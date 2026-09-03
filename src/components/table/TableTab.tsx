import {
  PER_MONTHS,
  SAISIE_FIELDS,
  SHORT,
  ST,
  STATUT_OPTS,
  type Statut,
} from "../../data/constants";
import type { Chantier } from "../../data/chantiers";
import type { Store } from "../../state/store";
import { BRAND, FS, INK, LINE, MONO, RADIUS, STATE, SURFACE } from "../../theme";
import StatutBadge from "../StatutBadge";
import { Button, Card, EmptyState, PageHead } from "../ui";
import ChantierDetail from "./ChantierDetail";
import FilterBar from "./FilterBar";

/** Séparateurs de trimestre. */
const sepColor = (m: number) => (m === 2 || m === 5 || m === 8 ? LINE.base : "transparent");

/** Hauteur d'une ligne repliée. Deux lignes de texte serrées, pas trois espacées. */
const ROW_PAD = "7px 14px";

export default function TableTab({ store }: { store: Store }) {
  const { state, engine, set } = store;
  const met = engine.metric;
  const cat = state.cat;
  const catLabel = cat === "Total" ? "CA total" : "CA " + cat;
  const mIdx = PER_MONTHS[state.fPeriode];

  // La largeur de colonne s'élargit quand la période est courte.
  const colW = mIdx.length <= 3 ? 160 : mIdx.length <= 6 ? 110 : 82;
  const gridCols = "440px repeat(" + mIdx.length + ", " + colW + "px) 120px";
  const gridColsDetail = "400px repeat(" + mIdx.length + ", " + colW + "px) 120px";
  const tableMin = 440 + mIdx.length * colW + 120 + "px";

  const list = engine.sorted(engine.filtered(), mIdx);
  const shown = list.slice(0, state.pageSize);

  const totals = mIdx.map((m) => {
    const v = engine.aggregate(list, [m], "saisi", met.key, cat);
    const b = engine.aggregate(list, [m], "base", met.key, cat, true);
    return {
      m,
      text: engine.fmt(v, met.kind),
      color: engine.markerColor(v, b, met.better),
    };
  });
  const grandTotal = engine.fmt(engine.aggregate(list, mIdx, "saisi", met.key, cat), met.kind);

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: "20px 28px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <PageHead
        eyebrow={"Exercice " + state.year}
        title="Tableau prévisionnel"
        hint={
          list.length +
          " chantier" +
          (list.length > 1 ? "s" : "") +
          " · " +
          state.fPeriode.toLowerCase() +
          " · " +
          (met.key === "ca" ? catLabel : met.label) +
          (engine.closed() ? " · lecture seule" : "")
        }
      />

      <Card pad={14} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <FilterBar store={store} />

        {/* La légende est le filtre : chaque étape se coche, avec sa couleur. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            paddingTop: 2,
          }}
        >
          {STATUT_OPTS.map((x) => {
            const on = state.fStatuts.includes(x);
            const c = ST[x].accent;
            return (
              <button
                key={x}
                onClick={() =>
                  set((p) => ({
                    fStatuts: p.fStatuts.includes(x)
                      ? p.fStatuts.filter((y) => y !== x)
                      : STATUT_OPTS.filter((y) => y === x || p.fStatuts.includes(y)),
                  }))
                }
                title={(on ? "Masquer « " : "Afficher « ") + engine.statutLabel(x) + " »"}
                aria-pressed={on}
                className="hov-soft"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "5px 11px",
                  border: "1px solid " + (on ? c + "66" : LINE.base),
                  borderRadius: RADIUS.pill,
                  background: on ? c + "14" : SURFACE.card,
                  color: on ? INK.strong : INK.faint,
                  fontFamily: "inherit",
                  fontSize: FS.small,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: 13,
                    height: 13,
                    flex: "0 0 auto",
                    borderRadius: 3,
                    border: "1px solid " + (on ? c : "#cbd5e1"),
                    background: on ? c : SURFACE.card,
                    color: "#fff",
                    fontSize: 10,
                    lineHeight: "11px",
                    textAlign: "center",
                  }}
                >
                  {on ? "✓" : ""}
                </span>
                {engine.statutLabel(x)}
              </button>
            );
          })}
          <Button
            size="sm"
            tone="subtle"
            onClick={() =>
              set({
                fStatuts: state.fStatuts.length === STATUT_OPTS.length ? [] : [...STATUT_OPTS],
              })
            }
          >
            {state.fStatuts.length === STATUT_OPTS.length ? "Tout décocher" : "Tout cocher"}
          </Button>
        </div>

        {list.length === 0 ? (
          <EmptyState
            title="Aucun chantier ne correspond aux filtres"
            hint="Retirez un filtre ci-dessus, ou remettez la vue à zéro pour retrouver tout le portefeuille."
            action={
              <Button
                size="sm"
                tone="primary"
                onClick={() =>
                  set({
                    fSearch: "",
                    searchDraft: "",
                    onlyTodo: false,
                    onlyFlagged: false,
                    fRex: "Tous",
                    fEntity: "Toutes",
                    fStatuts: [...STATUT_OPTS],
                  })
                }
              >
                Tout réinitialiser
              </Button>
            }
          />
        ) : (
          <div
            style={{
              border: "1px solid " + LINE.base,
              borderRadius: RADIUS.card,
              overflow: "hidden",
            }}
          >
            {/*
              Le tableau a son propre cadre de défilement : sans hauteur bornée, ni
              l'en-tête des mois ni la ligne de total ne peuvent tenir à l'écran, et
              l'on perd les repères dès la quinzième ligne.
            */}
            <div
              style={{
                overflow: "auto",
                height: "calc(100vh - 340px)",
                minHeight: 380,
              }}
            >
              <div style={{ minWidth: tableMin }}>
                {/* En-tête */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: gridCols,
                    alignItems: "center",
                    background: SURFACE.card,
                    borderBottom: "1px solid " + LINE.base,
                    position: "sticky",
                    top: 0,
                    zIndex: 3,
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      fontSize: FS.micro,
                      fontWeight: 700,
                      letterSpacing: "0.6px",
                      textTransform: "uppercase",
                      color: INK.muted,
                      position: "sticky",
                      left: 0,
                      background: SURFACE.card,
                      zIndex: 2,
                    }}
                  >
                    Chantier
                  </div>
                  {mIdx.map((m) => (
                    <div
                      key={m}
                      style={{
                        padding: "10px 8px",
                        textAlign: "right",
                        fontSize: FS.micro,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        color: INK.muted,
                        borderRight: "1px solid " + sepColor(m),
                      }}
                    >
                      {SHORT[m]}
                    </div>
                  ))}
                  <div
                    style={{
                      padding: "10px 14px",
                      textAlign: "right",
                      fontSize: FS.micro,
                      fontWeight: 700,
                      letterSpacing: "0.6px",
                      textTransform: "uppercase",
                      color: INK.muted,
                    }}
                  >
                    {met.agg === "ratio" ? "Moyenne" : "Total"}
                  </div>
                </div>

                {shown.map((ch) => (
                  <Row
                    key={ch.id}
                    store={store}
                    ch={ch}
                    mIdx={mIdx}
                    gridCols={gridCols}
                    gridColsDetail={gridColsDetail}
                  />
                ))}

                {list.length > shown.length && (
                  <div
                    style={{
                      position: "sticky",
                      left: 0,
                      display: "flex",
                      justifyContent: "center",
                      padding: 12,
                    }}
                  >
                    <Button onClick={() => set((p) => ({ pageSize: p.pageSize + 40 }))}>
                      {"Afficher 40 chantiers de plus (" + shown.length + " / " + list.length + ")"}
                    </Button>
                  </div>
                )}

                {/* Total du périmètre filtré — calculé sur toute la liste, pas seulement la page. */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: gridCols,
                    alignItems: "center",
                    background: SURFACE.sunken,
                    borderTop: "1px solid " + LINE.base,
                    position: "sticky",
                    bottom: 0,
                    zIndex: 3,
                  }}
                >
                  <div
                    style={{
                      padding: "12px 14px",
                      fontSize: FS.body,
                      fontWeight: 700,
                      color: INK.strong,
                      position: "sticky",
                      left: 0,
                      background: SURFACE.sunken,
                      zIndex: 2,
                    }}
                  >
                    Total périmètre filtré
                  </div>
                  {totals.map((t) => (
                    <div
                      key={t.m}
                      style={{
                        padding: "12px 8px",
                        textAlign: "right",
                        fontSize: FS.body,
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                        color: t.color,
                        borderRight: "1px solid " + sepColor(t.m),
                      }}
                    >
                      {t.text}
                    </div>
                  ))}
                  <div
                    style={{
                      padding: "12px 14px",
                      textAlign: "right",
                      fontSize: FS.base,
                      fontWeight: 700,
                      color: INK.strong,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {grandTotal}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ce que les repères du tableau veulent dire — une infobulle ne se lit pas au clavier. */}
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
            fontSize: FS.small,
            color: INK.muted,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: "#fffdf5",
                border: "1px solid " + LINE.base,
              }}
            />
            mois à saisir
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: SURFACE.card,
                border: "1px solid " + LINE.base,
                boxShadow: "inset 0 -3px 0 " + BRAND.base,
              }}
            />
            valeur modifiée à la main
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: STATE.warn, fontWeight: 700 }}>−7 %</span>
            écart à la baseline au-delà de 5 %
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: STATE.danger, fontWeight: 700 }}>−22 %</span>
            au-delà de 15 %
          </span>
        </div>
      </Card>
    </div>
  );
}

/** Une ligne chantier, repliée ou dépliée sur son détail. */
function Row({
  store,
  ch,
  mIdx,
  gridCols,
  gridColsDetail,
}: {
  store: Store;
  ch: Chantier;
  mIdx: number[];
  gridCols: string;
  gridColsDetail: string;
}) {
  const { state, engine, set, toggleFlag } = store;
  const met = engine.metric;
  const cat = state.cat;
  const st = engine.st(ch) as Statut;
  const open = state.openRow === ch.id;
  const rowBg = open ? BRAND.wash : SURFACE.card;

  const cells = mIdx.map((m) => {
    const v = engine.metricFrom(engine.prims(ch, m, "saisi"), met.key, cat);
    const b = engine.metricFrom(engine.prims(ch, m, "base"), met.key, cat);
    const touched = SAISIE_FIELDS.some(
      (f) => engine.edited(ch, f, m, false) || engine.edited(ch, f, m, true),
    );
    return {
      m,
      empty: v === null,
      text: engine.fmt(v, met.kind),
      color: engine.markerColor(v, b, met.better),
      mark: touched ? BRAND.base : "transparent",
      markTitle: touched ? "Valeur modifiée manuellement" : "",
    };
  });

  const rowSaisi = engine.aggregate([ch], mIdx, "saisi", met.key, cat);
  const completion = engine.completionPct(ch, mIdx);
  const flagged = !!state.flags[ch.id];
  const editable = engine.editableMonths(ch, mIdx).length > 0;

  return (
    <div style={{ borderBottom: "1px solid " + LINE.soft, background: rowBg }}>
      <div
        className={open ? undefined : "hov-row"}
        onClick={() => set({ openRow: open ? null : ch.id })}
        style={{
          display: "grid",
          gridTemplateColumns: gridCols,
          alignItems: "stretch",
          cursor: "pointer",
          borderLeft: "3px solid " + ST[st].accent,
        }}
      >
        <div
          className="row-sticky"
          style={{
            padding: ROW_PAD,
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
            position: "sticky",
            left: 0,
            background: rowBg,
            zIndex: 1,
          }}
        >
          <span style={{ width: 12, color: INK.faint, fontSize: 10 }}>{open ? "▾" : "▸"}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
              <span
                title={ch.nom}
                style={{
                  fontSize: FS.body,
                  fontWeight: 600,
                  color: INK.strong,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {ch.nom}
              </span>
              {flagged && <span style={{ fontSize: 11, color: STATE.danger }}>⚑</span>}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                minWidth: 0,
                fontSize: FS.micro,
                color: INK.muted,
                marginTop: 1,
              }}
            >
              <span style={{ fontFamily: MONO, flex: "0 0 auto" }}>{ch.id}</span>
              <span style={{ color: LINE.base }}>·</span>
              <span
                style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {ch.entite + (engine.isCG ? " · " + ch.client : "")}
              </span>
              <span style={{ color: LINE.base }}>·</span>
              <span
                style={{ flex: "0 0 auto", fontVariantNumeric: "tabular-nums" }}
                title={
                  engine.closed()
                    ? "Part de la période que le réalisé Gescof couvre"
                    : "Part des champs de budget renseignés sur la période affichée"
                }
              >
                {completion} % {engine.closed() ? "remonté" : "rempli"}
              </span>
            </div>
          </div>

          <StatutBadge st={st} engine={engine} size="sm" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFlag(ch);
            }}
            title={
              flagged
                ? "Chantier signalé — cliquer pour retirer le signalement"
                : "Signaler ce chantier"
            }
            aria-pressed={flagged}
            className={flagged ? undefined : "flag"}
            style={{
              flex: "0 0 auto",
              width: 22,
              height: 22,
              padding: 0,
              border: "1px solid " + (flagged ? "#f5c6c2" : "transparent"),
              borderRadius: 6,
              background: flagged ? STATE.dangerTint : "transparent",
              color: flagged ? STATE.danger : INK.faint,
              fontFamily: "inherit",
              fontSize: 12,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ⚑
          </button>
        </div>

        {cells.map((c) => (
          <div
            key={c.m}
            title={c.markTitle}
            style={{
              padding: "8px",
              textAlign: "right",
              fontSize: FS.body,
              fontVariantNumeric: "tabular-nums",
              color: c.empty ? INK.faint : c.color,
              background: c.empty && editable ? "#fffdf5" : "transparent",
              borderRight: "1px solid " + sepColor(c.m),
              boxShadow: "inset 0 -2px 0 " + c.mark,
            }}
          >
            {c.text}
          </div>
        ))}

        <div
          style={{
            padding: "8px 14px",
            textAlign: "right",
            fontSize: FS.body,
            fontWeight: 700,
            color: INK.strong,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {engine.fmt(rowSaisi, met.kind)}
        </div>
      </div>

      {open && (
        <ChantierDetail store={store} ch={ch} mIdx={mIdx} gridColsDetail={gridColsDetail} />
      )}
    </div>
  );
}
