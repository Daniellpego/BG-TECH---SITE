import { Controller, Post, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Request } from 'express';
import { Req } from '@nestjs/common';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsString()
  name: string;

  @IsString()
  tenantId: string;

  @IsString()
  @IsOptional()
  role?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login and receive JWT' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'JWT access token + user info' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new user (admin only)' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'JWT access token + user info' })
  @ApiResponse({ status: 403, description: 'Only admins can register users' })
  async register(@Req() req: Request, @Body() dto: RegisterDto) {
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException('Only admins can register new users');
    }
    return this.authService.register(dto);
  }
}
