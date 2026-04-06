export interface Achievement {
  ID: number;
  Name: string;
  Description: string;
  Category: number;
  Points: number;
  icon: string;
}

export interface AchievementFull extends Achievement {
  Faction: number;
  Map: number;
}

export interface AchievementWithQuantity {
  ID: number;
  Name: string;
  Description: string;
  Points: number;
  icon: string;
  Quantity: number;
  category: number;
}

export interface AchievementCriteria {
  ID: number;
  Achievement: number;
  Quantity: number;
  Description: string;
}

export interface AchievementCategory {
  ID: number;
  ParentID: number;
  Name: string;
}
