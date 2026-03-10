import { UserEntity } from 'src/users/entities/user.entity';
import { FindOrCreateGithubUserUseCase } from './find-or-create-github-user.use-case';

// passport-github2 Profile의 필수 필드만 담은 테스트용 타입
interface TestProfile {
  id: string;
  displayName: string;
  username?: string;
  emails?: Array<{ value: string }>;
  photos?: Array<{ value: string }>;
  provider: 'github';
  profileUrl?: string;
}

describe('FindOrCreateGithubUserUseCase', () => {
  let useCase: FindOrCreateGithubUserUseCase;
  let mockCommandBus: { execute: jest.Mock };
  let mockQueryBus: { execute: jest.Mock };

  const GITHUB_PROFILE_ID = '12345';
  const GITHUB_EMAIL = 'github@example.com';
  const ACCESS_TOKEN = 'github-access-token';

  const makeProfile = (overrides: Partial<TestProfile> = {}): TestProfile => ({
    id: GITHUB_PROFILE_ID,
    displayName: 'GitHub User',
    username: 'githubuser',
    emails: [{ value: GITHUB_EMAIL }],
    photos: [{ value: 'https://avatar.url/photo.png' }],
    provider: 'github',
    ...overrides,
  });

  const mockUser: Partial<UserEntity> = {
    id: 1,
    email: GITHUB_EMAIL,
    name: 'GitHub User',
    avatarUrl: 'https://avatar.url/photo.png',
    password: null,
  };

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn() };
    mockQueryBus = { execute: jest.fn() };

    useCase = new FindOrCreateGithubUserUseCase(mockCommandBus as any, mockQueryBus as any);
  });

  describe('execute', () => {
    describe('[케이스 1] 기존 OAuth 계정이 있는 경우', () => {
      it('accessToken만 갱신하고 연결된 유저를 반환한다', async () => {
        const existingOAuthAccount = { id: 10, user: mockUser };
        mockQueryBus.execute.mockResolvedValueOnce(existingOAuthAccount);

        const result = await useCase.execute({ profile: makeProfile() as any, accessToken: ACCESS_TOKEN });

        expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
        const command = mockCommandBus.execute.mock.calls[0]?.[0] as { constructor: { name: string } };
        expect(command.constructor.name).toBe('UpdateOAuthAccountAccessTokenCommand');
        expect(result).toEqual(mockUser);
      });
    });

    describe('[케이스 2] OAuth 계정 없음 + 동일 이메일 유저 존재', () => {
      it('기존 유저에 OAuth 계정을 연결하고 해당 유저를 반환한다', async () => {
        mockQueryBus.execute
          .mockResolvedValueOnce(null)     // GetOAuthAccountByProviderQuery → 없음
          .mockResolvedValueOnce(mockUser); // GetOneUserByEmailQuery → 기존 유저 존재
        mockCommandBus.execute.mockResolvedValue(undefined);

        const result = await useCase.execute({ profile: makeProfile() as any, accessToken: ACCESS_TOKEN });

        // 유저 생성 없이 CreateOAuthAccountCommand만 실행
        expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
        const command = mockCommandBus.execute.mock.calls[0]?.[0] as { constructor: { name: string } };
        expect(command.constructor.name).toBe('CreateOAuthAccountCommand');
        expect(result).toEqual(mockUser);
      });
    });

    describe('[케이스 3] OAuth 계정 없음 + 이메일로 조회도 없음 (완전 신규)', () => {
      it('새 유저를 생성하고 OAuth 계정을 연결한 뒤 유저를 반환한다', async () => {
        mockQueryBus.execute
          .mockResolvedValueOnce(null) // GetOAuthAccountByProviderQuery
          .mockResolvedValueOnce(null); // GetOneUserByEmailQuery
        mockCommandBus.execute
          .mockResolvedValueOnce(mockUser)   // SaveGithubUserCommand
          .mockResolvedValueOnce(undefined); // CreateOAuthAccountCommand

        const result = await useCase.execute({ profile: makeProfile() as any, accessToken: ACCESS_TOKEN });

        expect(mockCommandBus.execute).toHaveBeenCalledTimes(2);
        const [saveUserCall, createOAuthCall] = mockCommandBus.execute.mock.calls;
        expect((saveUserCall?.[0] as { constructor: { name: string } }).constructor.name).toBe('SaveGithubUserCommand');
        expect((createOAuthCall?.[0] as { constructor: { name: string } }).constructor.name).toBe('CreateOAuthAccountCommand');
        expect(result).toEqual(mockUser);
      });
    });

    describe('[케이스 4] 이메일이 없는 GitHub 프로필', () => {
      it('placeholder 이메일(github_{id}@noemail.dev)로 유저를 생성한다', async () => {
        mockQueryBus.execute.mockResolvedValueOnce(null); // GetOAuthAccountByProviderQuery
        mockCommandBus.execute
          .mockResolvedValueOnce(mockUser)   // SaveGithubUserCommand
          .mockResolvedValueOnce(undefined); // CreateOAuthAccountCommand

        await useCase.execute({ profile: makeProfile({ emails: undefined }) as any, accessToken: ACCESS_TOKEN });

        const saveUserCommand = mockCommandBus.execute.mock.calls[0]?.[0] as { props: { email: string } };
        expect(saveUserCommand.props.email).toBe(`github_${GITHUB_PROFILE_ID}@noemail.dev`);
      });

      it('이메일이 없으면 GetOneUserByEmailQuery를 실행하지 않는다', async () => {
        mockQueryBus.execute.mockResolvedValueOnce(null);
        mockCommandBus.execute.mockResolvedValue(mockUser);

        await useCase.execute({ profile: makeProfile({ emails: undefined }) as any, accessToken: ACCESS_TOKEN });

        // GetOAuthAccountByProviderQuery 한 번만 호출
        expect(mockQueryBus.execute).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('findOrCreateUser', () => {
    it('이메일이 있고 기존 유저가 존재하면 유저 생성 없이 기존 유저를 반환한다', async () => {
      mockQueryBus.execute.mockResolvedValue(mockUser);

      const result = await useCase.findOrCreateUser({
        email: GITHUB_EMAIL,
        profile: makeProfile() as any,
        providerAccountId: GITHUB_PROFILE_ID,
      });

      expect(mockCommandBus.execute).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('이메일이 undefined이면 GetOneUserByEmailQuery를 실행하지 않고 유저를 생성한다', async () => {
      mockCommandBus.execute.mockResolvedValue(mockUser);

      await useCase.findOrCreateUser({
        email: undefined,
        profile: makeProfile() as any,
        providerAccountId: GITHUB_PROFILE_ID,
      });

      expect(mockQueryBus.execute).not.toHaveBeenCalled();
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
    });
  });
});
