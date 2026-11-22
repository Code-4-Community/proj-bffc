import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plant } from '../entities/plant.entity';
import { PlantResponseDto } from './dto/plant-response.dto';

@Injectable()
export class PlantsService {
  private readonly s3Region: string;
  private readonly s3Bucket: string;

  constructor(@InjectRepository(Plant) private plantRepo: Repository<Plant>) {
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
