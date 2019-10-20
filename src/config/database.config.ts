import { join } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const AuthDatabaseConfig: TypeOrmModuleOptions =
{
    type: 'mysql',
    host: process.env.AUTH_DATABASE_HOST,
    port: +process.env.AUTH_DATABASE_PORT,
    username: process.env.AUTH_DATABASE_USERNAME,
    password: process.env.AUTH_DATABASE_PASSWORD,
    database: process.env.AUTH_DATABASE_NAME,
    entities: [join(__dirname, '..', 'auth', '*.entity.{js, ts}')],
    synchronize: true
};

export const WorldDatabaseConfig: TypeOrmModuleOptions =
{
    name: 'worldConnection',
    type: 'mysql',
    host: process.env.WORLD_DATABASE_HOST,
    port: +process.env.WORLD_DATABASE_PORT,
    username: process.env.WORLD_DATABASE_USERNAME,
    password: process.env.WORLD_DATABASE_PASSWORD,
    database: process.env.WORLD_DATABASE_NAME,
    entities: [join(__dirname, '..', 'world', '*.entity.{js, ts}')],
    synchronize: true
};

export const CharactersDatabaseConfig: TypeOrmModuleOptions =
{
    name: 'charactersConnection',
    type: 'mysql',
    host: process.env.CHARACTERS_DATABASE_HOST,
    port: +process.env.CHARACTERS_DATABASE_PORT,
    username: process.env.CHARACTERS_DATABASE_USERNAME,
    password: process.env.CHARACTERS_DATABASE_PASSWORD,
    database: process.env.CHARACTERS_DATABASE_NAME,
    entities: [join(__dirname, '..', 'characters', '*.entity.{js, ts}')],
    synchronize: true
};

export const WebsiteDatabaseConfig: TypeOrmModuleOptions =
{
    name: 'websiteConnection',
    type: 'mysql',
    host: process.env.WEB_SITE_DATABASE_HOST,
    port: +process.env.WEB_SITE_DATABASE_PORT,
    username: process.env.WEB_SITE_DATABASE_USERNAME,
    password: process.env.WEB_SITE_DATABASE_PASSWORD,
    database: process.env.WEB_SITE_DATABASE_NAME,
    entities: [join(__dirname, '..', 'website', '*.entity.{js, ts}')],
    synchronize: true
};
