# SaaS Analytics Dashboard

A polished, interactive executive analytics dashboard for a fictional SaaS company. Built as a single-page React application with mock data, designed for a time-boxed frontend technical assessment.

## Features

- **KPI cards** with trend indicators (revenue, signups, active users, conversion rate)
- **Interactive filters** — date range (All / 6 months / 3 months) and subscription tier (All / Free / Pro / Enterprise)
- **Four charts** — revenue trend line, user growth by plan, subscription breakdown donut, conversion rate bars
- **Loading state** — shimmer skeleton UI on initial render
- **Error handling** — simulated error state with retry, triggered via a "Simulate Error" button
- **Responsive** — adapts from mobile to desktop with a clean grid layout
- **Light theme** — restrained, professional executive dashboard aesthetic

## Tech Stack

| Layer         | Tool                |
| ------------- | ------------------- |
| Framework     | React 19 + TypeScript |
| Build         | Vite                |
| Styling       | Tailwind CSS v4     |
| Charts        | Recharts            |

No backend, no routing, no external API calls. All data is local mock data.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

Output is written to `dist/`.

## Preview Production Build

```bash
npm run preview
```

## Deploy to Vercel

1. Push this repo (or the `dashboard/` directory) to GitHub.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Vercel auto-detects Vite. No configuration needed.
4. Click **Deploy**.

Or via CLI:

```bash
npx vercel
```

## Mock Data

Ten months of SaaS metrics (Jun 2025 -- Mar 2026) are defined in `src/data/mockData.ts`. The data is designed to feel realistic:

- **Free** tier is the largest user segment, **Pro** is mid-range, **Enterprise** is smallest
- Revenue correlates with paid tiers (Pro ~35%, Enterprise ~65% weighted split)
- Active users grow in proportion to signups with a slight holiday dip in December
- Conversion rate varies between 12--14%, trending slightly upward

## Filtering Behavior

- **Date range** slices the dataset to the last N months. All KPIs, charts, and trend indicators update.
- **Tier filter** adjusts tier-specific views: revenue KPI shows estimated plan share, the users KPI switches to that tier's count, and the donut chart shows a start-vs-now comparison for the selected tier.
- Charts that are not tier-specific (revenue line, conversion bars) continue to show full data to avoid misleading breakdowns.

## Assessment Note

This project was designed and built for a time-boxed frontend assessment. The scope is intentionally limited to demonstrate clean component architecture, TypeScript usage, data-driven UI, and responsive design -- not production-grade infrastructure.
