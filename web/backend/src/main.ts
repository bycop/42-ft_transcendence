import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FrontModule } from './front.module';
import * as cookieParser from "cookie-parser";
import { AuthGuard } from 'guards/auth.guard'
import { Reflector } from '@nestjs/core'
import { AuthService } from 'auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const front = await NestFactory.create(FrontModule);
  const authService = app.get(AuthService)
  const reflector = app.get(Reflector)
  app.use(cookieParser());
  app.useGlobalGuards(new AuthGuard(authService, reflector));
  app.enableCors({
	  origin: "http://" + process.env.BASE_URL,
	  credentials: true
  });
  app.setGlobalPrefix('api'); //change
  await app.listen(3000);
  if (process.env.BUILD_MODE && process.env.BUILD_MODE == "prod")
    await front.listen(80);
}
bootstrap();
