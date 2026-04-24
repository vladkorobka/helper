# Design Spec: Apple Liquid Glass Redesign

**Date:** 2026-04-24  
**Branch:** stage  
**Scope:** Visual-only redesign — layout and JSX structure unchanged

---

## Decisions

| Decision | Value |
|---|---|
| Style | Apple Liquid Glass |
| Background gradient | `#dbeafe` → `#ede9fe` → `#d1fae5` (Blue-Purple-Green) |
| Animated blobs | 3 radial-gradient blobs with `blur(50–55px)` |
| Glass panels | `rgba(255,255,255,0.52–0.60)` + `backdrop-filter: blur(28px)` |
| Glass border | `1px solid rgba(255,255,255,0.78–0.85)` |
| Border radius | Cards/Nav: `8px` · Inputs/Buttons: `6px` |
| Font | Inter (400/500/600/700/800) via `next/font/google` |
| Primary accent | `#3b82f6` → `#2563eb` (gradient) |
| Success accent | `#10b981` → `#059669` (gradient) |
| Teal accent | `#14b8a6` → `#0d9488` (gradient) |

---

## What Changes

### `app/globals.css`
- Add Inter font via CSS variable (`--font-inter`)
- Replace `--background: oklch(1 0 0)` with the gradient body background
- Replace `--radius: 0.625rem` with `--radius: 0.5rem` (8px)
- Add `.glass-panel` utility class: `backdrop-filter`, `background`, `border`
- Add `.glass-input` utility class for inputs/selects
- Add `.glass-nav` utility class for navigation
- Keep existing `.btn-*`, `.table-header`, `.table-cell` — update colors/radius
- Add animated background blob styles (`.bg-blob`)

### `app/layout.js`
- Import Inter from `next/font/google` (weights: 400, 500, 600, 700, 800)
- Apply `font.variable` to `<html>`
- Set `font-family: var(--font-inter)` as base

### `components/layout/Layout.jsx`
- Change `bg-gray-50` → transparent (background lives on `<body>`)
- Add 3 `position: fixed` blob divs inside the layout wrapper (rendered once for all app pages)

### `components/layout/Navigation.jsx`
- Replace `bg-white border-b border-gray-200` → `glass-nav` class
- Active link: `bg-blue-500/10 text-blue-700` instead of `border-b-2 border-sky-500`
- Nav border-radius: `8px`
- Logo: Inter 800 + `letter-spacing: 2px`

### All `.card` usages (tickets, clients, employees, programs, profile, settings, forms)
- Replace `bg-white rounded-2xl shadow-sm border border-gray-100` → `glass-panel` class
- Border radius: `8px` (down from `rounded-2xl = 16px`)

### Inputs / Selects (`components/ui/input.jsx`, `components/ui/select.jsx`, all inline `className="input"`)
- Replace `border-gray-200 bg-white` → `glass-input` class
- Border radius: `6px`
- Focus ring: `ring-blue-500/20 border-blue-400/50`

### Buttons (`components/ui/button.jsx`, `.btn-*` classes)
- Border radius: `6px` (from `rounded-xl = 12px`)
- Gradient fills for primary/success/teal variants

### `app/(auth)/layout.jsx` (Login, Forgot password, Reset, Accept invite)
- Add same 3 `position: fixed` blob divs here (auth pages don't use `Layout.jsx`)
- Auth card: `glass-panel` with stronger opacity (60%)

---

## What Does NOT Change

- JSX structure and component hierarchy
- All routing and page files
- Business logic, hooks, API calls
- `StatusBadge` dot colors (amber/sky/teal — kept)
- Table column layout and sorting
- Form field structure and validation

---

## CSS Token Reference

```css
/* Body */
background: linear-gradient(145deg, #dbeafe 0%, #ede9fe 45%, #d1fae5 100%);
background-attachment: fixed;

/* Blobs */
.bg-blob-1: rgba(147,197,253,0.65) · blur(55px) · top-left
.bg-blob-2: rgba(196,181,253,0.60) · blur(50px) · top-right
.bg-blob-3: rgba(110,231,183,0.50) · blur(45px) · bottom-center

/* Glass panel */
background: rgba(255,255,255,0.52);
backdrop-filter: blur(28px);
-webkit-backdrop-filter: blur(28px);
border: 1px solid rgba(255,255,255,0.78);
border-radius: 8px;
box-shadow: 0 4px 20px rgba(59,130,246,0.07);

/* Glass nav (stronger) */
background: rgba(255,255,255,0.58);
backdrop-filter: blur(28px);
border: 1px solid rgba(255,255,255,0.84);
box-shadow: 0 2px 12px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.9);

/* Glass input */
background: rgba(255,255,255,0.65);
border: 1px solid rgba(203,213,225,0.65);
border-radius: 6px;
box-shadow: inset 0 1px 3px rgba(0,0,0,0.03);

/* Focus state */
border-color: rgba(59,130,246,0.48);
box-shadow: 0 0 0 3px rgba(59,130,246,0.10);

/* Table head */
background: rgba(241,245,249,0.62);
border-bottom: 1px solid rgba(226,232,240,0.55);

/* Table row divider */
border-bottom: 1px solid rgba(226,232,240,0.30);
```

---

## Typography Scale (Inter)

| Role | Size | Weight | Notes |
|---|---|---|---|
| Page title | 20–22px | 700 | `letter-spacing: -0.3px` |
| Section / form title | 14px | 600 | |
| Nav logo | 13px | 800 | `letter-spacing: 2px` |
| Body / table | 12–13px | 400–500 | |
| Secondary / meta | 11px | 400 | `text-slate-500` |
| Labels uppercase | 10px | 700 | `letter-spacing: 0.08em; text-transform: uppercase` |
| Micro (footer, badge) | 9–10px | 400–600 | |

---

## Implementation Notes

- Use `background-attachment: fixed` on body so gradient doesn't scroll
- Blobs are `position: fixed` divs — rendered in `components/layout/Layout.jsx` (app pages) and `app/(auth)/layout.jsx` (auth pages)
- `backdrop-filter` is supported in all modern browsers; no fallback needed for this app
- `.superpowers/` should be in `.gitignore`
