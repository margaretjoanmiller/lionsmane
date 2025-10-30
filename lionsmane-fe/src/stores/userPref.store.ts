import { create } from 'zustand';

interface UserPrefs {
  hasReadeckKey: boolean | undefined;
  setToTrue: () => void;
  setToFalse: () => void;
}

export const usePrefStore = create<UserPrefs>((set) => ({
  hasReadeckKey: undefined,
  setToFalse: () => set(() => ({ hasReadeckKey: true })),
  setToTrue: () => set(() => ({ hasReadeckKey: true })),
}));
