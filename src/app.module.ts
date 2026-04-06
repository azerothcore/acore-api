import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { CharactersModule } from './characters/characters.module';
import {
  AuthDatabaseConfig,
  CharactersDatabaseConfig,
  WebsiteDatabaseConfig,
  WorldDatabaseConfig,
} from './config/database.config';
import { WebsiteModule } from './website/website.module';
import { WorldModule } from './world/world.module';

const websiteEnabled = process.env.WEBSITE_MODULE_ENABLED === 'true';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot(AuthDatabaseConfig),
    TypeOrmModule.forRoot(WorldDatabaseConfig),
    TypeOrmModule.forRoot(CharactersDatabaseConfig),
    ...(websiteEnabled
      ? [TypeOrmModule.forRoot(WebsiteDatabaseConfig), WebsiteModule]
      : []),
    AuthModule,
    WorldModule,
    CharactersModule,
  ],
})
export class AppModule {}
