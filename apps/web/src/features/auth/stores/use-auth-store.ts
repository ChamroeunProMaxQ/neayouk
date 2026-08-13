import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserDto } from "@repo/contracts";

export interface AuthState {
  user: UserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: UserDto | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Atomic selectors to avoid unnecessary re-renders.
 */
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
