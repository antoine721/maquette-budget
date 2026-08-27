import type { Role, Tab } from "./data/constants";

/**
 * Réglages de la campagne et de l'affichage.
 * Ils correspondent aux « tweaks » du prototype (dc_set_props) et gardent les mêmes valeurs par défaut.
 */
export interface AppConfig {
  /** Exercice budgété à l'ouverture. */
  campaignYear: number;
  /** Rôle affiché au départ. */
  defaultRole: Role;
  /** Onglet d'ouverture. */
  startTab: Tab;
  /** Diamètre de l'anneau CA, en pixels. */
  gaugeSize: number;
  /** Afficher le bloc « Objectif CDG + complétion » sous l'anneau. */
  showObjectiveBlock: boolean;
  /** Exiger la reconfirmation des valeurs reprises de N-1. */
  confirmN1: boolean;
  /** Proposer la valeur N-1 en gris dans les cases vides. */
  ghostN1: boolean;
}

export const CONFIG: AppConfig = {
  campaignYear: 2027,
  defaultRole: "Exploitation",
  startTab: "Accueil",
  gaugeSize: 176,
  showObjectiveBlock: true,
  confirmN1: true,
  ghostN1: true,
};
