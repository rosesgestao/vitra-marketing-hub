# Product Marketing Context — Vitra

## Product Overview

**Vitra Marketing Hub** (formerly `vitra-premium-ferramenta-operacional`) is a multi-brand operational marketing platform supporting two distinct real estate brands in Porto Alegre, Brazil.

### Two Distinct Brands

#### Vitra Imobiliária (main brand / marca-mãe)
- **Positioning:** Institutional-commercial real estate advisory
- **Target:** Buyers, investors, families seeking properties in Porto Alegre
- **Brand voice:** Trustworthy, professional, consultative
- **Visual identity:** Navy (#0A1628) + Gold (#C4942A) + blue accents (safe, established, professional)
- **Default CTA:** "Fale com a Vitra" (Talk to Vitra), "Agende sua visita" (Schedule a visit)
- **Key messaging:** Portfolio of properties, patrimonial advisory, institutional support

#### Vitra Premium (luxury sub-brand)
- **Positioning:** Editorial, curated, high-end real estate
- **Target:** High-net-worth buyers and luxury real estate investors
- **Brand voice:** Sophisticated, refined, editorial
- **Visual identity:** Black (#000000) + Gold (#C4942A), **NO blue** (luxury, editorial, exclusive)
- **Default CTA:** "Conheça o projeto" (Discover the project)
- **Key messaging:** Curation, exclusivity, refined taste, editorial approach

### Hard Rule: Zero Cross-Contamination
- **Never** Premium vocabulary (curadoria, sofisticado, exclusivo, atemporal...) in Imobiliária copy
- **Never** cheap vocabulary (baratinho, promoção relâmpago...) in Premium copy
- Each asset, campaign, CTA, template carries explicit `brand_scope` field
- Copy validation gates prevent brand-mixing before publishing

---

## Platform Architecture

### Core Problem Being Solved
Real estate teams in Porto Alegre need a unified operational hub to:
1. Manage campaigns across multiple brand identities without risking contamination
2. Generate marketing copy (headlines, CTAs, bullets) powered by AI but human-reviewed
3. Render social media creatives (1:1, 9:16, 1.91:1 formats) with brand assets auto-applied
4. Track campaign performance and social media analytics
5. Export assets (PNG, PDF) production-ready, with no additional design work

### Current Features
- **Painel (Dashboard):** Campaign list, asset matrix, team workflows (pipeline, kanban, calendar)
- **Estúdio de Peças:** Fixed social media templates per platform (Facebook, LinkedIn, YouTube, Instagram, etc.) — no variations
- **Estúdio de Criativos (NEW):** Dynamic creative generator — users input property data, upload photos, system generates 3 formats (1:1, 9:16, 1.91:1) as browser-exportable HTML → PNG
- **Tráfego Pago:** Meta Ads workflow (generate, review, approve, export creatives)
- **Pipeline / Kanban / Calendario:** Shared workflow views
- **Agentes:** AI automation hub (future feature)
- **Métricas:** Analytics dashboard (future feature)

### Tech Stack
- **Frontend:** React 18 + Vite 5 + Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Edge Functions, Storage)
- **Render Pipeline:** Satori (layout) → SVG → Resvg (raster) → PNG; optional Node.js worker for high-res 9:16 Premium
- **AI Copilot:** Anthropic API (copy generation, facts extraction, template suggestion)
- **Export:** html2canvas + browser-native download

---

## Page / Feature Context for Copywriting

### Primary Audiences
1. **Marketing teams:** Need to generate on-brand copy fast, without hiring copywriters per campaign
2. **Real estate operators:** Want production-ready creatives without design bottleneck
3. **Premium brand managers:** Prioritize refinement and editorial direction
4. **Imobiliária managers:** Prioritize volume and institutional consistency

### Value Propositions

#### For Vitra Teams (Internal)
- **Time savings:** From 3-4 hours per creative set → 15 minutes (headline + facts → 3 format exports)
- **Brand safety:** Copy validation prevents Premium/Imobiliária mixing; logo & colors auto-applied
- **Consistency:** Same voice, CTA, visual treatment across campaigns
- **Approvals:** Single source of truth for brief, assets, published dates, metrics
- **Flexibility:** Mix AI suggestions + human judgment; tweak before publishing

#### For Real Estate Partners (Future B2B)
- **White-label:** Could offer copywriting + creative generation as a partner service
- **Self-service:** Property owners upload photos + data → get 3 social formats in minutes
- **Brand licensing:** Vitra's editorial voice + asset quality applied to their listings

---

## Key Proof Points / Outcomes
- **Current state:** ~0 campaigns live (MVP phase, internal team testing)
- **Design goal:** Reduce creative production cost per asset by 90%
- **Quality bar:** Copy passes `copyValidation.ts` (brand vocabulary check, no product name repetition, headline ≤40 chars); PNG exports at exact dimensions (no resize artifacts)
- **Scope:** Portuguese (PT-BR) only; Porto Alegre market focus; extensible to other Brazilian cities

---

## Constraints & Decisions
- **Brand separation is non-negotiable:** Every asset lives in one `brand_scope` slot; no shared templates
- **Copy tone differs:** Imobiliária = advisory + trust; Premium = editorial + refinement
- **Visual identity is locked:** No deviations from navy/gold (Imobiliária) or black/gold (Premium) palettes
- **AI is a suggestion layer:** Humans always review + approve copy before rendering; copy validation flags issues
- **Export is browser-native:** No backend rendering for speed; html2canvas handles PNG generation
- **Photos are base64-embedded:** html2canvas cannot export external images, so all photos are embedded in the HTML artifact to ensure PNG export works offline

---

## Tone & Voice Reference

### Vitra Imobiliária
- **Register:** Professional, consultative, warm
- **Examples:**
  - ✅ "Assessoria patrimonial Vitra" (patrimonial advisory)
  - ✅ "Fale com a Vitra" (talk to us)
  - ✅ "Apartamentos no Menino Deus" (straightforward, location-anchored)
  - ❌ Avoid: "REVOLUÇÃO" (revolution), "OPORTUNIDADE IMPERDÍVEL" (can't miss), buzzwords without substance

### Vitra Premium
- **Register:** Refined, editorial, understated confidence
- **Examples:**
  - ✅ "Curadoria reservada" (reserved curation)
  - ✅ "Conheça o projeto" (discover)
  - ✅ "Projeto editorial Premium" (editorial framing)
  - ❌ Avoid: "MEGA DESCONTO" (mega discount), "PROMOÇÃO" (promotion), cheap language

---

## Customer Language (Voice of Customer)

### From Team Feedback
- "Preciso gerar copy rápido mas que respeite a marca" (I need fast copy that respects the brand)
- "Cada imóvel é diferente, mas queremos consistência nos headlines" (Each property is different, but we want headline consistency)
- "As peças precisam sair prontas para exportar PNG" (Assets need to be ready to export as PNG)
- "Premium é mais sofisticado, Imobiliária é mais direto" (Premium is more sophisticated, Imobiliária is more direct)

### From Product Perspective
- **Pain point:** Real estate teams waste hours on copy approval cycles and design iteration
- **Desired outcome:** One-click campaign setup + AI-generated variations + human review + export
- **Objection:** "Will AI copy sound robotic?" → Answer: Copy validation + editorial review gates prevent that; Premium brand especially demands human touch

---

## Related Docs
- **BRAND.md:** Official brand specs, color palette, logo rules, tone of voice (source of truth for brand identity)
- **CLAUDE.md:** Full architecture guide, tech commands, deployment notes (in this repo)
- **README.md:** High-level project description
