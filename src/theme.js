/* Palette shared by the landing page.

   These values are a verbatim mirror of THEMES in src/App.jsx, which stays the
   source of truth for the in-app theme picker. src/index.css already carries a
   second mirror as [data-theme] blocks for the Tailwind token layer. Keeping a
   third copy here is deliberate: the landing page is a separate Vite entry, and
   importing App.jsx would pull the whole app into the landing bundle.

   If you change a hex, change it in all three places. */
export const THEMES = {
  "ultraviolet-circuit": {
    name: "Ultraviolet Circuit",
    note: "Indigo-black base, violet identity, cyan runs the data.",
    void: "#06070F", panel: "#0D1020", panel2: "#151A2E", line: "#242B45",
    brand: "#7C6BFF", live: "#00E5FF", hot: "#FF4D8D",
    text: "#EEF1FF", mute: "#9AA6C4",
  },
  nightdrive: {
    name: "Nightdrive",
    note: "Warmer purple base. Softer glow, same structure.",
    void: "#0A0818", panel: "#140F26", panel2: "#1C1636", line: "#2C2450",
    brand: "#8B5CF6", live: "#22D3EE", hot: "#FF5C9E",
    text: "#F3F0FF", mute: "#ADA3CB",
  },
  "cyan-prime": {
    name: "Cyan Prime",
    note: "Roles flip. Cyan is the identity, violet marks live state.",
    void: "#04060E", panel: "#0A0F1C", panel2: "#101827", line: "#1D2940",
    brand: "#00E5FF", live: "#7B5CFF", hot: "#FF3D7F",
    text: "#ECF6FF", mute: "#93A6C0",
  },
};

export const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
export const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
