import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  // Get user by ID
  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    return user;
  }

  // Get user by phone number
  async getUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.userRepository.findOneBy({ phoneNumber });
  }

  // Update user information
  async updateUserInfo(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.getUserById(userId);

    const updatedUser = await this.userRepository.save({
      ...user,
      ...updateUserDto,
    });

    return updatedUser;
  }

  // Create a new user
  async createUser(phoneNumber: string): Promise<User> {
    const user = this.userRepository.create({ phoneNumber });
    return this.userRepository.save(user);
  }
}
