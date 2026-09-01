/** Styles partagés par les cartes — les valeurs viennent toutes des jetons. */

import { FS, INK, LINE, MONO, RADIUS, SHADOW, SURFACE } from "../../theme";

export const CARD: React.CSSProperties = {
  background: SURFACE.card,
  border: "1px solid " + LINE.base,
  borderRadius: RADIUS.card,
  boxShadow: SHADOW.card,
  padding: 16,
};

export const LIST_BUTTON: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: 4,
  padding: "9px 11px",
  border: "1px solid " + LINE.soft,
  borderRadius: RADIUS.control,
  background: SURFACE.card,
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
  width: "100%",
};

export const CODE_BADGE: React.CSSProperties = {
  flex: "0 0 auto",
  whiteSpace: "nowrap",
  fontFamily: MONO,
  fontSize: FS.micro,
  fontWeight: 600,
  color: INK.base,
  background: SURFACE.canvas,
  borderRadius: 5,
  padding: "2px 6px",
};

export const NAME: React.CSSProperties = {
  minWidth: 0,
  flex: 1,
  fontSize: FS.body,
  fontWeight: 600,
  color: INK.strong,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const PILL: React.CSSProperties = {
  flex: "0 0 auto",
  padding: "2px 8px",
  borderRadius: RADIUS.pill,
  fontSize: FS.micro,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

export const COL_HEAD: React.CSSProperties = {
  fontSize: FS.micro,
  fontWeight: 700,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: INK.muted,
};
