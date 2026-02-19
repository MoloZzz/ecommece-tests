import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../../src/orders/orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from '../../src/users/users.service';
import { ProductsService } from '../../src/products/products.service';
import { OrderEntity, OrderStatus } from '../../src/orders/entity/order.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

/**
 * Behavior Verification Tests for OrdersService (Orchestrator)
 *
 * These tests verify the behavior and interactions of OrdersService:
 * - Service method calls to dependencies (UsersService, ProductsService)
 * - Repository interactions
 * - Orchestration of payment flow
 * - Error handling and propagation
 */
describe('OrdersService Behavior Verification', () => {
  let service: OrdersService;
  let orderRepository: jest.Mocked<Repository<OrderEntity>>;
  let usersService: jest.Mocked<UsersService>;
  let productsService: jest.Mocked<ProductsService>;

  const mockOrderRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUsersService = {
    findOneById: jest.fn(),
    deductBalance: jest.fn(),
    updateBalance: jest.fn(),
    createUser: jest.fn(),
  };

  const mockProductsService = {
    getById: jest.fn(),
    reserveStock: jest.fn(),
    updateStock: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: mockOrderRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get(getRepositoryToken(OrderEntity));
    usersService = module.get(UsersService);
    productsService = module.get(ProductsService);

    jest.clearAllMocks();
  });

  describe('Order Creation Behavior', () => {
    it('should call UsersService.findOneById when creating order', async () => {
      // Arrange
      const userId = 'user-1';
      const productId = 'product-1';

      mockUsersService.findOneById.mockResolvedValue({
        id: userId,
        email: 'test@test.com',
        balance: 1000,
      } as any);

      mockProductsService.getById.mockResolvedValue({
        id: productId,
        name: 'Product',
        price: 100,
        stock: 10,
      } as any);

      mockOrderRepository.create.mockReturnValue({
        id: 'order-1',
        userId,
        total: 100,
        status: OrderStatus.created,
      } as any);

      mockOrderRepository.save.mockResolvedValue({
        id: 'order-1',
        userId,
        total: 100,
        status: OrderStatus.created,
      } as any);

      // Act
      await service.create({
        userId,
        items: [{ productId, quantity: 1 }],
      });

      // Behavior verification: UsersService.findOneById called
      expect(mockUsersService.findOneById).toHaveBeenCalledTimes(1);
      expect(mockUsersService.findOneById).toHaveBeenCalledWith(userId);
    });

    it('should call ProductsService.getById for each item when creating order', async () => {
      // Arrange
      const userId = 'user-1';
      const productId1 = 'product-1';
      const productId2 = 'product-2';

      mockUsersService.findOneById.mockResolvedValue({
        id: userId,
        email: 'test@test.com',
        balance: 1000,
      } as any);

      mockProductsService.getById
        .mockResolvedValueOnce({
          id: productId1,
          name: 'Product1',
          price: 100,
          stock: 10,
        } as any)
        .mockResolvedValueOnce({
          id: productId2,
          name: 'Product2',
          price: 200,
          stock: 10,
        } as any);

      mockOrderRepository.create.mockReturnValue({
        id: 'order-1',
        userId,
        total: 300,
        status: OrderStatus.created,
      } as any);

      mockOrderRepository.save.mockResolvedValue({
        id: 'order-1',
        userId,
        total: 300,
        status: OrderStatus.created,
      } as any);

      // Act
      await service.create({
        userId,
        items: [
          { productId: productId1, quantity: 1 },
          { productId: productId2, quantity: 1 },
        ],
      });

      // Behavior verification: ProductsService.getById called for each product
      expect(mockProductsService.getById).toHaveBeenCalledTimes(2);
      expect(mockProductsService.getById).toHaveBeenCalledWith(productId1);
      expect(mockProductsService.getById).toHaveBeenCalledWith(productId2);
    });

    it('should call repository.create and repository.save when creating order', async () => {
      // Arrange
      const userId = 'user-1';
      const productId = 'product-1';

      mockUsersService.findOneById.mockResolvedValue({
        id: userId,
        email: 'test@test.com',
        balance: 1000,
      } as any);

      mockProductsService.getById.mockResolvedValue({
        id: productId,
        name: 'Product',
        price: 100,
        stock: 10,
      } as any);

      const createdOrder = {
        id: 'order-1',
        userId,
        total: 100,
        status: OrderStatus.created,
      };

      mockOrderRepository.create.mockReturnValue(createdOrder as any);
      mockOrderRepository.save.mockResolvedValue(createdOrder as any);

      // Act
      await service.create({
        userId,
        items: [{ productId, quantity: 1 }],
      });

      // Behavior verification: repository methods called
      expect(mockOrderRepository.create).toHaveBeenCalledTimes(1);
      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          total: 100,
          status: OrderStatus.created,
        }),
      );
      expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
      expect(mockOrderRepository.save).toHaveBeenCalledWith(createdOrder);
    });
  });

  describe('Order Payment Behavior (Orchestration)', () => {
    it('should call UsersService.deductBalance when paying order', async () => {
      // Arrange
      const orderId = 'order-1';
      const userId = 'user-1';
      const order = {
        id: orderId,
        userId,
        total: 500,
        status: OrderStatus.created,
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 1,
            priceAtPurchase: 500,
          },
        ],
      };

      mockOrderRepository.findOne.mockResolvedValue(order as any);
      mockUsersService.deductBalance.mockResolvedValue(undefined);
      mockProductsService.reserveStock.mockResolvedValue(undefined);
      mockOrderRepository.save.mockResolvedValue({
        ...order,
        status: OrderStatus.paid,
      } as any);

      // Act
      await service.updateStatus(orderId, OrderStatus.paid);

      // Behavior verification: UsersService.deductBalance called
      expect(mockUsersService.deductBalance).toHaveBeenCalledTimes(1);
      expect(mockUsersService.deductBalance).toHaveBeenCalledWith(userId, 500);
    });

    it('should call ProductsService.reserveStock for each item when paying order', async () => {
      // Arrange
      const orderId = 'order-1';
      const userId = 'user-1';
      const order = {
        id: orderId,
        userId,
        total: 500,
        status: OrderStatus.created,
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 2,
            priceAtPurchase: 200,
          },
          {
            id: 'item-2',
            productId: 'product-2',
            quantity: 1,
            priceAtPurchase: 100,
          },
        ],
      };

      mockOrderRepository.findOne.mockResolvedValue(order as any);
      mockUsersService.deductBalance.mockResolvedValue(undefined);
      mockProductsService.reserveStock.mockResolvedValue(undefined);
      mockOrderRepository.save.mockResolvedValue({
        ...order,
        status: OrderStatus.paid,
      } as any);

      // Act
      await service.updateStatus(orderId, OrderStatus.paid);

      // Behavior verification: ProductsService.reserveStock called for each item
      expect(mockProductsService.reserveStock).toHaveBeenCalledTimes(2);
      expect(mockProductsService.reserveStock).toHaveBeenCalledWith(
        'product-1',
        2,
      );
      expect(mockProductsService.reserveStock).toHaveBeenCalledWith(
        'product-2',
        1,
      );
    });

    it('should call repository.save with updated status after payment', async () => {
      // Arrange
      const orderId = 'order-1';
      const userId = 'user-1';
      const order = {
        id: orderId,
        userId,
        total: 500,
        status: OrderStatus.created,
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 1,
            priceAtPurchase: 500,
          },
        ],
      };

      mockOrderRepository.findOne.mockResolvedValue(order as any);
      mockUsersService.deductBalance.mockResolvedValue(undefined);
      mockProductsService.reserveStock.mockResolvedValue(undefined);
      const paidOrder = { ...order, status: OrderStatus.paid };
      mockOrderRepository.save.mockResolvedValue(paidOrder as any);

      // Act
      await service.updateStatus(orderId, OrderStatus.paid);

      // Behavior verification: repository.save called with updated status
      expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
      expect(mockOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.paid,
        }),
      );
    });

    it('should NOT call payment methods when transitioning to shipped', async () => {
      // Arrange
      const orderId = 'order-1';
      const order = {
        id: orderId,
        userId: 'user-1',
        total: 500,
        status: OrderStatus.paid,
        items: [],
      };

      mockOrderRepository.findOne.mockResolvedValue(order as any);
      mockOrderRepository.save.mockResolvedValue({
        ...order,
        status: OrderStatus.shipped,
      } as any);

      // Act
      await service.updateStatus(orderId, OrderStatus.shipped);

      // Behavior verification: payment methods NOT called
      expect(mockUsersService.deductBalance).not.toHaveBeenCalled();
      expect(mockProductsService.reserveStock).not.toHaveBeenCalled();
      expect(mockOrderRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling Behavior', () => {
    it('should propagate NotFoundException when user not found', async () => {
      // Arrange
      const userId = 'user-1';
      const productId = 'product-1';

      mockUsersService.findOneById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      // Act & Assert
      await expect(
        service.create({
          userId,
          items: [{ productId, quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);

      // Behavior verification: error propagated
      expect(mockOrderRepository.create).not.toHaveBeenCalled();
    });

    it('should propagate BadRequestException when insufficient stock', async () => {
      // Arrange
      const userId = 'user-1';
      const productId = 'product-1';

      mockUsersService.findOneById.mockResolvedValue({
        id: userId,
        email: 'test@test.com',
        balance: 1000,
      } as any);

      mockProductsService.getById.mockResolvedValue({
        id: productId,
        name: 'Product',
        price: 100,
        stock: 5, // Less than requested quantity
      } as any);

      // Act & Assert
      await expect(
        service.create({
          userId,
          items: [{ productId, quantity: 10 }], // More than stock
        }),
      ).rejects.toThrow(BadRequestException);

      // Behavior verification: error thrown before repository operations
      expect(mockOrderRepository.create).not.toHaveBeenCalled();
    });

    it('should propagate BadRequestException when deductBalance fails', async () => {
      // Arrange
      const orderId = 'order-1';
      const order = {
        id: orderId,
        userId: 'user-1',
        total: 500,
        status: OrderStatus.created,
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 1,
            priceAtPurchase: 500,
          },
        ],
      };

      mockOrderRepository.findOne.mockResolvedValue(order as any);
      mockUsersService.deductBalance.mockRejectedValue(
        new BadRequestException('Insufficient balance'),
      );

      // Act & Assert
      await expect(
        service.updateStatus(orderId, OrderStatus.paid),
      ).rejects.toThrow(BadRequestException);

      // Behavior verification: error propagated, stock not reserved
      expect(mockProductsService.reserveStock).not.toHaveBeenCalled();
      expect(mockOrderRepository.save).not.toHaveBeenCalled();
    });

    it('should propagate BadRequestException when reserveStock fails', async () => {
      // Arrange
      const orderId = 'order-1';
      const order = {
        id: orderId,
        userId: 'user-1',
        total: 500,
        status: OrderStatus.created,
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 1,
            priceAtPurchase: 500,
          },
        ],
      };

      mockOrderRepository.findOne.mockResolvedValue(order as any);
      mockUsersService.deductBalance.mockResolvedValue(undefined);
      mockProductsService.reserveStock.mockRejectedValue(
        new BadRequestException('Insufficient stock'),
      );

      // Act & Assert
      await expect(
        service.updateStatus(orderId, OrderStatus.paid),
      ).rejects.toThrow(BadRequestException);

      // Behavior verification: error propagated after balance deduction
      // Note: In real scenario, this would be a problem (balance deducted but stock not reserved)
      // This test verifies the current behavior
      expect(mockUsersService.deductBalance).toHaveBeenCalled();
      expect(mockOrderRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Status Transition Behavior', () => {
    it('should call repository.findOne with relations when updating status', async () => {
      // Arrange
      const orderId = 'order-1';
      const order = {
        id: orderId,
        userId: 'user-1',
        total: 500,
        status: OrderStatus.created,
        items: [],
      };

      mockOrderRepository.findOne.mockResolvedValue(order as any);
      mockOrderRepository.save.mockResolvedValue(order as any);

      // Act
      await service.updateStatus(orderId, OrderStatus.paid);

      // Behavior verification: findOne called with relations
      expect(mockOrderRepository.findOne).toHaveBeenCalledWith({
        where: { id: orderId },
        relations: true,
      });
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      // Arrange
      const orderId = 'order-1';
      const order = {
        id: orderId,
        userId: 'user-1',
        total: 500,
        status: OrderStatus.created,
        items: [],
      };

      mockOrderRepository.findOne.mockResolvedValue(order as any);

      // Act & Assert
      await expect(
        service.updateStatus(orderId, OrderStatus.shipped), // Invalid: created -> shipped
      ).rejects.toThrow(BadRequestException);

      // Behavior verification: error thrown, no save called
      expect(mockOrderRepository.save).not.toHaveBeenCalled();
    });
  });
});
