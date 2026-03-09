import { User } from '@@decorators';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChangePasswordUseCase } from 'src/users/application/use-cases/change-password.use-case';
import { GetAvatarPresignedUrlUseCase } from 'src/users/application/use-cases/get-avatar-presigned-url.use-case';
import { GetBookmarksUseCase } from 'src/users/application/use-cases/get-bookmarks.use-case';
import { GetMeUseCase } from 'src/users/application/use-cases/get-me.use-case';
import { ToggleBookmarkUseCase } from 'src/users/application/use-cases/toggle-bookmark.use-case';
import { UpdateProfileUseCase } from 'src/users/application/use-cases/update-profile.use-case';
import { ProfileEntity } from 'src/users/entities/profile.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GetAvatarPresignedUrlDto, GetAvatarPresignedUrlResponseDto } from './dto/get-avatar-presigned-url.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersRouter } from './users.path.presenter';

@ApiTags(UsersRouter.HttpApiTags)
@ApiBearerAuth('accessToken')
@UseGuards(JwtAuthGuard)
@Controller(UsersRouter.Root)
export class UsersHttpController {
  constructor(
    private readonly getMeUseCase: GetMeUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly getAvatarPresignedUrlUseCase: GetAvatarPresignedUrlUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly getBookmarksUseCase: GetBookmarksUseCase,
    private readonly toggleBookmarkUseCase: ToggleBookmarkUseCase,
  ) {}

  @ApiOperation({ summary: '내 프로필 조회' })
  @Get(UsersRouter.Http.GetMe)
  async getMe(@User() user: { id: number }): Promise<ProfileEntity> {
    return await this.getMeUseCase.execute({ userId: user.id });
  }

  @ApiOperation({ summary: '프로필 수정' })
  @Patch(UsersRouter.Http.UpdateProfile)
  async updateProfile(@User() user: { id: number }, @Body() bodyDto: UpdateProfileDto): Promise<ProfileEntity> {
    return await this.updateProfileUseCase.execute({ userId: user.id, bodyDto });
  }

  @ApiOperation({ summary: '아바타 업로드용 presigned URL 발급' })
  @Post(UsersRouter.Http.GetAvatarPresignedUrl)
  async getAvatarPresignedUrl(
    @User() user: { id: number },
    @Body() bodyDto: GetAvatarPresignedUrlDto,
  ): Promise<GetAvatarPresignedUrlResponseDto> {
    return await this.getAvatarPresignedUrlUseCase.execute({
      userId: user.id,
      filename: bodyDto.filename,
      contentType: bodyDto.contentType,
    });
  }

  @ApiOperation({ summary: '비밀번호 변경' })
  @HttpCode(HttpStatus.OK)
  @Post(UsersRouter.Http.ChangePassword)
  async changePassword(@User() user: { id: number }, @Body() bodyDto: ChangePasswordDto): Promise<void> {
    await this.changePasswordUseCase.execute({ userId: user.id, bodyDto });
  }

  @ApiOperation({ summary: '북마크 목록 조회' })
  @Get(UsersRouter.Http.GetBookmarks)
  async getBookmarks(@User() user: { id: number }): Promise<string[]> {
    return await this.getBookmarksUseCase.execute({ userId: user.id });
  }

  @ApiOperation({ summary: '북마크 토글' })
  @HttpCode(HttpStatus.OK)
  @Post(UsersRouter.Http.ToggleBookmark)
  async toggleBookmark(@User() user: { id: number }, @Param('toolId') toolId: string): Promise<string[]> {
    return await this.toggleBookmarkUseCase.execute({ userId: user.id, toolId });
  }
}
