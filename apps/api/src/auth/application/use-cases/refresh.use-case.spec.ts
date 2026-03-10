import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RefreshUseCase } from './refresh.use-case';

describe('RefreshUseCase', () => {
  let useCase: RefreshUseCase;
  let mockCommandBus: { execute: jest.Mock };
  let mockJwtService: { sign: jest.Mock };
  let mockConfigService: { getOrThrow: jest.Mock };

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockJwtService = { sign: jest.fn().mockReturnValue('new-mock-token') };
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

    useCase = new RefreshUseCase(
      mockCommandBus as any,
      mockJwtService as unknown as JwtService,
      mockConfigService as unknown as ConfigService,
    );
  });

  describe('execute', () => {
    const props = { userId: 1, email: 'user@example.com', oldToken: 'old-refresh-token' };

    it('기존 리프레시 토큰을 먼저 삭제한다', async () => {
      await useCase.execute(props);

      const firstCallArg = mockCommandBus.execute.mock.calls[0]?.[0] as { constructor: { name: string } };
      expect(firstCallArg.constructor.name).toBe('DeleteRefreshTokenCommand');
    });

    it('새 accessToken과 refreshToken을 반환한다', async () => {
      const result = await useCase.execute(props);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('새 리프레시 토큰을 DB에 저장한다', async () => {
      await useCase.execute(props);

      // DeleteRefreshTokenCommand + SaveRefreshTokenCommand
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(2);
      const secondCallArg = mockCommandBus.execute.mock.calls[1]?.[0] as { constructor: { name: string } };
      expect(secondCallArg.constructor.name).toBe('SaveRefreshTokenCommand');
    });

    it('토큰 발급 시 userId와 email로 payload를 구성한다', async () => {
      await useCase.execute(props);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: props.userId, email: props.email },
        expect.any(Object),
      );
    });
  });

  describe('deleteRefreshToken', () => {
    it('DeleteRefreshTokenCommand를 실행한다', async () => {
      await useCase.deleteRefreshToken('old-token');

      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
      const callArg = mockCommandBus.execute.mock.calls[0]?.[0] as { constructor: { name: string } };
      expect(callArg.constructor.name).toBe('DeleteRefreshTokenCommand');
    });
  });
});
