import { create } from "zustand";
import * as profileService from "../services/profileService";
import { UnauthorizedError, redirectToLogin } from "../services/http";

type ProfileState = {
  profile: profileService.Profile | null;
  error: string | null;
  load: () => Promise<void>;
  save: (update: profileService.ProfileUpdate) => Promise<boolean>;
};

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  error: null,

  load: async () => {
    try {
      const profile = await profileService.getProfile();
      set({ profile, error: null });
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      set({ error: e instanceof Error ? e.message : "Failed to load profile" });
    }
  },

  save: async (update) => {
    try {
      const profile = await profileService.updateProfile(update);
      set({ profile, error: null });
      return true;
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        redirectToLogin();
        return false;
      }
      set({ error: e instanceof Error ? e.message : "Failed to save profile" });
      return false;
    }
  },
}));
