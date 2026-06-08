import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { fetchCollection, syncSticker, syncBatch } from './sync';
import { getStickerData } from '../data/stickers';
import type { CollectionStats, GroupStat, Owned, TeamStat } from '../types';

const LS_RECENT = 'wc26_recent_v1';
const LS_FAV = 'wc26_fav_v1';

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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const WC = getStickerData();
  const [owned, setOwned] = useState<Owned>({});
  const [recent, setRecent] = useState<number[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [favoriteTeam, setFavoriteTeamState] = useState<string | null>(null);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  useEffect(() => { saveRecent(recent); }, [recent]);

  useEffect(() => {
    loadRecent().then(setRecent);
    loadFav().then(setFavoriteTeamState);
  }, []);

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

  const pushRecent = useCallback((nums: number[]) => {
    setRecent(prev => {
      const set = new Set(nums);
      const filtered = prev.filter(n => !set.has(n));
      return [...nums, ...filtered].slice(0, 30);
    });
  }, []);

  const syncOne = useCallback((n: number, count: number) => {
    const uid = userRef.current?.id;
    if (!uid) return;
    syncSticker(uid, n, count).catch(e => console.warn('sync error', e));
  }, []);

  // We need a ref to owned for applyScan to read current value without stale closure
  const ownedRef = useRef<Owned>(owned);
  ownedRef.current = owned;

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
      // Read current owned via ref to avoid stale closure
      const currentOwned = ownedRef.current;
      setOwned(o => {
        const next = { ...o };
        nums.forEach(n => {
          if (next[n]) { next[n] += 1; result.dupes.push(n); }
          else { next[n] = 1; result.added.push(n); }
          updates.push({ n, count: next[n] });
        });
        return next;
      });
      pushRecent(nums.filter(n => !currentOwned[n]));
      const uid = userRef.current?.id;
      if (uid) syncBatch(uid, updates).catch(e => console.warn('scan sync error', e));
      return result;
    },
  }), [owned, pushRecent, syncOne]);

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

  const auth = useMemo<AuthActions>(() => ({
    signIn: async () => {
      // Handled in LoginScreen via GoogleSignin + supabase.auth.signInWithIdToken
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
