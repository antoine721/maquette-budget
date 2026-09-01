import { useEffect, useRef, useState } from "react";
import { CONFIG } from "../config";
import { YEARS } from "../data/constants";
import type { Store } from "../state/store";

/** Un exercice se lit à sa position vis-à-vis de la campagne budgétée. */
function statusOf(year: number): { label: string; fg: string; bg: string } {
  if (year < CONFIG.campaignYear) return { label: "Clos", fg: "#6b7681", bg: "#f1f4f7" };
  if (year > CONFIG.campaignYear) return { label: "À venir", fg: "#92400e", bg: "#fef3c7" };
  return { label: "Campagne en cours", fg: "#0782b6", bg: "#e8f6fd" };
}

/**
 * Sélecteur d'exercice global. Toute l'application travaille sur une période :
 * l'accueil, le tableau et le pilotage suivent l'année choisie ici.
 *
 * C'est un menu dessiné à la main plutôt qu'un `<select>` natif : la liste porte
 * l'état de chaque exercice, ce qu'une liste système ne sait pas afficher.
 */
export default function YearPicker({ store }: { store: Store }) {
  const { state, set } = store;
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement | null>(null);
  const status = statusOf(state.year);

  // Fermeture au clic extérieur et à l'échappement — le menu ne survit pas au reste de l'écran.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const years = [...YEARS].reverse();

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Exercice affiché dans toute l'application"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          height: 40,
          padding: "0 12px",
          border: "1px solid " + (open ? "#bfe3f6" : "#e6eaee"),
          borderRadius: 10,
          background: open ? "#f6fbfe" : "#fff",
          boxShadow: open ? "0 0 0 3px rgba(10,155,216,0.12)" : "none",
          fontFamily: "inherit",
          cursor: "pointer",
          transition: "background 120ms, border-color 120ms, box-shadow 120ms",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0a9bd8"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>

        <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.1 }}>
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.7px",
              textTransform: "uppercase",
              color: "#6b7681",
            }}
          >
            Exercice
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#17202a",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.2px",
            }}
          >
            {state.year}
          </span>
        </span>

        <span
          style={{
            padding: "2px 7px",
            borderRadius: 20,
            fontSize: 10,
            fontWeight: 700,
            whiteSpace: "nowrap",
            background: status.bg,
            color: status.fg,
          }}
        >
          {status.label}
        </span>

        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b7681"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 140ms" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 40,
            minWidth: 246,
            padding: 6,
            background: "#fff",
            border: "1px solid #e6eaee",
            borderRadius: 12,
            boxShadow: "0 12px 32px rgba(15,23,42,0.14)",
          }}
        >
          <div
            style={{
              padding: "6px 10px 8px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.7px",
              textTransform: "uppercase",
              color: "#6b7681",
            }}
          >
            Choisir un exercice
          </div>

          {years.map((y) => {
            const on = y === state.year;
            const st = statusOf(y);
            return (
              <button
                key={y}
                role="option"
                aria-selected={on}
                className={on ? undefined : "hov-f8"}
                onClick={() => {
                  set({ year: y, openRow: null, hoverSeg: null });
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "9px 10px",
                  border: 0,
                  borderRadius: 9,
                  background: on ? "#e8f6fd" : "#fff",
                  fontFamily: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: on ? "#0782b6" : "#17202a",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {y}
                </span>
                <span style={{ fontSize: 12, color: "#6b7681" }}>{st.label}</span>
                <span style={{ flex: 1 }} />
                {on && (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0a9bd8"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
