import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDefined, IsString, IsUUID, ValidateNested } from 'class-validator';
import { CreateOrderItemDto } from './create-order-item.dto';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  @IsDefined()
  @IsUUID(4)
  userId: string;

@ApiProperty({ type: () => [CreateOrderItemDto] })
@IsDefined()
@IsArray()
@ValidateNested({ each: true })
@Type(() => CreateOrderItemDto)
items: CreateOrderItemDto[];
}
