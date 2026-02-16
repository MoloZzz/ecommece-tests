import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserEntity } from './entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm/repository/Repository';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findOneById(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async deductBalance(userId: string, total: number): Promise<void> {
    const result = await this.usersRepository
      .createQueryBuilder()
      .update(UserEntity)
      .set({
        balance: () => `balance - ${total}`,
      })
      .where('id = :id', { id: userId })
      .andWhere('balance >= :total', { total })
      .execute();

    if (result.affected === 0) {
      throw new BadRequestException('Insufficient balance');
    }
  }

  async createUser(dto: CreateUserDto): Promise<UserEntity> {
    const user = this.usersRepository.create({
      ...dto,
      balance: 0,
    });

    return this.usersRepository.save(user);
  }

  async updateBalance(id: string, balance: number) {
    const user = await this.findOneById(id);
    return this.usersRepository.save({ ...user, balance });
  }
}
