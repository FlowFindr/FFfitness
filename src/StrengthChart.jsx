import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

/* ============================================================
   STRENGTH CHART
   Split into its own module so recharts, which is most of the
   bundle, only downloads when you open the Progress tab.
   Everything it needs arrives as props, so nothing imports back
   out of App and the chunk stays self contained.
   ============================================================ */
export default function StrengthChart({ t, series, unit, mono }) {
  const tick = { fill: t.mute, fontSize: 10, fontFamily: mono };
  return (
    <ResponsiveContainer width="100%" height={195}>
      <LineChart data={series} margin={{ left: -16, right: 12 }}>
        <CartesianGrid stroke={t.line} />
        <XAxis dataKey="date" tick={tick} axisLine={{ stroke: t.line }} tickLine={false} />
        <YAxis tick={tick} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: t.panel, border: `1px solid ${t.brand}66`, borderRadius: 3, fontFamily: mono, fontSize: 11, color: t.text }} />
        <Line type="monotone" dataKey="e1rm" stroke={t.brand} strokeWidth={2} dot={{ fill: t.brand, r: 3 }} name={`Est. 1RM (${unit})`} />
      </LineChart>
    </ResponsiveContainer>
  );
}
