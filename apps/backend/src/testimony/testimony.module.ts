import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Testimonial } from '../entities/testimonial.entity';
import { Site } from '../entities/site.entity';
import { TestimonyController } from './testimony.controller';
import { TestimonyService } from './testimony.service';

@Module({
  imports: [TypeOrmModule.forFeature([Testimonial, Site])],
  controllers: [TestimonyController],
  providers: [TestimonyService],
  exports: [TestimonyService],
})
export class TestimonyModule {}
