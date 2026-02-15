import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEmail } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsDefined()
  @IsEmail()
  email: string;
}
