import type { StickerData, Sticker, Team, Group, SpecialSection, Owned } from '../types';

// ── seeded RNG (mulberry32) ─────────────────────────────────────────────────
function rng(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

// ── 48 nations [name, code, region, colors] ────────────────────────────────
const NATIONS: [string, string, string, string[]][] = [
  ['Mexico','MEX','latin',['#006847','#ffffff','#ce1126']],
  ['Canada','CAN','euro',['#d52b1e','#ffffff']],
  ['United States','USA','euro',['#3c3b6e','#ffffff','#b22234']],
  ['Argentina','ARG','latin',['#74acdf','#ffffff','#f6b40e']],
  ['Brazil','BRA','latin',['#009c3b','#ffdf00','#002776']],
  ['France','FRA','euro',['#0055a4','#ffffff','#ef4135']],
  ['England','ENG','euro',['#ffffff','#cf081f','#1d3a8a']],
  ['Spain','ESP','latin',['#aa151b','#f1bf00']],
  ['Germany','GER','euro',['#1a1a1a','#dd0000','#ffce00']],
  ['Portugal','POR','latin',['#006600','#d40000','#ffd700']],
  ['Netherlands','NED','euro',['#ae1c28','#ff7a1a','#21468b']],
  ['Italy','ITA','euro',['#009246','#ffffff','#ce2b37']],
  ['Belgium','BEL','euro',['#1a1a1a','#fae042','#ed2939']],
  ['Croatia','CRO','euro',['#ff0000','#ffffff','#171796']],
  ['Uruguay','URU','latin',['#7bafd4','#ffffff','#001489']],
  ['Colombia','COL','latin',['#fcd116','#003893','#ce1126']],
  ['Japan','JPN','asia',['#bc002d','#ffffff','#1d3a8a']],
  ['South Korea','KOR','asia',['#cd2e3a','#0047a0','#ffffff']],
  ['Morocco','MAR','africa',['#c1272d','#006233']],
  ['Senegal','SEN','africa',['#00853f','#fdef42','#e31b23']],
  ['Nigeria','NGA','africa',['#008751','#ffffff']],
  ['Ghana','GHA','africa',['#ce1126','#fcd116','#006b3f']],
  ['Cameroon','CMR','africa',['#007a5e','#ce1126','#fcd116']],
  ['Ivory Coast','CIV','africa',['#f77f00','#ffffff','#009e60']],
  ['Australia','AUS','asia',['#00843d','#ffcd00']],
  ['Saudi Arabia','KSA','arab',['#006c35','#ffffff']],
  ['Qatar','QAT','arab',['#8a1538','#ffffff']],
  ['Iran','IRN','arab',['#239f40','#ffffff','#da0000']],
  ['Switzerland','SUI','euro',['#d52b1e','#ffffff']],
  ['Denmark','DEN','euro',['#c60c30','#ffffff']],
  ['Poland','POL','euro',['#ffffff','#dc143c']],
  ['Serbia','SRB','euro',['#c6363c','#0c4076','#ffffff']],
  ['Wales','WAL','euro',['#c8102e','#00ad1d','#1a1a1a']],
  ['Austria','AUT','euro',['#ed2939','#ffffff']],
  ['Ecuador','ECU','latin',['#ffdd00','#034ea2','#ed1c24']],
  ['Peru','PER','latin',['#d91023','#ffffff']],
  ['Chile','CHI','latin',['#0039a6','#ffffff','#d52b1e']],
  ['Paraguay','PAR','latin',['#d52b1e','#ffffff','#0038a8']],
  ['Egypt','EGY','arab',['#ce1126','#ffffff','#1a1a1a']],
  ['Tunisia','TUN','arab',['#e70013','#ffffff']],
  ['Algeria','ALG','arab',['#006233','#ffffff','#d21034']],
  ['Sweden','SWE','euro',['#006aa7','#fecc00']],
  ['Norway','NOR','euro',['#ef2b2d','#ffffff','#002868']],
  ['Turkey','TUR','euro',['#e30a17','#ffffff']],
  ['Greece','GRE','euro',['#0d5eaf','#ffffff']],
  ['Scotland','SCO','euro',['#0065bf','#ffffff']],
  ['Costa Rica','CRC','latin',['#002b7f','#ffffff','#ce1126']],
  ['New Zealand','NZL','asia',['#00247d','#ffffff','#cc142b']],
];

type Region = 'euro' | 'latin' | 'africa' | 'asia' | 'arab';
const NAMES: Record<Region, { f: string[]; l: string[] }> = {
  euro:   { f:['Liam','Noah','Lucas','Felix','Max','Leon','Erik','Jan','Stefan','Mateo','Oscar','Hugo','Finn','Karl','Tom','Niklas'],
            l:['Berg','Hansen','Müller','Novak','Larsen','Kowalski','Andersson','Schmidt','Janssen','Costa','Petrov','Vidal','Horvat','Nielsen','Walsh','Bauer'] },
  latin:  { f:['Mateo','Santiago','Diego','Lucas','Bruno','Tomás','Nicolás','Joaquín','Emiliano','Gabriel','Andrés','Felipe','Rodrigo','Iván','Marco','Cristian'],
            l:['Silva','Gómez','Rodríguez','Fernández','Martínez','Vargas','Rojas','Castro','Mendoza','Suárez','Ramírez','Torres','Herrera','Ortiz','Cruz','Núñez'] },
  africa: { f:['Mohamed','Samuel','Kwame','Yaya','Ismael','Sadio','Victor','Riyad','Achraf','Thomas','Andre','Joseph','Daniel','Emmanuel','Kalidou','Franck'],
            l:['Diallo','Mensah','Koné','Traoré','Osei','Mané','Okafor','Touré','Hakimi','Boateng','Sarr','Aubameyang','Eto','Mahrez','Salah','Ndour'] },
  asia:   { f:['Hiroshi','Takumi','Sora','Min-jun','Ji-ho','Daiki','Ren','Kenji','Seo-jun','Riku','Haruto','Yuto','Jae','Sung','Akira','Tatsuya'],
            l:['Tanaka','Kim','Lee','Sato','Park','Nakamura','Choi','Yamamoto','Suzuki','Watanabe','Jung','Kang','Ito','Kobayashi','Cho','Han'] },
  arab:   { f:['Mohammed','Ahmed','Ali','Hassan','Omar','Youssef','Khalid','Karim','Ibrahim','Saud','Tariq','Bilal','Faisal','Nasser','Walid','Sami'],
            l:['Al-Shehri','Hassan','Al-Dawsari','Khedira','Ben Yedder','Al-Owais','Bounou','Mostafa','Trezeguet','Al-Najei','Saleh','Mahmoud','Al-Hassan','Sliti','Brahimi','Aziz'] },
};

const POSITIONS: [string, number][] = [['GK', 2], ['DF', 6], ['MF', 5], ['FW', 3]];
const GROUP_LETTERS = 'ABCDEFGHIJKL'.split('');

// ── build ──────────────────────────────────────────────────────────────────
let _cache: StickerData | null = null;

export function getStickerData(): StickerData {
  if (_cache) return _cache;

  const teams: Record<string, Team> = {};
  const stickers: Sticker[] = [];
  let n = 0;

  const buckets: number[][] = GROUP_LETTERS.map(() => []);
  NATIONS.forEach((_, i) => buckets[i % 12].push(i));

  const groups: Group[] = GROUP_LETTERS.map((letter, gi) => {
    const teamIds: string[] = [];
    buckets[gi].forEach(natIdx => {
      const [name, code, region, colors] = NATIONS[natIdx];
      const r = rng(natIdx * 1000 + 7);
      const start = n + 1;
      const tStickers: Sticker[] = [];

      const mk = (
        type: Sticker['type'],
        sName: string,
        sub: string,
        extra: Partial<Sticker> = {},
      ): Sticker => {
        n += 1;
        const s: Sticker = { n, teamId: code, teamName: name, code, group: letter, colors, type, name: sName, sub, ...extra };
        stickers.push(s);
        tStickers.push(s);
        return s;
      };

      mk('badge', name, 'Team Badge', { emblem: true });
      mk('photo', name, 'Squad Photo', { wide: true });

      const usedNums = new Set<number>();
      let pIndex = 0;
      POSITIONS.forEach(([pos, count]) => {
        for (let k = 0; k < count; k++) {
          const fn = pick(NAMES[region as Region].f, r);
          const ln = pick(NAMES[region as Region].l, r);
          let num: number;
          do { num = 1 + Math.floor(r() * 23); } while (usedNums.has(num));
          usedNums.add(num);
          mk('player', `${fn} ${ln}`, pos, { pos, shirt: num, captain: pIndex === 2 });
          pIndex++;
        }
      });

      teams[code] = { id: code, name, code, group: letter, colors, region, range: [start, n], stickers: tStickers };
      teamIds.push(code);
    });
    return { letter, teamIds };
  });

  // ── special sections ─────────────────────────────────────────────────────
  function specialSection(
    title: string,
    sub: string,
    type: Sticker['type'],
    items: { name: string; sub?: string }[],
    colorPool: string[][],
  ): SpecialSection {
    const start = n + 1;
    const list = items.map((item, i) => {
      n += 1;
      const colors = colorPool[i % colorPool.length];
      const s: Sticker = { n, teamId: null, teamName: '', code: '', group: '', colors, type, name: item.name, sub: item.sub ?? sub, special: title };
      stickers.push(s);
      return s;
    });
    return { title, sub, type, range: [start, n], stickers: list };
  }

  const goldPool = [['#caa24a','#f4e3a1'],['#b8902f','#ffe9a8'],['#9a7b25','#f0d98a']];
  const cityPool = [['#1f7a4d','#7fd6a8'],['#1b5fb0','#8fc4f6'],['#b0481b','#f6b78f'],['#7a1f6a','#d68fc6']];

  const legends = specialSection('Legends', 'All-Time Greats', 'legend', [
    {name:'No. 10 Maestro'},{name:'The Sweeper'},{name:'Golden Keeper'},{name:'The Striker'},
    {name:'Midfield General'},{name:'The Winger'},{name:'Iron Captain'},{name:'The Prodigy'},
    {name:'Free-Kick King'},{name:'The Libero'},{name:'Box-to-Box'},{name:'The Poacher'},
  ], goldPool);

  const cities = specialSection('Host Cities', 'Stadiums 2026', 'stadium', [
    {name:'New York / NJ'},{name:'Los Angeles'},{name:'Dallas'},{name:'Kansas City'},
    {name:'Atlanta'},{name:'Houston'},{name:'Seattle'},{name:'San Francisco'},
    {name:'Miami'},{name:'Philadelphia'},{name:'Boston'},{name:'Toronto'},
    {name:'Vancouver'},{name:'Mexico City'},{name:'Guadalajara'},{name:'Monterrey'},
  ], cityPool);

  const specials = [legends, cities];

  const byNumber: Record<number, Sticker> = {};
  stickers.forEach(s => { byNumber[s.n] = s; });

  function seedOwned(): Owned {
    const owned: Owned = {};
    stickers.forEach(s => {
      const r = rng(s.n * 7 + 13);
      const base = s.type === 'badge' ? 0.82 : (s.type === 'legend' || s.type === 'stadium') ? 0.45 : 0.62;
      if (r() < base) {
        let count = 1;
        const d = r();
        if (d > 0.90) count = 3; else if (d > 0.74) count = 2;
        owned[s.n] = count;
      }
    });
    return owned;
  }

  _cache = { groups, teams, stickers, specials, byNumber, total: n, groupsLetters: GROUP_LETTERS, seedOwned };
  return _cache;
}
