import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './create-user.dto.js';

@Injectable()
export class UserService {

  findOne(userId: number) {
    return {
      name: 'John Doe',
      email: ''
    };
  }

  createUser(dto: CreateUserDto, userId: number): CreateUserDto {
    // Here you can implement the logic to create a user, e.g., save to a database
    // For demonstration purposes, we'll just return the userDto
    return dto;
  }
}
