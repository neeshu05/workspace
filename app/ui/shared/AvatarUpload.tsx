"use client";
import { ChangeEvent } from "react";
import { motion } from "framer-motion";

export default function AvatarUpload({
  avatarImage,
  initials,
  onFileChange,
  onRemove,
}: {
  avatarImage: string | null;
  initials: string;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="avatar-upload">
      <motion.div
        className="avatar-preview"
        key={avatarImage ?? "initials"}
        style={avatarImage ? { backgroundImage: `url(${avatarImage})` } : undefined}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {!avatarImage && initials}
      </motion.div>
      <label className="avatar-upload-btn">
        Change photo
        <input type="file" accept="image/*" onChange={onFileChange} hidden />
      </label>
      {avatarImage && (
        <button type="button" className="avatar-remove" onClick={onRemove}>
          Remove photo
        </button>
      )}
    </div>
  );
}
