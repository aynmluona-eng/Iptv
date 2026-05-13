import { create } from 'zustand';

interface AppState {
  favorites: string[];
  toggleFavorite: (teamId: string) => void;
  matches: any[];
  setMatches: (matches: any[]) => void;
  liveMatches: any[];
  setLiveMatches: (matches: any[]) => void;
}

export const useStore = create<AppState>((set) => ({
  favorites: [],
  toggleFavorite: (teamId) => set((state) => ({
    favorites: state.favorites.includes(teamId)
      ? state.favorites.filter(id => id !== teamId)
      : [...state.favorites, teamId]
  })),
  matches: [],
  setMatches: (matches) => set({ matches }),
  liveMatches: [],
  setLiveMatches: (liveMatches) => set({ liveMatches }),
}));
