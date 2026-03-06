import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { isDefined } from 'class-validator';
import dayjs from 'dayjs';
import { Profile } from 'passport-github2';

import { AppException } from '@@exceptions';
import { PrismaService } from '../common/prisma/prisma.service';
import { AUTH_ERRORS } from './auth.error';
import { SignupDto } from './dto/signup.dto';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 이메일/비밀번호로 회원가입 후 토큰 발급
   *
   * @param {SignupDto} dto 회원가입 정보
   * @returns {Promise<TokenPair>} 발급된 액세스/리프레시 토큰 쌍
   * @throws {AppException} 이미 사용 중인 이메일인 경우
   */
  async signup(dto: SignupDto): Promise<TokenPair> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (isDefined(existing)) {
      throw new AppException(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hashed, name: dto.name ?? null },
    });

    return this.issueTokens(user.id, user.email);
  }

  /**
   * 이메일/비밀번호로 로컬 사용자 유효성 검증
   *
   * @param {string} email 사용자 이메일
   * @param {string} password 입력된 비밀번호
   * @returns {Promise<object>} 검증된 사용자 정보
   * @throws {AppException} 이메일 또는 비밀번호가 올바르지 않은 경우
   */
  async validateLocalUser(email: string, password: string): Promise<object> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!isDefined(user?.password)) {
      throw new AppException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new AppException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    return user;
  }

  /**
   * 로그인 후 토큰 발급
   *
   * @param {number} userId 사용자 ID
   * @param {string} email 사용자 이메일
   * @returns {Promise<TokenPair>} 발급된 액세스/리프레시 토큰 쌍
   */
  login(userId: number, email: string): Promise<TokenPair> {
    return this.issueTokens(userId, email);
  }

  /**
   * GitHub OAuth 프로필로 기존 사용자 조회 또는 신규 사용자 생성
   *
   * @param {Profile} profile GitHub OAuth 프로필
   * @param {string} accessToken GitHub 액세스 토큰
   * @returns {Promise<object>} 조회 또는 생성된 사용자 정보
   */
  async findOrCreateGithubUser(profile: Profile, accessToken: string): Promise<object> {
    const email = profile.emails?.[0]?.value;
    const providerAccountId = String(profile.id);

    const existing = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider: 'github', providerAccountId } },
      include: { user: true },
    });

    if (isDefined(existing)) {
      await this.prisma.oAuthAccount.update({
        where: { id: existing.id },
        data: { accessToken },
      });

      return existing.user;
    }

    let user = isDefined(email) ? await this.prisma.user.findUnique({ where: { email } }) : null;

    if (!isDefined(user)) {
      user = await this.prisma.user.create({
        data: {
          email: email ?? `github_${providerAccountId}@noemail.dev`,
          name: profile.displayName || profile.username || null,
          avatarUrl: profile.photos?.[0]?.value ?? null,
        },
      });
    }

    await this.prisma.oAuthAccount.create({
      data: { userId: user.id, provider: 'github', providerAccountId, accessToken },
    });

    return user;
  }

  /**
   * GitHub OAuth 로그인 콜백 후 토큰 발급
   *
   * @param {number} userId 사용자 ID
   * @param {string} email 사용자 이메일
   * @returns {Promise<TokenPair>} 발급된 액세스/리프레시 토큰 쌍
   */
  githubLoginCallback(userId: number, email: string): Promise<TokenPair> {
    return this.issueTokens(userId, email);
  }

  /**
   * 리프레시 토큰을 교체하고 새 토큰 쌍 발급
   *
   * @param {number} userId 사용자 ID
   * @param {string} email 사용자 이메일
   * @param {string} oldToken 기존 리프레시 토큰
   * @returns {Promise<TokenPair>} 새로 발급된 액세스/리프레시 토큰 쌍
   */
  async refresh(userId: number, email: string, oldToken: string): Promise<TokenPair> {
    await this.prisma.refreshToken.delete({ where: { token: oldToken } });

    return this.issueTokens(userId, email);
  }

  /**
   * 리프레시 토큰 삭제로 로그아웃 처리
   *
   * @param {number} userId 사용자 ID
   * @param {string} refreshToken 삭제할 리프레시 토큰
   */
  async logout(userId: number, refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId, token: refreshToken } });
  }

  /**
   * 액세스/리프레시 토큰 쌍 발급 및 리프레시 토큰 DB 저장
   *
   * @param {number} userId 사용자 ID
   * @param {string} email 사용자 이메일
   * @returns {Promise<TokenPair>} 발급된 액세스/리프레시 토큰 쌍
   */
  private async issueTokens(userId: number, email: string): Promise<TokenPair> {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      // biome-ignore lint/suspicious/noExplicitAny: @nestjs/jwt v11 expiresIn 타입이 ms의 StringValue를 요구하나 string과 호환되지 않는 라이브러리 타입 이슈
      expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      // biome-ignore lint/suspicious/noExplicitAny: @nestjs/jwt v11 expiresIn 타입이 ms의 StringValue를 요구하나 string과 호환되지 않는 라이브러리 타입 이슈
      expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN') as any,
    });

    const refreshTtlDays = this.configService.getOrThrow<number>('REFRESH_TOKEN_TTL_DAYS');
    const expiresAt = dayjs().add(refreshTtlDays, 'day').toDate();

    await this.prisma.refreshToken.create({
      data: { userId, token: refreshToken, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}
