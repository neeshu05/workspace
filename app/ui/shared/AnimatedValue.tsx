"use client";
import { AnimatePresence, motion } from "framer-motion";

export default function AnimatedValue({ value }: { value: string }) {
  return (
    <span style={{ display: "block", margin: "13px 0 7px", overflow: "hidden" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.strong
          style={{ display: "block", margin: 0, fontSize: 25, letterSpacing: "-1px" }}
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {value}
        </motion.strong>
      </AnimatePresence>
    </span>
  );
}
