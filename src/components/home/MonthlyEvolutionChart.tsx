import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { SHORT } from "../../data/constants";
import type { Store } from "../../state/store";
import EChart from "../EChart";
import { CARD } from "./cardStyles";

/**
 * Évolution mensuelle du CA sur l'exercice consulté, comparée au réalisé de l'année
 * précédente. C'est la lecture utile hors campagne, quand l'avancement de la saisie
 * n'a plus d'intérêt.
 */
export default function MonthlyEvolutionChart({ store }: { store: Store }) {
  const { state, engine } = store;
  const isGlobal = !engine.isExploit;
  const rows = engine.monthly(isGlobal);

  const total = rows.reduce((a, r) => a + (r.declare || 0), 0);
  const totalPrev = rows.reduce((a, r) => a + r.prev, 0);
  const evolution = totalPrev ? ((total - totalPrev) / totalPrev) * 100 : null;

  const option = useMemo<EChartsOption>(() => {
    const declare = rows.map((r) => Math.round(r.declare || 0));
    const prev = rows.map((r) => Math.round(r.prev));
    const fmt = (v: number) => engine.fmt(v);

    return {
      animationDuration: 500,
      grid: { top: 28, right: 16, bottom: 26, left: 56 },
      tooltip: {
        trigger: "axis",
        backgroundColor: "#17202a",
        borderWidth: 0,
        padding: [8, 11],
        textStyle: { color: "#fff", fontSize: 12, fontFamily: "Barlow, Helvetica, sans-serif" },
        // Le tooltip porte l'évolution : c'est l'information que l'on vient chercher ici.
        formatter: (params: unknown) => {
          const list = params as { dataIndex: number }[];
          const i = list[0].dataIndex;
          const a = declare[i];
          const b = prev[i];
          const d = b ? ((a - b) / b) * 100 : null;
          const sign = d !== null && d >= 0 ? "+" : "−";
          const color = d !== null && d >= 0 ? "#4ade80" : "#fca5a5";
          return (
            "<b>" +
            SHORT[i] +
            " " +
            state.year +
            "</b><br/>Déclaré&nbsp;: <b>" +
            fmt(a) +
            "</b><br/>" +
            (state.year - 1) +
            "&nbsp;: " +
            fmt(b) +
            (d === null
              ? ""
              : '<br/><span style="color:' +
                color +
                '">' +
                sign +
                Math.abs(d).toFixed(1).replace(".", ",") +
                " %</span>")
          );
        },
      },
      xAxis: {
        type: "category",
        data: SHORT.slice(),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#e6eaee" } },
        axisLabel: { color: "#8a95a1", fontSize: 11, fontFamily: "Barlow, Helvetica, sans-serif" },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#f1f4f7" } },
        axisLabel: {
          color: "#8a95a1",
          fontSize: 11,
          fontFamily: "Barlow, Helvetica, sans-serif",
          formatter: (v: number) => engine.fmt(v),
        },
      },
      series: [
        {
          name: "Déclaré",
          type: "bar",
          data: declare,
          barWidth: "52%",
          itemStyle: { color: "#0a9bd8", borderRadius: [4, 4, 0, 0] },
          emphasis: { itemStyle: { color: "#0782b6" } },
        },
        {
          name: "Réalisé N-1",
          type: "line",
          data: prev,
          smooth: true,
          symbol: "circle",
          symbolSize: 5,
          lineStyle: { color: "#94a3b8", width: 2, type: "dashed" },
          itemStyle: { color: "#94a3b8" },
        },
      ],
    };
  }, [rows, engine, state.year]);

  return (
    <div style={{ ...CARD, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>Évolution mensuelle du CA</span>
        <span style={{ fontSize: 11.5, color: "#8a95a1" }}>
          {"Exercice " + state.year + " vs " + (state.year - 1)}
          {engine.isExploit ? " · mon périmètre" : " · consolidé"}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#17202a" }}>{engine.fmt(total)}</span>
        {evolution !== null && (
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: evolution >= 0 ? "#15803d" : "#dc2626",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {(evolution >= 0 ? "+" : "−") +
              Math.abs(evolution).toFixed(1).replace(".", ",") +
              " % vs " +
              (state.year - 1)}
          </span>
        )}
      </div>

      {/* Hauteur explicite : un enfant en height 100 % dans un parent flex auto se replierait à zéro. */}
      <div style={{ height: 300, marginTop: 8 }}>
        <EChart option={option} />
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 4, fontSize: 11.5, color: "#6b7681" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#0a9bd8" }} />
          CA déclaré {state.year}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 0, borderTop: "2px dashed #94a3b8" }} />
          Réalisé {state.year - 1}
        </span>
      </div>
    </div>
  );
}
