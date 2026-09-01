import { useMemo, useRef } from "react";
import type { EChartsOption } from "echarts";
import { ST, STATUT_OPTS, type Statut } from "../../data/constants";
import type { Chantier } from "../../data/chantiers";
import type { Engine } from "../../lib/engine";
import type { Store } from "../../state/store";
import { FS, INK, RADIUS, SURFACE } from "../../theme";
import EChart, { type EChartsInstance } from "../EChart";
import { Card, CardHead } from "../ui";

export interface StatutSegment {
  key: Statut;
  label: string;
  color: string;
  hint: string;
  list: Chantier[];
  pick: () => void;
}

const HINTS: Record<Statut, string> = {
  "En attente baseline CG": "la saisie n'est pas encore ouverte à l'exploitation",
  "Non budgétisé": "baseline publiée, aucun mois saisi",
  "En saisie": "saisie commencée, pas encore envoyée",
  "À valider": "envoyé, en attente du contrôle de gestion",
  Validé: "cristallisation validée",
  Clôturé: "exercice clos, consultation seule",
};

/** Répartition du portefeuille par statut du cycle, dans l'ordre du circuit. */
export function statutSegments(store: Store, view: Engine): StatutSegment[] {
  const { set } = store;
  const list = view.perim();
  return STATUT_OPTS.map((st) => ({
    key: st,
    label: view.statutLabel(st),
    color: ST[st].accent,
    hint: HINTS[st],
    list: list.filter((ch) => view.st(ch) === st),
    pick: () =>
      set({
        tab: "Tableau prévisionnel",
        fStatuts: [st],
        onlyTodo: false,
        fSearch: "",
        searchDraft: "",
        hoverSeg: null,
      }),
  })).filter((x) => x.list.length);
}

/**
 * Où en est le portefeuille dans le cycle de vie d'un budget.
 *
 * Une teinte par étape, la même que sur les filtres et les badges du tableau : la
 * couleur sert à reconnaître l'étape d'un coup d'œil. Les teintes sont adoucies et
 * séparées par un filet de surface — c'était la saturation, pas le nombre de
 * couleurs, qui rendait l'anneau criard.
 */
export default function BudgetDonutCard({ store, compact }: { store: Store; compact?: boolean }) {
  const { state, engine, set } = store;
  const view = engine;

  const segs = statutSegments(store, view);
  const tot = segs.reduce((a, x) => a + x.list.length, 0) || 1;
  const done = segs
    .filter((x) => x.key === "Validé" || x.key === "Clôturé")
    .reduce((a, x) => a + x.list.length, 0);
  const donePct = Math.round((done / tot) * 100);
  const chartRef = useRef<EChartsInstance | null>(null);

  const ringPx = compact ? 132 : 168;
  const inset = Math.round(ringPx * (compact ? 0.2 : 0.24));

  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 420,
      series: [
        {
          type: "pie",
          radius: ["64%", "90%"],
          center: ["50%", "50%"],
          startAngle: 90,
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          cursor: "pointer",
          // Un filet de surface entre deux parts : elles se touchent sans se confondre.
          itemStyle: { borderWidth: 2, borderColor: SURFACE.card },
          emphasis: { focus: "self", scaleSize: 4 },
          blur: { itemStyle: { opacity: 0.28 } },
          data: segs.map((x) => ({
            name: x.key,
            value: x.list.length,
            itemStyle: { color: x.color },
          })),
        },
      ],
    }),
    // Les segments sont reconstruits à chaque rendu ; seule leur substance compte ici.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [segs.map((x) => x.key + ":" + x.list.length).join("|")],
  );

  const focusSegment = (key: string | null) => {
    set({ hoverSeg: key });
    const chart = chartRef.current;
    if (!chart) return;
    const index = segs.findIndex((x) => x.key === key);
    chart.dispatchAction({ type: "downplay", seriesIndex: 0 });
    if (index >= 0) chart.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex: index });
  };

  const hit = segs.find((x) => x.key === state.hoverSeg);
  const centerPct = hit ? Math.round((hit.list.length / tot) * 100) : donePct;

  return (
    <Card style={{ display: "flex", flexDirection: "column" }}>
      <CardHead
        title="Avancement du portefeuille"
        hint={tot + " chantiers · par étape du circuit"}
      />

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          onMouseLeave={() => set({ hoverSeg: null })}
          style={{ position: "relative", width: ringPx, height: ringPx }}
        >
          <EChart
            option={option}
            instanceRef={chartRef}
            events={{
              mouseover: (p: { name: string }) => set({ hoverSeg: p.name }),
              mouseout: () => set({ hoverSeg: null }),
              click: (p: { name: string }) => segs.find((x) => x.key === p.name)?.pick(),
            }}
          />
          <div
            style={{
              position: "absolute",
              inset,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontSize: compact ? 22 : 30,
                fontWeight: 700,
                letterSpacing: "-1px",
                color: hit ? hit.color : INK.strong,
                lineHeight: 1,
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {centerPct} %
            </span>
            <span
              style={{
                fontSize: FS.micro,
                fontWeight: 600,
                color: INK.muted,
                marginTop: 4,
                textAlign: "center",
                lineHeight: 1.2,
                overflow: "hidden",
              }}
            >
              {hit ? hit.label : "terminés"}
            </span>
          </div>
        </div>
      </div>

      {/* Ce que dit l'étape survolée, en clair : l'infobulle système arrive trop tard. */}
      <div
        style={{
          minHeight: 30,
          marginTop: 8,
          padding: "0 4px",
          textAlign: "center",
          fontSize: FS.small,
          color: INK.muted,
          lineHeight: 1.3,
        }}
      >
        {hit
          ? hit.hint
          : "Survolez une étape pour la définir, cliquez pour l'ouvrir dans le tableau."}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 4 }}>
        {segs.map((x) => {
          const on = state.hoverSeg === x.key;
          return (
            <button
              key={x.key}
              onClick={x.pick}
              onMouseEnter={() => focusSegment(x.key)}
              onMouseLeave={() => focusSegment(null)}
              title={"Ouvrir « " + x.label + " » dans le tableau"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "6px 8px",
                border: 0,
                borderRadius: RADIUS.control,
                background: on ? SURFACE.hover : SURFACE.card,
                fontFamily: "inherit",
                textAlign: "left",
                cursor: "pointer",
                transition: "background 150ms ease",
              }}
            >
              <span
                style={{ flex: "0 0 auto", width: 8, height: 8, borderRadius: 2, background: x.color }}
              />
              <span
                style={{
                  minWidth: 0,
                  flex: 1,
                  fontSize: FS.small,
                  fontWeight: 600,
                  color: INK.base,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {x.label}
              </span>
              <span
                style={{
                  flex: "0 0 auto",
                  fontSize: FS.small,
                  fontWeight: 700,
                  color: INK.strong,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {x.list.length}
              </span>
              <span
                style={{
                  flex: "0 0 auto",
                  fontSize: FS.small,
                  color: INK.muted,
                  width: 42,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {Math.round((x.list.length / tot) * 100)} %
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
