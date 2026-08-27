import { AGENCES, FULL_YEAR, MONTHS, SHORT } from "../../data/constants";
import type { Store } from "../../state/store";
import { CARD } from "../home/cardStyles";

const COEF_GRID = "300px repeat(12, 1fr) 90px";

/**
 * Réglages du contrôle de gestion : coefficients de baseline et fenêtres de gestion.
 *
 * Les périodes sont informatives par défaut ; elles ne bloquent que lorsque c'est
 * explicitement demandé, et la raison est alors reprise sur la page d'accueil.
 */
export default function PilotSettings({ store }: { store: Store }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Coefficients store={store} />
      {/* Le bloc « Périodes de gestion » est retiré de l'écran pour l'instant.
          La mécanique reste en place côté état (aucune période bloquante active
          par défaut) : réafficher <PeriodRules /> suffit à le remettre. */}
      <SaisieMonths store={store} />
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
          <div style={{ fontSize: 12, color: "#6b7681", marginTop: 3 }}>
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
              borderBottom: "1px solid #eef1f4",
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
                  borderBottom: "1px solid #f1f4f7",
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
                          fontSize: 13.5,
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
                    <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{r.role}</div>
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
                          border: "1px solid #bfe3f6",
                          borderRadius: 6,
                          background: "#fff",
                          fontSize: 12.5,
                          fontVariantNumeric: "tabular-nums",
                          color: "#17202a",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 12.5, color: "#475569" }}>
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

/** Ouverture des mois de saisie, par entité. */
function SaisieMonths({ store }: { store: Store }) {
  const { state, togglePeriod } = store;

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
          <div style={{ fontSize: 14, fontWeight: 700 }}>Mois ouverts à la saisie</div>
          <div style={{ fontSize: 12, color: "#6b7681", marginTop: 3 }}>
            Un mois fermé bloque la saisie de l'exploitation sur l'entité concernée.
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#6b7681" }}>
          <Legend color="#16a34a" label="Ouvert" />
          <Legend color="#cbd5e1" label="Fermé" />
        </div>
      </div>

      <div style={{ overflowX: "auto", marginTop: 14 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "170px repeat(12, 60px)",
            gap: 6,
            minWidth: 890,
          }}
        >
          <div />
          {SHORT.map((s) => (
            <div
              key={s}
              style={{
                textAlign: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#8a95a1",
                letterSpacing: "0.4px",
              }}
            >
              {s}
            </div>
          ))}
          {AGENCES.map((a) => (
            <AgenceRow key={a} agence={a} periods={state.periods[a]} toggle={togglePeriod} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AgenceRow({
  agence,
  periods,
  toggle,
}: {
  agence: string;
  periods: boolean[];
  toggle: (agence: string, m: number) => void;
}) {
  return (
    <>
      <div
        style={{ fontSize: 13, fontWeight: 600, color: "#3b4753", display: "flex", alignItems: "center" }}
      >
        {agence}
      </div>
      {MONTHS.map((mo, m) => {
        const o = periods[m];
        return (
          <button
            key={mo}
            onClick={() => toggle(agence, m)}
            title={mo + " — " + agence}
            style={{
              height: 30,
              border: "1px solid " + (o ? "#bbf7d0" : "#e2e8f0"),
              borderRadius: 7,
              background: o ? "#dcfce7" : "#f1f5f9",
              color: o ? "#166534" : "#64748b",
              fontFamily: "inherit",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {o ? "Ouvert" : "Fermé"}
          </button>
        );
      })}
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block" }} />
      {label}
    </div>
  );
}

const HEAD: React.CSSProperties = {
  padding: "8px 0",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.7px",
  textTransform: "uppercase",
  color: "#8a95a1",
};

const ADD_BUTTON: React.CSSProperties = {
  padding: "8px 13px",
  border: "1px solid #dde3e8",
  borderRadius: 8,
  background: "#fff",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 600,
  color: "#3b4753",
  cursor: "pointer",
};
