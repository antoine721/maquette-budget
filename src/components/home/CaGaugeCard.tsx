import { useMemo, useRef } from "react";
import type { EChartsOption } from "echarts";
import { CONFIG } from "../../config";
import { CAT_COLORS, type CatKey } from "../../data/constants";
import type { Store } from "../../state/store";
import EChart, { type EChartsInstance } from "../EChart";

/** Part grise du portefeuille pas encore déclarée — l'anneau complet vaut l'objectif CDG. */
const RESTE = "reste";

/**
 * Carré « CA déclaré » : anneau segmenté par catégorie, gradué sur l'objectif CDG.
 * Survoler une section l'épaissit, atténue les autres et ouvre une carte compacte ;
 * la légende sous le graphe est synchronisée dans les deux sens.
 */
export default function CaGaugeCard({ store }: { store: Store }) {
  const { state, engine, set } = store;
  const isCG = engine.isCG;
  const parts = engine.caParts(isCG);
  const baseTotal = engine.caBaseTotal(isCG);
  const declared = parts.reduce((a, x) => a + x.value, 0);
  const chartRef = useRef<EChartsInstance | null>(null);

  const gaugePx = CONFIG.gaugeSize;
  const gaugeInset = Math.round(gaugePx * 0.215);
  const gaugeValueSize = gaugePx < 130 ? 15 : 20;

  const deltaPct = baseTotal
    ? (declared - baseTotal >= 0 ? "+" : "−") +
      Math.abs(((declared - baseTotal) / baseTotal) * 100)
        .toFixed(1)
        .replace(".", ",") +
      " %"
    : "";
  const deltaColor = declared >= baseTotal ? "#15803d" : "#dc2626";

  const prev = engine.caPrevTotal(isCG);
  const n1Delta = !prev
    ? "—"
    : (declared >= prev ? "+" : "−") +
      Math.abs(((declared - prev) / prev) * 100)
        .toFixed(1)
        .replace(".", ",") +
      " % vs " +
      (state.year - 1);
  const n1Color = !prev ? "#94a3b8" : declared >= prev ? "#15803d" : "#dc2626";

  const option = useMemo<EChartsOption>(() => {
    type Slice = {
      name: string;
      value: number;
      itemStyle: { color: string };
      emphasis?: { disabled: boolean };
    };
    const data: Slice[] = parts.map((x) => ({
      name: x.key,
      value: Math.max(0, x.value),
      itemStyle: { color: CAT_COLORS[x.key as CatKey] },
    }));
    // Tant que le déclaré reste sous l'objectif, le solde ferme l'anneau en gris.
    const reste = Math.max(0, baseTotal - declared);
    if (reste > 0)
      data.push({
        name: RESTE,
        value: reste,
        itemStyle: { color: "#eef1f4" },
        emphasis: { disabled: true },
      });

    return {
      animationDuration: 420,
      series: [
        {
          type: "pie",
          radius: ["71%", "93%"],
          center: ["50%", "50%"],
          startAngle: 90,
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          cursor: "pointer",
          itemStyle: { borderWidth: 0 },
          emphasis: { focus: "self", scaleSize: 3 },
          blur: { itemStyle: { opacity: 0.35 } },
          data,
        },
      ],
    };
  }, [parts, baseTotal, declared]);

  /** Synchronise la légende vers l'anneau. */
  const focusSegment = (key: string | null) => {
    set({ hoverSeg: key });
    const chart = chartRef.current;
    if (!chart) return;
    const index = parts.findIndex((x) => x.key === key);
    chart.dispatchAction({ type: "downplay", seriesIndex: 0 });
    if (index >= 0) chart.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex: index });
  };

  const hovered = parts.find((x) => x.key === state.hoverSeg);
  const segCard = hovered
    ? (() => {
        const d = hovered.value - hovered.base;
        const up = d >= 0;
        return {
          label: hovered.label,
          dot: CAT_COLORS[hovered.key as CatKey],
          value: engine.fmt(hovered.value),
          deltaColor: up ? "#4ade80" : "#fca5a5",
          rate: hovered.base
            ? (up ? "+" : "−") +
              Math.abs((d / hovered.base) * 100)
                .toFixed(1)
                .replace(".", ",") +
              " % vs objectif"
            : "objectif non défini",
        };
      })()
    : null;

  return (
    <div
      style={{
        maxWidth: 400,
        aspectRatio: "1 / 1",
        background: "#fff",
        border: "1px solid #e6eaee",
        borderRadius: 14,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>
          {isCG ? "CA déclaré consolidé — toutes exploitations" : "CA déclaré sur mon périmètre"}
        </span>
        <span style={{ fontSize: 11, color: "#6b7681" }}>
          {isCG
            ? "Exercice " +
              state.year +
              (state.fEntity === "Toutes" ? " · toutes entités" : " · " + state.fEntity)
            : "Exercice " + state.year + " · chantiers dont vous êtes responsable"}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <div
          onMouseLeave={() => set({ hoverSeg: null })}
          style={{ position: "relative", width: gaugePx, height: gaugePx, flex: "0 0 auto" }}
        >
          <EChart
            option={option}
            instanceRef={chartRef}
            events={{
              mouseover: (p: { name: string }) =>
                set({ hoverSeg: p.name === RESTE ? null : p.name }),
              mouseout: () => set({ hoverSeg: null }),
            }}
          />

          {segCard && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: -8,
                transform: "translate(-50%, -100%)",
                zIndex: 6,
                whiteSpace: "nowrap",
                padding: "6px 9px",
                background: "#17202a",
                color: "#fff",
                borderRadius: 8,
                boxShadow: "0 8px 18px rgba(15,23,42,0.2)",
                pointerEvents: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: segCard.dot }} />
                <span style={{ fontSize: 11.5, fontWeight: 600 }}>{segCard.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{segCard.value}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: segCard.deltaColor }}>
                  {segCard.rate}
                </span>
              </div>
            </div>
          )}

          <div
            style={{
              position: "absolute",
              inset: gaugeInset,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontSize: gaugeValueSize,
                fontWeight: 700,
                letterSpacing: "-0.5px",
                color: "#17202a",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
              }}
            >
              {engine.fmt(declared)}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: deltaColor,
                marginTop: 1,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {deltaPct}
            </span>
          </div>
        </div>

        {CONFIG.showObjectiveBlock && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.4px",
                textTransform: "uppercase",
                color: "#6b7681",
              }}
            >
              Objectif CDG
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#475569",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {engine.fmt(baseTotal)}
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>complétion {engine.fillPct(isCG)}</span>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.4px",
              textTransform: "uppercase",
              color: "#6b7681",
            }}
          >
            Réalisé N-1
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#475569",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {engine.fmt(prev)}
          </span>
          <span
            style={{ fontSize: 12, fontWeight: 700, color: n1Color, fontVariantNumeric: "tabular-nums" }}
          >
            {n1Delta}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "4px 14px",
            width: "100%",
            marginTop: 2,
          }}
        >
          {parts.map((x) => {
            const d = x.value - x.base;
            const up = d >= 0;
            return (
              <div
                key={x.key}
                onMouseEnter={() => focusSegment(x.key)}
                onMouseLeave={() => focusSegment(null)}
                title={
                  x.label +
                  " — objectif " +
                  engine.fmt(x.base) +
                  " · déclaré " +
                  engine.fmt(x.value) +
                  (x.base ? " (" + Math.round((x.value / x.base) * 100) + " % de l'objectif)" : "")
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "5px 7px",
                  borderRadius: 7,
                  background: state.hoverSeg === x.key ? "#f4f6f8" : "transparent",
                  transition: "background 140ms ease",
                }}
              >
                <span
                  style={{
                    flex: "0 0 auto",
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: CAT_COLORS[x.key as CatKey],
                  }}
                />
                <span
                  style={{
                    minWidth: 0,
                    flex: 1,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "#3b4753",
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
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#17202a",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {engine.fmt(x.value)}
                </span>
                <span
                  style={{
                    flex: "0 0 auto",
                    fontSize: 11,
                    fontWeight: 700,
                    color: up ? "#16a34a" : "#dc2626",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {x.base
                    ? (up ? "+" : "−") +
                      Math.abs((d / x.base) * 100)
                        .toFixed(1)
                        .replace(".", ",") +
                      " %"
                    : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
