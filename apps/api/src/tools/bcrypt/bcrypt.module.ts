import { Module } from '@nestjs/common';
import { BcryptController } from './bcrypt.controller';
import { BcryptService } from './bcrypt.service';

@Module({
  controllers: [BcryptController],
  providers: [BcryptService],
})
export class BcryptModule {}
