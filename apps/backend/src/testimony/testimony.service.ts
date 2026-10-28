import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Testimonial } from '../entities/testimonial.entity';
import { Site } from '../entities/site.entity';
import { TestimonyResponseDto } from './dto/testimony-response.dto';

@Injectable()
export class TestimonyService {
  constructor(
    @InjectRepository(Testimonial)
    private testimonialRepo: Repository<Testimonial>,
    @InjectRepository(Site)
    private siteRepo: Repository<Site>,
  ) {}

  async findBySiteId(siteId: string): Promise<TestimonyResponseDto[]> {
    const site = await this.siteRepo.findOne({ where: { id: siteId } });
    if (!site) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    const testimonials = await this.testimonialRepo.find({
      where: { site: { id: siteId } },
      relations: ['steward'],
      order: { createdAt: 'DESC' },
    });

    return testimonials.map((t) => this.mapToDto(t));
  }

  private mapToDto(testimonial: Testimonial): TestimonyResponseDto {
    return {
      id: testimonial.id,
      quote: testimonial.answer,
      steward: testimonial.steward
        ? {
            id: testimonial.steward.id,
            name: testimonial.steward.name,
          }
        : null,
      dateAdded: testimonial.createdAt,
    };
  }
}
