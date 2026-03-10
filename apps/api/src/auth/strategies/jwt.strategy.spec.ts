import { AppException } from '@@exceptions';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AUTH_ERRORS } from '../auth.error';

const mockTokenExtractor = jest.fn();

jest.mock('passport-jwt', () => ({
  ExtractJwt: {
    fromAuthHeaderAsBearerToken: jest.fn().mockReturnValue(mockTokenExtractor),
  },
  Strategy: class MockPassportJwtStrategy {
    // biome-ignore lint/suspicious/noEmptyBlockStatements: 테스트용 mock 클래스
    constructor(_opts: unknown) {}
  },
}));

jest.mock('@nestjs/passport', () => ({
  PassportStrategy: (_Strategy: unknown, _name?: string) => {
    return class MockPassportBase {
      // biome-ignore lint/suspicious/noEmptyBlockStatements: 테스트용 mock 클래스
      constructor(_opts: unknown) {}
    };
  },
}));

// passport-jwt mock이 먼저 적용된 후 import 해야 하므로 require 사용
// biome-ignore lint/style/useNamingConvention: require로 클래스 지연 import 시 PascalCase 필요
const { JwtStrategy } = require('./jwt.strategy') as {
  // biome-ignore lint/style/useNamingConvention: 클래스 생성자 참조 타입 프로퍼티
  JwtStrategy: new (
    configService: ConfigService,
    prisma: unknown,
    redisService: unknown,
  ) => { validate: (req: Request, payload: { sub: number; email: string }) => Promise<unknown> };
};

/** AppException의 errorCode를 검증하는 헬퍼 */
const expectErrorCode = async (promise: Promise<unknown>, expectedErrorCode: string) => {
  const error = await promise.catch((e) => e);
  expect(error).toBeInstanceOf(AppException);
  expect((error as AppException).getResponse()).toMatchObject({ errorCode: expectedErrorCode });
};

describe('JwtStrategy', () => {
  let strategy: { validate: (req: Request, payload: { sub: number; email: string }) => Promise<unknown> };
  let mockPrisma: { user: { findUnique: jest.Mock } };
  let mockRedisService: { isBlacklisted: jest.Mock };

  beforeEach(() => {
    mockPrisma = { user: { findUnique: jest.fn() } };
    mockRedisService = { isBlacklisted: jest.fn() };

    const mockConfigService = {
      getOrThrow: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;

    strategy = new JwtStrategy(mockConfigService, mockPrisma, mockRedisService);
    jest.clearAllMocks();
    mockTokenExtractor.mockReturnValue('test-token');
  });

  describe('validate', () => {
    const mockReq = {} as Request;
    const payload = { sub: 1, email: 'user@example.com' };

    it('토큰이 블랙리스트에 있으면 REVOKED_TOKEN 예외를 던진다', async () => {
      mockRedisService.isBlacklisted.mockResolvedValue(true);

      await expectErrorCode(strategy.validate(mockReq, payload), AUTH_ERRORS.REVOKED_TOKEN.errorCode);
    });

    it('사용자가 존재하지 않으면 USER_NOT_FOUND 예외를 던진다', async () => {
      mockRedisService.isBlacklisted.mockResolvedValue(false);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expectErrorCode(strategy.validate(mockReq, payload), AUTH_ERRORS.USER_NOT_FOUND.errorCode);
    });

    it('유효한 토큰이고 사용자가 존재하면 사용자 정보를 반환한다', async () => {
      const mockUser = { id: 1, email: 'user@example.com' };
      mockRedisService.isBlacklisted.mockResolvedValue(false);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockReq, payload);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: payload.sub } });
    });

    it('토큰 추출 결과가 null이면 블랙리스트를 확인하지 않는다', async () => {
      mockTokenExtractor.mockReturnValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'user@example.com' });

      await strategy.validate(mockReq, payload);

      expect(mockRedisService.isBlacklisted).not.toHaveBeenCalled();
    });

    it('블랙리스트 확인 시 추출된 토큰 값을 전달한다', async () => {
      mockTokenExtractor.mockReturnValue('specific-token-value');
      mockRedisService.isBlacklisted.mockResolvedValue(false);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'user@example.com' });

      await strategy.validate(mockReq, payload);

      expect(mockRedisService.isBlacklisted).toHaveBeenCalledWith('specific-token-value');
    });
  });
});
