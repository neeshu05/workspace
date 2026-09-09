"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Alert } from "../../../lib/services/alertsService";

export default function AlertModal({ selected, onClose, onCloseAlert }: { selected: Alert | null; onClose: () => void; onCloseAlert: (id: string) => void }) {
  return (
    <AnimatePresence>
      {selected && (
        <motion.div className="modal-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <motion.article
            className="modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <p className="eyebrow">
              {selected.id} · {selected.level}
            </p>
            <h2>{selected.title}</h2>
            <p>{selected.location}. This derived alert is refreshed from the warehouse monitoring API.</p>
            <button onClick={() => onCloseAlert(selected.id)}>Close alert</button>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
