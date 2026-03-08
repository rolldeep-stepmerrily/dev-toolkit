import { Module } from '@nestjs/common';
import { HashUseCase } from './application/use-cases/hash.use-case';
import { VerifyUseCase } from './application/use-cases/verify.use-case';
import { BcryptHttpController } from './presenter/http/bcrypt.http.controller';

@Module({
  controllers: [BcryptHttpController],
  providers: [
    /** use-cases */
    HashUseCase,
    VerifyUseCase,
  ],
})
export class BcryptModule {}
