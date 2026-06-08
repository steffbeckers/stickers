import { getStickerData } from '../../src/data/stickers';

describe('getStickerData', () => {
  const data = getStickerData();

  it('has 12 groups A-L', () => {
    expect(data.groups.map(g => g.letter)).toEqual(
      'ABCDEFGHIJKL'.split('')
    );
  });

  it('has exactly 48 teams', () => {
    expect(Object.keys(data.teams)).toHaveLength(48);
  });

  it('each team has 18 stickers (badge + photo + 16 players)', () => {
    Object.values(data.teams).forEach(t => {
      expect(t.stickers).toHaveLength(18);
    });
  });

  it('sticker numbers are sequential starting at 1', () => {
    expect(data.stickers[0].n).toBe(1);
    data.stickers.forEach((s, i) => expect(s.n).toBe(i + 1));
  });

  it('has Legends special section with 12 stickers', () => {
    const leg = data.specials.find(s => s.title === 'Legends');
    expect(leg).toBeDefined();
    expect(leg!.stickers).toHaveLength(12);
  });

  it('has Host Cities special section with 16 stickers', () => {
    const cities = data.specials.find(s => s.title === 'Host Cities');
    expect(cities).toBeDefined();
    expect(cities!.stickers).toHaveLength(16);
  });

  it('total sticker count matches byNumber index', () => {
    expect(data.total).toBe(data.stickers.length);
    expect(Object.keys(data.byNumber)).toHaveLength(data.total);
  });

  it('Belgium is in the dataset', () => {
    expect(data.teams['BEL']).toBeDefined();
    expect(data.teams['BEL'].name).toBe('Belgium');
  });

  it('seedOwned returns ~50-75% of stickers', () => {
    const owned = data.seedOwned();
    const count = Object.keys(owned).length;
    expect(count).toBeGreaterThan(data.total * 0.5);
    expect(count).toBeLessThan(data.total * 0.75);
  });
});
