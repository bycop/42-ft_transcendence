import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ServeStaticModule} from '@nestjs/serve-static';
import { join } from 'path';

import { PongModule } from "./pong/pong.module";
import { ChatModule } from "./chat/chat.module";
import {ProfileModule} from "./profile/profile.module";
import { AuthModule } from './auth/auth.module';
import { GlobalModule } from './global/global.module';
import { AchievementModule } from './achievement/achievement.module';


@Module({
  imports: [
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', '../../frontend/'), //client est le dossier ou va etre l'app vue
    // }),
    PongModule,
    ChatModule,
    ProfileModule,
    AuthModule,
    GlobalModule,
    AchievementModule,
  ],
  providers: [AppService],
})
export class AppModule {}
