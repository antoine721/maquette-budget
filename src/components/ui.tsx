/**
 * Primitives d'interface — carte, badge, bouton, bascule, menu, jauge.
 *
 * L'application dessinait auparavant cinq mécaniques de sélection différentes à
 * quelques pixels les unes des autres : onglets soulignés, onglets en pilules,
 * segmented control, pilules, cases à cocher, plus des `<select>` système. Tout
 * passe désormais par ces quelques composants.
 */

import { useEffect, useRef, useState } from "react";
import { BRAND, FS, INK, LINE, RADIUS, SHADOW, STATE, SURFACE } from "../theme";

// ------------------------------------------------------------------ surfaces

export function Card({
  children,
  pad = 16,
  style,
}: {
  children: React.ReactNode;
  pad?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: SURFACE.card,
        border: "1px solid " + LINE.base,
        borderRadius: RADIUS.card,
        boxShadow: SHADOW.card,
        padding: pad,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** En-tête de carte : ce que la carte montre, sur quel périmètre, et ses contrôles. */
export function CardHead({
  title,
  hint,
  right,
}: {
  title: string;
  hint?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 12,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: FS.base, fontWeight: 700, color: INK.strong }}>{title}</div>
        {hint && (
          <div style={{ fontSize: FS.small, color: INK.muted, marginTop: 2 }}>{hint}</div>
        )}
      </div>
      {right}
    </div>
  );
}

// ---------------------------------------------------------------------- texte

export function Pill({
  children,
  fg,
  bg,
  border,
  title,
}: {
  children: React.ReactNode;
  fg: string;
  bg: string;
  border?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      style={{
        flex: "0 0 auto",
        padding: "2px 8px",
        borderRadius: RADIUS.pill,
        fontSize: FS.micro,
        fontWeight: 700,
        whiteSpace: "nowrap",
        color: fg,
        background: bg,
        border: border ? "1px solid " + border : undefined,
      }}
    >
      {children}
    </span>
  );
}

// -------------------------------------------------------------------- actions

type ButtonTone = "primary" | "ghost" | "subtle" | "good" | "dark";

const TONES: Record<ButtonTone, React.CSSProperties> = {
  primary: { background: BRAND.base, color: INK.onDark, border: "1px solid " + BRAND.base },
  good: { background: STATE.good, color: INK.onDark, border: "1px solid " + STATE.good },
  dark: { background: INK.base, color: INK.onDark, border: "1px solid " + INK.base },
  ghost: { background: SURFACE.card, color: INK.base, border: "1px solid " + LINE.base },
  subtle: { background: "transparent", color: INK.muted, border: "1px solid transparent" },
};

export function Button({
  children,
  onClick,
  tone = "ghost",
  size = "md",
  disabled,
  title,
  style,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  tone?: ButtonTone;
  size?: "sm" | "md";
  disabled?: boolean;
  title?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={tone === "ghost" || tone === "subtle" ? "hov-soft" : "hov-lift"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: size === "sm" ? "6px 11px" : "8px 14px",
        borderRadius: RADIUS.control,
        fontFamily: "inherit",
        fontSize: size === "sm" ? FS.small : FS.body,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        whiteSpace: "nowrap",
        ...TONES[tone],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/**
 * Bascule cochable — statuts du tableau, séries d'un graphique, périmètres.
 * `accent` colore la case quand la bascule porte une couleur de série.
 */
export function Toggle({
  on,
  onClick,
  children,
  accent = BRAND.base,
  title,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: string;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={on}
      className="hov-soft"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "5px 11px",
        border: "1px solid " + (on ? LINE.active : LINE.base),
        borderRadius: RADIUS.pill,
        background: on ? BRAND.wash : SURFACE.card,
        color: on ? INK.strong : INK.muted,
        fontFamily: "inherit",
        fontSize: FS.small,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      <Check on={on} accent={accent} />
      {children}
    </button>
  );
}

function Check({ on, accent }: { on: boolean; accent: string }) {
  return (
    <span
      style={{
        width: 13,
        height: 13,
        flex: "0 0 auto",
        borderRadius: 3,
        border: "1px solid " + (on ? accent : "#cbd5e1"),
        background: on ? accent : SURFACE.card,
        color: INK.onDark,
        fontSize: 10,
        lineHeight: "11px",
        textAlign: "center",
      }}
    >
      {on ? "✓" : ""}
    </span>
  );
}

/** Filtre actif : ce qui restreint la vue, et de quoi le retirer. */
export function Chip({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 6px 4px 10px",
        border: "1px solid " + LINE.active,
        borderRadius: RADIUS.pill,
        background: BRAND.wash,
        fontSize: FS.small,
        color: INK.base,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color: INK.muted }}>{label}</span>
      <b style={{ fontWeight: 700, color: BRAND.ink }}>{value}</b>
      <button
        onClick={onClear}
        aria-label={"Retirer le filtre " + label}
        title={"Retirer le filtre " + label}
        className="hov-soft"
        style={{
          width: 18,
          height: 18,
          padding: 0,
          border: 0,
          borderRadius: 5,
          background: "transparent",
          color: INK.muted,
          fontFamily: "inherit",
          fontSize: 13,
          lineHeight: "16px",
          cursor: "pointer",
        }}
      >
        ×
      </button>
    </span>
  );
}

// ----------------------------------------------------------------------- menu

export interface DropdownOption {
  value: string;
  label: string;
  hint?: string;
}

/**
 * Menu déroulant dessiné. Un `<select>` système ne sait afficher ni l'état d'une
 * option ni une seconde ligne, et ne se laisse pas mettre au style du reste.
 */
export function Dropdown({
  value,
  options,
  onChange,
  label,
  align = "left",
  minWidth = 200,
  trigger,
  title,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  label?: string;
  align?: "left" | "right";
  minWidth?: number;
  trigger?: (open: boolean) => React.ReactNode;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement | null>(null);
  const current = options.find((o) => o.value === value);

  // Le menu ne survit ni à un clic ailleurs, ni à la touche d'échappement.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={title}
        className="hov-soft"
        style={
          trigger
            ? { border: 0, background: "transparent", padding: 0, cursor: "pointer", fontFamily: "inherit" }
            : {
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 11px",
                border: "1px solid " + (open ? LINE.active : LINE.base),
                borderRadius: RADIUS.control,
                background: SURFACE.card,
                fontFamily: "inherit",
                fontSize: FS.body,
                fontWeight: 600,
                color: INK.strong,
                cursor: "pointer",
              }
        }
      >
        {trigger ? (
          trigger(open)
        ) : (
          <>
            {label && <span style={{ fontWeight: 500, color: INK.muted }}>{label}</span>}
            {current?.label ?? value}
            <Caret open={open} />
          </>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            [align]: 0,
            zIndex: 40,
            minWidth,
            padding: 6,
            background: SURFACE.card,
            border: "1px solid " + LINE.base,
            borderRadius: RADIUS.card,
            boxShadow: SHADOW.menu,
          }}
        >
          {options.map((o) => {
            const on = o.value === value;
            return (
              <button
                key={o.value}
                role="option"
                aria-selected={on}
                className={on ? undefined : "hov-soft"}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "8px 10px",
                  border: 0,
                  borderRadius: RADIUS.control,
                  background: on ? BRAND.tint : "transparent",
                  fontFamily: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: FS.body,
                      fontWeight: on ? 700 : 600,
                      color: on ? BRAND.ink : INK.strong,
                    }}
                  >
                    {o.label}
                  </span>
                  {o.hint && (
                    <span style={{ display: "block", fontSize: FS.micro, color: INK.muted }}>
                      {o.hint}
                    </span>
                  )}
                </span>
                {on && <Tick />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Caret({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={INK.muted}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 140ms" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function Tick() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke={BRAND.base}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// --------------------------------------------------------------------- mesure

/** Barre de progression : une part d'un tout, sur la piste de la même teinte. */
export function Meter({
  pct,
  color = BRAND.base,
  height = 6,
  width,
}: {
  pct: number;
  color?: string;
  height?: number;
  width?: number | string;
}) {
  return (
    <div
      style={{
        width: width ?? "100%",
        height,
        borderRadius: height,
        background: "#eef1f4",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height,
          width: Math.max(0, Math.min(100, pct)) + "%",
          background: color,
          borderRadius: height,
          transition: "width 300ms",
        }}
      />
    </div>
  );
}

/**
 * Tuile d'indicateur. Le libellé dit ce qui est compté, la précision dit sur quoi :
 * c'est ce qui manquait quand quatre pourcentages d'avancement cohabitaient sans
 * qu'on puisse les rapprocher.
 */
export function Kpi({
  label,
  value,
  hint,
  meter,
  tone,
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  meter?: { pct: number; color?: string };
  tone?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div style={{ fontSize: FS.micro, fontWeight: 700, color: INK.muted, letterSpacing: "0.3px" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: FS.title,
          fontWeight: 700,
          color: tone ?? INK.strong,
          letterSpacing: "-0.5px",
          marginTop: 4,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {meter && (
        <div style={{ marginTop: 8 }}>
          <Meter pct={meter.pct} color={meter.color} height={5} />
        </div>
      )}
      {hint && <div style={{ fontSize: FS.small, color: INK.muted, marginTop: 6 }}>{hint}</div>}
    </>
  );

  const style: React.CSSProperties = {
    flex: "1 1 190px",
    minWidth: 170,
    background: SURFACE.card,
    border: "1px solid " + LINE.base,
    borderRadius: RADIUS.card,
    boxShadow: SHADOW.card,
    padding: "12px 14px 14px",
    textAlign: "left",
    fontFamily: "inherit",
  };

  if (!onClick) return <div style={style}>{inner}</div>;
  return (
    <button className="hov-soft" onClick={onClick} style={{ ...style, cursor: "pointer" }}>
      {inner}
    </button>
  );
}

/**
 * En-tête d'écran : où l'on est, sur quoi porte la page, et son geste principal.
 * Le même bloc ouvre l'accueil, le tableau et le pilotage — un onglet actif ne
 * suffit pas à dire ce que l'on regarde.
 */
export function PageHead({
  eyebrow,
  title,
  hint,
  right,
  dot,
}: {
  eyebrow: string;
  title: string;
  hint?: string;
  right?: React.ReactNode;
  dot?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 16,
        flexWrap: "wrap",
        padding: "2px 2px 0",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {dot && <span style={{ width: 6, height: 6, borderRadius: 3, background: dot }} />}
          <span
            style={{
              fontSize: FS.micro,
              fontWeight: 700,
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              color: dot ? BRAND.strong : INK.muted,
            }}
          >
            {eyebrow}
          </span>
        </div>
        <h1
          style={{
            margin: "4px 0 0",
            fontSize: FS.title,
            fontWeight: 700,
            letterSpacing: "-0.5px",
            color: INK.strong,
          }}
        >
          {title}
        </h1>
        {hint && <div style={{ fontSize: FS.body, color: INK.muted, marginTop: 2 }}>{hint}</div>}
      </div>
      <span style={{ flex: 1 }} />
      {right}
    </div>
  );
}

/** Écran vide : ce qu'il n'y a pas, et le geste qui le remplit. */
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        textAlign: "center",
        padding: "28px 24px",
        border: "1px dashed " + LINE.base,
        borderRadius: RADIUS.card,
        background: SURFACE.sunken,
      }}
    >
      <div style={{ fontSize: FS.body, fontWeight: 700, color: INK.base }}>{title}</div>
      {hint && <div style={{ fontSize: FS.small, color: INK.muted, maxWidth: 460 }}>{hint}</div>}
      {action}
    </div>
  );
}
