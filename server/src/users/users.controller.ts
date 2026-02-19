import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { IdParamDto } from 'src/common/id-param.dto';

@ApiTags('users')
@Controller('/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() data: CreateUserDto) {
    return this.usersService.createUser(data);
  }

  @Get('/:id')
  async getUserById(@Param() param: IdParamDto) {
    return this.usersService.findOneById(param.id);
  }

  @Patch('/:id/balance')
  async updateUserBalance(
    @Param('id') id: string,
    @Body('balance') balance: number,
  ) {
    return this.usersService.updateBalance(id, balance);
  }
}
