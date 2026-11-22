import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Plant } from '../entities/plant.entity';
import { Site } from '../entities/site.entity';
import { UserType } from '../entities/user.entity';
import {
  AccessTokenPayload,
  COGNITO_GROUPS,
} from '../aws/cognito/cognito.types';
import { CreatePlantDto } from './dto/create-plant.dto';
import { PlantResponseDto } from './dto/plant-response.dto';

// Empty or whitespace-only optional text is stored as NULL.
function blankToUndefined(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

@Injectable()
export class PlantsService {
  private readonly s3Region: string;
  private readonly s3Bucket: string;

  constructor(
    @InjectRepository(Plant) private plantRepo: Repository<Plant>,
    private dataSource: DataSource,
  ) {
    this.s3Region = process.env.AWS_REGION ?? 'us-east-2';
    this.s3Bucket = process.env.AWS_MEDIA_BUCKET_NAME ?? '';
  }

  async findOne(id: string): Promise<PlantResponseDto> {
    const plant = await this.plantRepo.findOne({
      where: { id },
      relations: ['hostSites'],
    });

    if (!plant) {
      throw new NotFoundException(`Plant with ID ${id} not found`);
    }

    return this.mapToDto(plant);
  }

  /**
   * Creates a plant and links it to `dto.siteIds` in one transaction, so the
   * plant and its `site_plants` rows are saved together or not at all.
   *
   * @param caller - The verified token payload, or `null` when auth is disabled.
   * @throws {NotFoundException} If any site ID does not match a site.
   * @throws {ForbiddenException} If a steward links a site they do not steward.
   */
  async create(
    dto: CreatePlantDto,
    caller: AccessTokenPayload | null,
  ): Promise<PlantResponseDto> {
    const siteIds = dto.siteIds ?? [];

    return this.dataSource.transaction(async (manager) => {
      const sites = siteIds.length
        ? await manager.find(Site, {
            where: { id: In(siteIds) },
            relations: ['steward'],
          })
        : [];

      const found = new Set(sites.map((site) => site.id));
      const missing = siteIds.filter((id) => !found.has(id));
      if (missing.length) {
        throw new NotFoundException(`Site(s) not found: ${missing.join(', ')}`);
      }

      this.assertCanLinkSites(caller, sites);

      const plant = manager.create(Plant, {
        plantName: dto.name.trim(),
        imageS3Key: blankToUndefined(dto.imageS3Key),
        description: blankToUndefined(dto.description),
        flavor: blankToUndefined(dto.flavor),
        harvestSeason: blankToUndefined(dto.harvestSeason),
        howToHarvest: blankToUndefined(dto.howToHarvest),
        recipes: dto.recipes ?? [],
        hostSites: sites,
      });
      const saved = await manager.save(plant);
      return this.mapToDto(saved);
    });
  }

  /**
   * Admins may link any site. Stewards may only link sites whose steward's
   * email matches their Cognito username (createUser uses the email as the
   * username). When auth is disabled there is no caller, so no check runs.
   */
  private assertCanLinkSites(
    caller: AccessTokenPayload | null,
    sites: Site[],
  ): void {
    if (!caller) {
      return;
    }
    const groups = caller['cognito:groups'] ?? [];
    if (groups.includes(COGNITO_GROUPS[UserType.ADMIN])) {
      return;
    }
    const email = caller.username?.trim().toLowerCase();
    const notOwned = sites.filter(
      (site) => !email || site.steward?.email?.toLowerCase() !== email,
    );
    if (notOwned.length) {
      throw new ForbiddenException(
        `Stewards can only link plants to their own sites. Not your site(s): ${notOwned
          .map((site) => site.id)
          .join(', ')}`,
      );
    }
  }

  private mapToDto(plant: Plant): PlantResponseDto {
    return {
      id: plant.id,
      name: plant.plantName,
      imageUrl: plant.imageS3Key ? this.buildS3Url(plant.imageS3Key) : null,
      description: plant.description ?? null,
      flavor: plant.flavor ?? null,
      harvestSeason: plant.harvestSeason ?? null,
      howToHarvest: plant.howToHarvest ?? null,
      recipes: plant.recipes ?? [],
      hostSites: (plant.hostSites ?? []).map((site) => ({
        id: site.id,
        name: site.name,
        siteType: site.type,
      })),
    };
  }

  private buildS3Url(s3Key: string): string {
    if (!this.s3Bucket) {
      return s3Key;
    }
    return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${s3Key}`;
  }
}
