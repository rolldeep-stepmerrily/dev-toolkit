import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { User } from '@@decorators';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { SignupDto } from './dto/signup.dto';
import { TokenEntity } from './entities/token.entity';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 이메일/비밀번호 회원가입 후 토큰 발급
   *
   * @param {SignupDto} dto 회원가입 정보
   * @returns {Promise<TokenEntity>} 발급된 액세스/리프레시 토큰 쌍
   */
  @ApiOperation({ summary: '이메일/비밀번호 회원가입' })
  @Post('signup')
  signup(@Body() dto: SignupDto): Promise<TokenEntity> {
    return this.authService.signup(dto);
  }

  /**
   * 이메일/비밀번호 로그인 후 토큰 발급
   *
   * @param {object} user LocalAuthGuard가 주입한 인증된 사용자 정보
   * @returns {Promise<TokenEntity>} 발급된 액세스/리프레시 토큰 쌍
   */
  @ApiOperation({ summary: '이메일/비밀번호 로그인' })
  @ApiBody({ type: LoginDto })
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@User() user: { id: number; email: string }): Promise<TokenEntity> {
    return this.authService.login(user.id, user.email);
  }

  /**
   * GitHub OAuth 로그인 시작 (GitHub으로 리디렉션)
   */
  @ApiOperation({ summary: 'GitHub OAuth 로그인 시작' })
  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubLogin(): void {
    // GithubAuthGuard가 GitHub OAuth 페이지로 리디렉션 처리
  }

  /**
   * GitHub OAuth 콜백 처리 후 클라이언트로 토큰과 함께 리디렉션
   *
   * @param {object} user GithubAuthGuard가 주입한 인증된 사용자 정보
   * @param {Response} res Express Response 객체
   */
  @ApiOperation({ summary: 'GitHub OAuth 콜백' })
  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubCallback(@User() user: { id: number; email: string }, @Res() res: Response): Promise<void> {
    const { accessToken, refreshToken } = await this.authService.githubLoginCallback(user.id, user.email);
    const clientUrl = this.configService.getOrThrow<string>('CLIENT_URL');
    res.redirect(`${clientUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  }

  /**
   * 리프레시 토큰으로 새 액세스 토큰 발급
   *
   * @param {object} user JwtRefreshGuard가 주입한 사용자 정보 (리프레시 토큰 포함)
   * @returns {Promise<TokenEntity>} 새로 발급된 액세스/리프레시 토큰 쌍
   */
  @ApiOperation({ summary: 'Access token 갱신' })
  @ApiBearerAuth('refreshToken')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@User() user: { id: number; email: string; refreshToken: string }): Promise<TokenEntity> {
    return this.authService.refresh(user.id, user.email, user.refreshToken);
  }

  /**
   * 로그아웃 처리 (리프레시 토큰 무효화)
   *
   * @param {object} user JwtAuthGuard가 주입한 인증된 사용자 정보
   * @param {LogoutDto} dto 무효화할 리프레시 토큰
   */
  @ApiOperation({ summary: '로그아웃' })
  @ApiBearerAuth('accessToken')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@User() user: { id: number }, @Body() dto: LogoutDto): Promise<void> {
    return this.authService.logout(user.id, dto.refreshToken);
  }
}
