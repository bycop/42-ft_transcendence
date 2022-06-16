import { Module } from '@nestjs/common';
import { ServeStaticModule} from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '../../../frontend/dist/'), //client est le dossier ou va etre l'app vue
    }),
  ]
})
export class FrontModule {}
