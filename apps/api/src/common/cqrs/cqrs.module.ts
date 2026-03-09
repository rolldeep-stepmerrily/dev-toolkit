import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypedCommandBus } from './typed-command-bus';
import { TypedQueryBus } from './typed-query-bus';

@Global()
@Module({
  imports: [CqrsModule],
  providers: [TypedQueryBus, TypedCommandBus],
  exports: [CqrsModule, TypedQueryBus, TypedCommandBus],
})
export class GlobalCqrsModule {}
