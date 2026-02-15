import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor() {}
  async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto) {
    throw new Error('Method not implemented.');
  }
  async findOne(id: string) {
    throw new Error('Method not implemented.');
  }
  async create(createOrderDto: CreateOrderDto) {
    throw new Error('Method not implemented.');
  }
}
