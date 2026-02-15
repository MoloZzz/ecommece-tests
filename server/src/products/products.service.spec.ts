import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ProductEntity } from './entity/product.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
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
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return product if found', async () => {
    const product = { id: '1', stock: 10 } as ProductEntity;
    mockRepository.findOne.mockResolvedValue(product);

    const result = await service.getById('1');

    expect(result).toEqual(product);
    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });

  it('should throw NotFoundException if product not found', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(service.getById('1')).rejects.toThrow(
      NotFoundException,
    );
  });


  it('should reserve stock successfully', async () => {
    mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });

    await service.reserveStock('p1', 5);

    expect(mockQueryBuilder.update).toHaveBeenCalled();
    expect(mockQueryBuilder.set).toHaveBeenCalled();
    expect(mockQueryBuilder.where).toHaveBeenCalledWith('id = :id', {
      id: 'p1',
    });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'stock >= :quantity',
      { quantity: 5 },
    );
    expect(mockQueryBuilder.execute).toHaveBeenCalled();
  });

  it('should throw BadRequestException if insufficient stock', async () => {
    mockQueryBuilder.execute.mockResolvedValue({ affected: 0 });

    await expect(service.reserveStock('p1', 10)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should update stock', async () => {
    const product = { id: '1', stock: 5 } as ProductEntity;
    mockRepository.findOne.mockResolvedValue(product);
    mockRepository.save.mockResolvedValue({ ...product, stock: 20 });

    const result = await service.updateStock('1', { stock: 20 });

    expect(result.stock).toBe(20);
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should return all products', async () => {
    const products = [
      { id: '1', stock: 10 },
      { id: '2', stock: 5 },
    ] as ProductEntity[];

    mockRepository.find.mockResolvedValue(products);

    const result = await service.findAll();

    expect(result).toEqual(products);
    expect(mockRepository.find).toHaveBeenCalled();
  });

  it('should create product', async () => {
    const dto = { name: 'Test', stock: 10 };
    const created = { id: '1', ...dto } as ProductEntity;

    mockRepository.create.mockReturnValue(created);
    mockRepository.save.mockResolvedValue(created);

    const result = await service.create(dto as any);

    expect(mockRepository.create).toHaveBeenCalledWith(dto);
    expect(mockRepository.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(created);
  });
});
