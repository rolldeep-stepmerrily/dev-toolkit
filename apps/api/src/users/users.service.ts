import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { isDefined } from 'class-validator';

import { AppException } from '@@exceptions';
import { PrismaService } from '../common/prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { HistoryEntity } from './entities/history.entity';
import { ProfileEntity } from './entities/profile.entity';
import { USERS_ERRORS } from './users.error';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 사용자 프로필 조회
   *
   * @param {number} userId 사용자 ID
   * @returns {Promise<ProfileEntity>} 사용자 프로필
   * @throws {AppException} 사용자를 찾을 수 없는 경우
   */
  async getMe(userId: number): Promise<ProfileEntity> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!isDefined(user)) {
      throw new AppException(USERS_ERRORS.NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      hasPassword: isDefined(user.password),
      createdAt: user.createdAt,
    };
  }

  /**
   * 프로필 정보(이름, 아바타) 수정
   *
   * @param {number} userId 사용자 ID
   * @param {UpdateProfileDto} dto 수정할 프로필 정보
   * @returns {Promise<ProfileEntity>} 수정된 프로필
   */
  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<ProfileEntity> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(isDefined(dto.name) && { name: dto.name }),
        ...(isDefined(dto.avatarUrl) && { avatarUrl: dto.avatarUrl }),
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      hasPassword: isDefined(user.password),
      createdAt: user.createdAt,
    };
  }

  /**
   * 비밀번호 변경 (현재 비밀번호 검증 후 변경)
   *
   * @param {number} userId 사용자 ID
   * @param {ChangePasswordDto} dto 현재/새 비밀번호
   * @throws {AppException} 비밀번호 로그인 미사용 계정, 현재 비밀번호 불일치, 동일 비밀번호인 경우
   */
  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currentHash = user?.password;

    if (!isDefined(currentHash)) {
      throw new AppException(USERS_ERRORS.NO_PASSWORD);
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, currentHash);

    if (!isMatch) {
      throw new AppException(USERS_ERRORS.WRONG_PASSWORD);
    }

    const isSame = await bcrypt.compare(dto.newPassword, currentHash);

    if (isSame) {
      throw new AppException(USERS_ERRORS.PASSWORD_SAME);
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  }

  /**
   * 북마크한 도구 목록 조회
   *
   * @param {number} userId 사용자 ID
   * @returns {Promise<string[]>} 북마크된 toolId 배열 (생성 순)
   */
  async getBookmarks(userId: number): Promise<string[]> {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return bookmarks.map((b) => b.toolId);
  }

  /**
   * 도구 북마크 토글 (없으면 추가, 있으면 제거)
   *
   * @param {number} userId 사용자 ID
   * @param {string} toolId 도구 ID
   * @returns {Promise<string[]>} 업데이트된 북마크 toolId 배열
   */
  async toggleBookmark(userId: number, toolId: string): Promise<string[]> {
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_toolId: { userId, toolId } },
    });

    if (isDefined(existing)) {
      await this.prisma.bookmark.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.bookmark.create({ data: { userId, toolId } });
    }

    return this.getBookmarks(userId);
  }

  /**
   * 최근 사용한 도구 히스토리 조회 (최대 10개, 중복 제거)
   *
   * @param {number} userId 사용자 ID
   * @returns {Promise<HistoryEntity[]>} 최근 사용 도구 목록
   */
  async getHistory(userId: number): Promise<HistoryEntity[]> {
    const entries = await this.prisma.toolHistory.findMany({
      where: { userId },
      orderBy: { usedAt: 'desc' },
      take: 100,
    });

    const seen = new Set<string>();
    const result: HistoryEntity[] = [];

    for (const entry of entries) {
      if (seen.has(entry.toolId)) {
        continue;
      }

      seen.add(entry.toolId);
      result.push({ toolId: entry.toolId, usedAt: entry.usedAt });

      if (result.length >= 10) {
        break;
      }
    }

    return result;
  }

  /**
   * 도구 사용 기록 추가
   *
   * @param {number} userId 사용자 ID
   * @param {string} toolId 도구 ID
   */
  async recordHistory(userId: number, toolId: string): Promise<void> {
    await this.prisma.toolHistory.create({ data: { userId, toolId } });
  }
}
