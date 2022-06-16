import { Global, Module } from '@nestjs/common';
import { DbService } from './services/db.service';
import { GlobalService } from './services/global.service';
import { GlobalController } from './global.controller';

@Global()
@Module({
  providers: [GlobalService, DbService],
  exports: [GlobalService, DbService],
  controllers: [GlobalController]
})
export class GlobalModule {}
