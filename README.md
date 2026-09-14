# Chitti Map

Smart, pothole-aware navigation UI for Chennai, built as a mobile-first Next.js app.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** for styling (custom navy/blue "Chitti" design tokens in `tailwind.config.ts`)
- **React Leaflet** for the full-screen interactive map
- **Lucide React** for icons

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). Resize the browser to a phone width (or open dev tools' device toolbar) to see the intended mobile-first layout — it also works at desktop widths, just with extra breathing room on either side of the centered `max-w-md` card stack.

## Project structure

```
app/
  layout.tsx        Root layout, Google font loading (Space Grotesk + Inter), metadata
  page.tsx           Assembles the map + floating overlays + bottom nav
  globals.css        Tailwind directives, Leaflet theme overrides, marker/keyframe CSS
components/
  ChittiMap.tsx        Full-screen React Leaflet map, dummy pothole + route data
  SearchOverlay.tsx    Floating top card: Chitti Map branding + start/destination search
  RouteSafetySheet.tsx Floating bottom card: safety score ring + expandable alert list
  BottomNav.tsx         Fixed bottom nav: Home / Saved Routes / Report / Profile
```

## Notes on the implementation

- `ChittiMap` is loaded with `next/dynamic` and `ssr: false` in `page.tsx` because Leaflet
  reaches for `window` — it will throw if it's ever rendered on the server.
- Pothole and waypoint markers are plain `L.divIcon` HTML strings (not React components)
  since Leaflet renders marker icons outside the React tree. Tailwind's content scanner
  never sees that HTML, so the marker pulse animation is defined as a plain `@keyframes`
  block in `globals.css` rather than a Tailwind utility.
- The basemap uses CARTO's free "Dark Matter" tiles so the map itself sits inside the
  navy palette instead of fighting a bright default OpenStreetMap style.
- All pothole locations, the route, the safety score, and the alert list are static dummy
  data — wire them up to your real detection/routing API by replacing the constants at the
  top of `ChittiMap.tsx` and the props passed into `RouteSafetySheet` in `page.tsx`.
- Layout uses `pointer-events-none` wrapper divs around each floating overlay so empty
  space around the cards still lets you pan/zoom the map underneath; only the cards
  themselves (`pointer-events-auto`) intercept touches.
