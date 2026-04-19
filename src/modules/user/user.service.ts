import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { NOT_FOUND_RESPONSE } from '@/common/constants/http-responses.types';
import { AuthDto } from '../auth/dto/auth.dto';
import { Helper } from '@/utils';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async register(body: AuthDto) {
    const { email } = body;
    const user = await this.userRepo.findOneBy({ email });

    if (user) {
      throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    }
    return Object.defineProperty(
      await this.userRepo.save(this.userRepo.create(body)),
      'password',
      { enumerable: false },
    );
  }

  async findAll(): Promise<unknown> {
    const users = await this.userRepo.findAndCount({
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'createdAt',
        'updatedAt',
      ],
      skip: 0,
      take: 10,
    });

    return Helper.paginateResponse({ data: users, page: 1, limit: 10 });
  }

  async getByUserByEmail(email: string) {
    const user = await this.userRepo.findOne({
      where: { email },
    });
    return user;
  }

  async softDeleteUser(userId: string) {
    const result = await this.userRepo.softDelete(userId);

    if (!result || !result.affected) {
      throw new HttpException(
        NOT_FOUND_RESPONSE.message,
        NOT_FOUND_RESPONSE.status,
      );
    }
    return;
  }
}
