import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { User } from '@@decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { HistoryEntity } from './entities/history.entity';
import { ProfileEntity } from './entities/profile.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('accessToken')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 현재 로그인한 사용자의 프로필 조회
   *
   * @param {object} user JWT에서 추출한 사용자 정보
   * @returns {Promise<ProfileEntity>} 사용자 프로필
   */
  @ApiOperation({ summary: '내 프로필 조회' })
  @Get('me')
  getMe(@User() user: { id: number }): Promise<ProfileEntity> {
    return this.usersService.getMe(user.id);
  }

  /**
   * 프로필 정보(이름, 아바타) 수정
   *
   * @param {object} user JWT에서 추출한 사용자 정보
   * @param {UpdateProfileDto} dto 수정할 프로필 정보
   * @returns {Promise<ProfileEntity>} 수정된 프로필
   */
  @ApiOperation({ summary: '프로필 수정' })
  @Patch('me')
  updateProfile(@User() user: { id: number }, @Body() dto: UpdateProfileDto): Promise<ProfileEntity> {
    return this.usersService.updateProfile(user.id, dto);
  }

  /**
   * 비밀번호 변경
   *
   * @param {object} user JWT에서 추출한 사용자 정보
   * @param {ChangePasswordDto} dto 현재/새 비밀번호
   */
  @ApiOperation({ summary: '비밀번호 변경' })
  @HttpCode(HttpStatus.OK)
  @Post('me/password')
  changePassword(@User() user: { id: number }, @Body() dto: ChangePasswordDto): Promise<void> {
    return this.usersService.changePassword(user.id, dto);
  }

  /**
   * 북마크한 도구 목록 조회
   *
   * @param {object} user JWT에서 추출한 사용자 정보
   * @returns {Promise<string[]>} 북마크된 toolId 배열
   */
  @ApiOperation({ summary: '북마크 목록 조회' })
  @Get('me/bookmarks')
  getBookmarks(@User() user: { id: number }): Promise<string[]> {
    return this.usersService.getBookmarks(user.id);
  }

  /**
   * 도구 북마크 토글 (추가/제거)
   *
   * @param {object} user JWT에서 추출한 사용자 정보
   * @param {string} toolId 도구 ID
   * @returns {Promise<string[]>} 업데이트된 북마크 toolId 배열
   */
  @ApiOperation({ summary: '북마크 토글' })
  @HttpCode(HttpStatus.OK)
  @Post('me/bookmarks/:toolId')
  toggleBookmark(@User() user: { id: number }, @Param('toolId') toolId: string): Promise<string[]> {
    return this.usersService.toggleBookmark(user.id, toolId);
  }

  /**
   * 최근 사용한 도구 히스토리 조회 (최대 10개, 중복 제거)
   *
   * @param {object} user JWT에서 추출한 사용자 정보
   * @returns {Promise<HistoryEntity[]>} 최근 사용 도구 목록
   */
  @ApiOperation({ summary: '히스토리 조회' })
  @Get('me/history')
  getHistory(@User() user: { id: number }): Promise<HistoryEntity[]> {
    return this.usersService.getHistory(user.id);
  }

  /**
   * 도구 사용 기록 추가
   *
   * @param {object} user JWT에서 추출한 사용자 정보
   * @param {string} toolId 도구 ID
   */
  @ApiOperation({ summary: '도구 사용 기록' })
  @HttpCode(HttpStatus.OK)
  @Post('me/history/:toolId')
  recordHistory(@User() user: { id: number }, @Param('toolId') toolId: string): Promise<void> {
    return this.usersService.recordHistory(user.id, toolId);
  }
}
