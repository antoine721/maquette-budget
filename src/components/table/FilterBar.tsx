import {
  CAT,
  ENTITIES,
  METRICS,
  PER_MONTHS,
  SORTS,
  STATUT_OPTS,
  type MetricKey,
} from "../../data/constants";
import type { Store } from "../../state/store";
import { BRAND, FS, INK, LINE, RADIUS, STATE, SURFACE } from "../../theme";
import { Button, Chip, Dropdown } from "../ui";

/**
 * Contrôles du tableau : ce qu'on cherche, ce qu'on affiche, et ce qui restreint
 * la liste.
 *
 * La seconde ligne est la réponse au « il me manque des chantiers » : tout filtre
 * qui retire des lignes — y compris ceux posés par un clic depuis l'accueil ou le
 * pilotage — s'affiche en clair, se retire d'une croix, et se remet à zéro d'un
 * bouton. L'exercice, lui, se choisit dans le header, pour toute l'application.
 */
export default function FilterBar({ store }: { store: Store }) {
  const { state, engine, set, setSearch, undoLast, toast } = store;
  const catLabel = state.cat === "Total" ? "CA total" : "CA " + state.cat;
  const met = engine.metric;
  const list = engine.filtered();
  const flaggedCount = Object.values(state.flags).filter(Boolean).length;
  const allStatuts = state.fStatuts.length === STATUT_OPTS.length;

  /** Ce qui retire des lignes de la liste — jamais ce qui change seulement l'affichage. */
  const chips: { label: string; value: string; clear: () => void }[] = [];
  if (state.fSearch)
    chips.push({
      label: "Recherche",
      value: state.fSearch,
      clear: () => set({ fSearch: "", searchDraft: "" }),
    });
  if (state.onlyTodo)
    chips.push({ label: "Vue", value: "À traiter uniquement", clear: () => set({ onlyTodo: false }) });
  if (state.onlyFlagged)
    chips.push({ label: "Vue", value: "Signalés uniquement", clear: () => set({ onlyFlagged: false }) });
  if (state.fRex !== "Tous")
    chips.push({ label: "Responsable", value: state.fRex, clear: () => set({ fRex: "Tous" }) });
  if (state.fEntity !== "Toutes")
    chips.push({ label: "Entité", value: state.fEntity, clear: () => set({ fEntity: "Toutes" }) });
  if (!allStatuts)
    chips.push({
      label: "Statuts",
      value: state.fStatuts.length ? state.fStatuts.map((s) => engine.statutLabel(s)).join(", ") : "aucun",
      clear: () => set({ fStatuts: [...STATUT_OPTS] }),
    });

  const reset = () =>
    set({
      fSearch: "",
      searchDraft: "",
      onlyTodo: false,
      onlyFlagged: false,
      fRex: "Tous",
      fEntity: "Toutes",
      fStatuts: [...STATUT_OPTS],
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 200 }}>
          <input
            value={state.searchDraft}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Chercher un code, un site, une ville…"
            style={{
              width: "100%",
              padding: "8px 30px 8px 12px",
              border: "1px solid " + LINE.base,
              borderRadius: RADIUS.control,
              background: SURFACE.card,
              fontSize: FS.body,
              color: INK.strong,
            }}
          />
          {state.searchDraft && (
            <button
              onClick={() => set({ fSearch: "", searchDraft: "" })}
              aria-label="Effacer la recherche"
              title="Effacer la recherche"
              style={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                width: 20,
                height: 20,
                border: 0,
                borderRadius: 5,
                background: "transparent",
                color: INK.muted,
                fontFamily: "inherit",
                fontSize: 14,
                lineHeight: "18px",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {["Toutes", ...ENTITIES.map((e) => e.code)].map((code) => {
            const e = ENTITIES.find((x) => x.code === code);
            const on = state.fEntity === code;
            return (
              <button
                key={code}
                onClick={() => set({ fEntity: code })}
                title={e ? e.name : "Toutes les entités"}
                aria-pressed={on}
                className="hov-soft"
                style={{
                  padding: "8px 13px",
                  border: "1px solid " + (on ? LINE.active : LINE.base),
                  borderRadius: RADIUS.pill,
                  background: on ? BRAND.wash : SURFACE.card,
                  color: on ? BRAND.ink : INK.muted,
                  fontFamily: "inherit",
                  fontSize: FS.small,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {code}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => set({ onlyFlagged: !state.onlyFlagged })}
          title="N'afficher que les chantiers signalés"
          aria-pressed={state.onlyFlagged}
          className="hov-soft"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            border: "1px solid " + (state.onlyFlagged ? "#f5c6c2" : LINE.base),
            borderRadius: RADIUS.pill,
            background: state.onlyFlagged ? STATE.dangerTint : SURFACE.card,
            color: state.onlyFlagged ? STATE.danger : INK.muted,
            fontFamily: "inherit",
            fontSize: FS.small,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 12 }}>⚑</span>
          Signalés
          <span style={{ fontWeight: 600, opacity: 0.75 }}>{flaggedCount}</span>
        </button>

        <span style={{ width: 1, height: 22, background: LINE.base }} />

        <Dropdown
          label="Indicateur"
          value={met.key}
          onChange={(v) => set({ metric: v as MetricKey })}
          minWidth={250}
          options={METRICS.map((m) => ({
            value: m.key,
            label: m.key === "ca" ? catLabel : m.label,
            hint: m.formula,
          }))}
        />

        {met.key === "ca" && (
          <Dropdown
            label="Catégorie"
            value={state.cat}
            onChange={(v) => set({ cat: v })}
            minWidth={210}
            options={[
              { value: "Total", label: "Toutes catégories" },
              ...CAT.map((c) => ({ value: c.label, label: c.label, hint: c.title })),
            ]}
          />
        )}

        <Dropdown
          label="Période"
          value={state.fPeriode}
          onChange={(v) => set({ fPeriode: v })}
          minWidth={200}
          options={Object.keys(PER_MONTHS).map((k) => ({
            value: k,
            label: k,
            hint: PER_MONTHS[k].length + " mois",
          }))}
        />

        <Dropdown
          label="Trier par"
          value={state.fSort}
          onChange={(v) => set({ fSort: v })}
          minWidth={220}
          align="right"
          options={SORTS.map((s) => ({ value: s, label: s }))}
        />

        {state.history.length > 0 && (
          <Button size="sm" onClick={undoLast} title="Annuler la dernière action en masse">
            Annuler
          </Button>
        )}

        <span style={{ flex: 1 }} />

        <Button
          size="sm"
          onClick={() =>
            toast("Export Excel — " + list.length + " chantiers, " + state.fPeriode + " " + state.year)
          }
        >
          Excel
        </Button>
        <Button
          size="sm"
          onClick={() =>
            toast("Export CSV — " + list.length + " chantiers, " + state.fPeriode + " " + state.year)
          }
        >
          CSV
        </Button>
      </div>

      {chips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          {chips.map((c) => (
            <Chip key={c.label + c.value} label={c.label} value={c.value} onClear={c.clear} />
          ))}
          <Button size="sm" tone="subtle" onClick={reset}>
            Tout réinitialiser
          </Button>
        </div>
      )}
    </div>
  );
}
