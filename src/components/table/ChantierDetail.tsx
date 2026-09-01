import { useEffect, useRef } from "react";
import type { Statut } from "../../data/constants";
import type { Chantier } from "../../data/chantiers";
import { buildDetail, menuActions, menuPlaceholder, type DetailLine } from "../../lib/detail";
import type { Store } from "../../state/store";
import { BRAND, FS, INK, LINE, RADIUS, STATE, SURFACE } from "../../theme";

/** Une teinte par zone : d'où part le budget, ce qu'on saisit, ce qui en découle. */
const SECTION_ACCENT = [INK.muted, BRAND.base, "#8b5cf6"];

/** Détail du calcul d'un chantier : les trois groupes de lignes et le circuit de validation. */
export default function ChantierDetail({
  store,
  ch,
  mIdx,
  gridColsDetail,
}: {
  store: Store;
  ch: Chantier;
  mIdx: number[];
  gridColsDetail: string;
}) {
  const {
    state,
    engine,
    set,
    setCell,
    setChantierRef,
    toast,
    setStatutFlow,
    validateBudget,
  } = store;
  const met = engine.metric;
  const cat = state.cat;
  const st = engine.st(ch) as Statut;
  const isCG = engine.isCG;
  const isExploit = engine.isExploit;

  const detail = buildDetail(engine, state, ch, mIdx);
  // Les lignes arrivent à plat ; chaque en-tête ouvre la zone qui le suit.
  const sections: { head: DetailLine; lines: DetailLine[] }[] = [];
  detail.forEach((d) => {
    if (d.head) sections.push({ head: d, lines: [] });
    else sections[sections.length - 1]?.lines.push(d);
  });
  const rowSaisi = engine.aggregate([ch], mIdx, "saisi", met.key, cat);
  const rowBase = engine.aggregate([ch], mIdx, "base", met.key, cat);
  const filledM = mIdx.filter((m) => engine.prims(ch, m, "saisi"));
  const cristal = engine.cristal(ch);
  // Un budget incomplet ne part pas en validation.
  const reste = engine.remainingToSubmit(ch);

  const predRate = rowBase && rowSaisi !== null ? Math.round((rowSaisi / rowBase) * 100) + " %" : "—";
  const predRateColor = (() => {
    if (!rowBase || rowSaisi === null) return "#94a3b8";
    const r = rowSaisi / rowBase;
    return r >= 1 ? STATE.good : r > 0.97 ? STATE.warn : STATE.danger;
  })();

  const trace =
    st === "Non budgétisé"
      ? "Baseline publiée : le budget " +
        state.year +
        " reste entièrement à construire sur ce chantier."
      : st === "En attente baseline CG"
        ? "Baseline saisie par le contrôle de gestion — non encore publiée à l'exploitation."
        : st === "À valider"
          ? "Cristallisation n°" +
            (cristal + 1) +
            " en attente de validation du contrôle de gestion."
          : st === "Validé"
            ? "Cristallisation n°" +
              cristal +
              " validée — toute correction ouvrira une nouvelle cristallisation."
            : st === "Clôturé"
              ? "Exercice clos — le budget n'est plus d'actualité, consultation seule."
              : "Baseline vérifiée · " +
                (filledM.length ? filledM.length + "/" + mIdx.length + " mois saisis" : "aucune saisie");

  return (
    <div
      style={{
        padding: "4px 16px 20px 40px",
        background: "#fbfcfd",
        borderTop: "1px dashed #e6eaee",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 0 6px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            color: "#6b7681",
          }}
        >
          Détail du calcul — {ch.id}
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            color: "#6b7681",
            background: "#fff",
            border: "1px solid #e6eaee",
            borderRadius: 6,
            padding: "4px 9px",
          }}
        >
          {met.formula + "  ·  PAD = Prestations à la Demande  ·  TE = Travaux Exceptionnels"}
        </div>
        <span style={{ flex: 1 }} />
        <CristalBadge n={cristal} pending={st === "À valider"} />
      </div>

      {sections.map((sec) => (
        <section
          key={sec.head.id}
          style={{
            marginTop: 14,
            border: "1px solid " + LINE.base,
            borderRadius: RADIUS.card,
            background: SURFACE.card,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              background: SURFACE.sunken,
              borderBottom: "1px solid " + LINE.base,
              borderLeft: "3px solid " + SECTION_ACCENT[sec.head.head!.index - 1],
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                flex: "0 0 auto",
                borderRadius: "50%",
                background: SECTION_ACCENT[sec.head.head!.index - 1],
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {sec.head.head!.index}
            </span>
            <span style={{ fontSize: FS.body, fontWeight: 700, color: INK.strong }}>
              {sec.head.label}
            </span>
            <span style={{ fontSize: FS.small, color: INK.muted }}>{sec.head.head!.hint}</span>
          </div>

          {sec.lines.map((d) => (
        <div
          key={d.id}
          style={{
            display: "grid",
            gridTemplateColumns: gridColsDetail,
            alignItems: "center",
            borderTop: "1px solid " + d.sepColor,
            background: d.rowBg,
          }}
        >
          <div
            style={{
              padding: d.pad,
              fontSize: d.size,
              fontWeight: d.weight,
              color: d.labelColor,
              letterSpacing: d.spacing,
              textTransform: d.transform as React.CSSProperties["textTransform"],
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span
                onClick={
                  d.toggleCa
                    ? (e) => {
                        e.stopPropagation();
                        set((p) => ({
                          openCa: { ...p.openCa, [ch.id]: p.openCa[ch.id] === false },
                        }));
                      }
                    : undefined
                }
                title={d.title}
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  cursor: d.cursor,
                }}
              >
                {d.label}
              </span>
              {d.quick && <LineQuick store={store} ch={ch} line={d} onBaseline={isCG} />}
            </span>
            {d.applied && (
              <span
                title={d.applied.title}
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: INK.faint,
                  letterSpacing: 0,
                  textTransform: "none",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {d.applied.label}
              </span>
            )}
          </div>

          {d.cells.map((c, i) => (
            <div key={i} style={{ padding: "5px 4px", textAlign: "right" }}>
              {c.editable ? (
                <input
                  value={c.raw}
                  onChange={(e) =>
                    c.refId
                      ? setChantierRef(c.refId, ch, c.month!, e.target.value)
                      : setCell(ch, c.field!, c.month!, e.target.value, !!c.onBaseline)
                  }
                  placeholder={c.ghost}
                  title={c.ghostTitle}
                  style={{
                    width: "100%",
                    padding: 6,
                    textAlign: "right",
                    border: "1px " + (c.dash || "solid") + " " + c.border,
                    borderRadius: 6,
                    background: c.bg || "#fff",
                    fontSize: 13,
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 600,
                    color: c.fg,
                  }}
                />
              ) : (
                <span
                  style={{
                    display: "block",
                    padding: "6px 4px",
                    borderRadius: 6,
                    background: c.bg,
                    fontSize: 13,
                    fontVariantNumeric: "tabular-nums",
                    color: c.color,
                  }}
                >
                  {c.text}
                </span>
              )}
            </div>
          ))}

          <div
            style={{
              padding: "9px 16px",
              textAlign: "right",
              fontSize: 13,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              color: d.totalColor,
            }}
          >
            {d.total}
          </div>
        </div>
          ))}
        </section>
      ))}

      {/* Bandeau de clôture : le récapitulatif chiffré, puis les actions du circuit. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 18,
          padding: "12px 14px",
          background: "#fff",
          border: "1px solid #e6eaee",
          borderRadius: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Stat label="Prévu CG" value={engine.fmt(rowBase, met.kind)} color="#475569" />
          <Sep />
          <Stat label="Déclaré" value={engine.fmt(rowSaisi, met.kind)} color="#17202a" />
          <Sep />
          <Stat label="% objectif" value={predRate} color={predRateColor} />
          <Sep />
          <Stat
            label="Couverture"
            value={filledM.length + "/" + mIdx.length + " mois saisis"}
            color="#6b7681"
            small
          />
        </div>

        <span style={{ flex: 1 }} />

        {isCG && st === "En attente baseline CG" && (
          <FlowButton
            bg="#475569"
            onClick={(e) => {
              e.stopPropagation();
              setStatutFlow(
                ch,
                "Non budgétisé",
                "Baseline " + ch.id + " publiée — saisie exploitation ouverte",
              );
            }}
          >
            Publier la baseline à l'exploitation
          </FlowButton>
        )}
        {isExploit && (st === "En saisie" || st === "Non budgétisé") && (
          <FlowButton
            bg="#0a9bd8"
            disabled={reste > 0}
            title={
              reste > 0
                ? reste +
                  " champ" +
                  (reste > 1 ? "s" : "") +
                  " encore vide" +
                  (reste > 1 ? "s" : "") +
                  " — le budget doit être complet pour partir en validation"
                : "Envoyer la cristallisation n°" + (cristal + 1) + " au contrôle de gestion"
            }
            onClick={(e) => {
              e.stopPropagation();
              if (reste > 0) {
                toast(
                  "Budget incomplet — " +
                    reste +
                    " champ" +
                    (reste > 1 ? "s" : "") +
                    " à renseigner avant l'envoi en validation",
                );
                return;
              }
              setStatutFlow(
                ch,
                "À valider",
                ch.id + " envoyé en validation — cristallisation n°" + (cristal + 1),
              );
            }}
          >
            {reste > 0 ? "Envoyer en validation (" + reste + " à remplir)" : "Envoyer en validation"}
          </FlowButton>
        )}
        {isCG && st === "À valider" && (
          <FlowButton
            bg="#16a34a"
            onClick={(e) => {
              e.stopPropagation();
              validateBudget(ch);
            }}
          >
            Valider ce budget
          </FlowButton>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast("Export de " + ch.id + " en cours…");
          }}
          style={{
            padding: "9px 15px",
            border: "1px solid #dde3e8",
            borderRadius: 8,
            background: "#fff",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            color: "#3b4753",
            cursor: "pointer",
          }}
        >
          Exporter ce chantier
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 10,
        }}
      >
        <div style={{ fontSize: 13, color: "#6b7681" }}>{trace}</div>
        <span style={{ flex: 1 }} />
      </div>
    </div>
  );
}

/** Rappelle où en est le budget dans le cycle de cristallisation. */
function CristalBadge({ n, pending }: { n: number; pending: boolean }) {
  if (!n && !pending) return null;
  return (
    <span
      title="Chaque envoi en validation crée une cristallisation ; corriger un budget validé en ouvre une nouvelle."
      style={{
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: pending ? "#e0f2fe" : "#dcfce7",
        color: pending ? "#075985" : "#166534",
        border: "1px solid " + (pending ? "#bae6fd" : "#bbf7d0"),
        whiteSpace: "nowrap",
      }}
    >
      {pending ? "Cristallisation n°" + (n + 1) + " à valider" : "Cristallisation n°" + n + " validée"}
    </span>
  );
}

/** Badge de complétion + menu ⋯ des actions en masse propres à la ligne. */
function LineQuick({
  store,
  ch,
  line,
  onBaseline,
}: {
  store: Store;
  ch: Chantier;
  line: DetailLine;
  onBaseline: boolean;
}) {
  const { state, set, applyAction, toast } = store;
  const q = line.quick!;
  const menuOpen = state.openMenu === q.menuId;
  const listOpen = menuOpen && !state.menuStep;
  const stepOpen = menuOpen && !!state.menuStep;
  const wrap = useRef<HTMLSpanElement | null>(null);

  // Le menu se referme au clic ailleurs et à l'échappement : il ne restait ouvert
  // que jusqu'au prochain clic sur son propre bouton.
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => set({ openMenu: null, menuStep: null, menuValue: "" });
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, set]);

  return (
    <span
      ref={wrap}
      style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flex: "0 0 auto" }}
    >
      <span
        title={q.doneTitle}
        style={{
          padding: "2px 8px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 700,
          background: q.doneBg,
          color: q.doneFg,
          whiteSpace: "nowrap",
        }}
      >
        {q.doneLabel}
      </span>

      <span style={{ position: "relative" }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            set({ openMenu: menuOpen ? null : q.menuId, menuStep: null, menuValue: "" });
          }}
          title="Actions en masse sur cette ligne"
          style={{
            width: 24,
            height: 24,
            border: "1px solid #dde3e8",
            borderRadius: 6,
            background: "#fff",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 700,
            color: "#6b7681",
            cursor: "pointer",
            padding: 0,
          }}
        >
          ⋯
        </button>

        {menuOpen && (
          <>
            <span
              onClick={(e) => {
                e.stopPropagation();
                set({ openMenu: null, menuStep: null });
              }}
              style={{ position: "fixed", inset: 0, zIndex: 19, display: "block" }}
            />
            <span
              style={{
                position: "absolute",
                top: 28,
                right: 0,
                zIndex: 20,
                width: 262,
                display: "flex",
                flexDirection: "column",
                gap: 3,
                padding: 10,
                background: "#fff",
                border: "1px solid #e6eaee",
                borderRadius: 10,
                boxShadow: "0 14px 32px rgba(15,23,42,0.16)",
              }}
            >
              {listOpen &&
                menuActions().map((a) => (
                  <button
                    key={a.act}
                    className="hov-f4"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (a.needs) {
                        set({ menuStep: a.act, menuValue: "" });
                        return;
                      }
                      applyAction(ch, q.fields, q.editableMonths, a.act, state.menuValue, onBaseline);
                      set({ openMenu: null, menuStep: null });
                    }}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      border: 0,
                      borderRadius: 7,
                      background: "transparent",
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 600,
                      color: a.color,
                      cursor: "pointer",
                    }}
                  >
                    {a.label}
                  </button>
                ))}

              {stepOpen && (
                <span style={{ display: "flex", flexDirection: "column", gap: 8, padding: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#17202a" }}>
                    {state.menuStep}
                  </span>
                  <input
                    value={state.menuValue}
                    onChange={(e) => set({ menuValue: e.target.value })}
                    placeholder={menuPlaceholder(state.menuStep!)}
                    style={{
                      padding: "8px 10px",
                      border: "1px solid #dde3e8",
                      borderRadius: 7,
                      background: "#fff",
                      fontSize: 13,
                      fontVariantNumeric: "tabular-nums",
                      color: "#17202a",
                    }}
                  />
                  <span style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (String(state.menuValue).trim() === "") {
                          toast("Renseignez une valeur");
                          return;
                        }
                        applyAction(
                          ch,
                          q.fields,
                          q.editableMonths,
                          state.menuStep!,
                          state.menuValue,
                          onBaseline,
                        );
                        set({ openMenu: null, menuStep: null, menuValue: "" });
                      }}
                      style={{
                        flex: 1,
                        padding: 8,
                        border: 0,
                        borderRadius: 7,
                        background: BRAND.base,
                        color: "#fff",
                        fontFamily: "inherit",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Appliquer
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        set({ menuStep: null });
                      }}
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #dde3e8",
                        borderRadius: 7,
                        background: "#fff",
                        fontFamily: "inherit",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7681",
                        cursor: "pointer",
                      }}
                    >
                      Retour
                    </button>
                  </span>
                </span>
              )}
            </span>
          </>
        )}
      </span>
    </span>
  );
}

function Stat({
  label,
  value,
  color,
  small,
}: {
  label: string;
  value: string;
  color: string;
  small?: boolean;
}) {
  return (
    <span style={{ display: "flex", flexDirection: "column" }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          color: "#6b7681",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: small ? 13 : 14,
          fontWeight: small ? 600 : 700,
          color,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </span>
  );
}

function Sep() {
  return <span style={{ width: 1, height: 26, background: "#eef1f4" }} />;
}

function FlowButton({
  bg,
  onClick,
  children,
  disabled,
  title,
}: {
  bg: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: "9px 15px",
        border: disabled ? "1px solid #e2e8f0" : 0,
        borderRadius: 8,
        background: disabled ? "#f1f5f9" : bg,
        color: disabled ? INK.faint : "#fff",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
