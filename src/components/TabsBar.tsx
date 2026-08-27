import type { Tab } from "../data/constants";
import type { Store } from "../state/store";

/** Onglets Accueil / Tableau, plus Pilotage CDG réservé au contrôle de gestion. */
export default function TabsBar({ store }: { store: Store }) {
  const { state, engine, set } = store;
  // Le pilotage porte aussi les réglages (coefficients, périodes) : l'admin y a accès.
  const tabs: Tab[] = (["Accueil", "Tableau prévisionnel"] as Tab[]).concat(
    engine.isExploit ? [] : (["Pilotage CDG"] as Tab[]),
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 4,
        padding: "0 28px",
        background: "#fff",
        borderBottom: "1px solid #e6eaee",
      }}
    >
      {tabs.map((t) => {
        const on = state.tab === t;
        return (
          <button
            key={t}
            onClick={() => set({ tab: t })}
            style={{
              padding: "13px 18px",
              border: 0,
              borderBottom: "2px solid " + (on ? "#0a9bd8" : "transparent"),
              background: "transparent",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: on ? 700 : 500,
              color: on ? "#0a9bd8" : "#6b7681",
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        );
      })}
      <span style={{ flex: 1 }} />
      <span style={{ padding: "0 0 12px", fontSize: 12.5, color: "#6b7681" }}>
        {engine.campaignChip()}
      </span>
    </div>
  );
}
