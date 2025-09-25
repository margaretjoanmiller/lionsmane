import { create } from 'zustand';

interface UserPrefs {
  hasReadeckKey: boolean | undefined;
  setToTrue: () => void;
  setToFalse: () => void;
}

export const usePrefStore = create<UserPrefs>((set) => ({
  hasReadeckKey: undefined,
  setToTrue: () => set(() => ({ hasReadeckKey: true })),
  setToFalse: () => set(() => ({ hasReadeckKey: true })),
}));
