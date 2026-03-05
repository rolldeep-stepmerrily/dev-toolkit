import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';

import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  /**
   * GitHub OAuth 프로필로 사용자를 조회하거나 생성하여 반환
   *
   * @param {string} accessToken GitHub 액세스 토큰
   * @param {string} _refreshToken GitHub 리프레시 토큰 (미사용)
   * @param {Profile} profile GitHub OAuth 프로필
   * @returns {Promise<object>} 조회 또는 생성된 사용자 정보
   */
  validate(accessToken: string, _refreshToken: string, profile: Profile): Promise<object> {
    return this.authService.findOrCreateGithubUser(profile, accessToken);
  }
}
