import { AppException } from '@@exceptions';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AUTH_ERRORS } from 'src/auth/auth.error';
import { SignUpRequestBodyDto } from 'src/auth/presenter/http/dto/signup.dto';
import { SignUpUseCase } from './sign-up.use-case';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

/** AppException의 errorCode를 검증하는 헬퍼 */
const expectErrorCode = async (promise: Promise<unknown>, expectedErrorCode: string) => {
  const error = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(AppException);
  expect((error as AppException).getResponse()).toMatchObject({ errorCode: expectedErrorCode });
};

describe('SignUpUseCase', () => {
  let useCase: SignUpUseCase;
  let mockCommandBus: { execute: jest.Mock };
  let mockQueryBus: { execute: jest.Mock };
  let mockJwtService: { sign: jest.Mock };
  let mockConfigService: { getOrThrow: jest.Mock };
  let mockPrisma: { $transaction: jest.Mock };

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn() };
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
    mockPrisma = {
      $transaction: jest.fn().mockImplementation(async (cb: () => Promise<unknown>) => await cb()),
    };

    useCase = new SignUpUseCase(
      mockCommandBus as any,
      mockQueryBus as any,
      mockJwtService as unknown as JwtService,
      mockConfigService as unknown as ConfigService,
      mockPrisma as any,
    );
  });

  describe('execute', () => {
    const bodyDto: SignUpRequestBodyDto = {
      email: 'new@example.com',
      password: 'Password1!',
      name: 'Test User',
    };

    it('이미 사용 중인 이메일이면 EMAIL_ALREADY_EXISTS 예외를 던진다', async () => {
      mockQueryBus.execute.mockResolvedValue({ id: 1, email: bodyDto.email });

      await expectErrorCode(useCase.execute({ bodyDto }), AUTH_ERRORS.EMAIL_ALREADY_EXISTS.errorCode);
    });

    it('신규 이메일이면 accessToken과 refreshToken을 반환한다', async () => {
      mockQueryBus.execute.mockResolvedValue(null);
      mockCommandBus.execute.mockResolvedValue({ id: 1, email: bodyDto.email, name: bodyDto.name });

      const result = await useCase.execute({ bodyDto });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('비밀번호를 bcrypt로 해싱한다', async () => {
      mockQueryBus.execute.mockResolvedValue(null);
      mockCommandBus.execute.mockResolvedValue({ id: 1, email: bodyDto.email });

      await useCase.execute({ bodyDto });

      expect(bcrypt.hash).toHaveBeenCalledWith(bodyDto.password, 10);
    });

    it('회원가입 후 리프레시 토큰을 DB에 저장한다(commandBus 2회 호출)', async () => {
      mockQueryBus.execute.mockResolvedValue(null);
      mockCommandBus.execute.mockResolvedValue({ id: 1, email: bodyDto.email });

      await useCase.execute({ bodyDto });

      // SaveUserCommand + SaveRefreshTokenCommand
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('checkEmailDuplication', () => {
    it('이미 존재하는 이메일이면 EMAIL_ALREADY_EXISTS 예외를 던진다', async () => {
      mockQueryBus.execute.mockResolvedValue({ id: 1, email: 'taken@example.com' });

      await expectErrorCode(
        useCase.checkEmailDuplication('taken@example.com'),
        AUTH_ERRORS.EMAIL_ALREADY_EXISTS.errorCode,
      );
    });

    it('존재하지 않는 이메일이면 예외를 던지지 않는다', async () => {
      mockQueryBus.execute.mockResolvedValue(null);

      await expect(useCase.checkEmailDuplication('free@example.com')).resolves.toBeUndefined();
    });
  });

  describe('hashPassword', () => {
    it('bcrypt.hash를 saltRounds 10으로 호출한다', async () => {
      await useCase.hashPassword('mypassword');

      expect(bcrypt.hash).toHaveBeenCalledWith('mypassword', 10);
    });

    it('해싱된 비밀번호 문자열을 반환한다', async () => {
      const result = await useCase.hashPassword('mypassword');

      expect(typeof result).toBe('string');
      expect(result).toBe('hashed-password');
    });
  });
});
