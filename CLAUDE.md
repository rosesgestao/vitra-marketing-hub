# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vitra Marketing Hub** (renamed from `vitra-premium-ferramenta-operacional` in June 2026) is a multi-brand operational marketing platform supporting:
- **Vitra Imobiliária** (navy #0A1628 + gold #C4942A, institutional-commercial, main brand)
- **Vitra Premium** (black #000000 + gold #C4942A, editorial, luxury sub-brand)

The platform manages campaigns, AI-powered copy generation, creative asset rendering, paid media workflows, and social media analytics. The system enforces strict brand separation—no cross-contamination of assets, language, CTAs, templates, or strategy between brands.

## Tech Stack

- **Frontend:** React 18 + Vite 5 + Tailwind CSS (dashboard/)
- **Backend:** Supabase (PostgreSQL + Edge Functions + Storage)
- **Render Worker (optional):** Node.js + Puppeteer + Express (render-worker/, dormant by default)
- **Edge Functions:** Deno + TypeScript (supabase/functions/)
- **Build Tools:** ESLint (no-undef focus), Vitest, PostCSS
- **CI:** GitHub Actions (lint + test + build for dashboard; deno check for edges)

## Key Commands

### Dashboard (React)
```bash
cd dashboard
npm run dev           # Start Vite dev server (port 5173), HMR enabled
npm run build         # Production build to dist/
npm run preview       # Preview built app locally
npm run test          # Run Vitest in watch mode
npm run test:run      # Run tests once (CI mode)
npm run lint          # ESLint check (no-undef focus)
npm run sync:pecas    # Sync HTML generators to public/pecas (one-time)
```

### Supabase Edge Functions
```bash
cd supabase
deno check supabase/functions/render-asset/index.ts          # Type check one edge
deno check supabase/functions/generate-copy/index.ts         # etc.
```

### Render Worker (optional, see ACTIVATION.md)
```bash
cd render-worker
npm run start         # Long-running worker (polls Supabase, renders via Puppeteer)
npm run once          # Process one batch and exit
fly deploy            # Deploy to Fly.io (requires fly.toml + secrets)
```

## Architecture

### Multi-Brand Theme System

The dashboard chrome dynamically re-themes based on the active brand view via CSS variables on `<html data-brand>`:
- **Vitra Imobiliária** (default): navy + gold + blue accents (institutional)
- **Vitra Premium**: black + gold, no blue (editorial luxury)

Brand profiles live in `dashboard/src/lib/brandProfiles.js` — a single source of truth for:
- Brand scope (`vitra_imobiliaria` or `vitra_premium`)
- Visual direction + approval assets (logo paths, colors, fonts)
- UI copy (dashboard titles, CTAs, empty states)
- Default metadata (tone, audience, CTA wording)
- Template family + asset paths

The sidebar is an accordion (one section open at a time). Views route to brand-scoped dashboards; shared views (Pipeline, Kanban, Agentes, Métricas) default to Imobiliária but can be invoked from either brand.

### Dashboard Structure (React + Vite)

```
dashboard/
  src/
    App.jsx              # Root: sidebar + view router, brand theme dispatch
    main.jsx
    components/
      PremiumBrand.jsx   # SVG logos, brand-aware logo rendering
      PremiumShell.jsx   # Shared shell (header, sidebar, footer)
    views/
      PremiumDashboard.jsx    # Campaign list, asset matrix (brand-scoped)
      Pipeline.jsx            # Shared: workflow stages, drag-drop
      Calendario.jsx          # Shared: publication timeline
      Kanban.jsx              # Shared: content cards by status
      Agentes.jsx             # Shared: agent automation hub
      Metricas.jsx            # Shared: campaign + asset analytics
      EstudioPecas.jsx        # Shared: social media templates (Facebook, LinkedIn, YouTube, etc.)
    lib/
      supabase.js                  # Supabase client (createClient + env config)
      brandProfiles.js             # Brand scopes, profiles, asset paths, approved logos
      creativeTemplateCatalog.js   # Template families, render versions, field schemas
      premiumData.js               # API layer: campaign CRUD, asset ops, IA copilot calls
      pecasCatalog.js              # Peça platform registry (Facebook, LinkedIn, YouTube specs)
      listingText.js               # Pure: HTML → readable text extraction (SSRF-safe)
      __tests__/                   # Vitest suite (copy validation, text fit, template catalog, etc.)
  public/
    brand/vitra-{imobiliaria,premium}/   # Approved logos, brand manifest
    pecas/                                # HTML templates for social covers (symlinked/generated)
  vite.config.js          # Image ingestion middleware, HEIC conversion, SSRF guards
```

### Supabase Backend

**Database Schema** (migrations in supabase/):
- `premium_campaigns`: campaign record (brand_scope, brief, content_plan, slug)
- `premium_campaign_assets`: visual assets (template_key, metadata, status: queued/rendering/generated)
- `vitra_metadata`: product metadata for rendering (price, address, sqm, rooms, etc.)

**Edge Functions** (supabase/functions/):
- `render-asset/index.ts`: Satori → SVG → Resvg → PNG pipeline. Outputs 1080×1080 (1:1), 1200×627 (1.91:1), and optionally 1080×1920 (9:16 if SCALE_TALL permits). Brand detection by template key or campaign scope.
- `generate-copy/index.ts`: Anthropic API → copy angles (headline, body, CTA). Scope-aware (Imobiliária vs. Premium voice). Gated by `x-copilot-gate` header (COPILOT_GATE secret).
- `extract-facts/index.ts`: Anthropic API → structured facts (price, address, sqm, rooms, etc.) from listing text. Anchored to reduce hallucination.
- `suggest-template/index.ts`: Rule-based template suggestion based on facts (e.g., many photos → gallery template).
- `ingest-source-images/index.ts`: Image sourcing by URL/Google Drive (dev endpoint; no-op in production UI).
- `_shared/`: Pure validation modules (copyValidation.ts, factsExtraction.ts, textFit.ts, renderVersions.ts, edgeAuth.ts) shared between Edges and Vitest dashboard tests.

**Render Worker** (optional, render-worker/src/):
- Node.js long-running process consuming Supabase queue
- Partitioned by flag: `metadata.render_engine='worker'` claims 9:16 Premium (full-res via Puppeteer), leaving 1:1/1.91:1 to Edge
- v2 of "import by link": `/fetch-text` endpoint renders SPA/JS-heavy sites via headless Chrome (fallback when server-side fetch returns <200 chars)
- Protected by `x-render-token` header; SSRF guards against local/private/metadata IPs

### Copy Validation & Brand Separation (Core Rule)

`_shared/copyValidation.ts` enforces:
- No Premium vocabulary (curadoria, sofisticado, exclusivo, atemporal...) in Imobiliária copy
- No cheap vocabulary (baratinho, promoção relâmpago...) in Premium copy
- No product name repetition (headline + body start)
- Headline length check (40 chars max)
- All rules testable in Vitest and Edge contexts (pure TypeScript, no framework deps)

This is the **hard rule** blocking copy contamination between brands.

### Template System & Render Versions

**Creative Templates** (creativeTemplateCatalog.js):
- Imobiliária: 4 families (dual-photo-offer, patios-gallery, financiamento-orla, menino-deus-offer), each with 3 formats (1:1 feed, 9:16 story, 1.91:1 wide) → 12 variations total
- Premium: 5 models (photo-offer, editorial-panel, dark-spec, location-panorama, gallery-proof) with fewer format combos
- Each template has a schema (variable fields: price, address, images, etc.)

**Render Versions** (renderVersions.ts):
- Cache-busting string per family (e.g., "financiamento-orla-approved-v7")
- Bumping the version forces re-render of ALL assets using that family
- Dashboard catalog must match Edge function registry (Vitest test enforces sync)

### Peças (Social Covers) — Scalable Registry

`pecasCatalog.js` defines platforms (Facebook, LinkedIn, YouTube, Instagram, WhatsApp, E-mail) with:
- Format specs (width, height, aspect ratio, safe areas)
- HTML template variants per brand
- Status (available vs. soon)

Adding a platform = 1 entry + HTML generators in public/pecas. No hardcoding per-view; views auto-generate navigation from catalog.

## Data Flow Examples

### Campaign Creation (Brand-scoped)
1. Operator selects brand (sidebar → "Painel Imobiliária" or "Painel Premium")
2. UI loads `PremiumDashboard.jsx` with active brand scope
3. "Nova Campanha" form captures: title, brief, images, product metadata
4. Form validates brand_scope, inserts row into `premium_campaigns`
5. Assets table auto-seeded with templates for that scope
6. UI refreshes, shows campaign in asset matrix

### Asset Generation (Render Pipeline)
1. Operator approves template variation (e.g., "dual-photo-offer-feed 1:1")
2. Asset status set to `queued` with metadata (template_key, variable_values)
3. Edge cron polls; claims asset, calls `render-asset`
4. Edge: Satori layout → SVG (Inter + Playfair, brand colors) → Resvg raster → PNG
5. PNG uploaded to Storage at `premium-campaigns/{slug}/rendered/{assetId}.png`
6. Asset row updated: status → `generated`, public_url populated
7. UI displays rendered thumbnail, export buttons active

### Copy Generation (Copilot)
1. Operator clicks "Gerar copy por IA" on campaign
2. Dashboard calls `generate-copy` Edge with facts (price, address, sqm, rooms) + brand_scope
3. Edge checks `COPILOT_GATE` header (403 if anon + missing gate token)
4. Anthropic API generates 3 copy angles (Imobiliária or Premium voice per scope)
5. Dashboard validates each angle via `copyValidation.ts` (no vocab cross-contamination)
6. Issues array returned to operator (e.g., "Premium vocab detected: 'sofisticado'")
7. Operator reviews, picks angles, adjusts if needed, approves
8. Angles flow to render pipeline as variable copy for template layout

## Environment Setup

### Dashboard (.env, gitignored)
```
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_COPILOT_GATE=<secret_token>          # Gate for IA edges (local dev only)
WORKER_RENDER_URL=https://vitra-render-worker.fly.dev  # Optional: v2 link + 9:16
WORKER_RENDER_TOKEN=<token>
VITE_WORKER_RENDER_9X16=true              # Flag: route new 9:16 Premium to worker
```

### Render Worker (.env, gitignored)
```
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role>  # Server-side only
RENDER_TOKEN=<token>                      # Matches dashboard WORKER_RENDER_TOKEN
PORT=8787
BATCH_SIZE=3
POLL_INTERVAL_MS=15000
```

## Testing & CI

### Vitest (Dashboard)
- Tests in `dashboard/src/lib/__tests__/`
- Imports from `_shared/` (pure TypeScript) are tested on both sides
- Coverage: copyValidation, textFit, factsExtraction, renderVersions, templateCatalog, listingText, variation logic
- Run: `npm run test:run` (CI) or `npm run test` (watch)

### Deno Check (Edges)
- Each Edge function type-checked: `deno check supabase/functions/*/index.ts`
- Runs in CI on push/PR
- Tests `_shared/` modules (pure TS, Deno + Vitest compatible)

### ESLint (Dashboard)
- Focuses on `no-undef` (catches use-without-import bugs that build doesn't catch)
- Flat config, globals for browser+node, JSX parsing
- Run: `npm run lint` (or CI runs it automatically)

## Important Patterns & Conventions

### Brand Scope as First-Class Concept
Every asset, campaign, copy angle, template, and platform needs a `brand_scope` field. NEVER assume scope; always declare and validate:
```js
const scope = asset.metadata.brand_scope || campaign.brief.brand_scope || 'vitra_imobiliaria';
if (!BRAND_SCOPES.hasOwnProperty(scope)) throw new Error('Invalid brand scope');
```

### Copy Validation as Guard Rail
The `validateCopyAngle(angle, { scope, productName })` function is called server-side (Edge) AND client-side (Vitest). If validation fails, the piece comes back with an `issues` array. The operator must review and approve; the system does not auto-fix.

### Template Catalog as Schema Registry
Each template family has a strict schema (variable fields, image counts, text lengths). Rendering fails if data doesn't match. The schema is the contract between operator input and template layout.

### SSRF & Security Defaults
- Image ingestion (Vite middleware): validates source URL (blocks local/private/metadata IPs), caps payload (5MB), timeout (8s)
- Listing text fetch: SSRF + timeout + revalidation post-redirect
- Render worker `/fetch-text`: same guards; renders arbitrary URL in headless Chrome (isolated in Fly container)
- Copilot edges: gated by token; service role exempt

### Graceful Degradation
- Worker inactive → Edge renders everything (slower but works)
- `COPILOT_GATE` missing → edges open to anon (works for local dev)
- Fetch-by-link slow → falls back to paste (UX notifies operator)
- Browser storage unavailable → state in memory (nav doesn't persist but app works)

## Common Workflows

### Adding a New Template
1. Sketch layout + schema in `creativeTemplateCatalog.js` (add family object with field definitions)
2. Update `render-asset/index.ts` to recognize the template key and generate SVG (Satori JSX or direct SVG)
3. If template reuses text-fit logic, ensure the `DIMS` and `compactText` calls are in `_shared/textFit.ts` (sharable with Vitest)
4. Add render version key to `renderVersions.ts` for cache-busting if art changes
5. Deploy edges + test asset generation in dev dashboard
6. Operator creates campaign, assigns template, verifies output

### Adding a New Peça Platform
1. Add platform object to `pecasCatalog.js` (id, label, icon, formats with dimensions + HTML template names)
2. Create HTML generators in `dashboard/public/pecas/` (one file per platform × brand)
3. Run `npm run sync:pecas` (if auto-sync configured; else symlink/copy manually)
4. UI auto-renders platform in EstudioPecas sidebar + tab navigation
5. Operator can generate covers without code change

### Debugging a Failed Render
1. Check asset metadata: `template_key`, `variable_values` shape
2. Check Edge logs (Supabase dashboard → Functions → render-asset → Recent Invocations)
3. Common: text overflow (adjust DIMS or compact logic), missing image (check URLs in metadata), brand detection wrong
4. For Premium 9:16 OOM: check SCALE_TALL env var on Edge function (may need to lower from 0.75)
5. If issues persist, check Satori/Resvg version compatibility in imports

### Updating Brand Identity
1. Update color hex in `BRAND.md` (source of truth, linked from brandbooks)
2. Update render-asset Edge with new hex values (GOLD, OFF_WHITE, etc.)
3. Regenerate approved logos → `dashboard/public/brand/vitra-{brand}/logos/`
4. Update `brandProfiles.js` asset paths if logo filenames changed
5. Bump render versions for affected templates (forces re-render)
6. Redeploy edges + restart dashboard
7. Test with sample campaign

## Migration & Deployment Notes

- **Database migrations** in `supabase/` are applied on-demand; check migration SQL before applying
- **Edge function secrets** (COPILOT_GATE, PREMIUM_RENDER_SCALE) are set in Supabase dashboard, not .env
- **Render worker** deployment requires Fly.io account + service role key (never commit)
- **GitHub Actions CI** runs on push to main / PR; must pass lint + test + build to merge

## Obsidian Vault

`obsidian/` contains internal documentation (numbered update notes per session, brand audit, roadmap). Reference these for context on feature additions and decision history. Not part of the build artifact.

## Further Reading

- **BRAND.md**: Official brand specs, color palette, logo rules, tone of voice
- **README.md**: High-level project description, stack, repo link
- **CHANGELOG.md**: Session-by-session technical evolution
- **render-worker/ACTIVATION.md**: Runbook for deploying worker + v2 link feature
- **supabase/functions/_shared/*.ts**: Pure validation/rendering logic (the heart of the system)
