import { motion } from "framer-motion";
import { Bookmark, Contrast, User, Wind } from "lucide-react";
import { usePrefsStore } from "@/store/usePrefsStore";

function IconButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center rounded-full"
      style={{
        background: active ? "var(--accent)" : "var(--glass-strong)",
        color: active ? "var(--paper-2)" : "var(--ink)",
        border: "1px solid var(--line)",
        boxShadow: active
          ? "0 8px 20px -6px rgba(196,85,59,0.45)"
          : "0 4px 14px rgba(43,31,22,0.08)",
        backdropFilter: "var(--blur)",
        transition: "background 0.2s ease, color 0.2s ease",
      }}
    >
      {children}
    </motion.button>
  );
}

export function SettingsMenu() {
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);
  const highContrast = usePrefsStore((s) => s.highContrast);
  const favCount = usePrefsStore((s) => s.favorites.length);
  const toggleRM = usePrefsStore((s) => s.toggleReducedMotion);
  const toggleHC = usePrefsStore((s) => s.toggleHighContrast);
  const setOpen = usePrefsStore((s) => s.setFavoritesOpen);
  const favOpen = usePrefsStore((s) => s.favoritesOpen);

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 22 }}
      className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
    >
      {/* Spacer — brand lives in the chat panel */}
      <div aria-hidden />


      {/* Actions */}
      <div className="pointer-events-auto flex items-center gap-2">
        <IconButton active={reducedMotion} onClick={toggleRM} label="Calmer animations">
          <Wind size={17} />
        </IconButton>
        <IconButton active={highContrast} onClick={toggleHC} label="Higher contrast">
          <Contrast size={17} />
        </IconButton>
        <motion.button
          type="button"
          onClick={() => setOpen(!favOpen)}
          whileTap={{ scale: 0.94 }}
          aria-label="Saved places"
          className="relative inline-flex items-center gap-1.5 rounded-full pl-3 pr-3.5"
          style={{
            height: 40,
            background: favOpen ? "var(--accent)" : "var(--glass-strong)",
            color: favOpen ? "var(--paper-2)" : "var(--ink)",
            border: "1px solid var(--line)",
            boxShadow: favOpen
              ? "0 8px 20px -6px rgba(196,85,59,0.45)"
              : "0 4px 14px rgba(43,31,22,0.08)",
            backdropFilter: "var(--blur)",
          }}
        >
          <Bookmark size={16} />
          <span className="font-display text-[13px]" style={{ fontWeight: 700 }}>{favCount}</span>
        </motion.button>
        {/* Profile */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          aria-label="Profile"
          className="font-display grid size-10 place-items-center overflow-hidden rounded-full text-[13px]"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--amber))",
            color: "var(--paper-2)",
            border: "1px solid var(--line)",
            boxShadow: "0 4px 14px rgba(43,31,22,0.12)",
            fontWeight: 800,
          }}
        >
          <User size={17} />
        </motion.button>
      </div>
    </motion.header>
  );
}
