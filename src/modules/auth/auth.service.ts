import { Injectable, HttpException, HttpStatus, Global } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from './dto/auth.dto';
import { JwtPayload } from './interface/Jwt.interface';
import { UserService } from '../user/user.service';
import { RegisterUserDto } from './dto/registration.dto';
import { Helper as helper } from '@/utils';

import { ConfigService } from '@nestjs/config';

@Injectable()
@Global()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(body: AuthDto): Promise<unknown> {
    const user = await this.usersService.getByUserByEmail(body.email);

    if (!user)
      throw new HttpException('Invalid email/password', HttpStatus.NOT_FOUND);

    const { password, ...rest } = user;

    const verifyPassword = await helper.comparePassword(
      body.password,
      password,
    );

    if (!verifyPassword)
      throw new HttpException('Invalid email/password', HttpStatus.NOT_FOUND);

    const jwt_token = await this.createAccessToken({
      id: user.id,
      email: user.email,
    });
    return {
      status: HttpStatus.OK,
      message: 'Logged in successfully. ✔️',
      data: {
        ...rest,
        access_token: jwt_token,
      },
    };
  }

  async registration(body: RegisterUserDto) {
    const user = await this.usersService.register(body);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    const jwt_token = await this.createAccessToken({
      id: user.id,
      email: user.email,
    });
    return {
      status: HttpStatus.OK,
      data: {
        ...rest,
        access_token: jwt_token,
      },
    };
  }

  public async createAccessToken(payload: JwtPayload): Promise<unknown> {
    const result = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
    });

    return result;
  }
}
