import { ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleAsyncOptions = {
  useFactory: (configService: ConfigService) => ({
    secret: configService.get('JWT_SECRET', 'nolojia-super-secret-key'),
    signOptions: {
      expiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
    },
  }),
  inject: [ConfigService],
  global: true,
};