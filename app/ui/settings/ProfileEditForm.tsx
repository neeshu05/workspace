"use client";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useProfileStore } from "../../../lib/stores/useProfileStore";

type FormState = { name: string; department: string; bio: string; avatarImage: string | null };
const EMPTY_FORM: FormState = { name: "", department: "", bio: "", avatarImage: null };

export default function ProfileEditForm() {
  const profile = useProfileStore((s) => s.profile);
  const profileError = useProfileStore((s) => s.error);
  const save = useProfileStore((s) => s.save);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        department: profile.department ?? "",
        bio: profile.bio ?? "",
        avatarImage: profile.avatarImage ?? null,
      });
    }
  }, [profile]);

  const onAvatarFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file");
      return;
    }
    if (file.size > 1_000_000) {
      setAvatarError("Image must be under 1MB");
      return;
    }
    setAvatarError("");
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, avatarImage: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const ok = await save(form);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <article className="panel profile-edit-card">
      <div className="profile-edit-head">
        <div className="avatar-upload">
          <motion.div
            className="avatar-preview"
            key={form.avatarImage ?? "initials"}
            style={form.avatarImage ? { backgroundImage: `url(${form.avatarImage})` } : undefined}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {!form.avatarImage && (profile?.avatarInitials ?? "—")}
          </motion.div>
          <label className="avatar-upload-btn">
            Change photo
            <input type="file" accept="image/*" onChange={onAvatarFile} hidden />
          </label>
          {form.avatarImage && (
            <button type="button" className="avatar-remove" onClick={() => setForm((f) => ({ ...f, avatarImage: null }))}>
              Remove photo
            </button>
          )}
        </div>
        <div className="profile-edit-head-text">
          <h3>Profile details</h3>
          <p>Update your photo, name, department and bio.</p>
          <AnimatePresence>
            {avatarError && (
              <motion.p className="avatar-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {avatarError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      <form onSubmit={onSubmit} className="profile-edit-form">
        <div className="profile-edit-row">
          <label>
            Full name
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Your name" autoComplete="name" />
          </label>
          <label>
            Department
            <input
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              placeholder="e.g. Apex Fulfillment Center"
              autoComplete="off"
            />
          </label>
        </div>
        <label>
          Bio
          <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="A short note about your role" rows={3} />
        </label>
        <div className="profile-form-actions">
          <motion.button type="submit" disabled={saving} whileHover={{ scale: saving ? 1 : 1.03 }} whileTap={{ scale: saving ? 1 : 0.97 }}>
            {saving ? "Saving…" : "Save changes"}
          </motion.button>
          <AnimatePresence>
            {saved && (
              <motion.span className="save-confirm" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                ✓ Saved
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {profileError && <p className="inline-error">{profileError}</p>}
      </form>
    </article>
  );
}
