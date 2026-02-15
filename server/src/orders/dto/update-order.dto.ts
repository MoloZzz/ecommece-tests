import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEnum, IsString } from 'class-validator';
import { OrderStatus } from '../entity/order.entity';

export class UpdateOrderStatusDto {
  @ApiProperty()
  @IsDefined()
  @IsString()
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
