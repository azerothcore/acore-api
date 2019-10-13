import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleOptions =
{
    type: 'mysql',
    host: process.env.AUTH_DATABASE_HOST,
    port: +process.env.AUTH_DATABASE_PORT,
    username: process.env.AUTH_DATABASE_USERNAME,
    password: process.env.AUTH_DATABASE_PASSWORD,
    database: process.env.AUTH_DATABASE_NAME,
    entities: [__dirname + '/../**/*.entity.{js, ts}'],
    synchronize: true
};
