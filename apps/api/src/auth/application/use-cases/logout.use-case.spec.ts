import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/common/redis';
import { LogoutUseCase } from './logout.use-case';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let mockCommandBus: { execute: jest.Mock };
  let mockJwtService: { decode: jest.Mock };
  let mockRedisService: { addToBlacklist: jest.Mock };

  const USER_ID = 1;
  const REFRESH_TOKEN = 'refresh-token-value';
  const ACCESS_TOKEN = 'access-token-value';

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockJwtService = { decode: jest.fn() };
    mockRedisService = { addToBlacklist: jest.fn().mockResolvedValue(undefined) };

    useCase = new LogoutUseCase(
      mockCommandBus as any,
      mockJwtService as unknown as JwtService,
      mockRedisService as unknown as RedisService,
    );
  });

  describe('execute', () => {
    it('리프레시 토큰 삭제와 액세스 토큰 블랙리스트 추가를 동시에 실행한다', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 900;
      mockJwtService.decode.mockReturnValue({ exp: futureExp });

      await useCase.execute({ userId: USER_ID, refreshToken: REFRESH_TOKEN, accessToken: ACCESS_TOKEN });

      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
      expect(mockRedisService.addToBlacklist).toHaveBeenCalledTimes(1);
    });

    it('액세스 토큰의 남은 유효시간으로 TTL을 계산하여 블랙리스트에 추가한다', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 900;
      mockJwtService.decode.mockReturnValue({ exp: futureExp });

      await useCase.execute({ userId: USER_ID, refreshToken: REFRESH_TOKEN, accessToken: ACCESS_TOKEN });

      expect(mockRedisService.addToBlacklist).toHaveBeenCalledWith(ACCESS_TOKEN, expect.any(Number));
      const [, ttl] = mockRedisService.addToBlacklist.mock.calls[0] as [string, number];
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(900);
    });

    it('액세스 토큰에 exp 클레임이 없으면 블랙리스트에 추가하지 않는다', async () => {
      mockJwtService.decode.mockReturnValue({ sub: 1 });

      await useCase.execute({ userId: USER_ID, refreshToken: REFRESH_TOKEN, accessToken: ACCESS_TOKEN });

      expect(mockRedisService.addToBlacklist).not.toHaveBeenCalled();
    });

    it('액세스 토큰이 null로 디코딩되면 블랙리스트에 추가하지 않는다', async () => {
      mockJwtService.decode.mockReturnValue(null);

      await useCase.execute({ userId: USER_ID, refreshToken: REFRESH_TOKEN, accessToken: ACCESS_TOKEN });

      expect(mockRedisService.addToBlacklist).not.toHaveBeenCalled();
    });

    it('액세스 토큰이 빈 문자열이면 decode를 호출하지 않고 블랙리스트도 추가하지 않는다', async () => {
      await useCase.execute({ userId: USER_ID, refreshToken: REFRESH_TOKEN, accessToken: '' });

      expect(mockJwtService.decode).not.toHaveBeenCalled();
      expect(mockRedisService.addToBlacklist).not.toHaveBeenCalled();
    });

    it('이미 만료된 토큰(TTL 0)은 addToBlacklist에 0을 전달한다', async () => {
      const pastExp = Math.floor(Date.now() / 1000) - 100;
      mockJwtService.decode.mockReturnValue({ exp: pastExp });

      await useCase.execute({ userId: USER_ID, refreshToken: REFRESH_TOKEN, accessToken: ACCESS_TOKEN });

      // Math.max(0, negative) = 0 이므로 addToBlacklist(token, 0) 호출
      expect(mockRedisService.addToBlacklist).toHaveBeenCalledWith(ACCESS_TOKEN, 0);
    });
  });
});
