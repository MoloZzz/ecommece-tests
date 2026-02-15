import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor() {}

  async getUserById(id: string) {
    throw new Error('Method not implemented.');
  }

  async createUser() {
    throw new Error('Method not implemented.');
  }
}
