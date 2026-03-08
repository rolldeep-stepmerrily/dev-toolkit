import { Module } from '@nestjs/common';
import { SaveGithubUserCommandHandler } from 'src/users/application/commands/save-github-user.command';
import { GetOneUserByEmailQueryHandler } from 'src/users/application/queries/get-one-user-by-email.query';
import { SaveUserCommandHandler } from './application/commands/save-user.command';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,

    /** query-handlers */
    GetOneUserByEmailQueryHandler,

    /** command-handlers */
    SaveUserCommandHandler,
    SaveGithubUserCommandHandler,
  ],
})
export class UsersModule {}
