import { create } from "zustand";

type NavbarUiState = {
  scrolled: boolean;
  openSearch: boolean;
  openJoin: boolean;
  openDrawer: boolean;
  setScrolled: (scrolled: boolean) => void;
  setOpenSearch: (open: boolean) => void;
  setOpenJoin: (open: boolean) => void;
  setOpenDrawer: (open: boolean) => void;
};

export const useNavbarUiStore = create<NavbarUiState>((set) => ({
  scrolled: false,
  openSearch: false,
  openJoin: false,
  openDrawer: false,
  setScrolled: (scrolled) => set({ scrolled }),
  setOpenSearch: (openSearch) => set({ openSearch }),
  setOpenJoin: (openJoin) => set({ openJoin }),
  setOpenDrawer: (openDrawer) => set({ openDrawer }),
}));
