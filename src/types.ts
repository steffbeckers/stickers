export type StickerType = 'player' | 'badge' | 'photo' | 'legend' | 'stadium';

export interface Sticker {
  n: number;
  teamId: string | null;
  teamName: string;
  code: string;
  group: string;
  colors: string[];
  type: StickerType;
  name: string;
  sub: string;
  pos?: string;
  shirt?: number;
  captain?: boolean;
  special?: string;
  emblem?: boolean;
  wide?: boolean;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  group: string;
  colors: string[];
  region: string;
  range: [number, number];
  stickers: Sticker[];
}

export interface Group {
  letter: string;
  teamIds: string[];
}

export interface SpecialSection {
  title: string;
  sub: string;
  type: StickerType;
  range: [number, number];
  stickers: Sticker[];
}

/** sticker number → how many the user owns */
export type Owned = Record<number, number>;

export interface CollectionStats {
  total: number;
  distinct: number;
  missing: number;
  dupeTotal: number;
  percent: number;
  swaps: { s: Sticker; count: number }[];
}

export interface TeamStat {
  own: number;
  total: number;
  missing: number;
  percent: number;
  complete: boolean;
}

export interface GroupStat {
  own: number;
  total: number;
  percent: number;
  completeTeams: number;
}

export interface StickerData {
  groups: Group[];
  teams: Record<string, Team>;
  stickers: Sticker[];
  specials: SpecialSection[];
  byNumber: Record<number, Sticker>;
  total: number;
  groupsLetters: string[];
  seedOwned: () => Owned;
}

export interface ScanResult {
  team: string | null;
  stickers: { n: number; present: boolean }[];
}
