import type Redis from 'ioredis';
import { RedisThrottlerStorage } from './redis-throttler.storage';
import { RedisService } from './redis.service';

describe('RedisThrottlerStorage', () => {
  let storage: RedisThrottlerStorage;
  let mockRedisClient: jest.Mocked<Pick<Redis, 'exists' | 'pttl' | 'incr' | 'pexpire' | 'set'>>;
  let mockRedisService: { getClient: jest.Mock };

  const KEY = 'user-ip-key';
  const TTL = 60_000;
  const LIMIT = 5;
  const BLOCK_DURATION = 10_000;
  const THROTTLER_NAME = 'default';

  const hitKey = `throttle:${THROTTLER_NAME}:${KEY}`;
  const blockKey = `throttle:block:${THROTTLER_NAME}:${KEY}`;

  beforeEach(() => {
    mockRedisClient = {
      exists: jest.fn(),
      pttl: jest.fn(),
      incr: jest.fn(),
      pexpire: jest.fn(),
      set: jest.fn(),
    };
    mockRedisService = {
      getClient: jest.fn().mockReturnValue(mockRedisClient),
    };
    storage = new RedisThrottlerStorage(mockRedisService as unknown as RedisService);
  });

  describe('increment', () => {
    it('이미 차단된 상태이면 요청 처리 없이 isBlocked: true를 반환한다', async () => {
      mockRedisClient.exists.mockResolvedValue(1);
      mockRedisClient.pttl.mockResolvedValue(5_000);

      const result = await storage.increment(KEY, TTL, LIMIT, BLOCK_DURATION, THROTTLER_NAME);

      expect(mockRedisClient.incr).not.toHaveBeenCalled();
      expect(result.isBlocked).toBe(true);
      expect(result.totalHits).toBe(LIMIT + 1);
      expect(result.timeToBlockExpire).toBe(5_000);
    });

    it('첫 번째 요청이면 hitKey에 TTL을 설정한다', async () => {
      mockRedisClient.exists.mockResolvedValue(0);
      mockRedisClient.incr.mockResolvedValue(1);
      mockRedisClient.pttl.mockResolvedValue(59_000);

      const result = await storage.increment(KEY, TTL, LIMIT, BLOCK_DURATION, THROTTLER_NAME);

      expect(mockRedisClient.pexpire).toHaveBeenCalledWith(hitKey, TTL);
      expect(result.totalHits).toBe(1);
      expect(result.isBlocked).toBe(false);
    });

    it('이후 요청은 TTL을 재설정하지 않고 카운터만 증가한다', async () => {
      mockRedisClient.exists.mockResolvedValue(0);
      mockRedisClient.incr.mockResolvedValue(3);
      mockRedisClient.pttl.mockResolvedValue(50_000);

      const result = await storage.increment(KEY, TTL, LIMIT, BLOCK_DURATION, THROTTLER_NAME);

      expect(mockRedisClient.pexpire).not.toHaveBeenCalled();
      expect(result.totalHits).toBe(3);
      expect(result.isBlocked).toBe(false);
    });

    it('limit을 초과하면 blockKey를 설정하고 isBlocked: true를 반환한다', async () => {
      mockRedisClient.exists.mockResolvedValue(0);
      mockRedisClient.incr.mockResolvedValue(LIMIT + 1);
      mockRedisClient.pttl
        .mockResolvedValueOnce(50_000) // hitKey pttl
        .mockResolvedValueOnce(BLOCK_DURATION); // blockKey pttl

      const result = await storage.increment(KEY, TTL, LIMIT, BLOCK_DURATION, THROTTLER_NAME);

      expect(mockRedisClient.set).toHaveBeenCalledWith(blockKey, '1', 'PX', BLOCK_DURATION);
      expect(result.isBlocked).toBe(true);
      expect(result.timeToBlockExpire).toBe(BLOCK_DURATION);
    });

    it('limit 이내이면 isBlocked: false이고 blockKey를 설정하지 않는다', async () => {
      mockRedisClient.exists.mockResolvedValue(0);
      mockRedisClient.incr.mockResolvedValue(LIMIT);
      mockRedisClient.pttl.mockResolvedValue(30_000);

      const result = await storage.increment(KEY, TTL, LIMIT, BLOCK_DURATION, THROTTLER_NAME);

      expect(mockRedisClient.set).not.toHaveBeenCalled();
      expect(result.isBlocked).toBe(false);
      expect(result.timeToBlockExpire).toBe(0);
    });

    it('blockKey pttl이 음수이면 timeToBlockExpire를 0으로 반환한다', async () => {
      mockRedisClient.exists.mockResolvedValue(1);
      mockRedisClient.pttl.mockResolvedValue(-1);

      const result = await storage.increment(KEY, TTL, LIMIT, BLOCK_DURATION, THROTTLER_NAME);

      expect(result.timeToBlockExpire).toBe(0);
    });
  });
});
