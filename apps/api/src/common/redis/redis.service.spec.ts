import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

const mockRedisClient = {
  set: jest.fn(),
  exists: jest.fn(),
  quit: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedisClient);
});

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        if (key === 'REDIS_HOST') return 'localhost';
        if (key === 'REDIS_PORT') return 6379;
        throw new Error(`Unknown config key: ${key}`);
      }),
    } as unknown as ConfigService;

    service = new RedisService(configService);
    service.onModuleInit();
    jest.clearAllMocks();
  });

  describe('addToBlacklist', () => {
    it('ttlSeconds가 0이면 Redis set을 호출하지 않는다', async () => {
      await service.addToBlacklist('token', 0);

      expect(mockRedisClient.set).not.toHaveBeenCalled();
    });

    it('ttlSeconds가 음수이면 Redis set을 호출하지 않는다', async () => {
      await service.addToBlacklist('token', -100);

      expect(mockRedisClient.set).not.toHaveBeenCalled();
    });

    it('ttlSeconds가 양수이면 blacklist:{token} 키로 EX 옵션과 함께 저장한다', async () => {
      await service.addToBlacklist('my-access-token', 900);

      expect(mockRedisClient.set).toHaveBeenCalledWith('blacklist:my-access-token', '1', 'EX', 900);
    });
  });

  describe('isBlacklisted', () => {
    it('Redis에 키가 존재하면 true를 반환한다', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await service.isBlacklisted('my-access-token');

      expect(result).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith('blacklist:my-access-token');
    });

    it('Redis에 키가 없으면 false를 반환한다', async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await service.isBlacklisted('my-access-token');

      expect(result).toBe(false);
    });
  });
});
