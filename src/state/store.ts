import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CONFIG } from "../config";
import { AGENCES, CAT, MONTHS, type Statut } from "../data/constants";
import type { Chantier } from "../data/chantiers";
import { Engine } from "../lib/engine";
import type { AppState, EditMap, EditStore, HistoryEntry } from "../lib/types";

function initialState(): AppState {
  const periods: Record<string, boolean[]> = {};
  AGENCES.forEach((a) => (periods[a] = MONTHS.map(() => true)));
  return {
    year: CONFIG.campaignYear,
    role: CONFIG.defaultRole,
    tab: CONFIG.startTab,
    metric: "ca",
    cat: "Total",
    refs: [
      {
        id: "infl",
        label: "Inflation",
        role: "Source INSEE — saisie contrôle de gestion",
        dot: "#0a9bd8",
        values: [2.4, 2.4, 2.3, 2.3, 2.2, 2.2, 2.1, 2.1, 2.0, 2.0, 2.0, 1.9],
      },
      {
        id: "reval",
        label: "Revalorisation contractuelle",
        role: "Indexation clients au 1er avril",
        dot: "#16a34a",
        values: [0, 0, 0, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8],
      },
    ],
    fSort: "Priorité à déclarer",
    fSecteur: "Tous les secteurs",
    fVille: "Toutes les villes",
    fAgence: "Toutes les agences",
    fClient: "Tous les clients",
    fStatut: "Tous les statuts",
    fSearch: "",
    searchDraft: "",
    fPeriode: "Année complète",
    fEntity: "Toutes",
    fTag: "Tous les tags",
    fRex: "Tous",
    onlyTodo: false,
    openRow: null,
    openCa: {},
    openMenu: null,
    menuStep: null,
    menuValue: "",
    edits: {},
    baseEdits: {},
    statutOverride: {},
    history: [],
    tags: {
      "C00027-001": ["Sensible"],
      "C00034-003": ["Perte de marge"],
      "C00088-001": ["Nouveau marché"],
    },
    periods,
    pageSize: 40,
    hoverPie: null,
    hoverSeg: null,
    toast: "",
  };
}

/** Tout ce qui invalide le cache de calcul. Un survol n'en fait pas partie. */
function signature(s: AppState): string {
  return [
    s.year,
    s.role,
    s.tab,
    s.fEntity,
    s.fSecteur,
    s.fVille,
    s.fAgence,
    s.fClient,
    s.fStatut,
    s.fSearch,
    s.fPeriode,
    s.fSort,
    s.fTag,
    s.fRex,
    s.onlyTodo,
    s.metric,
    s.cat,
    JSON.stringify(s.edits),
    JSON.stringify(s.baseEdits),
    JSON.stringify(s.statutOverride),
    JSON.stringify(s.periods),
    JSON.stringify(s.tags),
    JSON.stringify(s.refs),
    s.history.length,
  ].join("|");
}

export type Patch = Partial<AppState>;

export function useApp() {
  const [state, setRawState] = useState<AppState>(initialState);
  const toastTimer = useRef<number | undefined>(undefined);
  const searchTimer = useRef<number | undefined>(undefined);
  const cacheRef = useRef<{ sig: string; m: Record<string, unknown> }>({ sig: "", m: {} });

  useEffect(
    () => () => {
      window.clearTimeout(toastTimer.current);
      window.clearTimeout(searchTimer.current);
    },
    [],
  );

  const set = useCallback((patch: Patch | ((prev: AppState) => Patch)) => {
    setRawState((prev) => ({
      ...prev,
      ...(typeof patch === "function" ? patch(prev) : patch),
    }));
  }, []);

  const toast = useCallback(
    (msg: string) => {
      set({ toast: msg });
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => set({ toast: "" }), 2600);
    },
    [set],
  );

  const sig = signature(state);
  if (cacheRef.current.sig !== sig) cacheRef.current = { sig, m: {} };
  const engine = useMemo(
    () => new Engine(state, cacheRef.current.m),
    // Le cache est partagé tant que la signature ne bouge pas ; l'instance, elle,
    // doit suivre chaque changement d'état (survols compris).
    [state],
  );

  /** Enregistre une action en masse et son état précédent, pour pouvoir l'annuler. */
  const commit = useCallback(
    (
      store: EditStore,
      next: EditMap,
      label: string,
      count: number,
      ch: Chantier,
      fields: string[],
      short?: string,
    ) => {
      const entry: HistoryEntry = {
        label,
        short: short || label,
        count,
        cible: ch.id,
        store,
        fields: fields || [],
        prev: state[store],
      };
      set(
        (prev) =>
          ({
            [store]: next,
            history: prev.history.concat([entry]).slice(-12),
          }) as Patch,
      );
      toast(label + " · " + count + " cellules — " + ch.id);
    },
    [set, state, toast],
  );

  const undoLast = useCallback(() => {
    const h = state.history;
    if (!h.length) return;
    const last = h[h.length - 1];
    set({ [last.store]: last.prev, history: h.slice(0, -1) } as Patch);
    toast("Annulé : " + last.label + " (" + last.cible + ")");
  }, [set, state.history, toast]);

  const setStatutFlow = useCallback(
    (ch: Chantier, st: Statut, msg: string) => {
      set((prev) => ({ statutOverride: { ...prev.statutOverride, [ch.id]: st } }));
      toast(msg);
    },
    [set, toast],
  );

  /** Applique une action en masse sur une ligne (baseline en rôle CG, prévisionnel sinon). */
  const applyAction = useCallback(
    (
      ch: Chantier,
      fields: string[],
      mList: number[],
      action: string,
      valRaw: string,
      onBaseline: boolean,
    ) => {
      const val = parseFloat(String(valRaw).replace(",", ".").replace(/[^\d.-]/g, ""));
      const store: EditStore = onBaseline ? "baseEdits" : "edits";
      const next: EditMap = { ...state[store] };
      let touched = 0;
      if (!mList.length) return toast("Aucun mois modifiable dans le périmètre");

      /** Valeur courante de la cellule, baseline si rien n'a encore été déclaré. */
      const current = (f: string, m: number) =>
        onBaseline
          ? engine.baseField(ch, m, f)
          : engine.saisiField(ch, m, f) === null
            ? engine.baseField(ch, m, f)
            : (engine.saisiField(ch, m, f) as number);

      if (action.indexOf("Reprendre les valeurs ") === 0) {
        const src = parseInt(action.replace(/\D/g, ""), 10);
        const srcEngine = engine.forYear(src);
        fields.forEach((f) =>
          mList.forEach((m) => {
            const v = srcEngine.saisiField(ch, m, f);
            const b = srcEngine.baseField(ch, m, f);
            next[engine.ek(ch, f, m)] = Math.round(v === null ? b : v);
            touched++;
          }),
        );
      } else if (action === "Arrondir à la centaine") {
        fields.forEach((f) =>
          mList.forEach((m) => {
            next[engine.ek(ch, f, m)] = Math.round(current(f, m) / 100) * 100;
            touched++;
          }),
        );
      } else if (action === "Vider la saisie" || action === "Vider la ligne") {
        fields.forEach((f) =>
          mList.forEach((m) => {
            next[engine.ek(ch, f, m)] = null;
            touched++;
          }),
        );
      } else if (action === "Recopier la baseline sur tous les mois") {
        fields.forEach((f) =>
          mList.forEach((m) => {
            next[engine.ek(ch, f, m)] = Math.round(engine.baseField(ch, m, f));
            touched++;
          }),
        );
      } else if (action === "Recopier le 1er mois saisi sur tous les mois") {
        fields.forEach((f) => {
          const src = mList.find((m) => engine.saisiField(ch, m, f) !== null);
          if (src === undefined) return;
          const v = Math.round(
            onBaseline ? engine.baseField(ch, src, f) : (engine.saisiField(ch, src, f) as number),
          );
          mList.forEach((m) => {
            next[engine.ek(ch, f, m)] = v;
            touched++;
          });
        });
      } else if (action === "Appliquer un % d'évolution") {
        if (isNaN(val)) return toast("Saisissez un pourcentage, ex. 2,5");
        fields.forEach((f) =>
          mList.forEach((m) => {
            next[engine.ek(ch, f, m)] = Math.round(current(f, m) * (1 + val / 100));
            touched++;
          }),
        );
      } else if (action === "Saisir une valeur fixe par mois") {
        if (isNaN(val)) return toast("Saisissez un montant");
        fields.forEach((f) =>
          mList.forEach((m) => {
            next[engine.ek(ch, f, m)] = Math.round(val);
            touched++;
          }),
        );
      } else if (action === "Répartir un total sur la période") {
        if (isNaN(val)) return toast("Saisissez le total à répartir");
        let sum = 0;
        fields.forEach((f) => mList.forEach((m) => (sum += engine.baseField(ch, m, f))));
        if (!sum) return toast("Répartition impossible : baseline vide");
        fields.forEach((f) =>
          mList.forEach((m) => {
            next[engine.ek(ch, f, m)] = Math.round((val * engine.baseField(ch, m, f)) / sum);
            touched++;
          }),
        );
      }

      if (!touched) return toast("Aucune cellule modifiable dans le périmètre");

      const shorts: Record<string, string> = {
        "Recopier la baseline sur tous les mois": "objectif CG repris",
        "Recopier le 1er mois saisi sur tous les mois": "1er mois recopié",
        "Appliquer un % d'évolution":
          (val > 0 ? "+" : "") + String(val).replace(".", ",") + " % appliqué",
        "Saisir une valeur fixe par mois": "valeur fixe " + engine.fmt(val) + "/mois",
        "Répartir un total sur la période": "total " + engine.fmt(val) + " réparti",
        "Arrondir à la centaine": "arrondi à la centaine",
        "Vider la ligne": "ligne vidée",
        "Vider la saisie": "saisie vidée",
      };
      if (action.indexOf("Reprendre les valeurs ") === 0)
        shorts[action] = "valeurs " + action.replace(/\D/g, "") + " reprises";

      commit(
        store,
        next,
        action + " · " + engine.fieldNames(fields),
        touched,
        ch,
        fields,
        shorts[action] || action,
      );
    },
    [commit, engine, state, toast],
  );

  /** Saisie directe d'une cellule (prévisionnel ou baseline). */
  const setCell = useCallback(
    (ch: Chantier, field: string, m: number, raw: string, onBaseline: boolean) => {
      const num = parseFloat(String(raw).replace(/[^\d.-]/g, ""));
      const store: EditStore = onBaseline ? "baseEdits" : "edits";
      set(
        (prev) =>
          ({
            [store]: { ...prev[store], [engine.ek(ch, field, m)]: isNaN(num) ? null : num },
          }) as Patch,
      );
    },
    [engine, set],
  );

  const setSearch = useCallback(
    (v: string) => {
      set({ searchDraft: v });
      window.clearTimeout(searchTimer.current);
      // Le champ répond tout de suite, le filtre attend la fin de la frappe.
      searchTimer.current = window.setTimeout(() => set({ fSearch: v }), 220);
    },
    [set],
  );

  const openChantier = useCallback(
    (code: string) => {
      set({ tab: "Tableau prévisionnel", fSearch: code, searchDraft: code, openRow: code });
    },
    [set],
  );

  const toggleTag = useCallback(
    (ch: Chantier, tag: string) => {
      const on = (state.tags[ch.id] || []).includes(tag);
      set((prev) => {
        const cur = prev.tags[ch.id] || [];
        return {
          tags: {
            ...prev.tags,
            [ch.id]: on ? cur.filter((x) => x !== tag) : cur.concat([tag]),
          },
        };
      });
      toast(
        on ? "Tag « " + tag + " » retiré de " + ch.id : "Tag « " + tag + " » ajouté à " + ch.id,
      );
    },
    [set, state.tags, toast],
  );

  const addRef = useCallback(() => {
    if (state.role !== "Contrôle de gestion") {
      toast("Seul le contrôle de gestion peut ajouter un coefficient");
      return;
    }
    const n = state.refs.length + 1;
    set((prev) => ({
      refs: prev.refs.concat([
        {
          id: "ref" + n,
          label: "Nouveau coefficient " + n,
          role: "À qualifier — contrôle de gestion",
          dot: "#f59e0b",
          values: MONTHS.map(() => 0),
        },
      ]),
    }));
    toast("Coefficient ajouté — renseignez les mois");
  }, [set, state.refs.length, state.role, toast]);

  const setRefValue = useCallback(
    (refIndex: number, m: number, raw: string) => {
      const num = parseFloat(String(raw).replace(",", ".").replace(/[^\d.-]/g, ""));
      set((prev) => {
        const refs = prev.refs.map((x) => ({ ...x, values: x.values.slice() }));
        refs[refIndex].values[m] = isNaN(num) ? 0 : num;
        return { refs };
      });
    },
    [set],
  );

  const togglePeriod = useCallback(
    (agence: string, m: number) => {
      set((prev) => {
        const next = { ...prev.periods };
        next[agence] = next[agence].slice();
        next[agence][m] = !next[agence][m];
        return { periods: next };
      });
    },
    [set],
  );

  /** Postes retouchés d'un couple chantier/mois — utilisé pour le soulignement bleu. */
  const editedFields = useMemo(() => CAT.map((c) => c.k as string).concat(["heures", "masse"]), []);

  return {
    state,
    engine,
    set,
    toast,
    commit,
    undoLast,
    setStatutFlow,
    applyAction,
    setCell,
    setSearch,
    openChantier,
    toggleTag,
    addRef,
    setRefValue,
    togglePeriod,
    editedFields,
  };
}

export type Store = ReturnType<typeof useApp>;
