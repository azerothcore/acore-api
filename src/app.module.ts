import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthDatabaseConfig, WorldDatabaseConfig, CharactersDatabaseConfig, WebsiteDatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { WorldModule } from './world/world.module';
import { CharactersModule } from './characters/characters.module';
import { WebsiteModule } from './website/website.module';

@Module(
{
    imports:
    [
        TypeOrmModule.forRoot(AuthDatabaseConfig),
        TypeOrmModule.forRoot(WorldDatabaseConfig),
        TypeOrmModule.forRoot(CharactersDatabaseConfig),
        TypeOrmModule.forRoot(WebsiteDatabaseConfig),
        AuthModule,
        WorldModule,
        CharactersModule,
        WebsiteModule
    ]
})
export class AppModule {}
