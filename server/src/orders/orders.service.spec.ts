import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { BadRequestException } from '@nestjs/common';
import { OrderEntity, OrderStatus } from './entity/order.entity';

describe('OrdersService (Unit)', () => {
  let service: OrdersService;

  const mockOrderRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUsersService = {
    findOneById: jest.fn(),
    deductBalance: jest.fn(),
  };

  const mockProductsService = {
    getById: jest.fn(),
    reserveStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: mockOrderRepository,
        },
        { provide: UsersService, useValue: mockUsersService },
        { provide: ProductsService, useValue: mockProductsService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate total correctly when creating order', async () => {
  mockUsersService.findOneById.mockResolvedValue({
    id: 'u1',
    balance: 1000,
  });

  mockProductsService.getById.mockResolvedValue({
    id: 'p1',
    price: 100,
    stock: 10,
  });

  mockOrderRepository.create.mockReturnValue({});
  mockOrderRepository.save.mockResolvedValue({});

  await service.create({
    userId: 'u1',
    items: [{ productId: 'p1', quantity: 2 }],
  });

  expect(mockProductsService.getById).toHaveBeenCalled();
  expect(mockOrderRepository.create).toHaveBeenCalledWith(
    expect.objectContaining({ total: 200 }),
  );
});


  it('should throw if insufficient stock', async () => {
    mockProductsService.getById.mockResolvedValue({
      id: 'p1',
      price: 100,
      stock: 1,
    });

    await expect(
      service.create({
        userId: 'u1',
        items: [{ productId: 'p1', quantity: 5 }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should not allow invalid status transition', () => {
    expect(() =>
      (service as any).validateTransition(
        OrderStatus.shipped,
        OrderStatus.paid,
      ),
    ).toThrow(BadRequestException);
  });
});
