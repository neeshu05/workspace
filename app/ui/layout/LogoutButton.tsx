"use client";
import { AnimatePresence, motion } from "framer-motion";

export default function LogoutButton({ loggingOut, onLogout }: { loggingOut: boolean; onLogout: () => void }) {
  return (
    <button className="logout" onClick={onLogout} disabled={loggingOut}>
      <AnimatePresence mode="wait" initial={false}>
        {loggingOut ? (
          <motion.span className="logout-inner" key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <motion.span className="spinner" animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} />
            Signing out…
          </motion.span>
        ) : (
          <motion.span className="logout-inner" key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            ⇥ Sign out
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
