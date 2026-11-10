import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';
import { UserType } from '../../../entities/user.entity';

export class CreateCognitoUserDto {
  @ApiProperty({
    description: 'Email address for the new account. Used as the sign-in name.',
    format: 'email',
    example: 'steward@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Role for the new account',
    enum: UserType,
    example: UserType.STEWARD,
  })
  @IsEnum(UserType)
  role: UserType;
}
