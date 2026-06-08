// Mock supabase before importing sync (pure functions don't need it, but the module imports it)
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: { onAuthStateChange: jest.fn() },
  },
}));

import { ownedToRows, rowsToOwned } from '../../src/store/sync';

describe('ownedToRows', () => {
  it('converts owned map to upsert rows', () => {
    const rows = ownedToRows({ 1: 2, 5: 1 }, 'user-123');
    expect(rows).toEqual([
      { user_id: 'user-123', sticker_n: 1, count: 2 },
      { user_id: 'user-123', sticker_n: 5, count: 1 },
    ]);
  });

  it('returns empty array for empty owned', () => {
    expect(ownedToRows({}, 'user-123')).toEqual([]);
  });
});

describe('rowsToOwned', () => {
  it('converts DB rows to owned map', () => {
    const owned = rowsToOwned([
      { sticker_n: 1, count: 2 },
      { sticker_n: 5, count: 1 },
    ]);
    expect(owned).toEqual({ 1: 2, 5: 1 });
  });

  it('returns empty object for empty rows', () => {
    expect(rowsToOwned([])).toEqual({});
  });
});
