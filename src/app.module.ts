import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthDatabaseConfig, WebsiteDatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { WebsiteModule } from './website/website.module';

@Module(
{
    imports: [
        TypeOrmModule.forRoot(AuthDatabaseConfig),
        TypeOrmModule.forRoot(WebsiteDatabaseConfig),
        AuthModule,
        WebsiteModule
    ]
})
export class AppModule {}
