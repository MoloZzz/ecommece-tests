import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  @IsDefined()
  @IsUUID(4)
  userId: string;

  items: any[];
}
