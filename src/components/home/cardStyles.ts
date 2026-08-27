/** Styles partagés par les cartes de la page d'accueil. */

export const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e6eaee",
  borderRadius: 14,
  padding: "16px 18px",
};

export const LIST_BUTTON: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: 4,
  padding: "9px 11px",
  border: "1px solid #f1f4f7",
  borderRadius: 9,
  background: "#fff",
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
  width: "100%",
};

export const CODE_BADGE: React.CSSProperties = {
  flex: "0 0 auto",
  whiteSpace: "nowrap",
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 11.5,
  fontWeight: 600,
  color: "#334155",
  background: "#f1f5f9",
  borderRadius: 5,
  padding: "2px 6px",
};

export const NAME: React.CSSProperties = {
  minWidth: 0,
  flex: 1,
  fontSize: 13,
  fontWeight: 600,
  color: "#17202a",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const PILL: React.CSSProperties = {
  flex: "0 0 auto",
  padding: "2px 8px",
  borderRadius: 20,
  fontSize: 10.5,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

export const COL_HEAD: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: "#8a95a1",
};
