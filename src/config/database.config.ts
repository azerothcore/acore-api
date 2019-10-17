import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const AuthDatabaseConfig: TypeOrmModuleOptions =
{
    type: 'mysql',
    host: process.env.AUTH_DATABASE_HOST,
    port: +process.env.AUTH_DATABASE_PORT,
    username: process.env.AUTH_DATABASE_USERNAME,
    password: process.env.AUTH_DATABASE_PASSWORD,
    database: process.env.AUTH_DATABASE_NAME,
    entities: [__dirname + '/../auth/*.entity.{js, ts}'],
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
    entities: [__dirname + '/../website/*.entity.{js, ts}'],
    synchronize: true
};
