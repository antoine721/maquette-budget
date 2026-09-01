import { FULL_YEAR, SHORT } from "../../data/constants";
import type { Store } from "../../state/store";
import { CARD } from "../home/cardStyles";
import { FS, INK, LINE, SURFACE } from "../../theme";

const COEF_GRID = "300px repeat(12, 1fr) 90px";

/** Réglages du contrôle de gestion : les coefficients de baseline. */
export default function PilotSettings({ store }: { store: Store }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Coefficients store={store} />
      {/* Les blocs « Périodes de gestion » et « Mois ouverts à la saisie » sont
          retirés de l'écran. La mécanique reste en place côté état — aucune période
          bloquante active, tous les mois ouverts — et l'historique du dépôt garde
          les composants si l'on veut les réafficher. */}
    </div>
  );
}

function Coefficients({ store }: { store: Store }) {
  const { state, engine, addRef, setRefValue } = store;
  const isCG = engine.isCG;

  return (
    <div style={CARD}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Coefficients de baseline</div>
          <div style={{ fontSize: 12, color: INK.muted, marginTop: 3 }}>
            Les coefficients se saisissent en <b>% d'évolution</b> : <code>0 %</code> vaut
            × 1,000, <code>2,4 %</code> vaut × 1,024. Un coefficient <b>commun</b> s'applique à tout
            le portefeuille ; un coefficient <b>particulier</b> est rattaché à tous les chantiers
            mais reste à 0 % — donc neutre — tant qu'il n'est pas renseigné chantier par chantier,
            dans le détail du chantier.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="hov-f8"
            onClick={() => addRef("commun")}
            style={ADD_BUTTON}
          >
            + Coefficient commun
          </button>
          <button
            onClick={() => addRef("particulier")}
            style={{
              ...ADD_BUTTON,
              border: "1px solid #ddd6fe",
              background: "#f8f7ff",
              color: "#5b21b6",
            }}
          >
            + Coefficient particulier
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto", marginTop: 14 }}>
        <div style={{ minWidth: 1040 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: COEF_GRID,
              alignItems: "center",
              borderBottom: "1px solid " + LINE.soft,
            }}
          >
            <div style={HEAD}>Coefficient</div>
            {FULL_YEAR.map((m) => (
              <div key={m} style={{ ...HEAD, textAlign: "right", padding: 8 }}>
                {SHORT[m]}
              </div>
            ))}
            <div style={{ ...HEAD, textAlign: "right", padding: "8px 12px" }}>Moy.</div>
          </div>

          {state.refs.map((r, ri) => {
            const particulier = r.scope === "particulier";
            return (
              <div
                key={r.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: COEF_GRID,
                  alignItems: "center",
                  borderBottom: "1px solid " + LINE.soft,
                  background: particulier ? "#fbfaff" : "transparent",
                }}
              >
                <div
                  style={{ padding: "9px 0", display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
                >
                  <span
                    style={{ width: 7, height: 7, borderRadius: 2, flex: "0 0 7px", background: r.dot }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {r.label}
                      </span>
                      <span
                        style={{
                          flex: "0 0 auto",
                          padding: "1px 7px",
                          borderRadius: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          background: particulier ? "#f3f0ff" : "#eef2ff",
                          color: particulier ? "#5b21b6" : "#3730a3",
                          border: "1px solid " + (particulier ? "#ddd6fe" : "#c7d2fe"),
                        }}
                      >
                        {particulier ? "Particulier" : "Commun"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{r.role}</div>
                  </div>
                </div>

                {FULL_YEAR.map((m) => (
                  <div key={m} style={{ padding: "5px 4px", textAlign: "right" }}>
                    {particulier ? (
                      <span
                        title="Valeur propre à chaque chantier — se règle dans le détail du chantier. 0 % = × 1,000"
                        style={{ fontSize: 12, color: "#a78bfa" }}
                      >
                        0 %
                      </span>
                    ) : isCG ? (
                      <input
                        value={String(r.values[m])}
                        onChange={(e) => setRefValue(ri, m, e.target.value)}
                        style={{
                          width: "100%",
                          padding: "5px 6px",
                          textAlign: "right",
                          border: "1px solid " + LINE.active,
                          borderRadius: 6,
                          background: SURFACE.card,
                          fontSize: 13,
                          fontVariantNumeric: "tabular-nums",
                          color: "#17202a",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 13, color: INK.base }}>
                        {(Number(r.values[m]) || 0).toFixed(1).replace(".", ",") + " %"}
                      </span>
                    )}
                  </div>
                ))}

                <div
                  style={{
                    padding: "9px 12px",
                    textAlign: "right",
                    fontSize: 13,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color: particulier ? "#a78bfa" : "#475569",
                  }}
                >
                  {particulier
                    ? "par chantier"
                    : (FULL_YEAR.reduce((a, m) => a + (Number(r.values[m]) || 0), 0) / 12)
                        .toFixed(2)
                        .replace(".", ",") + " %"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const HEAD: React.CSSProperties = {
  padding: "8px 0",
  fontSize: FS.micro,
  fontWeight: 700,
  letterSpacing: "0.7px",
  textTransform: "uppercase",
  color: INK.muted,
};

const ADD_BUTTON: React.CSSProperties = {
  padding: "8px 13px",
  border: "1px solid " + LINE.base,
  borderRadius: 8,
  background: SURFACE.card,
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 600,
  color: INK.base,
  cursor: "pointer",
};
