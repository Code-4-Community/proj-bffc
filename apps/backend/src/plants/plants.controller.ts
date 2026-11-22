import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { PlantsService } from './plants.service';
import { PlantResponseDto } from './dto/plant-response.dto';

@ApiTags('Plants')
@Controller('plant')
export class PlantsController {
  constructor(private plantsService: PlantsService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get plant details by ID',
    description:
      'Returns the full plant record, including the sites (of all types) where it grows.',
  })
  @ApiParam({
    name: 'id',
    description: 'Plant UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Plant details retrieved successfully',
    type: PlantResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Malformed plant ID' })
  @ApiNotFoundResponse({ description: 'Plant not found' })
  async getPlant(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PlantResponseDto> {
    return this.plantsService.findOne(id);
  }
}
