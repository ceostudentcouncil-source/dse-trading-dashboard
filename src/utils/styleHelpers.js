import { C } from "../constants.js";

export const inp = (ex = {}) => ({
  background: "#0A1628",
  border: "1px solid " + C.border,
  borderRadius: 6,
  color: C.text,
  padding: "6px 10px",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  ...ex,
});

export const card = (ex = {}) => ({
  background: C.card,
  border: "1px solid " + C.border,
  borderRadius: 12,
  ...ex,
});

export const btn = (color, active, small) => {
  color = color || C.accent;
  return {
    padding: small ? "4px 10px" : "8px 16px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    background: active ? color : color + "20",
    color: active ? "#fff" : color,
    fontWeight: 700,
    fontSize: small ? 11 : 13,
    fontFamily: "inherit",
    transition: "all 0.15s",
  };
};
