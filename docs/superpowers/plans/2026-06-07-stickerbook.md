# Stickerbook '26 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a World Cup 2026 Panini sticker collection app for Android with Google Sign-In, Supabase cloud sync, camera page scanning via Claude Vision, and a pixel-faithful Material 3 UI based on the provided design.

**Architecture:** Expo Router file-based routing (tabs + modals), React Context for optimistic local state, Supabase for auth + cloud sync, EAS-hosted API route that proxies camera photos to Claude Vision API.

**Tech Stack:** Expo SDK 56, React Native 0.85, Expo Router, TypeScript, Supabase, @react-native-google-signin/google-signin, expo-camera, expo-image-manipulator, react-native-svg, @anthropic-ai/sdk (server-side only), @react-native-async-storage/async-storage, Jest + @testing-library/react-native

**Design reference:** `docs/superpowers/specs/2026-06-07-stickerbook-design.md` — read it. All colours, layouts and interactions are specified there.

---

## File Map

```
src/
  app/
    _layout.tsx                  root layout: fonts, StoreProvider, auth guard
    (auth)/
      _layout.tsx                auth group layout (no tab bar)
      login.tsx                  LoginScreen
    (tabs)/
      _layout.tsx                Material 3 bottom tab bar
      index.tsx                  HomeScreen
      album.tsx                  AlbumScreen
      stats.tsx                  StatsScreen
    scan.tsx                     ScanScreen (full-screen modal)
    team/[id].tsx                CollectionScreen (team)
    special/[id].tsx             CollectionScreen (special section)
    sticker/[n].tsx              DetailScreen (bottom-sheet modal)
    profile.tsx                  ProfileScreen
    api/
      scan+api.ts                POST /api/scan — Claude Vision proxy
  constants/
    theme.ts                     colours, fonts, shadow helpers
  data/
    stickers.ts                  deterministic sticker catalogue (~900 stickers)
  types.ts                       all shared TypeScript types
  lib/
    supabase.ts                  Supabase client (AsyncStorage session)
  store/
    index.tsx                    StoreContext + StoreProvider
    sync.ts                      Supabase read/write helpers
  components/
    Icon.tsx                     SVG icon set (react-native-svg)
    ProgressRing.tsx             circular SVG progress ring
    Bar.tsx                      linear progress bar
    FlagChip.tsx                 flag-stripe chip
    PortraitGhost.tsx            player silhouette SVG
    Crest.tsx                    flag-coloured team badge
    StickerArt.tsx               sticker artwork (player/badge/photo/legend/stadium)
    StickerTile.tsx              grid tile: art + label + checkmark + dupe badge
    SectionHeader.tsx            section title row with optional action link
    HScroll.tsx                  horizontal scroll wrapper
    FavTeamPicker.tsx            bottom-sheet team picker
__tests__/
  data/stickers.test.ts
  store/sync.test.ts
  store/store.test.tsx
```

---

## Task 1 — Install dependencies & configure plugins

**Files:**
- Modify: `package.json`
- Modify: `app.json`
- Create: `jest.config.js`
- Create: `jest.setup.js`

- [ ] **Install runtime dependencies**

```bash
npx expo install \
  @react-native-google-signin/google-signin \
  @supabase/supabase-js \
  react-native-svg \
  react-native-url-polyfill \
  @react-native-async-storage/async-storage \
  expo-camera \
  expo-image-manipulator
```

- [ ] **Install dev dependencies**

```bash
npm install --save-dev \
  jest \
  @types/jest \
  @testing-library/react-native \
  @testing-library/jest-native \
  babel-jest \
  jest-expo
```

- [ ] **Add `@anthropic-ai/sdk` as a server-only dependency** (used only in the API route, not bundled into the native app)

```bash
npm install @anthropic-ai/sdk
```

- [ ] **Add plugins and permissions to `app.json`**

Replace the `"plugins"` array and add `"permissions"`:

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "@react-native-google-signin/google-signin",
      [
        "expo-camera",
        {
          "cameraPermission": "$(PRODUCT_NAME) needs camera access to scan your sticker album pages."
        }
      ],
      [
        "expo-splash-screen",
        {
          "android": {
            "image": "./assets/images/splash-icon.png",
            "imageWidth": 76
          },
          "backgroundColor": "#06301c"
        }
      ]
    ],
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#06301c",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "package": "com.steffbeckers.stickers",
      "predictiveBackGestureEnabled": false
    }
  }
}
```

- [ ] **Add `"web"` output to `app.json`** (required for API routes)

```json
"web": {
  "output": "server",
  "favicon": "./assets/images/favicon.png"
}
```

- [ ] **Add `"extra"` with API origin to `app.json`**

```json
"extra": {
  "apiOrigin": "https://stickers.expo.app",
  "eas": {
    "projectId": "e257b0d9-070e-4e97-8cd0-397c3b9338d8"
  },
  "router": {}
}
```

- [ ] **Create `jest.config.js`**

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testPathPattern: '__tests__',
};
```

- [ ] **Create `jest.setup.js`**

```js
import '@testing-library/jest-native/extend-expect';
```

- [ ] **Add test script to `package.json`**

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch"
}
```

- [ ] **Create `.env.local`** (gitignored — fill in your own values)

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Add `.env.local` to `.gitignore`**

```
.env.local
.env*.local
```

- [ ] **Rebuild the dev client** (native changes require a new build)

```bash
npx expo run:android
```

---

## Task 2 — Supabase project + Google OAuth setup

**Files:** None (cloud setup steps)

- [ ] **Create Supabase project** at https://supabase.com. Copy the Project URL and anon key into `.env.local`.

- [ ] **Run the collection table SQL** in Supabase SQL editor:

```sql
create table collection (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  sticker_n   int  not null,
  count       int  not null default 1,
  updated_at  timestamptz default now(),
  unique (user_id, sticker_n)
);

alter table collection enable row level security;

create policy "users manage own rows"
  on collection
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- index for fast per-user reads
create index collection_user_idx on collection(user_id);
```

- [ ] **Enable Google OAuth in Supabase:**
  1. Go to Authentication → Providers → Google
  2. Enable it
  3. Add your Google OAuth Web Client ID and Secret
  4. Set Redirect URL: copy the Supabase callback URL shown in the dashboard

- [ ] **Create Google OAuth credentials** at https://console.cloud.google.com:
  1. New project → APIs & Services → Credentials → Create OAuth 2.0 Client ID
  2. Type: Web application — add the Supabase callback URL to Authorized Redirect URIs
  3. Type: Android — add package name `com.steffbeckers.stickers` and SHA-1 fingerprint (`keytool -keystore ~/.android/debug.keystore -list -v`, password: `android`)
  4. Copy the Web Client ID into `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

---

## Task 3 — TypeScript types (`src/types.ts`)

**Files:**
- Create: `src/types.ts`

- [ ] **Write `src/types.ts`**

```ts
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
```

- [ ] **Commit**

```bash
git add src/types.ts
git commit -m "feat: add TypeScript types"
```

---

## Task 4 — Theme constants (`src/constants/theme.ts`)

**Files:**
- Create: `src/constants/theme.ts`

- [ ] **Write `src/constants/theme.ts`**

```ts
import { Platform, StyleSheet } from 'react-native';

export const colors = {
  pitch:     '#16b364',
  pitchDeep: '#0e8a49',
  pitchDark: '#06301c',
  ink:       '#0f1712',
  inkSoft:   '#3a4a40',
  muted:     '#7a8c82',
  faint:     '#b0bdb6',
  bg:        '#f8f9f6',
  surface:   '#ffffff',
  lineSoft:  'rgba(15,23,30,0.08)',
  line:      'rgba(15,23,30,0.14)',
  blue:      '#1b5fb0',
  magenta:   '#c4297a',
  gold:      '#caa24a',
  amber:     '#e07c1a',
} as const;

export const fonts = {
  display: 'Anton',
  ui:      'Roboto',
} as const;

/** Android elevation / iOS shadow — spread onto a View style */
export const shadows = {
  sm: Platform.select({
    android: { elevation: 2 },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
  }) ?? {},
  md: Platform.select({
    android: { elevation: 6 },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 12,
    },
  }) ?? {},
} as const;

/** flag colors → CSS-style diagonal gradient string used with LinearGradient */
export function flagColors(colors: string[]): string[] {
  // Returns the colours array as-is; callers use it with expo-linear-gradient or
  // react-native-svg LinearGradient.
  return colors;
}
```

- [ ] **Commit**

```bash
git add src/constants/theme.ts
git commit -m "feat: add theme constants"
```

---

## Task 5 — Sticker data model (`src/data/stickers.ts`) + tests

**Files:**
- Create: `src/data/stickers.ts`
- Create: `__tests__/data/stickers.test.ts`

- [ ] **Write the failing tests first** (`__tests__/data/stickers.test.ts`)

```ts
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

  it('seedOwned returns ~62% of stickers', () => {
    const owned = data.seedOwned();
    const count = Object.keys(owned).length;
    expect(count).toBeGreaterThan(data.total * 0.5);
    expect(count).toBeLessThan(data.total * 0.75);
  });
});
```

- [ ] **Run tests — expect FAIL (module not found)**

```bash
npm test -- --testPathPattern=data/stickers
```

Expected output: `Cannot find module '../../src/data/stickers'`

- [ ] **Write `src/data/stickers.ts`**

```ts
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
```

- [ ] **Run tests — expect PASS**

```bash
npm test -- --testPathPattern=data/stickers
```

Expected: 9 tests pass.

- [ ] **Commit**

```bash
git add src/data/stickers.ts __tests__/data/stickers.test.ts
git commit -m "feat: add sticker data model with tests"
```

---

## Task 6 — Supabase client (`src/lib/supabase.ts`)

**Files:**
- Create: `src/lib/supabase.ts`

- [ ] **Write `src/lib/supabase.ts`**

```ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl
  ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey
  ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat: add Supabase client"
```

---

## Task 7 — Supabase sync helpers (`src/store/sync.ts`) + tests

**Files:**
- Create: `src/store/sync.ts`
- Create: `__tests__/store/sync.test.ts`

- [ ] **Write the failing tests** (`__tests__/store/sync.test.ts`)

```ts
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
```

- [ ] **Run tests — expect FAIL**

```bash
npm test -- --testPathPattern=store/sync
```

- [ ] **Write `src/store/sync.ts`**

```ts
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
```

- [ ] **Run tests — expect PASS**

```bash
npm test -- --testPathPattern=store/sync
```

- [ ] **Commit**

```bash
git add src/store/sync.ts __tests__/store/sync.test.ts
git commit -m "feat: add Supabase sync helpers with tests"
```

---

## Task 8 — StoreContext (`src/store/index.tsx`) + tests

**Files:**
- Create: `src/store/index.tsx`
- Create: `__tests__/store/store.test.tsx`

- [ ] **Write the failing tests** (`__tests__/store/store.test.tsx`)

```tsx
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { StoreProvider, useStore } from '../../src/store';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: { onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })) },
    from: jest.fn(() => ({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), then: jest.fn() })),
  },
}));

jest.mock('../../src/store/sync', () => ({
  fetchCollection: jest.fn().mockResolvedValue({ 1: 2, 5: 1 }),
  syncSticker: jest.fn().mockResolvedValue(undefined),
  syncBatch: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <StoreProvider>{children}</StoreProvider>
);

describe('useStore actions', () => {
  it('add increments count and adds to recent', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    act(() => { result.current.actions.add(10); });
    expect(result.current.actions.countOf(10)).toBe(1);
    expect(result.current.recent).toContain(10);
  });

  it('remove decrements count', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    act(() => { result.current.actions.add(10); });
    act(() => { result.current.actions.add(10); });
    act(() => { result.current.actions.remove(10); });
    expect(result.current.actions.countOf(10)).toBe(1);
  });

  it('toggle adds then removes', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    act(() => { result.current.actions.toggle(20); });
    expect(result.current.actions.isOwned(20)).toBe(true);
    act(() => { result.current.actions.toggle(20); });
    expect(result.current.actions.isOwned(20)).toBe(false);
  });

  it('applyScan returns added and dupes', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    act(() => { result.current.actions.add(1); }); // pre-own sticker 1
    let scanResult: { added: number[]; dupes: number[] } | undefined;
    act(() => { scanResult = result.current.actions.applyScan([1, 2, 3]); });
    expect(scanResult!.added).toContain(2);
    expect(scanResult!.added).toContain(3);
    expect(scanResult!.dupes).toContain(1);
  });
});
```

- [ ] **Run tests — expect FAIL (module not found)**

```bash
npm test -- --testPathPattern=store/store
```

- [ ] **Write `src/store/index.tsx`**

```tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { fetchCollection, syncSticker, syncBatch } from './sync';
import { getStickerData } from '../data/stickers';
import type { CollectionStats, GroupStat, Owned, TeamStat } from '../types';

const LS_RECENT = 'wc26_recent_v1';
const LS_FAV = 'wc26_fav_v1';

// ── helpers ────────────────────────────────────────────────────────────────
async function loadRecent(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(LS_RECENT);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}
async function saveRecent(recent: number[]) {
  try { await AsyncStorage.setItem(LS_RECENT, JSON.stringify(recent)); } catch {}
}
async function loadFav(): Promise<string | null> {
  try { return await AsyncStorage.getItem(LS_FAV); } catch { return null; }
}
async function saveFav(id: string | null) {
  try {
    if (id) await AsyncStorage.setItem(LS_FAV, id);
    else await AsyncStorage.removeItem(LS_FAV);
  } catch {}
}

// ── context types ──────────────────────────────────────────────────────────
interface StoreActions {
  isOwned: (n: number) => boolean;
  countOf: (n: number) => number;
  toggle: (n: number) => void;
  add: (n: number) => void;
  remove: (n: number) => void;
  applyScan: (nums: number[]) => { added: number[]; dupes: number[] };
}

interface AuthActions {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  setFavoriteTeam: (id: string) => void;
}

interface StoreValue {
  owned: Owned;
  recent: number[];
  user: User | null;
  favoriteTeam: string | null;
  actions: StoreActions;
  auth: AuthActions;
  stats: CollectionStats;
  teamStat: (id: string) => TeamStat;
  groupStat: (letter: string) => GroupStat;
}

const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

// ── provider ───────────────────────────────────────────────────────────────
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const WC = getStickerData();
  const [owned, setOwned] = useState<Owned>({});
  const [recent, setRecent] = useState<number[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [favoriteTeam, setFavoriteTeamState] = useState<string | null>(null);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  // persist recent
  useEffect(() => { saveRecent(recent); }, [recent]);

  // load recent + fav on mount
  useEffect(() => {
    loadRecent().then(setRecent);
    loadFav().then(setFavoriteTeamState);
  }, []);

  // auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          try {
            const fetched = await fetchCollection(u.id);
            setOwned(fetched);
          } catch (e) {
            console.warn('Failed to load collection:', e);
            setOwned(WC.seedOwned());
          }
        } else {
          setOwned({});
        }
      },
    );
    return () => subscription.unsubscribe();
  }, []);

  // ── push recent helper ─────────────────────────────────────────────────
  const pushRecent = useCallback((nums: number[]) => {
    setRecent(prev => {
      const set = new Set(nums);
      const filtered = prev.filter(n => !set.has(n));
      return [...nums, ...filtered].slice(0, 30);
    });
  }, []);

  // ── sync in background ─────────────────────────────────────────────────
  const syncOne = useCallback((n: number, count: number) => {
    const uid = userRef.current?.id;
    if (!uid) return;
    syncSticker(uid, n, count).catch(e => console.warn('sync error', e));
  }, []);

  // ── actions ────────────────────────────────────────────────────────────
  const actions = useMemo<StoreActions>(() => ({
    isOwned: (n) => (owned[n] ?? 0) > 0,
    countOf: (n) => owned[n] ?? 0,

    toggle: (n) => {
      setOwned(o => {
        const next = { ...o };
        if (next[n]) { delete next[n]; syncOne(n, 0); }
        else { next[n] = 1; pushRecent([n]); syncOne(n, 1); }
        return next;
      });
    },

    add: (n) => {
      setOwned(o => {
        const prev = o[n] ?? 0;
        if (!prev) pushRecent([n]);
        const next = { ...o, [n]: prev + 1 };
        syncOne(n, prev + 1);
        return next;
      });
    },

    remove: (n) => {
      setOwned(o => {
        const prev = o[n] ?? 0;
        if (prev <= 0) return o;
        const next = { ...o };
        if (prev === 1) { delete next[n]; syncOne(n, 0); }
        else { next[n] = prev - 1; syncOne(n, prev - 1); }
        return next;
      });
    },

    applyScan: (nums) => {
      const result = { added: [] as number[], dupes: [] as number[] };
      const updates: { n: number; count: number }[] = [];
      setOwned(o => {
        const next = { ...o };
        nums.forEach(n => {
          if (next[n]) { next[n] += 1; result.dupes.push(n); }
          else { next[n] = 1; result.added.push(n); }
          updates.push({ n, count: next[n] });
        });
        return next;
      });
      pushRecent(nums.filter(n => !(owned[n])));
      const uid = userRef.current?.id;
      if (uid) syncBatch(uid, updates).catch(e => console.warn('scan sync error', e));
      return result;
    },
  }), [owned, pushRecent, syncOne]);

  // ── derived stats ──────────────────────────────────────────────────────
  const stats = useMemo<CollectionStats>(() => {
    let distinct = 0, dupeTotal = 0;
    const swaps: CollectionStats['swaps'] = [];
    WC.stickers.forEach(s => {
      const c = owned[s.n] ?? 0;
      if (c > 0) distinct++;
      if (c > 1) { dupeTotal += (c - 1); swaps.push({ s, count: c }); }
    });
    return {
      total: WC.total, distinct, dupeTotal, swaps,
      missing: WC.total - distinct,
      percent: Math.round((distinct / WC.total) * 1000) / 10,
    };
  }, [owned]);

  const teamStat = useCallback((teamId: string): TeamStat => {
    const t = WC.teams[teamId];
    let own = 0;
    t.stickers.forEach(s => { if (owned[s.n]) own++; });
    const total = t.stickers.length;
    return { own, total, missing: total - own, percent: Math.round((own / total) * 100), complete: own === total };
  }, [owned]);

  const groupStat = useCallback((letter: string): GroupStat => {
    const g = WC.groups.find(x => x.letter === letter)!;
    let own = 0, total = 0;
    g.teamIds.forEach(id => {
      WC.teams[id].stickers.forEach(s => { total++; if (owned[s.n]) own++; });
    });
    const completeTeams = g.teamIds.filter(id => teamStat(id).complete).length;
    return { own, total, percent: Math.round((own / total) * 100), completeTeams };
  }, [owned, teamStat]);

  // ── auth ───────────────────────────────────────────────────────────────
  const auth = useMemo<AuthActions>(() => ({
    signIn: async () => {
      // Handled in LoginScreen via GoogleSignin + supabase.auth.signInWithIdToken
      // onAuthStateChange fires automatically after sign-in
    },
    signOut: async () => {
      await supabase.auth.signOut();
      await saveRecent([]);
      setRecent([]);
      setOwned({});
    },
    setFavoriteTeam: (id) => {
      setFavoriteTeamState(id);
      saveFav(id);
    },
  }), []);

  const value: StoreValue = { owned, recent, user, favoriteTeam, actions, auth, stats, teamStat, groupStat };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
```

- [ ] **Run tests — expect PASS**

```bash
npm test -- --testPathPattern=store/store
```

- [ ] **Commit**

```bash
git add src/store/index.tsx __tests__/store/store.test.tsx
git commit -m "feat: add StoreContext with Supabase sync and tests"
```

---

## Task 9 — Root layout + auth guard (`src/app/_layout.tsx`)

**Files:**
- Modify: `src/app/_layout.tsx`

- [ ] **Write `src/app/_layout.tsx`**

```tsx
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StoreProvider, useStore } from '../store';

SplashScreen.preventAutoHideAsync();

function AuthGuard() {
  const { user } = useStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, segments]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Anton: require('../../assets/fonts/Anton-Regular.ttf'),
    Roboto: require('../../assets/fonts/Roboto-Regular.ttf'),
    'Roboto-Bold': require('../../assets/fonts/Roboto-Bold.ttf'),
    'Roboto-Medium': require('../../assets/fonts/Roboto-Medium.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreProvider>
        <AuthGuard />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="scan" options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
          <Stack.Screen name="team/[id]" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="special/[id]" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="sticker/[n]" options={{ animation: 'fade', presentation: 'transparentModal' }} />
          <Stack.Screen name="profile" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
        <StatusBar style="auto" />
      </StoreProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Download the Anton and Roboto font files and place them in `assets/fonts/`**

Download from Google Fonts:
- Anton-Regular.ttf: https://fonts.google.com/specimen/Anton
- Roboto-Regular.ttf, Roboto-Bold.ttf, Roboto-Medium.ttf: https://fonts.google.com/specimen/Roboto

```bash
mkdir -p assets/fonts
# Download and place the 4 .ttf files in assets/fonts/
```

- [ ] **Commit**

```bash
git add src/app/_layout.tsx assets/fonts/
git commit -m "feat: add root layout with auth guard and fonts"
```

---

## Task 10 — Icon component (`src/components/Icon.tsx`)

**Files:**
- Create: `src/components/Icon.tsx`

- [ ] **Write `src/components/Icon.tsx`**

```tsx
import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import type { ViewStyle } from 'react-native';

interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  fill?: string;
  style?: ViewStyle;
}

export function Icon({ name, size = 24, strokeWidth = 2, color = '#0f1712', fill = 'none', style }: IconProps) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const svg = { width: size, height: size, viewBox: '0 0 24 24', style: style as object };

  switch (name) {
    case 'home': return <Svg {...svg}><G {...p}><Path d="M3 10.5 12 3l9 7.5"/><Path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/></G></Svg>;
    case 'album': return <Svg {...svg}><G {...p}><Rect x="4" y="3" width="16" height="18" rx="2"/><Path d="M8 3v18"/><Path d="M12 8h4M12 12h4"/></G></Svg>;
    case 'scan': return <Svg {...svg}><G {...p}><Path d="M3 8V6a2 2 0 0 1 2-2h2M17 4h2a2 2 0 0 1 2 2v2M21 16v2a2 2 0 0 1-2 2h-2M7 20H5a2 2 0 0 1-2-2v-2"/><Circle cx="12" cy="12" r="3.2"/></G></Svg>;
    case 'stats': return <Svg {...svg}><G {...p}><Path d="M5 21V10M12 21V4M19 21v-7"/></G></Svg>;
    case 'search': return <Svg {...svg}><G {...p}><Circle cx="11" cy="11" r="7"/><Path d="m20 20-3.2-3.2"/></G></Svg>;
    case 'chevron': return <Svg {...svg}><G {...p}><Path d="m9 6 6 6-6 6"/></G></Svg>;
    case 'chevron-down': return <Svg {...svg}><G {...p}><Path d="m6 9 6 6 6-6"/></G></Svg>;
    case 'back': return <Svg {...svg}><G {...p}><Path d="m15 6-6 6 6 6"/></G></Svg>;
    case 'check': return <Svg {...svg}><G {...p}><Path d="m4 12.5 5 5L20 6.5"/></G></Svg>;
    case 'plus': return <Svg {...svg}><G {...p}><Path d="M12 5v14M5 12h14"/></G></Svg>;
    case 'minus': return <Svg {...svg}><G {...p}><Path d="M5 12h14"/></G></Svg>;
    case 'x': return <Svg {...svg}><G {...p}><Path d="M6 6l12 12M18 6 6 18"/></G></Svg>;
    case 'swap': return <Svg {...svg}><G {...p}><Path d="M7 4 3 8l4 4"/><Path d="M3 8h13a4 4 0 0 1 4 4"/><Path d="m17 20 4-4-4-4"/><Path d="M21 16H8a4 4 0 0 1-4-4"/></G></Svg>;
    case 'star': return <Svg {...svg}><G strokeWidth={strokeWidth} stroke={color} strokeLinecap="round" strokeLinejoin="round"><Path d="m12 3 2.6 5.5 6 .9-4.3 4.2 1 6L12 17l-5.3 2.6 1-6L3.4 9.4l6-.9z" fill={fill}/></G></Svg>;
    case 'lock': return <Svg {...svg}><G {...p}><Rect x="5" y="11" width="14" height="9" rx="2"/><Path d="M8 11V8a4 4 0 0 1 8 0v3"/></G></Svg>;
    case 'bolt': return <Svg {...svg}><G strokeWidth={strokeWidth} stroke={color} strokeLinecap="round" strokeLinejoin="round"><Path d="M13 3 4 14h6l-1 7 9-11h-6z" fill={fill}/></G></Svg>;
    case 'flash': return <Svg {...svg}><G {...p}><Path d="M7 2h10l-1 7h4l-9 13 2-9H6z"/></G></Svg>;
    case 'flash-off': return <Svg {...svg}><G {...p}><Path d="M7 2h10l-1 7h4l-9 13 2-9H6z"/><Path d="M3 3l18 18"/></G></Svg>;
    case 'pin': return <Svg {...svg}><G {...p}><Path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11Z"/><Circle cx="12" cy="10" r="2.4"/></G></Svg>;
    case 'share': return <Svg {...svg}><G {...p}><Circle cx="6" cy="12" r="2.4"/><Circle cx="17" cy="6" r="2.4"/><Circle cx="17" cy="18" r="2.4"/><Path d="m8.2 11 6.6-3.6M8.2 13l6.6 3.6"/></G></Svg>;
    case 'sparkle': return <Svg {...svg}><G strokeWidth={strokeWidth} stroke={color} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 4c.6 3.4 1.6 4.4 5 5-3.4.6-4.4 1.6-5 5-.6-3.4-1.6-4.4-5-5 3.4-.6 4.4-1.6 5-5Z" fill={fill}/></G></Svg>;
    case 'swap-h': return <Svg {...svg}><G {...p}><Path d="M7 4 3 8l4 4"/><Path d="M3 8h13a4 4 0 0 1 4 4"/><Path d="m17 20 4-4-4-4"/><Path d="M21 16H8a4 4 0 0 1-4-4"/></G></Svg>;
    case 'gift': return <Svg {...svg}><G {...p}><Rect x="3" y="8" width="18" height="5" rx="1"/><Path d="M5 13v8h14v-8M12 8v13"/><Path d="M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5zM12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5z"/></G></Svg>;
    default: return null;
  }
}
```

- [ ] **Commit**

```bash
git add src/components/Icon.tsx
git commit -m "feat: add Icon component (react-native-svg)"
```

---

## Task 11 — Primitive components

**Files:**
- Create: `src/components/ProgressRing.tsx`
- Create: `src/components/Bar.tsx`
- Create: `src/components/FlagChip.tsx`
- Create: `src/components/PortraitGhost.tsx`
- Create: `src/components/SectionHeader.tsx`
- Create: `src/components/HScroll.tsx`

- [ ] **Write `src/components/ProgressRing.tsx`**

```tsx
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../constants/theme';

interface Props {
  percent: number;
  size?: number;
  stroke?: number;
  track?: string;
  color?: string;
  children?: React.ReactNode;
}

export function ProgressRing({ percent, size = 72, stroke = 8, track = 'rgba(255,255,255,0.25)', color = '#fff', children }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, percent)) / 100);
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${c} ${c}`} strokeDashoffset={off} strokeLinecap="round" />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
```

- [ ] **Write `src/components/Bar.tsx`**

```tsx
import React from 'react';
import { View } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  percent: number;
  height?: number;
  color?: string;
  track?: string;
  radius?: number;
}

export function Bar({ percent, height = 7, color = colors.pitchDeep, track = 'rgba(0,0,0,0.08)', radius = 99 }: Props) {
  const w = `${Math.max(2, Math.min(100, percent))}%` as const;
  return (
    <View style={{ height, backgroundColor: track, borderRadius: radius, overflow: 'hidden', width: '100%' }}>
      <View style={{ height, width: w, backgroundColor: color, borderRadius: radius }} />
    </View>
  );
}
```

- [ ] **Write `src/components/FlagChip.tsx`**

```tsx
import React from 'react';
import { View } from 'react-native';

interface Props {
  colors: string[];
  w?: number;
  h?: number;
  radius?: number;
}

export function FlagChip({ colors, w = 26, h = 18, radius = 4 }: Props) {
  return (
    <View style={{ width: w, height: h, borderRadius: radius, overflow: 'hidden', flexDirection: 'row' }}>
      {colors.map((c, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: c }} />
      ))}
    </View>
  );
}
```

- [ ] **Write `src/components/PortraitGhost.tsx`**

```tsx
import React from 'react';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

interface Props {
  tone?: string;
  size?: number;
}

export function PortraitGhost({ tone = 'rgba(255,255,255,0.28)', size = 64 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <ClipPath id="pg">
          <Rect width="64" height="64" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#pg)" fill={tone}>
        <Circle cx="32" cy="25" r="12.5" />
        <Path d="M9 64c0-13 10.5-21 23-21s23 8 23 21z" />
      </G>
    </Svg>
  );
}
```

- [ ] **Write `src/components/SectionHeader.tsx`**

```tsx
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts } from '../constants/theme';

interface Props {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 22, marginBottom: 12 }}>
      <Text style={{ fontFamily: fonts.ui, fontSize: 14, fontWeight: '800', letterSpacing: 0.14, textTransform: 'uppercase', color: colors.ink }}>
        {title}
      </Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ fontFamily: fonts.ui, fontSize: 12.5, fontWeight: '700', color: colors.pitchDeep }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

- [ ] **Write `src/components/HScroll.tsx`**

```tsx
import React from 'react';
import { ScrollView } from 'react-native';

interface Props {
  children: React.ReactNode;
  pad?: number;
}

export function HScroll({ children, pad = 22 }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'row', gap: 12, paddingHorizontal: pad, paddingVertical: 2 }}
    >
      {children}
    </ScrollView>
  );
}
```

- [ ] **Commit**

```bash
git add src/components/
git commit -m "feat: add primitive UI components (ProgressRing, Bar, FlagChip, PortraitGhost, SectionHeader, HScroll)"
```

---

## Task 12 — Crest + StickerArt + StickerTile

**Files:**
- Create: `src/components/Crest.tsx`
- Create: `src/components/StickerArt.tsx`
- Create: `src/components/StickerTile.tsx`

- [ ] **Write `src/components/Crest.tsx`**

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import type { Team } from '../types';

interface Props {
  team: Pick<Team, 'colors' | 'code'>;
  size?: number;
  radius?: number;
}

export function Crest({ team, size = 38, radius }: Props) {
  const c = team.colors;
  const r = radius ?? Math.round(size * 0.26);
  return (
    <View style={{ width: size, height: size, borderRadius: r, overflow: 'hidden', backgroundColor: c[0], flexShrink: 0 }}>
      {c[1] && (
        <View style={{ position: 'absolute', bottom: 0, right: 0, width: size * 0.65, height: size, backgroundColor: c[1] as string,
          borderTopLeftRadius: size * 0.4 }} />
      )}
      {c[2] && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: size * 0.35, backgroundColor: c[2] as string, opacity: 0.92 }} />
      )}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'Anton', fontSize: size * 0.34, color: '#fff', textShadowColor: 'rgba(0,0,0,0.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
          {team.code}
        </Text>
      </View>
    </View>
  );
}
```

- [ ] **Write `src/components/StickerArt.tsx`**

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import { PortraitGhost } from './PortraitGhost';
import { Icon } from './Icon';
import { Crest } from './Crest';
import type { Sticker } from '../types';
import { colors } from '../constants/theme';

interface Props {
  s: Sticker;
  owned: boolean;
}

function flagGradientColors(c: string[]): [string, string] {
  if (c.length === 1) return [c[0], c[0]];
  return [c[0], c[c.length - 1]];
}

export function StickerArt({ s, owned }: Props) {
  if (!owned) {
    return (
      <View style={{ position: 'absolute', inset: 0 as any, backgroundColor: '#f1f3f7', borderRadius: 'inherit' as any,
        alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Text style={{ fontFamily: 'Anton', fontSize: 22, color: '#b0bdb6' }}>{s.n}</Text>
        <Text style={{ fontFamily: 'Roboto', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: '#b0bdb6', fontWeight: '700' }}>
          Missing
        </Text>
      </View>
    );
  }

  const bg = s.colors[0] ?? '#888';
  const bg2 = s.colors[s.colors.length - 1] ?? bg;

  if (s.type === 'badge') {
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Crest team={{ colors: s.colors, code: s.code }} size={48} radius={11} />
      </View>
    );
  }

  if (s.type === 'legend') {
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#14141a', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="star" size={34} fill={colors.gold} color={colors.gold} />
      </View>
    );
  }

  if (s.type === 'stadium') {
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="pin" size={30} strokeWidth={2.2} color="#fff" />
      </View>
    );
  }

  if (s.type === 'photo') {
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: bg }}>
        <View style={{ position: 'absolute', bottom: 6, left: 6, right: 6, flexDirection: 'row', gap: 2 }}>
          {[0,1,2,3,4].map(i => (
            <View key={i} style={{ flex: 1, maxWidth: 9, opacity: 0.85 }}>
              <PortraitGhost size={28} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  // player
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: bg, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: '14%' }}>
        <PortraitGhost />
      </View>
      {s.shirt != null && (
        <Text style={{ position: 'absolute', top: 5, right: 7, fontFamily: 'Anton', fontSize: 18, color: 'rgba(255,255,255,0.92)' }}>
          {s.shirt}
        </Text>
      )}
      {s.captain && (
        <View style={{ position: 'absolute', top: 7, left: 7, width: 16, height: 16, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 8, fontWeight: '800' }}>C</Text>
        </View>
      )}
    </View>
  );
}
```

- [ ] **Write `src/components/StickerTile.tsx`**

```tsx
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { StickerArt } from './StickerArt';
import { Icon } from './Icon';
import type { Sticker } from '../types';
import { colors, shadows } from '../constants/theme';

interface Props {
  s: Sticker;
  owned: boolean;
  count?: number;
  onPress?: () => void;
}

export function StickerTile({ s, owned, count = 0, onPress }: Props) {
  const label = s.type === 'player' ? s.name : (s.sub || s.name);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flexDirection: 'column' }}>
      <View style={{ position: 'relative', width: '100%', aspectRatio: 0.74, borderRadius: 13, backgroundColor: '#fff',
        ...(owned ? shadows.sm : {}), outline: owned ? '2px solid #fff' : 'none' } as any}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 13, overflow: 'hidden' }}>
          <StickerArt s={s} owned={owned} />
        </View>
        {owned && count > 1 && (
          <View style={{ position: 'absolute', top: -6, right: -6, minWidth: 22, height: 22, paddingHorizontal: 5,
            borderRadius: 11, backgroundColor: colors.magenta, borderWidth: 2, borderColor: '#fff',
            alignItems: 'center', justifyContent: 'center', ...shadows.sm }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>×{count}</Text>
          </View>
        )}
      </View>
      <View style={{ marginTop: 6, paddingLeft: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontFamily: 'Anton', fontSize: 12, color: owned ? colors.ink : colors.faint }}>{s.n}</Text>
          {owned && <Icon name="check" size={11} strokeWidth={3.2} color={colors.pitchDeep} />}
        </View>
        <Text numberOfLines={1} style={{ fontSize: 11.5, fontWeight: '600', marginTop: 1,
          color: owned ? colors.inkSoft : colors.faint }}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
```

- [ ] **Commit**

```bash
git add src/components/Crest.tsx src/components/StickerArt.tsx src/components/StickerTile.tsx
git commit -m "feat: add Crest, StickerArt, StickerTile components"
```

---

## Task 13 — FavTeamPicker (`src/components/FavTeamPicker.tsx`)

**Files:**
- Create: `src/components/FavTeamPicker.tsx`

- [ ] **Write `src/components/FavTeamPicker.tsx`**

```tsx
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Crest } from './Crest';
import { Icon } from './Icon';
import { getStickerData } from '../data/stickers';
import { colors, fonts, shadows } from '../constants/theme';

interface Props {
  current: string | null;
  onPick: (id: string) => void;
  onClose: () => void;
}

export function FavTeamPicker({ current, onPick, onClose }: Props) {
  const WC = getStickerData();
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const teams = Object.values(WC.teams).filter(t =>
    !query || t.name.toLowerCase().includes(query) || t.code.toLowerCase().includes(query)
  );

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(12,16,14,0.55)' }} onPress={onClose} activeOpacity={1} />
      <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, maxHeight: '82%', ...shadows.md }}>
        <View style={{ width: 40, height: 5, borderRadius: 9, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 12 }} />
        <View style={{ paddingHorizontal: 18, paddingBottom: 12 }}>
          <Text style={{ fontFamily: 'Anton', fontSize: 22, color: colors.ink }}>Pick your team</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, height: 42, paddingHorizontal: 13, borderRadius: 13, marginTop: 12, backgroundColor: colors.surface, ...shadows.sm }}>
            <Icon name="search" size={18} strokeWidth={2.4} color={colors.muted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search 48 nations"
              placeholderTextColor={colors.muted}
              style={{ flex: 1, fontSize: 15, fontFamily: fonts.ui, color: colors.ink }}
            />
          </View>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 28 }}>
          {teams.map(t => {
            const active = t.id === current;
            return (
              <TouchableOpacity key={t.id} onPress={() => onPick(t.id)} activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 13,
                  backgroundColor: active ? 'rgba(22,179,100,0.12)' : 'transparent' }}>
                <Crest team={t} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.ink }}>{t.name}</Text>
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.muted }}>Group {t.group}</Text>
                </View>
                {active && <Icon name="check" size={18} strokeWidth={3} color={colors.pitchDeep} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}
```

- [ ] **Commit**

```bash
git add src/components/FavTeamPicker.tsx
git commit -m "feat: add FavTeamPicker bottom sheet"
```

---

## Task 14 — Auth layout + Login screen

**Files:**
- Create: `src/app/(auth)/_layout.tsx`
- Create: `src/app/(auth)/login.tsx`

- [ ] **Write `src/app/(auth)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Write `src/app/(auth)/login.tsx`**

```tsx
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { supabase } from '../../lib/supabase';
import { StickerArt } from '../../components/StickerArt';
import { Icon } from '../../components/Icon';
import { getStickerData } from '../../data/stickers';
import { colors, fonts } from '../../constants/theme';

GoogleSignin.configure({
  webClientId: Constants.expoConfig?.extra?.googleWebClientId ?? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
});

const FAN_INDICES = ['BRA', 'ARG', 'FRA'] as const;
const ROTS = [-16, -4, 9];
const DYS = [18, 4, 14];

export default function LoginScreen() {
  const WC = getStickerData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fan = useMemo(() => [
    WC.teams['BRA'].stickers[0],
    WC.teams['ARG'].stickers[4],
    WC.teams['FRA'].stickers[6],
  ], []);

  const signIn = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No ID token returned');
      const { error: sbError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (sbError) throw sbError;
      // onAuthStateChange in StoreProvider handles the rest
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? 'Sign-in failed. Please try again.');
      setBusy(false);
    }
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      {/* pitch stripes */}
      <View style={s.stripes} />

      {/* brand */}
      <View style={s.brand}>
        <Text style={s.wordmark}>Stickerbook</Text>
        <View style={s.badge}><Text style={s.badgeText}>'26</Text></View>
      </View>
      <Text style={s.sub}>World Cup 2026 · 48 Nations</Text>

      {/* fanned sticker pack */}
      <View style={s.fanContainer}>
        <View style={s.fanGlow} />
        <View style={s.fanRow}>
          {fan.map((sticker, i) => (
            <View key={sticker.n} style={[s.fanCard, { transform: [{ rotate: `${ROTS[i]}deg` }, { translateY: DYS[i] }], zIndex: i === 1 ? 6 : 4 }]}>
              <View style={s.fanInner}>
                <StickerArt s={sticker} owned />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* sign-in card */}
      <View style={s.card}>
        <Text style={s.headline}>Collect every{'\n'}sticker. Anywhere.</Text>
        <Text style={s.body}>
          Track your album, scan new pages and line up swaps — all {WC.total} stickers across 48 nations, synced to your account.
        </Text>

        <TouchableOpacity onPress={signIn} disabled={busy} activeOpacity={0.85} style={s.button}>
          {busy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <PlayMark />
              <Text style={s.buttonText}>Sign in with Google Play</Text>
            </>
          )}
        </TouchableOpacity>

        {error && <Text style={s.errorText}>{error}</Text>}

        <View style={s.privacy}>
          <Icon name="lock" size={13} strokeWidth={2.2} color={colors.faint} />
          <Text style={s.privacyText}>Secured by Google Play</Text>
        </View>
      </View>
    </View>
  );
}

function PlayMark() {
  // Simple triangle play icon (Google Play branding)
  return (
    <View style={{ width: 19, height: 19, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 0, height: 0, borderStyle: 'solid', borderTopWidth: 9.5, borderBottomWidth: 9.5, borderLeftWidth: 16, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: colors.pitch }} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a3a2a' },
  stripes: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.5 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9, alignSelf: 'center', marginTop: 74 },
  wordmark: { fontFamily: 'Anton', fontSize: 30, color: '#fff' },
  badge: { backgroundColor: colors.pitch, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  badgeText: { fontFamily: 'Anton', fontSize: 15, color: colors.pitchDark },
  sub: { alignSelf: 'center', fontSize: 11.5, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginTop: 8 },
  fanContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0 },
  fanGlow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(22,179,100,0.18)' },
  fanRow: { flexDirection: 'row', alignItems: 'flex-end', width: 280, height: 180 },
  fanCard: { position: 'absolute', bottom: 0 },
  fanInner: { width: 90, height: 122, borderRadius: 12, overflow: 'hidden', borderWidth: 3, borderColor: '#fff' },
  card: { backgroundColor: colors.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40 },
  headline: { fontFamily: 'Anton', fontSize: 30, lineHeight: 32, color: colors.ink, marginBottom: 10 },
  body: { fontSize: 14, lineHeight: 20, color: colors.muted, marginBottom: 22 },
  button: { height: 54, borderRadius: 15, backgroundColor: colors.pitchDeep, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  buttonText: { color: '#fff', fontSize: 16.5, fontWeight: '700', fontFamily: fonts.ui },
  errorText: { color: colors.magenta, fontSize: 13, marginTop: 10, textAlign: 'center' },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 7, justifyContent: 'center', marginTop: 16 },
  privacyText: { fontSize: 12, fontWeight: '600', color: colors.faint },
});
```

- [ ] **Commit**

```bash
git add src/app/(auth)/
git commit -m "feat: add auth layout and Google Sign-In login screen"
```

---

## Task 15 — Tabs layout (`src/app/(tabs)/_layout.tsx`)

**Files:**
- Create: `src/app/(tabs)/_layout.tsx`

- [ ] **Write `src/app/(tabs)/_layout.tsx`** (Material 3 bottom nav for Android)

```tsx
import { Tabs, useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { colors, fonts, shadows } from '../../constants/theme';

const TAB_ITEMS = [
  { key: 'index', icon: 'home', label: 'Home' },
  { key: 'album', icon: 'album', label: 'Album' },
  { key: 'scan', icon: 'scan', label: 'Scan' },
  { key: 'stats', icon: 'stats', label: 'Stats' },
] as const;

function MaterialTabBar({ state, navigation }: any) {
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start',
      paddingTop: 10, paddingBottom: 22, paddingHorizontal: 8,
      backgroundColor: '#fafaf7', borderTopWidth: 1, borderTopColor: colors.lineSoft, ...shadows.sm }}>
      {TAB_ITEMS.map(item => {
        const isScan = item.key === 'scan';
        const activeIdx = state.index;
        const tabIdx = state.routes.findIndex((r: any) => r.name === item.key);
        const active = !isScan && tabIdx === activeIdx;

        const onPress = () => {
          if (isScan) { router.push('/scan'); return; }
          const event = navigation.emit({ type: 'tabPress', target: state.routes[tabIdx]?.key, canPreventDefault: true });
          if (!event.defaultPrevented) navigation.navigate(item.key);
        };

        return (
          <TouchableOpacity key={item.key} onPress={onPress} activeOpacity={0.7}
            style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 2 }}>
            <View style={{ width: 64, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
              backgroundColor: active ? 'rgba(22,179,100,0.2)' : 'transparent' }}>
              <Icon name={item.icon} size={22} strokeWidth={active ? 2.5 : 2} color={active ? colors.pitchDark : colors.inkSoft} />
            </View>
            <Text style={{ fontSize: 11.5, fontWeight: active ? '700' : '600', fontFamily: fonts.ui,
              color: active ? colors.ink : colors.muted }}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={props => <MaterialTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="album" />
      <Tabs.Screen name="stats" />
    </Tabs>
  );
}
```

- [ ] **Commit**

```bash
git add src/app/(tabs)/_layout.tsx
git commit -m "feat: add Material 3 tab bar layout"
```

---

## Task 16 — Home screen (`src/app/(tabs)/index.tsx`)

**Files:**
- Create: `src/app/(tabs)/index.tsx`

- [ ] **Write `src/app/(tabs)/index.tsx`**

```tsx
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { getStickerData } from '../../data/stickers';
import { ProgressRing } from '../../components/ProgressRing';
import { Bar } from '../../components/Bar';
import { FlagChip } from '../../components/FlagChip';
import { Crest } from '../../components/Crest';
import { StickerArt } from '../../components/StickerArt';
import { SectionHeader } from '../../components/SectionHeader';
import { HScroll } from '../../components/HScroll';
import { Icon } from '../../components/Icon';
import { colors, fonts, shadows } from '../../constants/theme';

export default function HomeScreen() {
  const { stats, teamStat, groupStat, recent } = useStore();
  const WC = getStickerData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const almost = useMemo(() =>
    Object.values(WC.teams)
      .map(t => ({ t, st: teamStat(t.id) }))
      .filter(x => x.st.missing > 0)
      .sort((a, b) => a.st.missing - b.st.missing)
      .slice(0, 8),
  [teamStat]);

  const recentStickers = recent.map(n => WC.byNumber[n]).filter(Boolean).slice(0, 12);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 116 }}>
      {/* header */}
      <View style={s.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Text style={s.wordmark}>Stickerbook</Text>
            <View style={s.badge}><Text style={s.badgeText}>'26</Text></View>
          </View>
          <Text style={s.sub}>World Cup · 48 Nations</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => router.push('/scan')} style={s.pillBtn}>
            <Icon name="search" size={19} strokeWidth={2.4} color={colors.inkSoft} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/profile')} style={[s.pillBtn, { backgroundColor: colors.ink, borderRadius: 19 }]}>
            <Icon name="sparkle" size={18} strokeWidth={2} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* hero progress card */}
      <View style={s.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <ProgressRing percent={stats.percent} size={92} stroke={9} color="#fff" track="rgba(255,255,255,0.28)">
            <Text style={{ fontFamily: 'Anton', fontSize: 27, color: '#fff' }}>
              {Math.floor(stats.percent)}<Text style={{ fontSize: 13 }}>%</Text>
            </Text>
          </ProgressRing>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>Album complete</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
              <Text style={{ fontFamily: 'Anton', fontSize: 38, color: '#fff' }}>{stats.distinct}</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>/ {stats.total}</Text>
            </View>
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>{stats.missing} stickers to go</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/scan')} style={s.scanBtn}>
          <Icon name="scan" size={19} strokeWidth={2.4} color={colors.pitchDark} />
          <Text style={{ fontWeight: '800', fontSize: 15, color: colors.pitchDark, fontFamily: fonts.ui }}>Scan a page</Text>
        </TouchableOpacity>
      </View>

      {/* stat pills */}
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 22, paddingBottom: 22 }}>
        {[
          { icon: 'check', value: stats.distinct, label: 'Collected', color: colors.pitchDeep },
          { icon: 'album', value: stats.missing, label: 'Missing', color: colors.blue },
          { icon: 'swap', value: stats.dupeTotal, label: 'Swaps', color: colors.magenta },
        ].map(p => (
          <View key={p.label} style={[s.pill, shadows.sm]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, color: p.color } as any}>
              <Icon name={p.icon} size={15} strokeWidth={2.6} color={p.color} />
              <Text style={{ fontFamily: 'Anton', fontSize: 23, color: colors.ink }}>{p.value}</Text>
            </View>
            <Text style={{ fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.muted }}>{p.label}</Text>
          </View>
        ))}
      </View>

      {/* almost complete */}
      <SectionHeader title="Almost complete" action="Album" onAction={() => router.push('/(tabs)/album')} />
      <HScroll>
        {almost.map(({ t, st }) => (
          <TouchableOpacity key={t.id} onPress={() => router.push(`/team/${t.id}`)} activeOpacity={0.8}
            style={[s.almostCard, shadows.sm]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Crest team={t} size={40} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '800', color: colors.ink }}>{t.name}</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.4 }}>GROUP {t.group}</Text>
              </View>
            </View>
            <Bar percent={st.percent} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.muted }}>{st.own}/{st.total}</Text>
              <Text style={{ fontSize: 11.5, fontWeight: '800', color: colors.magenta }}>{st.missing} to go</Text>
            </View>
          </TouchableOpacity>
        ))}
      </HScroll>

      <View style={{ height: 22 }} />

      {/* group stage */}
      <SectionHeader title="Group stage" action="See all" onAction={() => router.push('/(tabs)/album')} />
      <HScroll>
        {WC.groups.map(g => {
          const gs = groupStat(g.letter);
          return (
            <TouchableOpacity key={g.letter} onPress={() => router.push({ pathname: '/(tabs)/album', params: { letter: g.letter } })}
              activeOpacity={0.8} style={[s.groupCard, shadows.md]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'Anton', fontSize: 30, lineHeight: 30, color: '#fff' }}>{g.letter}</Text>
                <ProgressRing percent={gs.percent} size={34} stroke={4.5} color={colors.pitch} track="rgba(255,255,255,0.18)">
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>{gs.percent}</Text>
                </ProgressRing>
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {g.teamIds.map(id => <FlagChip key={id} colors={WC.teams[id].colors} w={20} h={13} radius={3} />)}
              </View>
              <Text style={{ fontSize: 10.5, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.4 }}>{gs.own}/{gs.total} STICKERS</Text>
            </TouchableOpacity>
          );
        })}
      </HScroll>

      <View style={{ height: 22 }} />

      {/* recently added */}
      {recentStickers.length > 0 && (
        <>
          <SectionHeader title="Recently added" />
          <HScroll>
            {recentStickers.map(sticker => (
              <TouchableOpacity key={sticker.n} onPress={() => router.push(`/sticker/${sticker.n}`)} activeOpacity={0.8} style={{ width: 92 }}>
                <View style={{ width: '100%', aspectRatio: 0.74, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#fff', ...shadows.sm }}>
                  <StickerArt s={sticker} owned />
                </View>
                <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '700', color: colors.inkSoft, marginTop: 5 }}>
                  {sticker.type === 'player' ? sticker.name : (sticker.sub || sticker.name)}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: colors.muted }}>{sticker.teamName || sticker.special}</Text>
              </TouchableOpacity>
            ))}
          </HScroll>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 16 },
  wordmark: { fontFamily: 'Anton', fontSize: 26, color: colors.ink },
  badge: { backgroundColor: colors.pitch, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontFamily: 'Anton', fontSize: 13, color: colors.pitchDark },
  sub: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: colors.muted, marginTop: 3 },
  pillBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  hero: { marginHorizontal: 22, borderRadius: 24, padding: 20, marginBottom: 16,
    backgroundColor: colors.pitchDeep, ...shadows.md },
  scanBtn: { marginTop: 16, height: 46, borderRadius: 14, backgroundColor: '#fff', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8 },
  pill: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 12, gap: 2 },
  almostCard: { width: 150, flexShrink: 0, backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 11 },
  groupCard: { width: 116, flexShrink: 0, borderRadius: 18, padding: 15, gap: 12, backgroundColor: colors.ink },
});
```

- [ ] **Commit**

```bash
git add src/app/(tabs)/index.tsx
git commit -m "feat: add Home screen"
```

---

## Task 17 — Album + Collection screens

**Files:**
- Create: `src/app/(tabs)/album.tsx`
- Create: `src/app/team/[id].tsx`
- Create: `src/app/special/[id].tsx`

- [ ] **Write `src/app/(tabs)/album.tsx`**

```tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { getStickerData } from '../../data/stickers';
import { Bar } from '../../components/Bar';
import { Crest } from '../../components/Crest';
import { Icon } from '../../components/Icon';
import { colors, fonts, shadows } from '../../constants/theme';

export default function AlbumScreen() {
  const { teamStat, groupStat, owned } = useStore();
  const WC = getStickerData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ letter?: string }>();
  const [q, setQ] = useState('');
  const [letter, setLetter] = useState(params.letter ?? 'All');

  const query = q.trim().toLowerCase();
  const matchTeam = (t: { name: string; code: string }) =>
    !query || t.name.toLowerCase().includes(query) || t.code.toLowerCase().includes(query);
  const visibleGroups = WC.groups.filter(g => letter === 'All' || g.letter === letter);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 116 }}>
      {/* header */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 12 }}>
        <Text style={{ fontFamily: 'Anton', fontSize: 34, color: colors.ink }}>Album</Text>
        <TouchableOpacity onPress={() => router.push('/scan')} style={s.scanBtn}>
          <Icon name="scan" size={16} strokeWidth={2.4} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, fontFamily: fonts.ui }}>Scan</Text>
        </TouchableOpacity>
      </View>

      {/* search */}
      <View style={[s.searchRow, shadows.sm]}>
        <Icon name="search" size={18} strokeWidth={2.4} color={colors.muted} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search team or sticker"
          placeholderTextColor={colors.muted}
          style={{ flex: 1, fontSize: 15, fontFamily: fonts.ui, color: colors.ink }} />
        {q ? <TouchableOpacity onPress={() => setQ('')}><Icon name="x" size={16} strokeWidth={2.6} color={colors.muted} /></TouchableOpacity> : null}
      </View>

      {/* group letter filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 7, paddingHorizontal: 18, paddingBottom: 16 }}>
        {['All', ...WC.groupsLetters].map(L => {
          const active = letter === L;
          return (
            <TouchableOpacity key={L} onPress={() => setLetter(L)} activeOpacity={0.7}
              style={[s.letterChip, active ? s.letterActive : s.letterInactive, !active && shadows.sm]}>
              <Text style={{ fontSize: 13.5, fontWeight: '800', fontFamily: fonts.ui, color: active ? '#06301c' : colors.inkSoft }}>
                {L}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* group rows */}
      {visibleGroups.map(g => {
        const gs = groupStat(g.letter);
        const teams = g.teamIds.map(id => WC.teams[id]).filter(matchTeam);
        if (!teams.length) return null;
        return (
          <View key={g.letter} style={[s.groupCard, shadows.sm]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: '14px 16px 12px' as any, paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ fontFamily: 'Anton', fontSize: 26, color: colors.ink }}>Group {g.letter}</Text>
              <View style={{ flex: 1 }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted }}>{gs.percent}%</Text>
            </View>
            <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
              <Bar percent={gs.percent} height={5} />
            </View>
            <View style={{ paddingVertical: 6 }}>
              {teams.map((t, i) => {
                const st = teamStat(t.id);
                return (
                  <TouchableOpacity key={t.id} onPress={() => router.push(`/team/${t.id}`)} activeOpacity={0.7}
                    style={[s.teamRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.lineSoft }]}>
                    <Crest team={t} size={36} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{t.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 }}>
                        <View style={{ flex: 1, maxWidth: 120 }}>
                          <Bar percent={st.percent} height={5} color={st.complete ? colors.pitch : colors.pitchDeep} />
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted }}>{st.own}/{st.total}</Text>
                      </View>
                    </View>
                    {st.complete
                      ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Icon name="check" size={13} strokeWidth={3} color={colors.pitchDeep} />
                          <Text style={{ fontSize: 11, fontWeight: '800', color: colors.pitchDeep }}>Done</Text>
                        </View>
                      : <Text style={{ fontSize: 11, fontWeight: '800', color: colors.magenta }}>−{st.missing}</Text>}
                    <Icon name="chevron" size={16} strokeWidth={2.4} color={colors.faint} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}

      {/* specials */}
      {letter === 'All' && !query && (
        <>
          <View style={{ paddingHorizontal: 18, paddingVertical: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', textTransform: 'uppercase', fontFamily: fonts.ui, color: colors.ink }}>Special pages</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 18 }}>
            {WC.specials.map(sp => {
              const own = sp.stickers.filter(s => owned[s.n]).length;
              const total = sp.stickers.length;
              const isLeg = sp.type === 'legend';
              return (
                <TouchableOpacity key={sp.title} onPress={() => router.push(`/special/${encodeURIComponent(sp.title)}`)}
                  activeOpacity={0.8} style={[s.specialCard, shadows.md, { backgroundColor: isLeg ? '#3a3320' : colors.blue }]}>
                  <Icon name={isLeg ? 'star' : 'pin'} size={22} fill={isLeg ? colors.gold : 'none'} color={isLeg ? colors.gold : '#fff'} strokeWidth={2.2} />
                  <View>
                    <Text style={{ fontFamily: 'Anton', fontSize: 15, color: '#fff' }}>{sp.title}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{own}/{total} collected</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scanBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 11, backgroundColor: colors.ink },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 9, height: 42, paddingHorizontal: 13, borderRadius: 13, marginHorizontal: 18, marginBottom: 12, backgroundColor: colors.surface },
  letterChip: { minWidth: 38, height: 34, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  letterActive: { backgroundColor: colors.pitch },
  letterInactive: { backgroundColor: colors.surface },
  groupCard: { marginHorizontal: 18, marginBottom: 14, backgroundColor: colors.surface, borderRadius: 20, overflow: 'hidden' },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 9 },
  specialCard: { flex: 1, borderRadius: 18, padding: 16, gap: 10 },
});
```

- [ ] **Write `src/app/team/[id].tsx`**

```tsx
import { useLocalSearchParams } from 'expo-router';
import { CollectionScreen } from '../../screens/CollectionScreen';

export default function TeamPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CollectionScreen kind="team" id={id} />;
}
```

- [ ] **Write `src/app/special/[id].tsx`**

```tsx
import { useLocalSearchParams } from 'expo-router';
import { CollectionScreen } from '../../screens/CollectionScreen';

export default function SpecialPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CollectionScreen kind="special" id={decodeURIComponent(id)} />;
}
```

- [ ] **Create the shared `CollectionScreen` component** (`src/screens/CollectionScreen.tsx`)

```tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { getStickerData } from '../data/stickers';
import { Bar } from '../components/Bar';
import { Crest } from '../components/Crest';
import { Icon } from '../components/Icon';
import { StickerTile } from '../components/StickerTile';
import { colors, fonts, shadows } from '../constants/theme';

interface Props {
  kind: 'team' | 'special';
  id: string;
}

export function CollectionScreen({ kind, id }: Props) {
  const { owned } = useStore();
  const WC = getStickerData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'missing' | 'got'>('all');

  let title: string, subtitle: string, bgColors: string[], crestTeam: any, stickers: any[], iconName: string | null;
  if (kind === 'team') {
    const t = WC.teams[id];
    title = t.name; subtitle = `Group ${t.group}`; bgColors = t.colors; crestTeam = t; stickers = t.stickers; iconName = null;
  } else {
    const sp = WC.specials.find(s => s.title === id)!;
    title = sp.title; subtitle = sp.sub; stickers = sp.stickers; crestTeam = null;
    bgColors = sp.type === 'legend' ? ['#b8902f', '#16140e'] : [colors.blue, '#1a3a7a'];
    iconName = sp.type === 'legend' ? 'star' : 'pin';
  }

  const own = stickers.filter(s => owned[s.n]).length;
  const total = stickers.length;
  const swaps = stickers.filter(s => (owned[s.n] ?? 0) > 1).length;
  const percent = Math.round((own / total) * 100);

  const shown = stickers.filter(s =>
    filter === 'all' ? true : filter === 'missing' ? !owned[s.n] : owned[s.n]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* sticky back bar */}
      <View style={[s.backBar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Icon name="back" size={20} strokeWidth={2.6} color={colors.inkSoft} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/scan')} style={s.backBtn}>
          <Icon name="scan" size={19} strokeWidth={2.4} color={colors.inkSoft} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* banner */}
        <View style={[s.banner, { backgroundColor: bgColors[0] }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {crestTeam
              ? <Crest team={crestTeam} size={56} />
              : <View style={s.iconBox}><Icon name={iconName!} size={28} fill={iconName === 'star' ? colors.gold : 'none'} color={iconName === 'star' ? colors.gold : '#fff'} /></View>}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Anton', fontSize: 26, color: '#fff' }}>{title}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>{subtitle}</Text>
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 7 }}>
              <Text style={{ fontFamily: 'Anton', fontSize: 30, color: '#fff' }}>{own}</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' }}>/ {total}</Text>
              <Text style={{ marginLeft: 'auto' as any, fontSize: 13, fontWeight: '800', color: '#fff' }}>{percent}%</Text>
            </View>
            <Bar percent={percent} height={7} color="#fff" track="rgba(255,255,255,0.28)" />
          </View>
        </View>

        {/* filter chips */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingBottom: 14 }}>
          {(['all', 'missing', 'got'] as const).map(k => {
            const active = filter === k;
            const count = k === 'all' ? total : k === 'missing' ? total - own : own;
            const label = k.charAt(0).toUpperCase() + k.slice(1);
            return (
              <TouchableOpacity key={k} onPress={() => setFilter(k)} activeOpacity={0.7}
                style={[s.filterChip, active ? s.filterActive : s.filterInactive, !active && shadows.sm]}>
                <Text style={{ fontSize: 12.5, fontWeight: '700', fontFamily: fonts.ui, color: active ? '#fff' : colors.inkSoft }}>
                  {label} <Text style={{ opacity: 0.6 }}>{count}</Text>
                </Text>
              </TouchableOpacity>
            );
          })}
          {swaps > 0 && (
            <View style={{ marginLeft: 'auto' as any, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="swap" size={14} strokeWidth={2.6} color={colors.magenta} />
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.magenta }}>{swaps}</Text>
            </View>
          )}
        </View>

        {/* sticker grid */}
        <View style={s.grid}>
          {shown.map((sticker, i) => (
            <View key={sticker.n} style={{ width: '30%' }}>
              <StickerTile s={sticker} owned={!!owned[sticker.n]} count={owned[sticker.n] ?? 0}
                onPress={() => router.push(`/sticker/${sticker.n}`)} />
            </View>
          ))}
        </View>
        {shown.length === 0 && (
          <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 13, fontWeight: '600', padding: 40 }}>
            Nothing here in this filter.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  backBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 8, backgroundColor: colors.bg },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  banner: { marginHorizontal: 14, borderRadius: 22, padding: 18, marginBottom: 16 },
  iconBox: { width: 56, height: 56, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  filterChip: { height: 32, paddingHorizontal: 13, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filterActive: { backgroundColor: colors.ink },
  filterInactive: { backgroundColor: colors.surface },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 18 },
});
```

- [ ] **Commit**

```bash
git add src/app/(tabs)/album.tsx src/app/team/ src/app/special/ src/screens/CollectionScreen.tsx
git commit -m "feat: add Album and Collection screens"
```

---

## Task 18 — Stats screen (`src/app/(tabs)/stats.tsx`)

**Files:**
- Create: `src/app/(tabs)/stats.tsx`

- [ ] **Write `src/app/(tabs)/stats.tsx`**

```tsx
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { getStickerData } from '../../data/stickers';
import { ProgressRing } from '../../components/ProgressRing';
import { Bar } from '../../components/Bar';
import { StickerArt } from '../../components/StickerArt';
import { SectionHeader } from '../../components/SectionHeader';
import { HScroll } from '../../components/HScroll';
import { colors, fonts, shadows } from '../../constants/theme';

export default function StatsScreen() {
  const { stats, groupStat } = useStore();
  const WC = getStickerData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const swaps = stats.swaps.slice().sort((a, b) => b.count - a.count);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 116 }}>
      <View style={{ paddingHorizontal: 18, paddingBottom: 14 }}>
        <Text style={{ fontFamily: 'Anton', fontSize: 34, color: colors.ink }}>Stats</Text>
      </View>

      {/* hero */}
      <View style={[s.hero, shadows.md]}>
        <ProgressRing percent={stats.percent} size={86} stroke={9} color={colors.pitch} track="rgba(255,255,255,0.16)">
          <Text style={{ fontFamily: 'Anton', fontSize: 25, color: '#fff' }}>
            {Math.floor(stats.percent)}<Text style={{ fontSize: 12 }}>%</Text>
          </Text>
        </ProgressRing>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>Total progress</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
            <Text style={{ fontFamily: 'Anton', fontSize: 34, color: '#fff' }}>{stats.distinct}</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>/ {stats.total}</Text>
          </View>
          <Text style={{ fontSize: 12.5, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{stats.missing} still missing</Text>
        </View>
      </View>

      {/* stat boxes */}
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingBottom: 22 }}>
        {[
          { value: stats.distinct, label: 'Collected', color: colors.pitchDeep },
          { value: stats.missing, label: 'Missing', color: colors.blue },
          { value: stats.dupeTotal, label: 'Spares', color: colors.magenta },
        ].map(b => (
          <View key={b.label} style={[s.statBox, shadows.sm]}>
            <Text style={{ fontFamily: 'Anton', fontSize: 26, color: b.color }}>{b.value}</Text>
            <Text style={{ fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.muted, marginTop: 2 }}>{b.label}</Text>
          </View>
        ))}
      </View>

      {/* completion by group */}
      <SectionHeader title="Completion by group" />
      <View style={[s.groupList, shadows.sm]}>
        {WC.groups.map((g, i) => {
          const st = groupStat(g.letter);
          return (
            <TouchableOpacity key={g.letter} onPress={() => router.push({ pathname: '/(tabs)/album', params: { letter: g.letter } })}
              activeOpacity={0.7}
              style={[s.groupRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.lineSoft }]}>
              <Text style={{ fontFamily: 'Anton', fontSize: 17, width: 22, color: colors.ink }}>{g.letter}</Text>
              <View style={{ flex: 1 }}>
                <Bar percent={st.percent} height={7} color={st.percent === 100 ? colors.pitch : colors.pitchDeep} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.muted, width: 38, textAlign: 'right' }}>{st.percent}%</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: 22 }} />

      {/* swaps */}
      <SectionHeader title={`Your swaps · ${stats.dupeTotal}`} />
      {swaps.length > 0 ? (
        <HScroll>
          {swaps.map(({ s: sticker, count }) => (
            <TouchableOpacity key={sticker.n} onPress={() => router.push(`/sticker/${sticker.n}`)} activeOpacity={0.8} style={{ width: 96 }}>
              <View style={{ width: '100%', aspectRatio: 0.74, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: colors.magenta }}>
                <StickerArt s={sticker} owned />
              </View>
              <View style={{ position: 'absolute', top: -7, right: -7, minWidth: 24, height: 24, borderRadius: 12,
                backgroundColor: colors.magenta, borderWidth: 2, borderColor: colors.bg,
                alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>×{count}</Text>
              </View>
              <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '700', color: colors.inkSoft, marginTop: 6 }}>
                {sticker.type === 'player' ? sticker.name : (sticker.sub || sticker.name)}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: colors.magenta }}>{count - 1} spare</Text>
            </TouchableOpacity>
          ))}
        </HScroll>
      ) : (
        <View style={[s.emptySwaps, shadows.sm]}>
          <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 13, fontWeight: '600' }}>No duplicate stickers yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  hero: { marginHorizontal: 18, marginBottom: 16, borderRadius: 22, padding: 18, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', gap: 18 },
  statBox: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 13 },
  groupList: { marginHorizontal: 18, marginBottom: 22, backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 6 },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  emptySwaps: { marginHorizontal: 18, padding: 24, backgroundColor: colors.surface, borderRadius: 16 },
});
```

- [ ] **Commit**

```bash
git add src/app/(tabs)/stats.tsx
git commit -m "feat: add Stats screen"
```

---

## Task 19 — Sticker detail modal (`src/app/sticker/[n].tsx`)

**Files:**
- Create: `src/app/sticker/[n].tsx`

- [ ] **Write `src/app/sticker/[n].tsx`**

```tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { getStickerData } from '../../data/stickers';
import { StickerArt } from '../../components/StickerArt';
import { Crest } from '../../components/Crest';
import { Icon } from '../../components/Icon';
import { colors, fonts, shadows } from '../../constants/theme';

export default function DetailScreen() {
  const { n: nStr } = useLocalSearchParams<{ n: string }>();
  const n = Number(nStr);
  const { owned, actions } = useStore();
  const WC = getStickerData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const s = WC.byNumber[n];
  if (!s) return null;

  const count = owned[n] ?? 0;
  const isOwned = count > 0;
  const team = s.teamId ? WC.teams[s.teamId] : null;
  const typeLabel: Record<string, string> = { player: s.pos ?? '', badge: 'Team Badge', photo: 'Squad Photo', legend: 'Legend', stadium: 'Host City' };

  const go = (delta: number) => {
    const nn = Math.min(WC.total, Math.max(1, n + delta));
    router.replace(`/sticker/${nn}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(12,16,14,0.55)' }} onPress={() => router.back()} />
      <View style={[ds.sheet, { paddingBottom: insets.bottom + 32 }]}>
        <View style={ds.pill} />

        {/* number row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontFamily: 'Anton', fontSize: 16, color: colors.muted }}>No. {n}</Text>
            <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: colors.faint }}>{WC.total} total</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={ds.closeBtn}>
            <Icon name="x" size={18} strokeWidth={2.6} color={colors.inkSoft} />
          </TouchableOpacity>
        </View>

        {/* hero sticker + prev/next */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 6 }}>
          <TouchableOpacity onPress={() => go(-1)} disabled={n <= 1} style={[ds.arrowBtn, { opacity: n <= 1 ? 0.3 : 1 }]}>
            <Icon name="back" size={20} strokeWidth={2.6} color={colors.inkSoft} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: 178 }}>
              <View style={[{ width: '100%', aspectRatio: 0.74, borderRadius: 18, overflow: 'hidden' }, isOwned && shadows.md]}>
                <StickerArt s={s} owned={isOwned} />
              </View>
              {count > 1 && (
                <View style={ds.countBadge}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>×{count}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={() => go(1)} disabled={n >= WC.total} style={[ds.arrowBtn, { opacity: n >= WC.total ? 0.3 : 1 }]}>
            <Icon name="chevron" size={20} strokeWidth={2.6} color={colors.inkSoft} />
          </TouchableOpacity>
        </View>

        {/* title */}
        <View style={{ alignItems: 'center', marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            {s.captain && <View style={ds.captainBadge}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>Captain</Text></View>}
            <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: colors.pitchDeep }}>
              {typeLabel[s.type]}{s.shirt != null ? ` · #${s.shirt}` : ''}
            </Text>
          </View>
          <Text style={{ fontFamily: 'Anton', fontSize: 28, color: colors.ink, textAlign: 'center' }}>{s.name}</Text>
          {s.special && <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 4 }}>{s.special} · {s.sub}</Text>}
        </View>

        {/* team row */}
        {team && (
          <TouchableOpacity onPress={() => { router.back(); router.push(`/team/${team.id}`); }}
            activeOpacity={0.7} style={[ds.teamRow, shadows.sm]}>
            <Crest team={team} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink }}>{team.name}</Text>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.muted }}>Group {team.group} · View team page</Text>
            </View>
            <Icon name="chevron" size={17} strokeWidth={2.4} color={colors.faint} />
          </TouchableOpacity>
        )}

        {/* actions */}
        {!isOwned ? (
          <TouchableOpacity onPress={() => actions.add(n)} activeOpacity={0.85} style={[ds.primaryBtn, shadows.md]}>
            <Icon name="check" size={20} strokeWidth={3} color="#fff" />
            <Text style={ds.primaryBtnText}>Mark as collected</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ gap: 10 }}>
            <View style={ds.ownedCard}>
              <Icon name="check" size={20} strokeWidth={3} color={colors.pitchDeep} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '800', color: colors.pitchDark }}>In your collection</Text>
                <Text style={{ fontSize: 11.5, fontWeight: '600', color: colors.pitchDeep }}>{count > 1 ? `${count - 1} spare for swaps` : 'No spares yet'}</Text>
              </View>
              <View style={[ds.stepper, shadows.sm]}>
                <TouchableOpacity onPress={() => actions.remove(n)} style={ds.stepBtn}>
                  <Icon name="minus" size={16} strokeWidth={3} color={colors.inkSoft} />
                </TouchableOpacity>
                <Text style={{ fontFamily: 'Anton', minWidth: 22, textAlign: 'center', fontSize: 18, color: colors.ink }}>{count}</Text>
                <TouchableOpacity onPress={() => actions.add(n)} style={ds.stepBtn}>
                  <Icon name="plus" size={16} strokeWidth={3} color={colors.inkSoft} />
                </TouchableOpacity>
              </View>
            </View>
            {count > 1 && (
              <TouchableOpacity activeOpacity={0.85} style={ds.swapBtn}>
                <Icon name="swap" size={18} strokeWidth={2.6} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14.5, fontFamily: fonts.ui }}>Offer {count - 1} for swap</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const ds = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '88%' },
  pill: { width: 40, height: 5, borderRadius: 9, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 6 },
  closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  arrowBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  countBadge: { position: 'absolute', top: -10, right: -10, minWidth: 30, height: 30, paddingHorizontal: 7, borderRadius: 15, backgroundColor: colors.magenta, borderWidth: 3, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  captainBadge: { backgroundColor: colors.ink, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 15, backgroundColor: colors.surface, marginBottom: 14 },
  primaryBtn: { height: 54, borderRadius: 16, backgroundColor: colors.pitchDeep, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, fontFamily: fonts.ui },
  ownedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 15, backgroundColor: 'rgba(22,179,100,0.1)', borderWidth: 1, borderColor: 'rgba(22,179,100,0.22)' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 12, padding: 4 },
  stepBtn: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#f4f4f6', alignItems: 'center', justifyContent: 'center' },
  swapBtn: { height: 48, borderRadius: 15, backgroundColor: colors.magenta, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
```

- [ ] **Commit**

```bash
git add src/app/sticker/
git commit -m "feat: add sticker detail bottom-sheet modal"
```

---

## Task 20 — Profile screen (`src/app/profile.tsx`)

**Files:**
- Create: `src/app/profile.tsx`

- [ ] **Write `src/app/profile.tsx`**

```tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { getStickerData } from '../data/stickers';
import { Bar } from '../components/Bar';
import { Crest } from '../components/Crest';
import { FavTeamPicker } from '../components/FavTeamPicker';
import { Icon } from '../components/Icon';
import { colors, fonts, shadows } from '../constants/theme';

function SettingRow({ icon, iconColor, label, detail, onPress }: { icon: string; iconColor: string; label: string; detail?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={ps.settingRow}>
      <View style={[ps.settingIcon, { backgroundColor: `${iconColor}22` }]}>
        <Icon name={icon} size={17} strokeWidth={2.4} color={iconColor} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink, fontFamily: fonts.ui }}>{label}</Text>
      {detail && <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted }}>{detail}</Text>}
      <Icon name="chevron" size={16} strokeWidth={2.4} color={colors.faint} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, auth, favoriteTeam, teamStat } = useStore();
  const WC = getStickerData();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [picking, setPicking] = useState(false);

  if (!user) return null;

  const fav = favoriteTeam ? WC.teams[favoriteTeam] : null;
  const favStat = fav ? teamStat(fav.id) : null;
  const email = user.email ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* back bar */}
      <View style={[ps.backBar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => router.back()} style={ps.backBtn}>
          <Icon name="back" size={20} strokeWidth={2.6} color={colors.inkSoft} />
        </TouchableOpacity>
        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.inkSoft, letterSpacing: 0.2, fontFamily: fonts.ui }}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 44 }}>
        {/* identity */}
        <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingBottom: 22 }}>
          <View style={ps.avatarRing}>
            <View style={ps.avatar}>
              <Icon name="sparkle" size={48} color={colors.pitch} />
            </View>
          </View>
          <Text style={{ fontFamily: 'Anton', fontSize: 27, color: colors.ink, marginTop: 14 }}>{email.split('@')[0]}</Text>
          <View style={[ps.providerBadge, shadows.sm]}>
            <Icon name="star" size={14} strokeWidth={2} color={colors.inkSoft} />
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.muted, fontFamily: fonts.ui }}>Signed in with Google</Text>
          </View>
        </View>

        {/* favorite team */}
        <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
          <Text style={ps.sectionTitle}>Favorite team</Text>
        </View>
        <View style={{ marginHorizontal: 18, marginBottom: 24 }}>
          {fav && favStat ? (
            <View style={[ps.favCard, shadows.sm]}>
              <View style={[ps.favBanner, { backgroundColor: fav.colors[0] }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, flex: 1 }}>
                  <Crest team={fav} size={50} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Anton', fontSize: 23, color: '#fff' }}>{fav.name}</Text>
                    <Text style={{ fontSize: 11.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>Group {fav.group}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setPicking(true)} activeOpacity={0.8}
                    style={{ height: 32, paddingHorizontal: 13, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontWeight: '800', fontSize: 12.5, color: colors.ink, fontFamily: fonts.ui }}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity onPress={() => router.push(`/team/${fav.id}`)} activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 7 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted }}>Your collection</Text>
                    <Text style={{ marginLeft: 'auto' as any, fontSize: 12.5, fontWeight: '800', color: favStat.complete ? colors.pitchDeep : colors.inkSoft }}>
                      {favStat.own}/{favStat.total}
                    </Text>
                  </View>
                  <Bar percent={favStat.percent} height={7} color={favStat.complete ? colors.pitch : colors.pitchDeep} />
                </View>
                <Icon name="chevron" size={17} strokeWidth={2.4} color={colors.faint} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setPicking(true)} activeOpacity={0.8}
              style={[ps.chooseTeam, shadows.sm]}>
              <Icon name="plus" size={18} strokeWidth={2.6} color={colors.pitchDeep} />
              <Text style={{ fontWeight: '700', fontSize: 14.5, color: colors.pitchDeep, fontFamily: fonts.ui }}>Choose your team</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* settings */}
        <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
          <Text style={ps.sectionTitle}>Settings</Text>
        </View>
        <View style={[ps.settingGroup, shadows.sm]}>
          <SettingRow icon="lock" iconColor={colors.blue} label="Account & security" detail="Google" />
          <View style={ps.divider} />
          <SettingRow icon="bolt" iconColor={colors.amber} label="Notifications" detail="On" />
          <View style={ps.divider} />
          <SettingRow icon="swap" iconColor={colors.magenta} label="Swap preferences" />
        </View>
        <View style={[ps.settingGroup, shadows.sm]}>
          <SettingRow icon="share" iconColor={colors.pitchDeep} label="Invite friends" />
          <View style={ps.divider} />
          <SettingRow icon="star" iconColor={colors.gold} label="Rate Stickerbook" />
          <View style={ps.divider} />
          <SettingRow icon="sparkle" iconColor={colors.blue} label="What's new" />
        </View>

        {/* sign out */}
        <View style={{ paddingHorizontal: 18 }}>
          <TouchableOpacity onPress={() => auth.signOut()} activeOpacity={0.8}
            style={[ps.signOut, shadows.sm]}>
            <Icon name="x" size={17} strokeWidth={2.8} color={colors.magenta} />
            <Text style={{ fontWeight: '800', fontSize: 14.5, color: colors.magenta, fontFamily: fonts.ui }}>Sign out</Text>
          </TouchableOpacity>
          <Text style={{ textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.faint, marginTop: 16 }}>
            Stickerbook '26 · v1.0 · Android
          </Text>
        </View>
      </ScrollView>

      {picking && (
        <FavTeamPicker
          current={favoriteTeam}
          onPick={(id) => { auth.setFavoriteTeam(id); setPicking(false); }}
          onClose={() => setPicking(false)}
        />
      )}
    </View>
  );
}

const ps = StyleSheet.create({
  backBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  avatarRing: { padding: 4, borderRadius: 999, backgroundColor: colors.pitchDeep, ...shadows.md },
  avatar: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.bg },
  providerBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, backgroundColor: colors.surface },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase', color: colors.ink, fontFamily: fonts.ui },
  favCard: { borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surface },
  favBanner: { padding: 16 },
  chooseTeam: { height: 64, borderRadius: 18, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  settingGroup: { marginHorizontal: 18, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, paddingHorizontal: 14 },
  settingIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: colors.lineSoft, marginLeft: 59 },
  signOut: { height: 50, borderRadius: 15, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
```

- [ ] **Commit**

```bash
git add src/app/profile.tsx
git commit -m "feat: add Profile screen"
```

---

## Task 21 — Scan API route (`src/app/api/scan+api.ts`)

**Files:**
- Create: `src/app/api/scan+api.ts`

- [ ] **Write `src/app/api/scan+api.ts`**

```ts
import Anthropic from '@anthropic-ai/sdk';

const PROMPT = `Analyze this World Cup 2026 Panini sticker album page photo.

Your task: identify each sticker slot on the page and determine whether:
1. The slot is EMPTY (you can see a printed slot with a number and possibly a player name printed on it — the sticker has NOT been placed)
2. The slot is FILLED (a colourful sticker card has been placed on the slot, covering it)

Also identify the team name shown at the top of the page if visible.

Return a JSON object in exactly this format (no markdown, no explanation, just JSON):
{
  "team": "Team Name or null",
  "stickers": [
    { "n": 123, "present": true },
    { "n": 124, "present": false }
  ]
}

Only include sticker entries where you can clearly read the number. If you cannot read a number, skip that slot.`;

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { image } = body as { image: string };

    if (!image) {
      return Response.json({ error: 'Missing image' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: image,
              },
            },
            {
              type: 'text',
              text: PROMPT,
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return Response.json({ error: 'Unexpected response from Claude' }, { status: 500 });
    }

    // Strip potential markdown code fences
    const raw = content.text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const data = JSON.parse(raw);

    return Response.json(data);
  } catch (e: any) {
    console.error('Scan API error:', e);
    return Response.json({ error: e.message ?? 'Unknown error' }, { status: 500 });
  }
}
```

- [ ] **Commit**

```bash
git add src/app/api/scan+api.ts
git commit -m "feat: add Claude Vision scan API route"
```

---

## Task 22 — Scan screen (`src/app/scan.tsx`)

**Files:**
- Create: `src/app/scan.tsx`

- [ ] **Write `src/app/scan.tsx`**

```tsx
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import Constants from 'expo-constants';
import { useStore } from '../store';
import { getStickerData } from '../data/stickers';
import { StickerArt } from '../components/StickerArt';
import { Icon } from '../components/Icon';
import { colors, fonts, shadows } from '../constants/theme';
import type { ScanResult } from '../types';

const API_ORIGIN = Constants.expoConfig?.extra?.apiOrigin ?? 'http://localhost:8081';

type Phase = 'aim' | 'processing' | 'results' | 'done';

export default function ScanScreen() {
  const router = useRouter();
  const { owned, actions } = useStore();
  const WC = getStickerData();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [phase, setPhase] = useState<Phase>('aim');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [applyResult, setApplyResult] = useState<{ added: number; dupes: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── permission gate ────────────────────────────────────────────────────
  if (!permission) return <View style={{ flex: 1, backgroundColor: '#0c0f0d' }} />;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0c0f0d', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Icon name="scan" size={48} strokeWidth={1.5} color={colors.pitch} />
        <Text style={{ fontFamily: 'Anton', fontSize: 24, color: '#fff', textAlign: 'center', marginTop: 20 }}>Camera access needed</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginTop: 10, marginBottom: 28 }}>
          Stickerbook needs the camera to scan your album pages.
        </Text>
        <TouchableOpacity onPress={requestPermission} activeOpacity={0.85} style={ss.grantBtn}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16, fontFamily: fonts.ui }}>Grant permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 14 }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 14 }}>Not now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── capture & analyse ──────────────────────────────────────────────────
  const capture = async () => {
    if (!cameraRef.current) return;
    setPhase('processing');
    setError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) throw new Error('No photo captured');

      // resize to max 1024px wide, JPEG 0.7
      const ctx = ImageManipulator.manipulate(photo.uri);
      ctx.resize({ width: 1024 });
      const rendered = await ctx.renderAsync();
      const compressed = await rendered.saveAsync({
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 0.7,
        base64: true,
      });

      if (!compressed.base64) throw new Error('Failed to encode image');

      const response = await fetch(`${API_ORIGIN}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressed.base64 }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? `Server error ${response.status}`);
      }

      const data: ScanResult = await response.json();
      setScanResult(data);

      // Pre-select all stickers identified as present
      const presentNums = (data.stickers ?? []).filter(x => x.present).map(x => x.n);
      setSelected(new Set(presentNums));
      setPhase('results');
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? 'Scan failed');
      setPhase('aim');
    }
  };

  const toggleSelected = (n: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n); else next.add(n);
      return next;
    });
  };

  const apply = () => {
    const nums = Array.from(selected);
    const result = actions.applyScan(nums);
    setApplyResult({ added: result.added.length, dupes: result.dupes.length });
    setPhase('done');
    setTimeout(() => router.back(), 1800);
  };

  const stickersInResult = (scanResult?.stickers ?? [])
    .map(x => ({ sticker: WC.byNumber[x.n], present: x.present }))
    .filter(x => x.sticker);

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#0c0f0d' }}>
      {/* camera */}
      {phase === 'aim' && (
        <CameraView ref={cameraRef} style={{ flex: 1 }} flash={flash} facing="back">
          {/* top bar */}
          <View style={ss.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={ss.camBtn}>
              <Icon name="x" size={20} strokeWidth={2.4} color="#fff" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontWeight: '800', fontSize: 14, color: '#fff' }}>Scan album page</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Point at a full page, then tap scan</Text>
            </View>
            <TouchableOpacity onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')} style={ss.camBtn}>
              <Icon name={flash === 'on' ? 'flash' : 'flash-off'} size={19} strokeWidth={2.2} color={flash === 'on' ? colors.amber : '#fff'} />
            </TouchableOpacity>
          </View>

          {/* corner brackets */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: '80%', aspectRatio: 0.75, position: 'relative' }}>
              {[{ top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 9 },
                { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 9 },
                { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 9 },
                { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 9 },
              ].map((style, i) => (
                <View key={i} style={[{ position: 'absolute', width: 28, height: 28, borderColor: 'rgba(255,255,255,0.92)' }, style]} />
              ))}
            </View>
          </View>

          {/* shutter */}
          <View style={ss.shutterArea}>
            <TouchableOpacity onPress={capture} style={ss.shutterOuter} activeOpacity={0.85}>
              <View style={ss.shutterInner}>
                <Icon name="scan" size={26} strokeWidth={2.4} color={colors.pitchDark} />
              </View>
            </TouchableOpacity>
          </View>
        </CameraView>
      )}

      {/* processing */}
      {phase === 'processing' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <ActivityIndicator size="large" color={colors.pitch} />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Analysing page…</Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>This takes a few seconds</Text>
        </View>
      )}

      {/* error */}
      {error && phase === 'aim' && (
        <View style={ss.errorBanner}>
          <Icon name="x" size={16} strokeWidth={2.4} color={colors.magenta} />
          <Text style={{ color: colors.magenta, fontWeight: '700', fontSize: 13, flex: 1 }}>{error}</Text>
        </View>
      )}

      {/* results sheet */}
      {(phase === 'results' || phase === 'done') && (
        <View style={{ position: 'absolute', inset: 0 } as any}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }} onPress={() => phase === 'results' ? setPhase('aim') : undefined} />
          <View style={ss.sheet}>
            <View style={ss.sheetPill} />

            {phase === 'done' ? (
              <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <View style={ss.doneCircle}>
                  <Icon name="check" size={34} strokeWidth={3.5} color={colors.pitchDark} />
                </View>
                <Text style={{ fontFamily: 'Anton', fontSize: 24, color: colors.ink, marginTop: 14 }}>Added to album!</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginTop: 4 }}>
                  {applyResult?.added} new · {applyResult?.dupes} swaps
                </Text>
              </View>
            ) : (
              <>
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'Anton', fontSize: 24, color: colors.ink }}>
                    {stickersInResult.length} stickers detected
                  </Text>
                  {scanResult?.team && (
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 2 }}>{scanResult.team}</Text>
                  )}
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 5 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <View style={{ width: 9, height: 9, borderRadius: 9, backgroundColor: colors.pitch }} />
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.pitchDeep }}>
                        {stickersInResult.filter(x => x.present && !owned[x.sticker.n]).length} new
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <View style={{ width: 9, height: 9, borderRadius: 9, backgroundColor: colors.magenta }} />
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.magenta }}>
                        {stickersInResult.filter(x => x.present && owned[x.sticker.n]).length} swaps
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <View style={{ width: 9, height: 9, borderRadius: 9, backgroundColor: colors.faint }} />
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.muted }}>
                        {stickersInResult.filter(x => !x.present).length} empty slots
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 8 }}>Tap to toggle which stickers to add.</Text>
                </View>

                <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 4 }}>
                  {stickersInResult.map(({ sticker, present }) => {
                    const isSelected = selected.has(sticker.n);
                    const isNew = !owned[sticker.n];
                    const borderColor = !present ? colors.faint : isNew ? colors.pitch : colors.magenta;
                    return (
                      <TouchableOpacity key={sticker.n} onPress={() => present && toggleSelected(sticker.n)}
                        activeOpacity={present ? 0.7 : 1}
                        style={{ width: '22%', opacity: present && !isSelected ? 0.45 : 1 }}>
                        <View style={{ width: '100%', aspectRatio: 0.74, borderRadius: 9, overflow: 'hidden', borderWidth: 2, borderColor }}>
                          <StickerArt s={sticker} owned={present} />
                        </View>
                        <View style={{ position: 'absolute', top: -6, right: -4, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 7,
                          backgroundColor: !present ? colors.faint : isNew ? colors.pitchDeep : colors.magenta, borderWidth: 1.5, borderColor: colors.bg }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>
                            {!present ? 'MISS' : isNew ? 'NEW' : 'DUP'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity onPress={apply} activeOpacity={0.85}
                  style={[ss.addBtn, { opacity: selected.size === 0 ? 0.5 : 1 }]} disabled={selected.size === 0}>
                  <Icon name="plus" size={19} strokeWidth={3} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16, fontFamily: fonts.ui }}>Add {selected.size} to album</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPhase('aim')} style={{ marginTop: 10, alignItems: 'center' }}>
                  <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 13 }}>Scan again</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const ss = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, paddingTop: 54 },
  camBtn: { width: 40, height: 40, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  shutterArea: { alignItems: 'center', paddingBottom: 46 },
  shutterOuter: { width: 76, height: 76, borderRadius: 99, borderWidth: 4, borderColor: 'rgba(255,255,255,0.9)', padding: 5 },
  shutterInner: { flex: 1, borderRadius: 99, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  errorBanner: { position: 'absolute', bottom: 120, left: 24, right: 24, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 14, padding: 12, ...shadows.md },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 30, maxHeight: '80%' },
  sheetPill: { width: 40, height: 5, borderRadius: 9, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 16 },
  doneCircle: { width: 64, height: 64, borderRadius: 99, backgroundColor: colors.pitch, alignItems: 'center', justifyContent: 'center' },
  addBtn: { marginTop: 18, height: 52, borderRadius: 15, backgroundColor: colors.pitchDeep, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...shadows.md },
  grantBtn: { height: 52, paddingHorizontal: 32, borderRadius: 15, backgroundColor: colors.pitchDeep, alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Commit**

```bash
git add src/app/scan.tsx
git commit -m "feat: add Scan screen with real camera and Claude Vision"
```

---

## Task 23 — EAS Hosting config + environment variables

**Files:**
- Modify: `eas.json`
- Create: `.env.production` (gitignored)

- [ ] **Update `eas.json`** to add a `hosting` target

```json
{
  "cli": { "version": ">= 16.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "hosting": {
    "default": {
      "entryPoint": "src/app"
    }
  }
}
```

- [ ] **Create `.env.production`** (gitignored)

```
ANTHROPIC_API_KEY=sk-ant-...
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

- [ ] **Add `.env.production` to `.gitignore`**

- [ ] **Deploy the API route to EAS Hosting**

```bash
eas hosting:deploy --environment production
```

After deployment, copy the hosting URL (e.g. `https://stickers.expo.app`) and update `extra.apiOrigin` in `app.json`.

- [ ] **Build and publish to Play Store**

```bash
eas build --platform android --profile production
eas submit --platform android
```

- [ ] **Final commit**

```bash
git add eas.json
git commit -m "feat: add EAS Hosting config for API route deployment"
```

---

## Self-review checklist (run before starting)

- [ ] All spec screens covered: Login ✓, Home ✓, Album ✓, Collection ✓, Stats ✓, Detail ✓, Profile ✓, Scan ✓
- [ ] API route hidden server-side ✓, no `EXPO_PUBLIC_` prefix on `ANTHROPIC_API_KEY` ✓
- [ ] Google Sign-In → Supabase `signInWithIdToken` ✓
- [ ] Optimistic updates + background Supabase sync ✓
- [ ] `recent` + `favoriteTeam` in AsyncStorage (not Supabase) ✓
- [ ] Image resized before Claude API call ✓
- [ ] Material 3 tab bar (Android) ✓
- [ ] All components use `react-native-svg` for SVG ✓
- [ ] All type names consistent throughout (`CollectionStats`, `TeamStat`, `GroupStat`, `ScanResult`) ✓
