import { AGENCES, ENTITIES, REX_NAMES, VILLES, type Statut } from "./constants";

export interface Chantier {
  id: string;
  entite: string;
  nom: string;
  ville: string;
  client: string;
  agence: string;
  secteur: "Propreté" | "Sécurité";
  /** CA de référence annuel, sert d'assiette au réalisé N-1. */
  ca: number;
  /** Prix horaire de référence — sert à dériver les heures. */
  taux: number;
  /** Part de masse salariale dans le CA. */
  msRate: number;
  statut: Statut;
  /** Vrai pour les 20 chantiers qui concentrent 80 % du CA. */
  big: boolean;
}

/** PRNG déterministe (mulberry32) — le jeu de démo doit être reproductible. */
export function rng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a — dérive une graine stable depuis une clé chantier/poste/mois. */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const NOMS_PROPRETE = [
  "Nettoyage siège",
  "Propreté centre commercial",
  "Entretien campus",
  "Propreté hôpital",
  "Nettoyage industriel",
  "Entretien résidences",
  "Propreté gare",
  "Nettoyage data center",
];

const NOMS_SECURITE = [
  "Gardiennage siège",
  "Sécurité centre commercial",
  "Surveillance campus",
  "Sûreté hôpital",
  "Sécurité site industriel",
  "Contrôle d'accès logistique",
  "Sécurité gare",
  "Rondes data center",
];

export const CHANTIERS: Chantier[] = [];
/** Responsable exploitation par code chantier. */
export const REX: Record<string, string> = {};
/** Chantiers « en saisie » volontairement en retard, pour faire apparaître les alertes. */
export const LATE: string[] = [];

(function buildChantiers() {
  const r = rng(20270901);
  const statuts: Statut[] = [
    "En attente baseline CG",
    "Non budgétisé",
    "En saisie",
    "À valider",
    "Validé",
  ];
  // 20 gros chantiers ≈ 80 % du CA : 20 × ~13-15 M€ ; 330 petits × ~0,3 M€.
  for (let i = 0; i < 350; i++) {
    const big = i < 20;
    const num = String(4 + i * 7).padStart(5, "0");
    const id = "C" + num + "-" + String(1 + Math.floor(r() * 4)).padStart(3, "0");
    const entite = ENTITIES[Math.floor(r() * ENTITIES.length)].code;
    const agence = AGENCES[Math.floor(r() * AGENCES.length)];
    const rex = REX_NAMES[big ? Math.floor(r() * 4) : Math.floor(r() * REX_NAMES.length)];
    let statut: Statut;
    if (big)
      statut =
        r() < 0.4
          ? "En saisie"
          : r() < 0.4
            ? "En attente baseline CG"
            : r() < 0.4
              ? "Non budgétisé"
              : r() < 0.6
                ? "À valider"
                : "Validé";
    else statut = statuts[Math.floor(r() * statuts.length)];
    CHANTIERS.push({
      id,
      entite,
      nom:
        (r() < 0.55
          ? NOMS_PROPRETE[Math.floor(r() * 8)]
          : NOMS_SECURITE[Math.floor(r() * 8)]) +
        " — Client " +
        (1 + Math.floor(r() * 90)),
      ville: VILLES[Math.floor(r() * VILLES.length)],
      client: "Client " + (1 + Math.floor(r() * 90)),
      agence,
      secteur: r() < 0.55 ? "Propreté" : "Sécurité",
      ca: big
        ? Math.round((12800000 + r() * 2400000) / 10000) * 10000
        : Math.round((150000 + r() * 260000) / 1000) * 1000,
      taux: 22 + r() * 5,
      msRate: 0.58 + r() * 0.14,
      statut,
      big,
    });
    REX[id] = rex;
    if (statut === "En saisie" && (big ? r() < 0.55 : r() < 0.25)) LATE.push(id);
  }
})();
