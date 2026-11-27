import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { CognitoService } from '../aws/cognito/cognito.service';
import { Roles } from '../aws/cognito/roles.decorator';
import { RolesGuard } from '../aws/cognito/roles.guard';
import { UserType } from '../entities/user.entity';
import { CreateMediaUploadDto } from './dto/create-media-upload.dto';
import { MediaUploadResponseDto } from './dto/media-upload-response.dto';
import { IMAGE_MAX_BYTES, UploadedMediaFile } from './media.constants';
import { MediaService } from './media.service';
import { MulterExceptionFilter } from './multer-exception.filter';

@ApiTags('Media')
@Controller('image')
export class ImageController {
  constructor(
    private mediaService: MediaService,
    private cognitoService: CognitoService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserType.ADMIN, UserType.STEWARD)
  @UseGuards(RolesGuard)
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: IMAGE_MAX_BYTES } }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'siteId'],
      properties: {
        file: { type: 'string', format: 'binary' },
        siteId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload an image to a site',
    description:
      'Steward or admin only. Stores the file in S3 and saves its URL and metadata. Stewards may only upload to their own site; admins may upload to any site.',
  })
  @ApiCreatedResponse({ type: MediaUploadResponseDto })
  @ApiBadRequestResponse({
    description: 'Missing file, invalid site ID, or disallowed file type',
  })
  @ApiPayloadTooLargeResponse({ description: 'File exceeds the 10MB limit' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({
    description:
      'Caller is not a steward or admin, or a steward uploaded to a site they do not steward',
  })
  @ApiNotFoundResponse({ description: 'Site ID does not match any site' })
  uploadImage(
    @UploadedFile() file: UploadedMediaFile,
    @Body() body: CreateMediaUploadDto,
    @Req() req: Request,
  ): Promise<MediaUploadResponseDto> {
    return this.mediaService.uploadImage(
      file,
      body.siteId,
      this.cognitoService.getUser(req),
    );
  }
}
