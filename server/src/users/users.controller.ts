import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('users')
@Controller('/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() data: CreateUserDto) {
    return this.usersService.createUser(data);
  }

  @Get('/:id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.findOneById(id);
  }

  @Patch('/:id/balance')
  async updateUserBalance(@Param('id') id: string, @Body('balance') balance: number) {
    return this.usersService.updateBalance(id, balance);
  } 
}
