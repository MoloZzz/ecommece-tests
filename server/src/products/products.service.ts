import { Injectable } from '@nestjs/common';
import { UpdateStockDto } from './dto/update-stock.dto';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  updateStock(id: string, updateStockDto: UpdateStockDto) {
    throw new Error('Method not implemented.');
  }
  findAll() {
    throw new Error('Method not implemented.');
  }
  create(createProductDto: CreateProductDto) {
    throw new Error('Method not implemented.');
  }
}
