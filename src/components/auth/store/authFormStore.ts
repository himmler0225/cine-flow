import { create } from "zustand";
import { t } from "@/lib/i18n";
import { useAuthStore } from "@/store/authStore";
import { validateLogin, validateRegister } from "@/components/auth/validation";

export type AuthTab = "login" | "register";

type LoginForm = {
  email: string;
  password: string;
  showPassword: boolean;
  remember: boolean;
};

type RegisterForm = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  agree: boolean;
};

type AuthFormState = {
  tab: AuthTab;
  loading: boolean;
  apiError: string;
  signupSuccess: string | null;
  fieldErrors: Record<string, string>;
  login: LoginForm;
  register: RegisterForm;
  syncTab: (tab: AuthTab) => void;
  setTab: (tab: AuthTab) => void;
  resetTransient: () => void;
  patchLogin: (patch: Partial<LoginForm>) => void;
  patchRegister: (patch: Partial<RegisterForm>) => void;
  submitLogin: () => Promise<void>;
  submitRegister: () => Promise<void>;
  submitGoogle: () => Promise<void>;
  backToLoginAfterSignup: () => void;
};

const emptyLogin = (): LoginForm => ({
  email: "",
  password: "",
  showPassword: false,
  remember: true,
});

const emptyRegister = (): RegisterForm => ({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  showPassword: false,
  agree: false,
});

export const useAuthFormStore = create<AuthFormState>((set, get) => ({
  tab: "login",
  loading: false,
  apiError: "",
  signupSuccess: null,
  fieldErrors: {},
  login: emptyLogin(),
  register: emptyRegister(),
  syncTab: (tab) => set({ tab }),
  setTab: (tab) => set({ tab, apiError: "", fieldErrors: {} }),
  resetTransient: () =>
    set({
      apiError: "",
      signupSuccess: null,
      fieldErrors: {},
      loading: false,
    }),
  patchLogin: (patch) => set((state) => ({ login: { ...state.login, ...patch } })),
  patchRegister: (patch) => set((state) => ({ register: { ...state.register, ...patch } })),
  submitLogin: async () => {
    const { login } = get();

    const fieldErrors = validateLogin(login, t);

    set({ apiError: "", fieldErrors });

    if (Object.keys(fieldErrors).length) return;

    set({ loading: true });

    try {
      await useAuthStore.getState().signInWithEmail(login.email, login.password);
    } catch (error) {
      set({
        apiError: error instanceof Error ? error.message : t("auth.errors.loginFailed"),
      });
    } finally {
      set({ loading: false });
    }
  },
  submitRegister: async () => {
    const { register } = get();

    const fieldErrors = validateRegister(register, t);

    set({ apiError: "", fieldErrors });

    if (Object.keys(fieldErrors).length) return;

    set({ loading: true });

    try {
      await useAuthStore
        .getState()
        .signUpWithEmail(register.email, register.password, register.username.trim());

      set({ signupSuccess: register.email });
    } catch (error) {
      set({
        apiError: error instanceof Error ? error.message : t("auth.errors.registerFailed"),
      });
    } finally {
      set({ loading: false });
    }
  },
  submitGoogle: async () => {
    set({ apiError: "", loading: true });

    try {
      await useAuthStore.getState().signInWithGoogle();
    } catch (error) {
      set({
        apiError: error instanceof Error ? error.message : t("auth.errors.googleFailed"),
        loading: false,
      });
    }
  },
  backToLoginAfterSignup: () => set({ signupSuccess: null, tab: "login" }),
}));
