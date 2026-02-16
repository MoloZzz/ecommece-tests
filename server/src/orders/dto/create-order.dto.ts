import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDefined, IsString, IsUUID } from 'class-validator';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  @IsDefined()
  @IsUUID(4)
  userId: string;

  @ApiProperty({ type: () => [CreateOrderItemDto] })
  @IsDefined()
  @IsArray()
  items: CreateOrderItemDto[];
}
