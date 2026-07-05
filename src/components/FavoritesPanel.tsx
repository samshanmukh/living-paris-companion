import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, X } from "lucide-react";
import { useCityStore } from "@/store/useCityStore";
import { usePrefsStore } from "@/store/usePrefsStore";

export function FavoritesPanel() {
  const open = usePrefsStore((s) => s.favoritesOpen);
  const favorites = usePrefsStore((s) => s.favorites);
  const setOpen = usePrefsStore((s) => s.setFavoritesOpen);
  const toggleFavorite = usePrefsStore((s) => s.toggleFavorite);
  const select = useCityStore((s) => s.select);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="fav-panel"
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className="glass pointer-events-auto absolute z-30 flex flex-col overflow-hidden"
          style={{
            top: 76,
            right: 24,
            width: 320,
            maxHeight: "min(520px, calc(100vh - 120px))",
            borderRadius: "var(--r-panel)",
            boxShadow: "var(--shadow-panel)",
          }}
        >
          <div className="flex items-center justify-between p-4 pb-3">
            <div>
              <p
                className="text-[10px] font-medium uppercase"
                style={{ letterSpacing: "0.14em", color: "var(--ink-3)" }}
              >
                Saved
              </p>
              <h2 className="font-display" style={{ fontSize: 22, color: "var(--ink)" }}>
                Your Paris
              </h2>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close favorites"
              className="grid size-7 place-items-center rounded-full transition-colors hover:bg-black/5"
              style={{ color: "var(--ink-2)" }}
            >
              <X size={15} />
            </button>
          </div>
          <div className="lp-rule mx-4" />

          {favorites.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <Bookmark size={22} style={{ color: "var(--accent)" }} />
              <p className="font-display" style={{ fontSize: 16, color: "var(--ink-2)" }}>
                Places you save will nest here.
              </p>
              <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
                Tap the bookmark on any place.
              </p>
            </div>
          ) : (
            <ul className="lp-scroll flex flex-col overflow-y-auto p-2">
              <AnimatePresence initial={false}>
                {favorites.map((f) => (
                  <motion.li
                    key={f.properties.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    layout
                    className="group flex items-center gap-2 rounded-2xl p-2 transition-colors hover:bg-white/40"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        void select(f);
                      }}
                      className="flex-1 text-left"
                    >
                      <p
                        className="font-display leading-tight"
                        style={{ fontSize: 16, color: "var(--ink)" }}
                      >
                        {f.properties.name}
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>
                        {f.properties.type ?? f.properties.layer}
                        {f.properties.arrondissement ? ` · ${f.properties.arrondissement}` : ""}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(f)}
                      aria-label="Remove"
                      className="grid size-7 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: "var(--ink-3)" }}
                    >
                      <X size={13} />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
