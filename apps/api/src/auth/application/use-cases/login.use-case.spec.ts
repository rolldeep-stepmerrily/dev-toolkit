import { AppException } from '@@exceptions';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AUTH_ERRORS } from 'src/auth/auth.error';
import { LoginRequestBodyDto } from 'src/auth/presenter/http/dto/login.dto';
import { UserEntity } from 'src/users/entities/user.entity';
import { LoginUseCase } from './login.use-case';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

/** AppException의 errorCode를 검증하는 헬퍼 */
const expectErrorCode = async (promise: Promise<unknown>, expectedErrorCode: string) => {
  const error = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(AppException);
  expect((error as AppException).getResponse()).toMatchObject({ errorCode: expectedErrorCode });
};

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockCommandBus: { execute: jest.Mock };
  let mockQueryBus: { execute: jest.Mock };
  let mockJwtService: { sign: jest.Mock };
  let mockConfigService: { getOrThrow: jest.Mock };

  const mockUser: Partial<UserEntity> = {
    id: 1,
    email: 'user@example.com',
    password: 'hashed-password',
    name: 'Test User',
    avatarUrl: null,
  };

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockQueryBus = { execute: jest.fn() };
    mockJwtService = { sign: jest.fn().mockReturnValue('mock-token') };
    mockConfigService = {
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        const config: Record<string, unknown> = {
          JWT_ACCESS_SECRET: 'access-secret',
          JWT_ACCESS_EXPIRES_IN: '15m',
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_REFRESH_EXPIRES_IN: '7d',
          REFRESH_TOKEN_TTL_DAYS: 7,
        };
        return config[key];
      }),
    };

    useCase = new LoginUseCase(
      mockCommandBus as any,
      mockQueryBus as any,
      mockJwtService as unknown as JwtService,
      mockConfigService as unknown as ConfigService,
    );
  });

  describe('execute', () => {
    const bodyDto: LoginRequestBodyDto = {
      email: 'user@example.com',
      password: 'Password1!',
    };

    it('이메일로 유저를 찾을 수 없으면 USER_NOT_FOUND 예외를 던진다', async () => {
      mockQueryBus.execute.mockResolvedValue(null);

      await expectErrorCode(useCase.execute({ bodyDto }), AUTH_ERRORS.USER_NOT_FOUND.errorCode);
    });

    it('비밀번호가 null인 경우(OAuth 전용 계정) INVALID_CREDENTIALS 예외를 던진다', async () => {
      mockQueryBus.execute.mockResolvedValue({ ...mockUser, password: null });

      await expectErrorCode(useCase.execute({ bodyDto }), AUTH_ERRORS.INVALID_CREDENTIALS.errorCode);
    });

    it('비밀번호가 일치하지 않으면 INVALID_CREDENTIALS 예외를 던진다', async () => {
      mockQueryBus.execute.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expectErrorCode(useCase.execute({ bodyDto }), AUTH_ERRORS.INVALID_CREDENTIALS.errorCode);
    });

    it('이메일과 비밀번호가 유효하면 accessToken과 refreshToken을 반환한다', async () => {
      mockQueryBus.execute.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await useCase.execute({ bodyDto });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('로그인 성공 시 리프레시 토큰을 DB에 저장한다', async () => {
      mockQueryBus.execute.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await useCase.execute({ bodyDto });

      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserByEmail', () => {
    it('유저가 존재하면 유저를 반환한다', async () => {
      mockQueryBus.execute.mockResolvedValue(mockUser);

      const result = await useCase.getUserByEmail('user@example.com');

      expect(result).toEqual(mockUser);
    });

    it('유저가 없으면 USER_NOT_FOUND 예외를 던진다', async () => {
      mockQueryBus.execute.mockResolvedValue(null);

      await expectErrorCode(useCase.getUserByEmail('notfound@example.com'), AUTH_ERRORS.USER_NOT_FOUND.errorCode);
    });
  });
});
