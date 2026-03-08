import { Module } from '@nestjs/common';
import { CreateBookmarkCommandHandler } from './application/commands/create-bookmark.command';
import { DeleteBookmarkCommandHandler } from './application/commands/delete-bookmark.command';
import { RecordHistoryCommandHandler } from './application/commands/record-history.command';
import { SaveGithubUserCommandHandler } from './application/commands/save-github-user.command';
import { SaveUserCommandHandler } from './application/commands/save-user.command';
import { UpdateUserPasswordCommandHandler } from './application/commands/update-user-password.command';
import { UpdateUserProfileCommandHandler } from './application/commands/update-user-profile.command';
import { FindBookmarkQueryHandler } from './application/queries/find-bookmark.query';
import { GetBookmarksQueryHandler } from './application/queries/get-bookmarks.query';
import { GetHistoryQueryHandler } from './application/queries/get-history.query';
import { GetOneUserByEmailQueryHandler } from './application/queries/get-one-user-by-email.query';
import { GetUserByIdQueryHandler } from './application/queries/get-user-by-id.query';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { GetBookmarksUseCase } from './application/use-cases/get-bookmarks.use-case';
import { GetHistoryUseCase } from './application/use-cases/get-history.use-case';
import { GetMeUseCase } from './application/use-cases/get-me.use-case';
import { RecordHistoryUseCase } from './application/use-cases/record-history.use-case';
import { ToggleBookmarkUseCase } from './application/use-cases/toggle-bookmark.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { UsersController } from './presenter/http/users.http.controller';

@Module({
  controllers: [UsersController],
  providers: [
    /** query-handlers */
    GetOneUserByEmailQueryHandler,
    GetUserByIdQueryHandler,
    GetBookmarksQueryHandler,
    FindBookmarkQueryHandler,
    GetHistoryQueryHandler,

    /** command-handlers */
    SaveUserCommandHandler,
    SaveGithubUserCommandHandler,
    UpdateUserProfileCommandHandler,
    UpdateUserPasswordCommandHandler,
    CreateBookmarkCommandHandler,
    DeleteBookmarkCommandHandler,
    RecordHistoryCommandHandler,

    /** use-cases */
    GetMeUseCase,
    UpdateProfileUseCase,
    ChangePasswordUseCase,
    GetBookmarksUseCase,
    ToggleBookmarkUseCase,
    GetHistoryUseCase,
    RecordHistoryUseCase,
  ],
})
export class UsersModule {}
