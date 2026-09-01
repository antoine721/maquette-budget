import { ST, type Statut } from "../data/constants";
import type { Engine } from "../lib/engine";
import { FS, INK, LINE, RADIUS } from "../theme";

/**
 * Badge de statut : une pastille placée sur la rampe d'avancement, puis le mot.
 *
 * Le mot porte le sens, la pastille situe l'étape dans le cycle. Auparavant chaque
 * statut avait son fond coloré — six teintes vives répétées sur chaque ligne du
 * tableau, qui saturaient l'écran sans rien ajouter au libellé.
 */
export default function StatutBadge({
  st,
  engine,
  size = "md",
}: {
  st: Statut;
  engine: Engine;
  size?: "sm" | "md";
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        flex: "0 0 auto",
        padding: size === "sm" ? "2px 8px 2px 7px" : "3px 10px 3px 8px",
        borderRadius: RADIUS.pill,
        border: "1px solid " + LINE.base,
        background: ST[st].bg,
        color: INK.base,
        fontSize: size === "sm" ? FS.micro : FS.small,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <Dot color={ST[st].accent} />
      {engine.statutLabel(st)}
    </span>
  );
}

export function Dot({ color, size = 7 }: { color: string; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: "0 0 auto",
        borderRadius: 2,
        background: color,
      }}
    />
  );
}
