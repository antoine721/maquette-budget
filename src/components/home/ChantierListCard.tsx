import type { Chantier } from "../../data/chantiers";
import { FS, INK, LINE, MONO, RADIUS, SURFACE } from "../../theme";
import { Button, Card, CardHead, Pill } from "../ui";

export interface ChantierListRow {
  ch: Chantier;
  tag: string;
  tagBg: string;
  tagFg: string;
  accent: string;
  /** Ce qui distingue cette ligne des autres — jamais la paraphrase du tag. */
  hint: string;
  hintColor: string;
}

/**
 * Carte de liste de chantiers, partagée par « À traiter en priorité » (REX),
 * « Budgets à valider » et « Chantiers non traités » (contrôle de gestion).
 *
 * Chaque ligne dit trois choses : quel chantier, ce qu'il attend, et ce qui le
 * distingue des autres — son poids en CA, ses mois manquants. Répéter le tag en
 * dessous du tag ne remplissait que de la place.
 */
export default function ChantierListCard({
  title,
  count,
  rows,
  empty,
  onOpen,
  onSeeAll,
  seeAllLabel,
}: {
  title: string;
  count: string;
  rows: ChantierListRow[];
  empty: string;
  onOpen: (code: string) => void;
  onSeeAll?: () => void;
  seeAllLabel?: string;
}) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <CardHead
        title={title}
        right={<span style={{ fontSize: FS.small, color: INK.muted }}>{count}</span>}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {rows.length === 0 && (
          <div
            style={{
              padding: "20px 12px",
              textAlign: "center",
              fontSize: FS.small,
              color: INK.muted,
              background: SURFACE.sunken,
              borderRadius: RADIUS.control,
            }}
          >
            {empty}
          </div>
        )}
        {rows.map((r) => (
          <button
            key={r.ch.id}
            className="hov-soft"
            onClick={() => onOpen(r.ch.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "8px 10px 8px 9px",
              border: "1px solid " + LINE.soft,
              borderLeft: "3px solid " + r.accent,
              borderRadius: RADIUS.control,
              background: SURFACE.card,
              fontFamily: "inherit",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: FS.body,
                    fontWeight: 600,
                    color: INK.strong,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.ch.nom}
                </span>
                <span
                  style={{
                    flex: "0 0 auto",
                    fontFamily: MONO,
                    fontSize: FS.micro,
                    color: INK.muted,
                  }}
                >
                  {r.ch.id}
                </span>
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: FS.small,
                  color: r.hintColor,
                  marginTop: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.hint}
              </span>
            </span>
            <Pill fg={r.tagFg} bg={r.tagBg}>
              {r.tag}
            </Pill>
          </button>
        ))}
      </div>

      {onSeeAll && rows.length > 0 && (
        <Button size="sm" onClick={onSeeAll} style={{ marginTop: 10, alignSelf: "flex-start" }}>
          {seeAllLabel || "Voir tout dans le tableau"}
        </Button>
      )}
    </Card>
  );
}
