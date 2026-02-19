import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  name: string;
  @ApiProperty()
  @IsDefined()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price: number;
  @ApiProperty()
  @IsDefined()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  stock: number;
}
