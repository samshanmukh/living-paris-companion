import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Coffee, Landmark, MapPin, TreePine } from "lucide-react";
import { useCityStore } from "@/store/useCityStore";
import type { ParisFeature } from "@/lib/types";

const imageCache = new Map<string, string | null>();

function categoryIcon(layer: string) {
  if (/caf|coffee|food|restaurant/i.test(layer)) return Coffee;
  if (/museum|cultur|art/i.test(layer)) return Landmark;
  if (/park|tree|garden/i.test(layer)) return TreePine;
  return MapPin;
}

function PlaceChip({ feature }: { feature: ParisFeature }) {
  const select = useCityStore((s) => s.select);
  const selected = useCityStore((s) => s.selected);
  const hover = useCityStore((s) => s.hover);
  const isSelected = selected?.properties.id === feature.properties.id;
  const Icon = categoryIcon(feature.properties.layer);
  const name = feature.properties.name;
  const type = feature.properties.type ?? feature.properties.layer;
  const cacheKey = `${name}|${type}`;
  const [image, setImage] = useState<string | null>(imageCache.get(cacheKey) ?? null);

  useEffect(() => {
    if (imageCache.has(cacheKey)) return;
    let cancelled = false;
    const url = `/api/place-image?name=${encodeURIComponent(name)}&type=${encodeURIComponent(String(type))}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : { image: null }))
      .then((data: { image: string | null }) => {
        imageCache.set(cacheKey, data.image);
        if (!cancelled) setImage(data.image);
      })
      .catch(() => imageCache.set(cacheKey, null));
    return () => { cancelled = true; };
  }, [cacheKey, name, type]);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      onClick={() => void select(feature)}
      onMouseEnter={() => hover(feature.properties.id)}
      onMouseLeave={() => hover(null)}
      className="flex w-full items-center gap-3 text-left"
      style={{
        background: "var(--paper-2)",
        border: `1px solid ${isSelected ? "var(--accent-line)" : "var(--line)"}`,
        borderRadius: 14,
        padding: 8,
        boxShadow: "var(--shadow-soft)",
      }}
    >
      {image ? (
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="size-12 shrink-0 rounded-[10px] object-cover"
          style={{ background: "var(--accent-tint)" }}
        />
      ) : (
        <span
          className="grid size-12 shrink-0 place-items-center rounded-[10px]"
          style={{ background: "var(--accent-tint)", color: "var(--accent-text)" }}
        >
          <Icon size={18} strokeWidth={1.6} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span
          className="font-serif block truncate text-[16px] leading-tight"
          style={{ color: "var(--ink)" }}
        >
          {name}
        </span>
        <span
          className="block truncate text-[11px]"
          style={{ color: "var(--ink-3)", marginTop: 1 }}
        >
          {type}
          {feature.properties.arrondissement ? ` · ${feature.properties.arrondissement}` : ""}
        </span>
      </span>
    </motion.button>
  );
}

const bubbleIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
  transition: { type: "spring" as const, stiffness: 260, damping: 22 },
};

export function MessageBubble({
  role,
  text,
  places,
}: {
  role: "user" | "ai";
  text: string;
  places?: ParisFeature[];
}) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <motion.div
        {...bubbleIn}
        className="self-end"
        style={{
          maxWidth: "82%",
          background: "var(--paper-2)",
          color: "var(--ink)",
          border: "1px solid var(--line)",
          borderRadius: "16px 16px 4px 16px",
          padding: "9px 14px",
          fontSize: 14,
          lineHeight: 1.5,
          boxShadow: "var(--shadow-soft)",
        }}
      >
        {text}
      </motion.div>
    );
  }

  // Assistant — no background. Serif for the reply text.
  return (
    <motion.div
      {...bubbleIn}
      className="flex w-full flex-col gap-2.5 self-start"
    >
      <p
        className="font-serif"
        style={{
          color: "var(--ink)",
          fontSize: 17,
          lineHeight: 1.35,
          letterSpacing: "-0.005em",
        }}
      >
        {text}
      </p>
      {places && places.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {places.map((f, i) => (
            <PlaceChip key={f.properties.id ?? i} feature={f} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
