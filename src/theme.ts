/**
 * Jetons de design — la seule source des couleurs, tailles et espacements.
 *
 * Avant ce fichier, chaque composant réécrivait ses gris et ses tailles à la main :
 * neuf tailles de police entre 10,5 et 15,5 px, et des gris de texte sous le seuil
 * de contraste AA. Tout ce qui est dessiné dans l'application se sert ici.
 */

/** Texte. `faint` ne passe pas AA : réservé aux traits et aux icônes, jamais au texte. */
export const INK = {
  /** Titres et valeurs. */
  strong: "#17202a",
  /** Corps de texte. */
  base: "#3b4753",
  /** Texte secondaire — 4,6:1 sur blanc, le plus clair qui reste lisible. */
  muted: "#6b7681",
  /** Décor uniquement : séparateurs, icônes, jamais un mot à lire. */
  faint: "#a8b1ba",
  onDark: "#ffffff",
} as const;

export const SURFACE = {
  /** Fond de page. */
  canvas: "#f4f6f8",
  /** Fond des cartes. */
  card: "#ffffff",
  /** Zones en retrait : en-têtes de tableau, pieds de total. */
  sunken: "#f8fafb",
  /** Survol d'une ligne cliquable. */
  hover: "#f4f8fb",
} as const;

export const LINE = {
  /** Bordure des cartes et des contrôles. */
  base: "#e6eaee",
  /** Séparateur entre lignes de tableau. */
  soft: "#f1f4f7",
  /** Bordure d'un contrôle actif. */
  active: "#bfe3f6",
} as const;

/** Bleu de marque — l'accent unique de l'application. */
export const BRAND = {
  base: "#0a9bd8",
  strong: "#0782b6",
  ink: "#075f85",
  tint: "#e8f6fd",
  wash: "#f5fbff",
} as const;

/**
 * États réservés. La couleur ne dit jamais l'état à elle seule : elle accompagne
 * toujours un mot. `warn` et `danger` marquent ce qui appelle une action, jamais
 * une étape du cycle de vie — celle-ci se lit sur la rampe d'avancement.
 */
export const STATE = {
  good: "#15803d",
  goodTint: "#dcfce7",
  warn: "#b45309",
  warnTint: "#fef3c7",
  danger: "#c2261c",
  dangerTint: "#fee2e2",
} as const;

/**
 * Couleurs du cycle de vie d'un budget — une teinte par étape, la même partout :
 * pastille du badge, case du filtre, segment de l'anneau, liseré de ligne.
 *
 * Elles sont volontairement moins saturées que des couleurs d'alerte : le rouge
 * de « Non budgétisé » dit « à construire », pas « incident ». Palette vérifiée
 * pour la vision des couleurs (séparation ΔE 13,6 sur la pire paire adjacente en
 * deutéranopie) ; chaque emploi porte un libellé visible, jamais la couleur seule.
 */
export const STATUS_COLORS = {
  attente: "#94a3b8",
  nonBudgete: "#d4453a",
  saisie: "#e0921c",
  aValider: "#0a9bd8",
  valide: "#1a9b52",
  clos: "#64748b",
} as const;

/** Hors cycle : un exercice clos n'a plus d'avancement à montrer. */
export const NEUTRAL = STATUS_COLORS.clos;

/** Échelle typographique — sept tailles, pas une de plus. */
export const FS = {
  micro: 11,
  small: 12,
  body: 13,
  base: 14,
  lead: 16,
  title: 20,
  hero: 28,
} as const;

export const RADIUS = { control: 8, card: 12, pill: 999 } as const;

export const SHADOW = {
  card: "0 1px 2px rgba(15,23,42,0.04)",
  raised: "0 1px 3px rgba(15,23,42,0.12)",
  menu: "0 12px 32px rgba(15,23,42,0.14)",
} as const;

/** Étiquette de section : petites capitales espacées. */
export const EYEBROW: React.CSSProperties = {
  fontSize: FS.micro,
  fontWeight: 700,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: INK.muted,
};

export const MONO = "'IBM Plex Mono', ui-monospace, monospace";
