import { Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { Profile } from 'passport-github2';
import { TypedCommandBus, TypedQueryBus } from 'src/common/cqrs';
import { SaveGithubUserCommand } from 'src/users/application/commands/save-github-user.command';
import { GetOneUserByEmailQuery } from 'src/users/application/queries/get-one-user-by-email.query';
import { UserEntity } from 'src/users/entities/user.entity';
import { CreateOAuthAccountCommand } from '../command/create-oauth-account.command';
import { UpdateOAuthAccountAccessTokenCommand } from '../command/update-oauth-account-access-token.command';
import { GetOAuthAccountByProviderQuery, OAuthAccountWithUser } from '../queries/get-oauth-account-by-provider.query';

@Injectable()
export class FindOrCreateGithubUserUseCase {
  constructor(
    private readonly commandBus: TypedCommandBus<
      UpdateOAuthAccountAccessTokenCommand | SaveGithubUserCommand | CreateOAuthAccountCommand
    >,
    private readonly queryBus: TypedQueryBus<GetOAuthAccountByProviderQuery | GetOneUserByEmailQuery>,
  ) {}

  async execute(props: FindOrCreateGithubUserUseCaseProps): Promise<UserEntity> {
    const { profile, accessToken } = props;
    const providerAccountId = String(profile.id);
    const email = profile.emails?.[0]?.value;

    const existing = await this.findOAuthAccount(providerAccountId);

    if (isDefined(existing)) {
      await this.updateOAuthAccountToken(existing.id, accessToken);
      return existing.user;
    }

    const user = await this.findOrCreateUser({ email, profile, providerAccountId });

    await this.linkOAuthAccount({ userId: user.id, providerAccountId, accessToken });

    return user;
  }

  /**
   * GitHub provider로 연결된 OAuth 계정 조회
   *
   * @param {string} providerAccountId GitHub 사용자 ID
   * @returns {Promise<OAuthAccountWithUser | null>} 조회된 OAuth 계정 (유저 포함)
   */
  async findOAuthAccount(providerAccountId: string): Promise<OAuthAccountWithUser | null> {
    return await this.queryBus.execute(new GetOAuthAccountByProviderQuery({ provider: 'github', providerAccountId }));
  }

  /**
   * OAuth 계정의 액세스 토큰 갱신
   *
   * @param {number} id OAuth 계정 ID
   * @param {string} accessToken 새 GitHub 액세스 토큰
   */
  async updateOAuthAccountToken(id: number, accessToken: string): Promise<void> {
    await this.commandBus.execute(new UpdateOAuthAccountAccessTokenCommand({ id, accessToken }));
  }

  /**
   * 이메일로 기존 유저 조회, 없으면 GitHub 프로필로 신규 생성
   *
   * @param {string | undefined} email GitHub 이메일
   * @param {Profile} profile GitHub OAuth 프로필
   * @returns {Promise<UserEntity>} 조회 또는 생성된 유저
   */
  async findOrCreateUser(props: {
    email: string | undefined;
    profile: Profile;
    providerAccountId: string;
  }): Promise<UserEntity> {
    const { email, profile, providerAccountId } = props;

    if (isDefined(email)) {
      const existing = await this.queryBus.execute(new GetOneUserByEmailQuery({ email }));
      if (isDefined(existing)) return existing;
    }

    return await this.commandBus.execute(
      new SaveGithubUserCommand({
        email: email ?? `github_${providerAccountId}@noemail.dev`,
        name: profile.displayName || profile.username || null,
        avatarUrl: profile.photos?.[0]?.value ?? null,
      }),
    );
  }

  /**
   * 유저에 GitHub OAuth 계정 연결
   *
   * @param {number} userId 유저 ID
   * @param {string} providerAccountId GitHub 사용자 ID
   * @param {string} accessToken GitHub 액세스 토큰
   */
  async linkOAuthAccount(props: { userId: number; providerAccountId: string; accessToken: string }): Promise<void> {
    const { userId, providerAccountId, accessToken } = props;

    await this.commandBus.execute(
      new CreateOAuthAccountCommand({ userId, provider: 'github', providerAccountId, accessToken }),
    );
  }
}

interface FindOrCreateGithubUserUseCaseProps {
  profile: Profile;
  accessToken: string;
}
