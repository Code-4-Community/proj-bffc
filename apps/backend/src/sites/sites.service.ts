import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from '../entities/site.entity';
import { SiteResponseDto } from './dto/site-response.dto';

@Injectable()
export class SitesService {
  private readonly s3Region: string;
  private readonly s3Bucket: string;

  constructor(@InjectRepository(Site) private siteRepo: Repository<Site>) {
    this.s3Region = process.env.AWS_REGION ?? 'us-east-2';
    this.s3Bucket = process.env.AWS_MEDIA_BUCKET_NAME ?? '';
  }

  async findOne(id: string): Promise<SiteResponseDto> {
    const site = await this.siteRepo.findOne({
      where: { id },
      relations: [
        'steward',
        'address',
        'images',
        'videos',
        'plantInventory',
        'partnerOrgs',
      ],
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    return this.mapToDto(site);
  }

  private mapToDto(site: Site): SiteResponseDto {
    return {
      id: site.id,
      name: site.name,
      type: site.type,
      history: site.history,
      accessibility: site.accessibility,
      address: site.address
        ? {
            id: site.address.id,
            street: site.address.street,
            city: site.address.city,
            state: site.address.state,
            zip: site.address.zip,
            location: {
              type: site.address.location?.type ?? 'Point',
              coordinates: site.address.location?.coordinates as [
                number,
                number,
              ],
            },
          }
        : null,
      steward: site.steward
        ? {
            id: site.steward.id,
            name: site.steward.name,
          }
        : null,
      images: (site.images ?? []).map((img) => ({
        id: img.id,
        url: this.buildS3Url(img.s3Key),
      })),
      videos: (site.videos ?? []).map((vid) => ({
        id: vid.id,
        url: this.buildS3Url(vid.s3Key),
      })),
      plantInventory: (site.plantInventory ?? []).map((plant) => ({
        id: plant.id,
        plantName: plant.plantName,
      })),
      partnerOrgs: (site.partnerOrgs ?? []).map((org) => ({
        id: org.id,
        name: org.name,
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
