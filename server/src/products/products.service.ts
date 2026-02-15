import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateStockDto } from './dto/update-stock.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { Repository } from 'typeorm/repository/Repository';
import { ProductEntity } from './entity/product.entity';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productsRepository: Repository<ProductEntity>,
  ) {}

  async getById(id: string): Promise<ProductEntity> {
    const product = await this.productsRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async reserveStock(productId: string, quantity: number) {
    const result = await this.productsRepository
      .createQueryBuilder()
      .update(ProductEntity)
      .set({
        stock: () => `stock - ${quantity}`,
      })
      .where('id = :id', { id: productId })
      .andWhere('stock >= :quantity', { quantity })
      .execute();

    if (result.affected === 0) {
      throw new BadRequestException('Insufficient stock');
    }
  }

  async updateStock(id: string, dto: UpdateStockDto) {
    const product = await this.getById(id);

    product.stock = dto.stock;

    return this.productsRepository.save(product);
  }

  async findAll() {
    return this.productsRepository.find();
  }

  async create(dto: CreateProductDto) {
    const product = this.productsRepository.create(dto);
    return this.productsRepository.save(product);
  }
}
