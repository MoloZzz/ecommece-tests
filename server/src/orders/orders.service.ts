import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity, OrderStatus } from './entity/order.entity';
import { Repository } from 'typeorm/repository/Repository';
import { ProductsService } from 'src/products/products.service';
import { UsersService } from 'src/users/users.service';
import { OrderItemEntity } from './entity/order-item.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
    private readonly userService: UsersService,
    private readonly productService: ProductsService,
  ) {}

  private readonly allowedTransitions = {
    created: [OrderStatus.paid],
    paid: [OrderStatus.shipped],
    shipped: [],
  };

  async create(dto: CreateOrderDto) {
    await this.userService.findOneById(dto.userId);

    let total = 0;

    const items: Partial<OrderItemEntity>[] = [];

    for (const item of dto.items) {
      const product = await this.productService.getById(item.productId);

      if (product.stock < item.quantity) {
        throw new BadRequestException('Insufficient stock');
      }

      total += product.price * item.quantity;

      items.push({
        productId: product.id,
        quantity: item.quantity,
        priceAtPurchase: product.price,
      });
    }

    const order = this.ordersRepository.create({
      userId: dto.userId,
      total,
      status: OrderStatus.created,
      items,
    });

    return this.ordersRepository.save(order);
  }

  async updateStatus(id: string, newStatus: OrderStatus) {
    const order = await this.findOneOrFail(id);

    this.validateTransition(order.status, newStatus);

    if (newStatus === OrderStatus.paid) {
      await this.handlePayment(order);
    }

    order.status = newStatus;

    return this.ordersRepository.save(order);
  }

  private validateTransition(current: OrderStatus, next: OrderStatus) {
    const allowed: OrderStatus[] = this.allowedTransitions[current];

    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${next}`,
      );
    }
  }

  async findOneOrFail(id: string, relations = false): Promise<OrderEntity> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: relations ? ['items'] : [],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private async handlePayment(order: OrderEntity) {
    await this.userService.deductBalance(order.userId, order.total);

    for (const item of order.items) {
      await this.productService.reserveStock(item.productId, item.quantity);
    }
  }
}
