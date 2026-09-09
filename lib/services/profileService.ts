import { getJson, patchJson } from "./http";

export type ProfileActivity = { id: string; action: string; detail: string | null; createdAt: string };
export type Profile = {
  name: string | null;
  email: string;
  role: string | null;
  department: string | null;
  avatarInitials: string | null;
  avatarImage: string | null;
  bio: string | null;
  activity: ProfileActivity[];
};
export type ProfileUpdate = { name?: string; department?: string; bio?: string; avatarImage?: string | null };

export function getProfile() {
  return getJson<Profile>("/api/profile");
}

export function updateProfile(data: ProfileUpdate) {
  return patchJson<Profile>("/api/profile", data);
}
