import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../../src/users/entity/user.entity';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

/**
 * Behavior Verification Tests for UsersService
 * 
 * These tests verify the behavior and interactions of UsersService:
 * - Repository interactions
 * - Query builder usage for atomic operations
 * - Error handling
 */
describe('UsersService Behavior Verification', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<UserEntity>>;

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
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(UserEntity));

    jest.clearAllMocks();
  });

  describe('findOneById Behavior', () => {
    it('should call repository.findOne with correct parameters', async () => {
      // Arrange
      const userId = 'user-1';
      const user = {
        id: userId,
        email: 'test@test.com',
        balance: 1000,
      };

      mockRepository.findOne.mockResolvedValue(user as UserEntity);

      // Act
      await service.findOneById(userId);

      // Behavior verification: repository.findOne called correctly
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOneById('non-existent')).rejects.toThrow(
        NotFoundException,
      );

      // Behavior verification: error thrown
      expect(mockRepository.findOne).toHaveBeenCalled();
    });
  });

  describe('deductBalance Behavior (Atomic Operation)', () => {
    it('should use query builder for atomic balance deduction', async () => {
      // Arrange
      const userId = 'user-1';
      const amount = 100;

      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      // Act
      await service.deductBalance(userId, amount);

      // Behavior verification: query builder chain called correctly
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(UserEntity);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        balance: expect.any(Function), // SQL function
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id = :id', {
        id: userId,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'balance >= :total',
        { total: amount },
      );
      expect(mockQueryBuilder.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when balance insufficient (affected = 0)', async () => {
      // Arrange
      const userId = 'user-1';
      const amount = 1000;

      mockQueryBuilder.execute.mockResolvedValue({ affected: 0 });

      // Act & Assert
      await expect(service.deductBalance(userId, amount)).rejects.toThrow(
        BadRequestException,
      );

      // Behavior verification: error thrown when atomic check fails
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should succeed when balance is sufficient (affected = 1)', async () => {
      // Arrange
      const userId = 'user-1';
      const amount = 100;

      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      // Act
      await service.deductBalance(userId, amount);

      // Behavior verification: operation succeeds
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
      // No exception thrown
    });
  });

  describe('createUser Behavior', () => {
    it('should call repository.create and save with default balance', async () => {
      // Arrange
      const dto = { email: 'test@test.com' };
      const createdUser = {
        id: 'user-1',
        ...dto,
        balance: 0,
      };

      mockRepository.create.mockReturnValue(createdUser as UserEntity);
      mockRepository.save.mockResolvedValue(createdUser as UserEntity);

      // Act
      await service.createUser(dto as any);

      // Behavior verification: repository methods called correctly
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...dto,
        balance: 0,
      });
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(createdUser);
    });
  });

  describe('updateBalance Behavior', () => {
    it('should call findOneById before updating balance', async () => {
      // Arrange
      const userId = 'user-1';
      const user = {
        id: userId,
        email: 'test@test.com',
        balance: 100,
      };
      const newBalance = 500;

      mockRepository.findOne.mockResolvedValue(user as UserEntity);
      mockRepository.save.mockResolvedValue({
        ...user,
        balance: newBalance,
      } as UserEntity);

      // Act
      await service.updateBalance(userId, newBalance);

      // Behavior verification: findOneById called first
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...user,
        balance: newBalance,
      });
    });

    it('should propagate NotFoundException from findOneById', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateBalance('non-existent', 100)).rejects.toThrow(
        NotFoundException,
      );

      // Behavior verification: error propagated, save not called
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});

