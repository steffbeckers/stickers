# Stickerbook '26 — Design Spec

_2026-06-07_

## Overview

A World Cup 2026 Panini sticker collection app for Android (Play Store). Users track which of ~900 stickers they've collected across 48 nations, scan physical album pages with the device camera to detect new stickers, and sync their collection to the cloud.

Source design: `Stickerbook (Android).html` from the Claude Design handoff bundle (`panini-stickers-wk-2026`).

---

## Architecture

**Option A: Expo Router tabs/modals + React Context + Supabase**

```
Native app (Expo Router)
  ↕ useStore() / StoreContext
React Context — optimistic local state
  ↕ sync service
Supabase — auth (Google Sign-In) + collection table
  ↕ (scan only)
EAS Hosting API route → Claude Vision API
```

### Navigation (Expo Router)

```
src/app/
  _layout.tsx              ← root layout: auth guard, StoreProvider, fonts
  (auth)/
    login.tsx              ← Google Sign-In screen
  (tabs)/
    _layout.tsx            ← Material 3 bottom tab bar (Home, Album, Stats)
    index.tsx              ← Home screen
    album.tsx              ← Album browse screen
    stats.tsx              ← Stats screen
  scan.tsx                 ← full-screen camera modal
  team/[id].tsx            ← team collection detail
  special/[id].tsx         ← Legends / Host Cities detail
  sticker/[n].tsx          ← sticker detail (bottom-sheet modal)
  profile.tsx              ← profile + settings
  api/
    scan+api.ts            ← server-side: Claude Vision proxy (EAS Hosting)
```

The root layout subscribes to `supabase.auth.onAuthStateChange`. When the session is `null`, it calls `router.replace('/(auth)/login')`; when a session exists, it calls `router.replace('/(tabs)')`. This keeps auth state reactive — sign-out from ProfileScreen automatically redirects back to login without any manual navigation call.

---

## Data Model

All sticker data (teams, groups, player names) is client-side only — seeded deterministically from `src/data/stickers.ts` (TypeScript port of the design's `data.js`). Nothing about the sticker catalogue is stored in Supabase.

**48 nations** across **12 groups (A–L)**. Each team has 18 stickers: 1 badge, 1 squad photo, 16 players (2 GK, 6 DF, 5 MF, 3 FW). Two special sections: **Legends** (12 stickers) and **Host Cities** (16 stickers). Total: ~900 stickers.

### TypeScript types (`src/types/stickers.ts`)

```ts
type StickerType = 'player' | 'badge' | 'photo' | 'legend' | 'stadium';

interface Sticker {
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
}

interface Team {
  id: string;       // country code e.g. 'BEL'
  name: string;
  code: string;
  group: string;
  colors: string[];
  region: string;
  stickers: Sticker[];
}

type Owned = Record<number, number>;  // sticker number → count owned

interface CollectionStats {
  total: number;
  distinct: number;
  missing: number;
  dupeTotal: number;
  percent: number;
  swaps: { s: Sticker; count: number }[];
}

interface TeamStat {
  own: number;
  total: number;
  missing: number;
  percent: number;
  complete: boolean;
}

interface GroupStat {
  own: number;
  total: number;
  percent: number;
  completeTeams: number;
}
```

---

## Supabase Schema

### Auth

Google Sign-In via `@react-native-google-signin/google-signin`. The Google ID token is exchanged with Supabase Auth (`supabase.auth.signInWithIdToken`). Supabase manages the session; no custom users table needed.

### Tables

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
create policy "own rows" on collection
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### Sync strategy

- **On login**: fetch all `collection` rows for the user → populate `owned` in StoreContext.
- **On add / remove / toggle / applyScan**: update local state immediately (optimistic), then upsert/delete in Supabase asynchronously.
- **Conflict resolution**: last-write-wins via `updated_at`. Acceptable for sticker collecting.

### Non-synced local state (AsyncStorage)

`recent` (last-added sticker numbers) and `favoriteTeam` (user preference) are UX state — persisted to AsyncStorage on the device only, not synced to Supabase. They reset if the user clears app data, which is acceptable.

---

## State Management

`StoreContext` (React Context + `useState`) holds:

```ts
interface StoreValue {
  owned: Owned;
  recent: number[];        // last-added sticker numbers, max 30
  user: SupabaseUser | null;
  actions: {
    isOwned: (n: number) => boolean;
    countOf: (n: number) => number;
    toggle: (n: number) => void;
    add: (n: number) => void;
    remove: (n: number) => void;
    applyScan: (nums: number[]) => { added: number[]; dupes: number[] };
  };
  stats: CollectionStats;
  teamStat: (id: string) => TeamStat;
  groupStat: (letter: string) => GroupStat;
  auth: {
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    setFavoriteTeam: (id: string) => void;
  };
}
```

---

## Design Tokens (`src/constants/theme.ts`)

Colors:
- `pitch`: `#16b364` (primary green)
- `pitchDeep`: `#0e8a49`
- `pitchDark`: `#06301c`
- `ink`: `#0f1712`
- `inkSoft`: `#3a4a40`
- `muted`: `#7a8c82`
- `faint`: `#b0bdb6`
- `bg`: `#f8f9f6`
- `surface`: `#ffffff`
- `lineSoft`: `rgba(15,23,30,0.08)`
- `blue`: `#1b5fb0`
- `magenta`: `#c4297a`
- `gold`: `#caa24a`
- `amber`: `#e07c1a`

Fonts: **Anton** (display headings), **Roboto** (UI body) — loaded via `expo-font`.

Shadows: `shadowSm` and `shadowMd` via platform-specific `elevation` (Android) / `shadow*` (iOS).

---

## Shared Components (`src/components/`)

| Component | Description |
|-----------|-------------|
| `Icon` | SVG icon set via `react-native-svg` (30 icons matching the design) |
| `Crest` | Flag-colored team badge patch (no real logos) |
| `StickerArt` | Fills its container — renders player / badge / photo / legend / stadium variants |
| `StickerTile` | Grid tile: sticker art + number label + owned checkmark + dupe count badge |
| `ProgressRing` | SVG circular progress ring with children |
| `Bar` | Linear progress bar |
| `FlagChip` | Small flag stripe chip |
| `PortraitGhost` | Neutral silhouette SVG placeholder for player stickers |
| `FavTeamPicker` | Bottom sheet: searchable list of all 48 teams to set favorite |

---

## Screens

### LoginScreen
Dark green radial gradient bg, fanned sticker pack hero, bottom card with "Sign in with Google Play" button. Real Google Sign-In flow: button tap → Google auth → Supabase session → root layout redirects to tabs.

### HomeScreen (tab: Home)
- Header: "Stickerbook '26" wordmark + profile avatar
- Hero progress card (green gradient, progress ring, distinct/total, "Scan a page" button)
- Quick stat pills: Collected / Missing / Swaps
- "Almost complete" horizontal scroll (teams sorted by missing count ascending)
- "Group stage" horizontal scroll (group cards A–L with flag chips and ring)
- "Recently added" horizontal scroll (last 12 stickers)

### AlbumScreen (tab: Album)
- Header + "Scan" button
- Search input
- Group letter filter chips (All, A–L)
- Group accordion rows (group header with progress bar → team rows with crest + bar + missing count)
- Special Pages section (Legends card, Host Cities card) — shown when `letter === 'All'` and no search query

### CollectionScreen (modal: `/team/[id]` or `/special/[id]`)
- Sticky back bar + scan button
- Flag gradient banner: crest, team name, group, own/total count, progress bar
- Filter chips: All / Missing / Got + swap count
- 3-column sticker grid with `StickerTile`

### ScanScreen (modal: `/scan`)
Full-screen camera view (dark bg):
1. **Aim phase**: `expo-camera` live preview with white corner-bracket overlay, flash toggle, instruction label, circular shutter button
2. **Capture**: photo taken → `expo-image-manipulator` resizes to max 1024px wide, JPEG 0.7
3. **Processing phase**: spinner overlay, POST to `/api/scan` (base64 image)
4. **Results sheet**: bottom sheet slides up showing detected stickers as tiles — colour-coded **New** (green border), **Dupe** (magenta border), **Empty** (greyed out). User can tap tiles to toggle them.
5. **Confirm**: "Add X to album" → `applyScan()` → Supabase sync → success state → auto-close

### API Route: `app/api/scan+api.ts`
- Accepts: `POST` with `{ image: string }` (base64 JPEG)
- Calls: `@anthropic-ai/sdk` with `claude-sonnet-4-6`, passes image + prompt asking Claude to identify: team name/group, each visible sticker number, and whether the slot is filled (sticker present) or empty
- Returns: `{ team: string, stickers: { n: number, present: boolean }[] }`
- Env: `ANTHROPIC_API_KEY` (server-side, never in app bundle)

### DetailScreen (modal: `/sticker/[n]`)
Bottom sheet over dim overlay:
- Sticker number + "X of total" label
- Hero sticker art (178px wide) with prev/next arrows
- Type label + sticker name (display font)
- Team row button (navigates to team collection)
- If not owned: "Mark as collected" primary button
- If owned: green status card (in collection, spare count) + +/- stepper + "Offer X for swap" button (if count > 1)

### StatsScreen (tab: Stats)
- Dark hero card: progress ring + distinct/total/missing
- Stat boxes: Collected / Missing / Spares
- "Completion by group" list with group letter + bar + percent (tappable → album filter)
- "Your swaps" horizontal scroll (stickers with count > 1)

### ProfileScreen (modal: `/profile`)
- Avatar (placeholder SVG), display name, "Signed in with Google Play" badge
- Favorite team section: flag banner + collection progress (tappable) + "Change" button → `FavTeamPicker` bottom sheet
- Settings rows: Account & security, Notifications, Swap preferences, Invite friends, Rate Stickerbook, What's new
- Sign out button (calls `supabase.auth.signOut()`)

---

## New Dependencies Required

```
@react-native-google-signin/google-signin
@supabase/supabase-js
react-native-svg              ← for Icon, ProgressRing, PortraitGhost
expo-camera
expo-image-manipulator
@anthropic-ai/sdk             ← server-side only (API route)
```

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | client | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | client | Supabase anon key |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | client | Google OAuth web client ID |
| `ANTHROPIC_API_KEY` | server (EAS Hosting) | Claude API key — never in app bundle |

---

## Out of Scope

- Real player photos (placeholder silhouettes used throughout)
- Swap matching / trading with other users
- Push notifications for swaps
- Offline mode / conflict resolution beyond last-write-wins
