import { useMemo, useRef } from "react";
import type { EChartsOption } from "echarts";
import { CAT_COLORS, type CatKey } from "../../data/constants";
import type { Store } from "../../state/store";
import { BRAND, FS, INK, RADIUS, SURFACE } from "../../theme";
import EChart, { type EChartsInstance } from "../EChart";
import { Card, CardHead } from "../ui";

/** Part non déclarée du portefeuille — l'anneau complet vaut l'objectif du contrôle de gestion. */
const RESTE = "reste";

/**
 * Le CA déclaré, mesuré contre l'objectif du contrôle de gestion.
 *
 * L'anneau entier vaut l'objectif : la portion pleine est ce qui a été déclaré,
 * le gris ce qui manque encore. La composition par catégorie se lit dessous, en
 * barre, où la comparaison des parts est plus juste qu'entre arcs de cercle.
 */
export default function CaGaugeCard({ store, compact }: { store: Store; compact?: boolean }) {
  const { state, engine, set } = store;
  // L'exercice est celui choisi dans le header : la carte n'a pas de période à elle.
  const view = engine;
  const isGlobal = !engine.isExploit;
  const parts = view.caParts(isGlobal);
  const objectif = view.caBaseTotal(isGlobal);
  const declare = parts.reduce((a, x) => a + x.value, 0);
  const pct = objectif ? Math.round((declare / objectif) * 100) : 0;
  const chartRef = useRef<EChartsInstance | null>(null);

  const ringPx = compact ? 132 : 156;
  const inset = Math.round(ringPx * (compact ? 0.2 : 0.24));

  const option = useMemo<EChartsOption>(() => {
    const reste = Math.max(0, objectif - declare);
    return {
      animationDuration: 420,
      series: [
        {
          type: "pie",
          radius: ["74%", "94%"],
          center: ["50%", "50%"],
          startAngle: 90,
          silent: true,
          label: { show: false },
          labelLine: { show: false },
          itemStyle: { borderWidth: 2, borderColor: SURFACE.card },
          data: [
            { name: "déclaré", value: Math.max(0, declare), itemStyle: { color: BRAND.base } },
            { name: RESTE, value: reste, itemStyle: { color: "#eef1f4" } },
          ],
        },
      ],
    };
  }, [objectif, declare]);

  const hovered = parts.find((x) => x.key === state.hoverSeg);

  return (
    <Card style={{ display: "flex", flexDirection: "column" }}>
      <CardHead
        title="CA déclaré"
        hint={
          (engine.isExploit
            ? "mon périmètre"
            : state.fEntity === "Toutes"
              ? "toutes entités"
              : state.fEntity) + " · face à l'objectif CDG"
        }
      />

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: ringPx, height: ringPx }}>
          <EChart option={option} instanceRef={chartRef} />
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
                fontSize: compact ? 22 : 28,
                fontWeight: 700,
                letterSpacing: "-1px",
                color: INK.strong,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {pct} %
            </span>
            <span
              style={{
                fontSize: FS.micro,
                fontWeight: 600,
                color: INK.muted,
                marginTop: 4,
                textAlign: "center",
              }}
            >
              de l'objectif
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          gap: 6,
          marginTop: 10,
          fontSize: FS.small,
          color: INK.muted,
        }}
      >
        <b style={{ fontSize: FS.base, fontWeight: 700, color: INK.strong }}>
          {view.fmt(declare)}
        </b>
        déclarés sur {view.fmt(objectif)}
      </div>

      {/* Composition du déclaré : quatre parts d'un même total, donc une barre. */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: FS.micro, fontWeight: 700, color: INK.muted, marginBottom: 6 }}>
          RÉPARTITION DU DÉCLARÉ
        </div>
        <div
          style={{
            display: "flex",
            gap: 2,
            height: 10,
            borderRadius: 5,
            overflow: "hidden",
            background: "#eef1f4",
          }}
        >
          {parts.map((x) => {
            const share = declare ? (x.value / declare) * 100 : 0;
            if (share <= 0) return null;
            return (
              <div
                key={x.key}
                onMouseEnter={() => set({ hoverSeg: x.key })}
                onMouseLeave={() => set({ hoverSeg: null })}
                title={x.label + " · " + view.fmt(x.value)}
                style={{
                  width: share + "%",
                  background: CAT_COLORS[x.key as CatKey],
                  opacity: hovered && hovered.key !== x.key ? 0.35 : 1,
                  transition: "opacity 150ms",
                }}
              />
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 8 }}>
          {parts.map((x) => {
            const share = declare ? Math.round((x.value / declare) * 100) : 0;
            const on = state.hoverSeg === x.key;
            return (
              <div
                key={x.key}
                onMouseEnter={() => set({ hoverSeg: x.key })}
                onMouseLeave={() => set({ hoverSeg: null })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "4px 8px",
                  borderRadius: RADIUS.control,
                  background: on ? SURFACE.hover : "transparent",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    flex: "0 0 auto",
                    borderRadius: 2,
                    background: CAT_COLORS[x.key as CatKey],
                  }}
                />
                <span style={{ flex: 1, fontSize: FS.small, fontWeight: 600, color: INK.base }}>
                  {x.label}
                </span>
                <span
                  style={{
                    fontSize: FS.small,
                    color: INK.muted,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {view.fmt(x.value)}
                </span>
                <span
                  style={{
                    width: 38,
                    textAlign: "right",
                    fontSize: FS.small,
                    fontWeight: 700,
                    color: INK.strong,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {share} %
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
