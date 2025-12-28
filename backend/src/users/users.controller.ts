import { Controller, Get, Put, Body, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Get current user information
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getCurrentUser(@Request() req: any) {
    return req.user;
  }

  // Update user information
  @Put('me')
  @UseGuards(AuthGuard('jwt'))
  async updateUserInfo(@Body() updateUserDto: UpdateUserDto, @Request() req: any) {
    return this.usersService.updateUserInfo(req.user.id, updateUserDto);
  }
}
