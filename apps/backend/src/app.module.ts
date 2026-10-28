import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import AppDataSource from './data-source';
import { CognitoModule } from './aws/cognito/cognito.module';
import { UsersModule } from './users/users.module';
import { SitesModule } from './sites/sites.module';
import { MediaModule } from './media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      ...AppDataSource.options,
      migrations: [],
      migrationsRun: false,
    }),
    CognitoModule,
    UsersModule,
    SitesModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
