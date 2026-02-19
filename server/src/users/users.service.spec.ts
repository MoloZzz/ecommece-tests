import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<UserEntity>>;

  const mockQueryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(UserEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return user if found', async () => {
    const user = { id: '1', balance: 100 } as UserEntity;
    mockUserRepository.findOne.mockResolvedValue(user);

    const result = await service.findOneById('1');

    expect(result).toEqual(user);
    expect(mockUserRepository.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });

  it('should throw NotFoundException if user not found', async () => {
    mockUserRepository.findOne.mockResolvedValue(null);

    await expect(service.findOneById('1')).rejects.toThrow(NotFoundException);
  });

  it('should deduct balance successfully', async () => {
    mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });

    await service.deductBalance('u1', 50);

    expect(mockQueryBuilder.update).toHaveBeenCalled();
    expect(mockQueryBuilder.set).toHaveBeenCalled();
    expect(mockQueryBuilder.where).toHaveBeenCalledWith('id = :id', {
      id: 'u1',
    });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'balance >= :total',
      { total: 50 },
    );
    expect(mockQueryBuilder.execute).toHaveBeenCalled();
  });

  it('should throw BadRequestException if insufficient balance', async () => {
    mockQueryBuilder.execute.mockResolvedValue({ affected: 0 });

    await expect(service.deductBalance('u1', 1000)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should create user with default balance 0', async () => {
    const dto = { email: 'test@test.com' };

    const createdUser = {
      id: '1',
      ...dto,
      balance: 0,
    } as UserEntity;

    mockUserRepository.create.mockReturnValue(createdUser);
    mockUserRepository.save.mockResolvedValue(createdUser);

    const result = await service.createUser(dto as any);

    expect(mockUserRepository.create).toHaveBeenCalledWith({
      ...dto,
      balance: 0,
    });
    expect(mockUserRepository.save).toHaveBeenCalledWith(createdUser);
    expect(result).toEqual(createdUser);
  });
});
