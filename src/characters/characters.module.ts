import { Module } from '@nestjs/common';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Characters } from './characters.entity';
import { RecoveryItem } from './recovery_item.entity';

@Module(
{
    imports: [TypeOrmModule.forFeature([Characters, RecoveryItem], 'charactersConnection')],
    controllers: [CharactersController],
    providers: [CharactersService]
})
export class CharactersModule {}
