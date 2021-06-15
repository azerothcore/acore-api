import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  AuthDatabaseConfig,
  WorldDatabaseConfig,
  CharactersDatabaseConfig,
  ElunaDatabaseConfig,
  // WebsiteDatabaseConfig,
} from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { WorldModule } from './world/world.module';
import { CharactersModule } from './characters/characters.module';
import { ElunaModule } from './eluna/eluna.module';
// import { WebsiteModule } from './website/website.module';


@Module({
  imports: [
    TypeOrmModule.forRoot(AuthDatabaseConfig),
    TypeOrmModule.forRoot(WorldDatabaseConfig),
    TypeOrmModule.forRoot(CharactersDatabaseConfig),
    TypeOrmModule.forRoot(ElunaDatabaseConfig),
    // TypeOrmModule.forRoot(WebsiteDatabaseConfig),
    AuthModule,
    WorldModule,
    CharactersModule,
    ElunaModule,
    // WebsiteModule,
  ],
})
export class AppModule {}
