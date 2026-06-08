import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { StoreProvider, useStore } from '../../src/store/index';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signOut: jest.fn().mockResolvedValue({}),
    },
  },
}));

jest.mock('../../src/store/sync', () => ({
  fetchCollection: jest.fn().mockResolvedValue({ 1: 2, 5: 1 }),
  syncSticker: jest.fn().mockResolvedValue(undefined),
  syncBatch: jest.fn().mockResolvedValue(undefined),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <StoreProvider>{children}</StoreProvider>
);

describe('useStore actions', () => {
  it('add increments count and adds to recent', async () => {
    const { result } = await renderHook(() => useStore(), { wrapper });
    await act(async () => { result.current.actions.add(10); });
    expect(result.current.actions.countOf(10)).toBe(1);
    expect(result.current.recent).toContain(10);
  });

  it('remove decrements count', async () => {
    const { result } = await renderHook(() => useStore(), { wrapper });
    await act(async () => { result.current.actions.add(10); });
    await act(async () => { result.current.actions.add(10); });
    await act(async () => { result.current.actions.remove(10); });
    expect(result.current.actions.countOf(10)).toBe(1);
  });

  it('toggle adds then removes', async () => {
    const { result } = await renderHook(() => useStore(), { wrapper });
    await act(async () => { result.current.actions.toggle(20); });
    expect(result.current.actions.isOwned(20)).toBe(true);
    await act(async () => { result.current.actions.toggle(20); });
    expect(result.current.actions.isOwned(20)).toBe(false);
  });

  it('applyScan returns added and dupes', async () => {
    const { result } = await renderHook(() => useStore(), { wrapper });
    await act(async () => { result.current.actions.add(1); });
    let scanResult: { added: number[]; dupes: number[] } | undefined;
    await act(async () => {
      scanResult = result.current.actions.applyScan([1, 2, 3]);
    });
    expect(scanResult!.added).toContain(2);
    expect(scanResult!.added).toContain(3);
    expect(scanResult!.dupes).toContain(1);
  });
});
