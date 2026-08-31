import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PermissionDto, UserTypeEnum } from "@repo/contracts";

export interface AuthUser {
  id?: number;
  sub?: number;
  username: string;
  userType?: UserTypeEnum | string;
  type?: UserTypeEnum | string;
  branchId?: number | null;
  roles?: string[];
  permissions?: PermissionDto[];
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
      setToken: (token) => set({ token, isAuthenticated: Boolean(token) }),
      setTokens: ({ accessToken, refreshToken }) =>
        set({ token: accessToken, refreshToken, isAuthenticated: Boolean(accessToken) }),
      logout: () => set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
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
export const useAuthToken = () => useAuthStore((state) => state.token);
