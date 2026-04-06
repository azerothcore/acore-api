import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { join } from 'path';
import {
  Achievement,
  AchievementCategory,
  AchievementCriteria,
  AchievementFull,
  AchievementWithQuantity,
} from './dbc.interface';
import Database = require('better-sqlite3');

@Injectable()
export class DbcService implements OnModuleDestroy {
  private db: Database.Database;

  constructor() {
    this.db = new Database(join(process.cwd(), 'src', 'storage', 'sqlite.db'), {
      readonly: true,
    });
  }

  onModuleDestroy() {
    this.db.close();
  }

  getAchievementPoints(
    achievementIds: number[],
    faction?: number,
  ): Map<number, number> {
    if (achievementIds.length === 0) return new Map();
    const placeholders = achievementIds.map(() => '?').join(',');
    let sql = `SELECT ID, Points FROM achievement WHERE ID IN (${placeholders})`;
    const params: number[] = [...achievementIds];
    if (faction !== undefined) {
      sql += ' AND (Faction = -1 OR Faction = ?)';
      params.push(faction);
    }
    const rows = this.db.prepare(sql).all(...params) as {
      ID: number;
      Points: number;
    }[];
    return new Map(rows.map((r) => [r.ID, r.Points]));
  }

  getAchievementsByIds(
    achievementIds: number[],
    category?: number,
  ): Achievement[] {
    if (achievementIds.length === 0) return [];
    const placeholders = achievementIds.map(() => '?').join(',');
    let sql = `SELECT ID, Name, Description, Category, Points, icon FROM achievement WHERE ID IN (${placeholders})`;
    const params: number[] = [...achievementIds];
    if (category !== undefined) {
      sql += ' AND Category = ?';
      params.push(category);
    }
    return this.db.prepare(sql).all(...params) as Achievement[];
  }

  getAchievementById(achievementId: number): AchievementFull | undefined {
    return this.db
      .prepare(
        'SELECT ID, Name, Description, Category, Points, icon, Faction, Map FROM achievement WHERE ID = ?',
      )
      .get(achievementId) as AchievementFull | undefined;
  }

  getCriteriaByIds(criteriaIds: number[]): Map<number, AchievementCriteria> {
    if (criteriaIds.length === 0) return new Map();
    const placeholders = criteriaIds.map(() => '?').join(',');
    const rows = this.db
      .prepare(
        `SELECT ID, Achievement, Quantity, Description FROM achievementCriteria WHERE ID IN (${placeholders})`,
      )
      .all(...criteriaIds) as AchievementCriteria[];
    return new Map(rows.map((r) => [r.ID, r]));
  }

  getAchievementsByCategory(category: number): Achievement[] {
    return this.db
      .prepare(
        'SELECT ID, Name, Description, Category, Points, icon FROM achievement WHERE Category = ?',
      )
      .all(category) as Achievement[];
  }

  getCriteriaByAchievementIds(
    achievementIds: number[],
  ): Map<number, AchievementCriteria[]> {
    if (achievementIds.length === 0) return new Map();
    const placeholders = achievementIds.map(() => '?').join(',');
    const rows = this.db
      .prepare(
        `SELECT ID, Achievement, Quantity, Description FROM achievementCriteria WHERE Achievement IN (${placeholders})`,
      )
      .all(...achievementIds) as AchievementCriteria[];
    const map = new Map<number, AchievementCriteria[]>();
    for (const row of rows) {
      if (!map.has(row.Achievement)) map.set(row.Achievement, []);
      map.get(row.Achievement)?.push(row);
    }
    return map;
  }

  getAllCategories(): AchievementCategory[] {
    return this.db
      .prepare('SELECT ID, ParentID, Name FROM achievementCategory')
      .all() as AchievementCategory[];
  }

  getCategoryById(categoryId: number): AchievementCategory | undefined {
    return this.db
      .prepare(
        'SELECT ID, ParentID, Name FROM achievementCategory WHERE ID = ?',
      )
      .get(categoryId) as AchievementCategory | undefined;
  }

  getAchievementsByCategoryWithQuantity(
    category: number,
    faction?: string,
  ): AchievementWithQuantity[] {
    let sql = `SELECT a.ID, a.Name, a.Description, a.Points, a.icon,
      COALESCE((SELECT ac.Quantity FROM achievementCriteria ac WHERE ac.Achievement = a.ID LIMIT 1), 0) AS Quantity
      FROM achievement a WHERE a.Category = ?`;
    const params: number[] = [category];
    if (faction === 'alliance') {
      sql += ' AND (a.Faction = -1 OR a.Faction = 1)';
    } else if (faction === 'horde') {
      sql += ' AND (a.Faction = -1 OR a.Faction = 0)';
    }
    return this.db.prepare(sql).all(...params) as AchievementWithQuantity[];
  }
}
