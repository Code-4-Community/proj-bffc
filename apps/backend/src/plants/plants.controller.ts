import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { CognitoService } from '../aws/cognito/cognito.service';
import { Roles } from '../aws/cognito/roles.decorator';
import { RolesGuard } from '../aws/cognito/roles.guard';
import { UserType } from '../entities/user.entity';
import { PlantsService } from './plants.service';
import { CreatePlantDto } from './dto/create-plant.dto';
import { PlantResponseDto } from './dto/plant-response.dto';

@ApiTags('Plants')
@Controller('plant')
export class PlantsController {
  constructor(
    private plantsService: PlantsService,
    private cognitoService: CognitoService,
  ) {}

  /**
   * Steward or admin: create a plant and optionally link it to sites.
   */
  @Post()
  @Roles(UserType.ADMIN, UserType.STEWARD)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a plant',
    description:
      'Steward or admin only. Creates a plant and links it to the given ' +
      'sites. Stewards may only link their own sites; admins may link any site.',
  })
  @ApiCreatedResponse({ type: PlantResponseDto })
  @ApiBadRequestResponse({
    description: 'Missing name, invalid field type, or malformed site ID',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description:
      'Caller is not a steward or admin, or a steward linked a site they do not steward',
  })
  @ApiNotFoundResponse({ description: 'A site ID does not match any site' })
  createPlant(
    @Body() body: CreatePlantDto,
    @Req() req: Request,
  ): Promise<PlantResponseDto> {
    return this.plantsService.create(body, this.cognitoService.getUser(req));
  }

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
