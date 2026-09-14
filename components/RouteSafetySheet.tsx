"use client";

import { useState } from "react";
import { ChevronUp, TriangleAlert, ShieldCheck, Navigation } from "lucide-react";

type RouteAlert = {
  id: number;
  location: string;
  distance: string;
  severity: "High" | "Medium" | "Low";
};

const ROUTE_ALERTS: RouteAlert[] = [
  { id: 1, location: "Anna Nagar 2nd Ave", distance: "0.4 km ahead", severity: "High" },
  { id: 2, location: "Kodambakkam Bridge", distance: "2.1 km ahead", severity: "Medium" },
  { id: 3, location: "Signal near CIT Nagar", distance: "3.6 km ahead", severity: "Low" },
];

const severityColor: Record<RouteAlert["severity"], string> = {
  High: "#FF5A5F",
  Medium: "#FF8A5C",
  Low: "#FBBF24",
};

function scoreTone(score: number) {
  if (score >= 80) return { ring: "#34D399", label: "Good" };
  if (score >= 50) return { ring: "#FBBF24", label: "Caution" };
  return { ring: "#FF5A5F", label: "Risky" };
}

export default function RouteSafetySheet({
  score = 82,
  alerts = ROUTE_ALERTS,
}: {
  score?: number;
  alerts?: RouteAlert[];
}) {
  const [expanded, setExpanded] = useState(false);
  const tone = scoreTone(score);
  const ringDeg = Math.round((score / 100) * 360);

  return (
    <div className="pointer-events-auto w-full px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-white/10 bg-navy-900/80 shadow-sheet backdrop-blur-xl">
        {/* Drag handle / summary row — tap to expand */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full flex-col items-center gap-3 px-4 pt-2.5 pb-3 text-left"
        >
          <span className="h-1 w-10 rounded-full bg-white/20" />

          <div className="flex w-full items-center gap-3">
            <div
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(${tone.ring} ${ringDeg}deg, rgba(255,255,255,0.08) 0deg)`,
              }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900">
                <span className="font-display text-[13px] font-semibold text-chitti-ink">
                  {score}
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-chitti-green" strokeWidth={2.4} />
                <p className="text-sm font-semibold text-chitti-ink">
                  Route Safety Score
                </p>
              </div>
              <p className="mt-0.5 truncate text-xs text-chitti-mist">
                {alerts.length} potholes detected on your route
              </p>
            </div>

            <ChevronUp
              className={`h-4 w-4 shrink-0 text-chitti-mist transition-transform duration-300 ${
                expanded ? "rotate-180" : ""
              }`}
              strokeWidth={2.4}
            />
          </div>
        </button>

        {/* Expandable alert list */}
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="max-h-52 space-y-2 overflow-y-auto px-4 no-scrollbar">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-3 py-2.5"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${severityColor[alert.severity]}26` }}
                  >
                    <TriangleAlert
                      className="h-4 w-4"
                      style={{ color: severityColor[alert.severity] }}
                      strokeWidth={2.2}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-chitti-ink">
                      {alert.location}
                    </p>
                    <p className="text-[11px] text-chitti-mist">{alert.distance}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold"
                    style={{
                      color: severityColor[alert.severity],
                      backgroundColor: `${severityColor[alert.severity]}1F`,
                    }}
                  >
                    {alert.severity}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-4 pb-4 pt-3">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-chitti-blue to-chitti-cyan py-3 text-sm font-semibold text-navy-950 shadow-[0_8px_24px_-6px_rgba(59,123,246,0.65)] transition active:scale-[0.98]"
              >
                <Navigation className="h-4 w-4" strokeWidth={2.4} />
                Start safe navigation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
