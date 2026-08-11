import { create } from "zustand";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import type { Session, User } from "@/services/platform/auth.service";
import { authApi } from "@/services/platform/auth.service";
import { profilesApi } from "@/services/platform/profiles.service";
import { watchHistoryApi } from "@/services/platform/watchHistory.service";
import { favoritesApi } from "@/services/platform/favorites.service";
import { watchlistApi } from "@/services/platform/watchlist.service";
import type { Profile } from "@/types/database";
import { goToAuth } from "@/lib/auth/authNavigation";
import { STORAGE_KEYS } from "@/constants/storage";

export type { Profile };

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  requestAuth: (tab?: "login" | "register") => void;
  fetchProfile: (userId: string) => Promise<void>;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  clearAuth: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

let initPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  initialize: async () => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      set({ isLoading: true });

      const session = await authApi.getSession();

      set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        isLoading: false,
      });

      if (session?.user) {
        void get().fetchProfile(session.user.id);

        void watchHistoryApi.migrateLocalToServer();

        void favoritesApi.migrateLocalToServer().then(async () => {
          const { clearFavoritesCache } = await import("@/hooks/useFavorites");

          clearFavoritesCache();
        });

        void watchlistApi.migrateLocalToServer();
      }

      authApi.onAuthStateChange(async (event, newSession) => {
        set({
          session: newSession,
          user: newSession?.user ?? null,
          isAuthenticated: !!newSession,
          isLoading: false,
        });

        if (newSession?.user) {
          void get().fetchProfile(newSession.user.id);

          if (event === "SIGNED_IN") {
            void watchHistoryApi.migrateLocalToServer();

            void favoritesApi.migrateLocalToServer().then(async () => {
              const { clearFavoritesCache } = await import("@/hooks/useFavorites");

              clearFavoritesCache();
            });

            void watchlistApi.migrateLocalToServer();
          }
        } else {
          set({ profile: null });
        }
      });
    })().catch((error) => {
      console.error("[auth] initialize failed", error);

      set({ isLoading: false });

      initPromise = null;
    });

    return initPromise;
  },
  requestAuth: (tab = "login") => {
    const redirect =
      typeof window !== "undefined" && window.location.pathname !== "/login"
        ? window.location.pathname + window.location.search
        : undefined;

    goToAuth(tab, redirect);
  },
  fetchProfile: async (userId) => {
    try {
      const profile = await profilesApi.fetchById(userId);

      if (!profile) return;

      set({ profile });

      const session = get().session;

      if (!session) return;

      set({
        session: {
          ...session,
          user: {
            ...session.user,
            user_metadata: {
              ...session.user.user_metadata,
              full_name: profile.username ?? session.user.user_metadata?.full_name,
              username: profile.username ?? session.user.user_metadata?.username,
              avatar_url: profile.avatar_url ?? session.user.user_metadata?.avatar_url,
              picture: profile.avatar_url ?? session.user.user_metadata?.picture,
            },
          },
        },
      });
    } catch (error) {
      console.error("[auth] fetchProfile failed", error);
    }
  },
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isLoading: false,
    }),
  setProfile: (profile) => set({ profile }),
  clearAuth: () => set({ session: null, user: null, profile: null, isAuthenticated: false }),
  signInWithEmail: async (email, password) => {
    const { data, error } = await authApi.signInWithPassword(email, password);

    if (error) throw new Error(error.message);

    if (data.user) await get().fetchProfile(data.user.id);

    toast.success(t("toast.welcomeBack"));
  },
  signUpWithEmail: async (email, password, username) => {
    const { error } = await authApi.signUp(email, password, username);

    if (error) throw new Error(error.message);
  },
  signInWithGoogle: async () => {
    const { error } = await authApi.signInWithGoogle();

    if (error) throw new Error(error.message);
  },
  signOut: async () => {
    await authApi.signOut();

    set({ user: null, profile: null, session: null, isAuthenticated: false });

    toast.success(t("toast.loggedOut"));

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEYS.reactQueryCache);

      window.location.href = "/login";
    }
  },
  updateProfile: async (data) => {
    const user = get().user;

    if (!user) return;

    const { error } = await profilesApi.update(data);

    if (error) throw new Error(error.message);

    await get().fetchProfile(user.id);
  },
}));
