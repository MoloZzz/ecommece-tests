import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { IdParamDto } from 'src/common/id-param.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get(':id')
  async findOne(@Param() param: IdParamDto) {
    return this.ordersService.findOneOrFail(param.id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param() param: IdParamDto,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(param.id, body.status);
  }
}
