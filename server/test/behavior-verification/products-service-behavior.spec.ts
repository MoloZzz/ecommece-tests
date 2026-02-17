import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../../src/products/products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductEntity } from '../../src/products/entity/product.entity';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

/**
 * Behavior Verification Tests for ProductsService
 * 
 * These tests verify the behavior and interactions of ProductsService:
 * - Repository interactions
 * - Query builder usage for atomic stock operations
 * - Error handling
 */
describe('ProductsService Behavior Verification', () => {
  let service: ProductsService;
  let repository: jest.Mocked<Repository<ProductEntity>>;

  const mockQueryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get(getRepositoryToken(ProductEntity));

    jest.clearAllMocks();
  });

  describe('getById Behavior', () => {
    it('should call repository.findOne with correct parameters', async () => {
      // Arrange
      const productId = 'product-1';
      const product = {
        id: productId,
        name: 'Product',
        price: 100,
        stock: 10,
      };

      mockRepository.findOne.mockResolvedValue(product as ProductEntity);

      // Act
      await service.getById(productId);

      // Behavior verification: repository.findOne called correctly
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId },
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getById('non-existent')).rejects.toThrow(
        NotFoundException,
      );

      // Behavior verification: error thrown
      expect(mockRepository.findOne).toHaveBeenCalled();
    });
  });

  describe('reserveStock Behavior (Atomic Operation)', () => {
    it('should use query builder for atomic stock reservation', async () => {
      // Arrange
      const productId = 'product-1';
      const quantity = 5;

      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      // Act
      await service.reserveStock(productId, quantity);

      // Behavior verification: query builder chain called correctly
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(ProductEntity);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        stock: expect.any(Function), // SQL function
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id = :id', {
        id: productId,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'stock >= :quantity',
        { quantity },
      );
      expect(mockQueryBuilder.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when stock insufficient (affected = 0)', async () => {
      // Arrange
      const productId = 'product-1';
      const quantity = 100;

      mockQueryBuilder.execute.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(
        service.reserveStock(productId, quantity),
      ).rejects.toThrow(BadRequestException);

      // Behavior verification: error thrown when atomic check fails
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should succeed when stock is sufficient (affected = 1)', async () => {
      // Arrange
      const productId = 'product-1';
      const quantity = 5;

      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      // Act
      await service.reserveStock(productId, quantity);

      // Behavior verification: operation succeeds
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
      // No exception thrown
    });
  });

  describe('updateStock Behavior', () => {
    it('should call getById before updating stock', async () => {
      // Arrange
      const productId = 'product-1';
      const product = {
        id: productId,
        name: 'Product',
        price: 100,
        stock: 10,
      };
      const newStock = 20;

      mockRepository.findOne.mockResolvedValue(product as ProductEntity);
      mockRepository.save.mockResolvedValue({
        ...product,
        stock: newStock,
      } as ProductEntity);

      // Act
      await service.updateStock(productId, { stock: newStock });

      // Behavior verification: getById called first
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...product,
        stock: newStock,
      });
    });

    it('should propagate NotFoundException from getById', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateStock('non-existent', { stock: 10 }),
      ).rejects.toThrow(NotFoundException);

      // Behavior verification: error propagated, save not called
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll Behavior', () => {
    it('should call repository.find', async () => {
      // Arrange
      const products = [
        { id: '1', name: 'Product1', price: 100, stock: 10 },
        { id: '2', name: 'Product2', price: 200, stock: 20 },
      ];

      mockRepository.find.mockResolvedValue(products as ProductEntity[]);

      // Act
      await service.findAll();

      // Behavior verification: repository.find called
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('create Behavior', () => {
    it('should call repository.create and save', async () => {
      // Arrange
      const dto = {
        name: 'Product',
        price: 100,
        stock: 10,
      };
      const createdProduct = {
        id: 'product-1',
        ...dto,
      };

      mockRepository.create.mockReturnValue(createdProduct as ProductEntity);
      mockRepository.save.mockResolvedValue(createdProduct as ProductEntity);

      // Act
      await service.create(dto as any);

      // Behavior verification: repository methods called correctly
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(createdProduct);
    });
  });
});

