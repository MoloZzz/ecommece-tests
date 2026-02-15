import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser() {
    return this.usersService.createUser();
  }

  @Get('/:id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }
}
