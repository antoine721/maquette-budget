import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { PieChart } from "echarts/charts";
import { SVGRenderer } from "echarts/renderers";
import type { EChartsOption } from "echarts";

// Import ciblé : seuls le camembert et le rendu SVG entrent dans le bundle.
// Les infobulles sont rendues par l'application, pas par ECharts.
echarts.use([PieChart, SVGRenderer]);

export type EChartsInstance = echarts.ECharts;

/** Ce que les événements de série exposent et dont l'application se sert. */
export interface EChartEventParams {
  name: string;
  dataIndex: number;
  seriesIndex: number;
  [key: string]: unknown;
}

export interface EChartProps {
  option: EChartsOption;
  style?: React.CSSProperties;
  /** Gestionnaires d'événements ECharts (`mouseover`, `mouseout`, `click`…). */
  events?: Record<string, (params: EChartEventParams) => void>;
  /** Reçoit l'instance, pour piloter le survol depuis la légende (`dispatchAction`). */
  instanceRef?: React.MutableRefObject<EChartsInstance | null>;
}

/**
 * Enveloppe React minimale autour d'Apache ECharts.
 *
 * Le rendu est en SVG (net à petite taille, pas de souci de densité de pixels).
 * Les gestionnaires sont liés une seule fois et lisent toujours la dernière closure,
 * ce qui évite de rebrancher les événements à chaque rendu.
 */
export default function EChart({ option, style, events, instanceRef }: EChartProps) {
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<EChartsInstance | null>(null);
  const latestEvents = useRef(events);
  latestEvents.current = events;

  useEffect(() => {
    const instance = echarts.init(host.current!, undefined, { renderer: "svg" });
    chart.current = instance;
    if (instanceRef) instanceRef.current = instance;

    Object.keys(latestEvents.current || {}).forEach((name) =>
      instance.on(name, (...args: unknown[]) => {
        latestEvents.current?.[name]?.(args[0] as EChartEventParams);
      }),
    );

    const ro = new ResizeObserver(() => instance.resize());
    ro.observe(host.current!);

    return () => {
      ro.disconnect();
      instance.dispose();
      chart.current = null;
      if (instanceRef) instanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chart.current?.setOption(option, { notMerge: true });
  }, [option]);

  return <div ref={host} style={{ width: "100%", height: "100%", ...style }} />;
}
