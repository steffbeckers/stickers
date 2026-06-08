import { supabase } from '../lib/supabase';
import type { Owned } from '../types';

export interface CollectionRow {
  sticker_n: number;
  count: number;
}

/** Convert local Owned map → array of upsert rows */
export function ownedToRows(
  owned: Owned,
  userId: string,
): { user_id: string; sticker_n: number; count: number }[] {
  return Object.entries(owned).map(([n, count]) => ({
    user_id: userId,
    sticker_n: Number(n),
    count,
  }));
}

/** Convert DB rows → local Owned map */
export function rowsToOwned(rows: CollectionRow[]): Owned {
  const owned: Owned = {};
  rows.forEach(r => { owned[r.sticker_n] = r.count; });
  return owned;
}

/** Fetch all collection rows for the signed-in user */
export async function fetchCollection(userId: string): Promise<Owned> {
  const { data, error } = await supabase
    .from('collection')
    .select('sticker_n, count')
    .eq('user_id', userId);
  if (error) throw error;
  return rowsToOwned(data ?? []);
}

/** Upsert a single sticker count (or delete if count === 0) */
export async function syncSticker(
  userId: string,
  stickerN: number,
  count: number,
): Promise<void> {
  if (count <= 0) {
    await supabase
      .from('collection')
      .delete()
      .eq('user_id', userId)
      .eq('sticker_n', stickerN);
  } else {
    await supabase.from('collection').upsert(
      { user_id: userId, sticker_n: stickerN, count, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,sticker_n' },
    );
  }
}

/** Bulk upsert after a scan */
export async function syncBatch(
  userId: string,
  updates: { n: number; count: number }[],
): Promise<void> {
  const toUpsert = updates.filter(u => u.count > 0).map(u => ({
    user_id: userId,
    sticker_n: u.n,
    count: u.count,
    updated_at: new Date().toISOString(),
  }));
  if (toUpsert.length > 0) {
    await supabase.from('collection').upsert(toUpsert, { onConflict: 'user_id,sticker_n' });
  }
}
