import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Soap } from '../shared/soap';
import { DbcService } from '../storage/dbc.service';
import { CharacterAchievement } from './character_achievement.entity';
import { CharacterAchievementProgress } from './character_achievement_progress.entity';
import { CharacterBanned } from './character_banned.entity';
import { Characters } from './characters.entity';
import { CharactersService } from './characters.service';
import { LogArenaFights } from './log_arena_fights.entity';
import { LogArenaMemberstats } from './log_arena_memberstats.entity';
import { RecoveryItem } from './recovery_item.entity';
import { Worldstates } from './worldstates.entity';

const CONNECTION = 'charactersConnection';

const CHARACTERS = [
  { guid: 7, name: 'First', account: 2 },
  { guid: 9, name: 'Second', account: 2 },
  { guid: 3, name: 'Other', account: 1 },
];

const RECOVERY_ITEMS = [
  { Id: 55, Guid: 3, ItemEntry: 2589, Count: 20 },
  { Id: 56, Guid: 7, ItemEntry: 2589, Count: 5 },
  { Id: 57, Guid: 9, ItemEntry: 4306, Count: 1 },
];

const matches = (
  row: Record<string, unknown>,
  where: Record<string, unknown>,
): boolean => Object.entries(where).every(([key, value]) => row[key] === value);

describe('CharactersService', () => {
  let service: CharactersService;
  let recoveryItems: typeof RECOVERY_ITEMS;
  let recoveryItemRepository: { findOne: jest.Mock; delete: jest.Mock };
  let soap: jest.SpyInstance;

  beforeEach(async () => {
    recoveryItems = RECOVERY_ITEMS.map((row) => ({ ...row }));
    recoveryItemRepository = {
      findOne: jest.fn(
        async ({ where }) =>
          recoveryItems.find((row) => matches(row, where)) ?? null,
      ),
      delete: jest.fn(async (where) => {
        const remaining = recoveryItems.filter((row) => !matches(row, where));
        const affected = recoveryItems.length - remaining.length;
        recoveryItems.splice(0, recoveryItems.length, ...remaining);
        return { affected };
      }),
    };
    const charactersRepository = {
      findOne: jest.fn(
        async ({ where }) =>
          CHARACTERS.find((row) => matches(row, where)) ?? null,
      ),
    };

    const module = await Test.createTestingModule({
      providers: [
        CharactersService,
        {
          provide: getRepositoryToken(Characters, CONNECTION),
          useValue: charactersRepository,
        },
        {
          provide: getRepositoryToken(RecoveryItem, CONNECTION),
          useValue: recoveryItemRepository,
        },
        ...[
          CharacterBanned,
          Worldstates,
          LogArenaFights,
          LogArenaMemberstats,
          CharacterAchievement,
          CharacterAchievementProgress,
        ].map((entity) => ({
          provide: getRepositoryToken(entity, CONNECTION),
          useValue: {},
        })),
        { provide: getDataSourceToken('authConnection'), useValue: {} },
        { provide: getDataSourceToken(CONNECTION), useValue: {} },
        { provide: DbcService, useValue: {} },
      ],
    }).compile();

    service = module.get(CharactersService);
    soap = jest.spyOn(Soap, 'command').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('recoveryItem', () => {
    it('mails the stored item of a row owned by the requested character', async () => {
      await expect(
        service.recoveryItem({ id: 56, guid: 7 }, 2),
      ).resolves.toEqual({ status: 'success' });
      expect(recoveryItemRepository.delete).toHaveBeenCalledWith({
        Id: 56,
        Guid: 7,
      });
      expect(soap).toHaveBeenCalledWith(
        'send items First "Recovery Item" "AzerothJS Recovery Item" 2589:5',
      );
      expect(recoveryItems.map((row) => row.Id)).toEqual([55, 57]);
    });

    it('accepts any character of the account, not only the first one', async () => {
      await expect(
        service.recoveryItem({ id: 57, guid: 9 }, 2),
      ).resolves.toEqual({ status: 'success' });
      expect(soap).toHaveBeenCalledWith(
        'send items Second "Recovery Item" "AzerothJS Recovery Item" 4306:1',
      );
    });

    it('rejects a row owned by another character', async () => {
      await expect(
        service.recoveryItem({ id: 55, guid: 7 }, 2),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(recoveryItemRepository.delete).not.toHaveBeenCalled();
      expect(soap).not.toHaveBeenCalled();
      expect(recoveryItems).toHaveLength(3);
    });

    it('rejects a character that does not belong to the account', async () => {
      await expect(
        service.recoveryItem({ id: 55, guid: 3 }, 2),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(recoveryItemRepository.delete).not.toHaveBeenCalled();
      expect(soap).not.toHaveBeenCalled();
    });

    it('mails a row only once when it is requested concurrently', async () => {
      const results = await Promise.allSettled([
        service.recoveryItem({ id: 56, guid: 7 }, 2),
        service.recoveryItem({ id: 56, guid: 7 }, 2),
      ]);
      expect(
        results.filter((result) => result.status === 'fulfilled'),
      ).toHaveLength(1);
      expect(soap).toHaveBeenCalledTimes(1);
    });
  });
});
