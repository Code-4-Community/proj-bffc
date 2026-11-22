import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const LUMA_HOSTS = ['lu.ma', 'luma.com'];

// HH:MM -> HH:MM:SS so times compare correctly as strings
function toSeconds(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

/** Valid https URL on a Luma host (lu.ma, luma.com, or a subdomain). */
function IsLumaLink(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isLumaLink',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid https Luma event link (lu.ma or luma.com)`,
        ...options,
      },
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          try {
            const url = new URL(value);
            return (
              url.protocol === 'https:' &&
              LUMA_HOSTS.some(
                (h) => url.hostname === h || url.hostname.endsWith(`.${h}`),
              )
            );
          } catch {
            return false;
          }
        },
      },
    });
}

/** The decorated time must be later than the sibling `startTime`. */
function IsAfterStartTime(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isAfterStartTime',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be after startTime`,
        ...options,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const start = (args.object as { startTime?: unknown }).startTime;
          if (
            typeof value !== 'string' ||
            typeof start !== 'string' ||
            !TIME_PATTERN.test(value) ||
            !TIME_PATTERN.test(start)
          ) {
            // Format errors are reported by the @Matches validators instead.
            return true;
          }
          return toSeconds(value) > toSeconds(start);
        },
      },
    });
}

/**
 * Request body for `POST /adminEvent`.
 */
export class CreateAdminEventDto {
  @ApiProperty({ format: 'uuid', description: 'Site the event belongs to' })
  @IsUUID('all', { message: 'site_id must be a UUID' })
  site_id!: string;

  @ApiProperty({ description: 'Event title' })
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name should not be empty' })
  name!: string;

  @ApiProperty()
  @IsString({ message: 'description must be a string' })
  @IsNotEmpty({ message: 'description should not be empty' })
  description!: string;

  @ApiProperty({ description: 'Where the event happens' })
  @IsString({ message: 'place must be a string' })
  @IsNotEmpty({ message: 'place should not be empty' })
  place!: string;

  @ApiProperty({
    description: 'Calendar date (YYYY-MM-DD)',
    example: '2026-10-25',
  })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date!: string;

  @ApiProperty({
    description: 'Start time (HH:MM or HH:MM:SS)',
    example: '14:00:00',
  })
  @Matches(TIME_PATTERN, {
    message: 'startTime must be in HH:MM or HH:MM:SS format',
  })
  startTime!: string;

  @ApiProperty({
    description: 'End time (HH:MM or HH:MM:SS)',
    example: '16:00:00',
  })
  @Matches(TIME_PATTERN, {
    message: 'endTime must be in HH:MM or HH:MM:SS format',
  })
  @IsAfterStartTime()
  endTime!: string;

  @ApiProperty({
    description: 'Luma registration link',
    example: 'https://lu.ma/example-harvest',
  })
  @IsLumaLink()
  registrationLink!: string;

  @ApiPropertyOptional({ description: 'S3 key of the event flyer' })
  @IsOptional()
  @IsString({ message: 'flyerS3Key must be a string' })
  flyerS3Key?: string;
}
