# LubeLogger — Custom Pump UI Fork

This is a personal customization of [LubeLogger](https://github.com/hargata/lubelog)
by hargata, with a custom mobile-first fuel entry UI (gas pump + odometer style).

## Branch Structure

| Branch | Purpose |
|---|---|
| `main` | Mirrors upstream LubeLogger exactly — never commit here |
| `custom-pump-ui` | All custom changes live here (currently checked out) |

## How to Get Upstream Updates

Whenever LubeLogger releases a new version:

```powershell
.\update-from-upstream.ps1
```

This script will:
1. Fetch the latest from hargata/lubelog
2. Fast-forward `main` to match
3. Rebase `custom-pump-ui` on top of `main`
4. Show you the final state

## Custom Changes Overview

- `wwwroot/css/pump-ui.css` — Gas pump + odometer visual styles
- `wwwroot/js/pump-ui.js` — Pump input, odometer logic, slide-up drawer
- `wwwroot/js/pump-nav.js` — Auto-open Gas tab on vehicle selection
- `Views/Vehicle/Gas/_GasPumpEntry.cshtml` — Pump entry partial view
- `Views/Vehicle/QuickFuel.cshtml` — PWA vehicle picker page
- `wwwroot/manifest.json` — PWA manifest for phone installation
- `Views/Shared/_Layout.cshtml` — (Modified) CSS/JS injection (4 lines)
- `Views/Vehicle/Gas/_Gas.cshtml` — (Modified) Pump UI hook (3 lines)

## Git Setup

Portable Git is installed at: `C:\Users\taits\AppData\Local\PortableGit2`
It is on the user PATH and available in new PowerShell sessions.

Upstream remote: `https://github.com/hargata/lubelog.git`
