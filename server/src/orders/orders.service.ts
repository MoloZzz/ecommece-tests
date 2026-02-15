import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity } from './entity/order.entity';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
  ) {}

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
