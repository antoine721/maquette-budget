import type { Chantier } from "../../data/chantiers";
import { CARD, CODE_BADGE, LIST_BUTTON, NAME, PILL } from "./cardStyles";

export interface ChantierListRow {
  ch: Chantier;
  tag: string;
  tagBg: string;
  tagFg: string;
  accent: string;
  hint: string;
  hintColor: string;
}

/**
 * Carte de liste de chantiers, partagée par « À traiter en priorité » (REX),
 * « Budgets à valider » et « Chantiers non traités » (contrôle de gestion).
 */
export default function ChantierListCard({
  title,
  dot,
  count,
  rows,
  empty,
  onOpen,
  onSeeAll,
  seeAllLabel,
}: {
  title: string;
  dot: string;
  count: string;
  rows: ChantierListRow[];
  empty: string;
  onOpen: (code: string) => void;
  onSeeAll?: () => void;
  seeAllLabel?: string;
}) {
  return (
    <div style={{ ...CARD, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot }} />
        <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
        <span style={{ marginLeft: "auto", fontSize: 12.5, color: "#8a95a1" }}>{count}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
        {rows.length === 0 && (
          <div
            style={{
              padding: "18px 12px",
              textAlign: "center",
              fontSize: 12.5,
              color: "#8a95a1",
              background: "#fbfcfd",
              borderRadius: 9,
            }}
          >
            {empty}
          </div>
        )}
        {rows.map((r) => (
          <button
            key={r.ch.id}
            className="hov-f8"
            onClick={() => onOpen(r.ch.id)}
            title={r.ch.id + " · " + r.ch.nom + " — " + r.hint}
            style={{ ...LIST_BUTTON, borderLeft: "3px solid " + r.accent }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span style={CODE_BADGE}>{r.ch.id}</span>
              <span style={NAME}>{r.ch.nom}</span>
              <span style={{ ...PILL, background: r.tagBg, color: r.tagFg }}>{r.tag}</span>
            </span>
            <span style={{ fontSize: 11.5, color: r.hintColor, lineHeight: 1.35 }}>{r.hint}</span>
          </button>
        ))}
      </div>

      {onSeeAll && rows.length > 0 && (
        <button
          className="hov-f4"
          onClick={onSeeAll}
          style={{
            marginTop: 10,
            alignSelf: "flex-start",
            padding: "7px 12px",
            border: "1px solid #dde3e8",
            borderRadius: 8,
            background: "#fff",
            fontFamily: "inherit",
            fontSize: 12.5,
            fontWeight: 600,
            color: "#3b4753",
            cursor: "pointer",
          }}
        >
          {seeAllLabel || "Voir tout dans le tableau"}
        </button>
      )}
    </div>
  );
}
