import { CONFIG } from "../../config";
import type { Store } from "../../state/store";

/**
 * Tête de l'accueil : la campagne en cours, et rien d'autre.
 *
 * L'accueil est l'écran de la campagne ; pour consulter un exercice passé on
 * ouvre le tableau prévisionnel, ou on change l'exercice d'un graphique.
 */
export default function CampaignBanner({ store }: { store: Store }) {
  const { engine, set } = store;
  const year = CONFIG.campaignYear;
  const view = engine.atYear(year);
  const pct = view.campaignPct();
  const g = view.budgetGroups();
  const reste = g.remplir.length + g.attente.length;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
        padding: "14px 16px",
        background: "#fff",
        border: "1px solid #bfe3f6",
        borderLeft: "3px solid #0a9bd8",
        borderRadius: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <span
            style={{
              padding: "3px 9px",
              borderRadius: 20,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.4px",
              textTransform: "uppercase",
              background: "#e8f6fd",
              color: "#0782b6",
            }}
          >
            Campagne ouverte
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.2px" }}>
            Budget prévisionnel janvier – décembre {year}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#8a95a1", marginTop: 3 }}>
          {"Construit sur les réalisés " +
            (year - 1) +
            " · à rendre avant fin septembre " +
            (year - 1)}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, color: "#6b7681", whiteSpace: "nowrap" }}>
          {reste ? reste + " chantiers à déclarer" : "tout est déclaré"}
        </span>
        <div style={{ width: 130, height: 6, borderRadius: 6, background: "#eef1f4", overflow: "hidden" }}>
          <div style={{ height: 6, width: pct, background: "#0a9bd8" }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0a9bd8" }}>{pct}</div>
      </div>

      <button
        onClick={() =>
          set({
            year,
            tab: "Tableau prévisionnel",
            onlyTodo: engine.isExploit,
            fSearch: "",
            searchDraft: "",
          })
        }
        style={{
          padding: "8px 13px",
          border: 0,
          borderRadius: 8,
          background: "#0a9bd8",
          color: "#fff",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {engine.isExploit ? "Remplir mon budget" : "Suivre la campagne"}
      </button>
    </div>
  );
}
