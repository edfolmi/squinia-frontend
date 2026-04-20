# CLAUDE.md / AGENT.md

## Squinia — Engineering Execution Guide

---

# 1. ENGINEERING PRINCIPLES

### 1.1 Build Philosophy

* Build **feature-by-feature (vertical slices)**, not layers in isolation
* Every feature must be **usable end-to-end** before moving on
* Prioritize **working systems over theoretical completeness**

### 1.2 Modularity Rules

* Max file size: **~600 lines** (hard limit unless justified)
* Prefer **many small modules** over few large ones
* Enforce **clear boundaries** between:

  * API layer
  * Business logic (services)
  * Domain models
  * Infrastructure (DB, queues, AI providers)

### 1.3 Design Principles

* Prefer **composition over inheritance**
* Avoid **global state and hidden dependencies**
* Every module must have **one clear responsibility**
* All logic must be **testable in isolation**

### 1.4 System Thinking

* Design for:

  * **Scalability (multi-tenant, async workloads)**
  * **Observability (logs, metrics)**
  * **Replaceability (LLM providers, STT/TTS engines)**

---

# 2. PROJECT STRUCTURE (SOURCE OF TRUTH)

## 2.1 Backend (FastAPI)

```
backend/
│
├── app/
│   ├── api/                  # HTTP layer (routes/controllers)
│   ├── core/                 # config, settings, security
│   ├── domain/               # business entities (pure logic)
│   ├── services/             # use-cases (orchestrates domain)
│   ├── agents/               # AI agents (simulation, evaluation)
│   ├── prompts/              # versioned prompt templates
│   ├── memory/               # user/session memory logic
│   ├── simulations/          # simulation engine
│   ├── evaluations/          # scoring + feedback engine
│   ├── assignments/          # tasks, quizzes, workflows
│   ├── db/                   # ORM models + repositories
│   ├── schemas/              # request/response schemas
│   ├── workers/              # async jobs (Celery/queues)
│   ├── realtime/             # WebSocket handlers
│   └── utils/                # helpers (strictly generic)
│
├── tests/
├── scripts/
└── main.py
```

### Rules

* `api/` NEVER contains business logic
* `services/` orchestrates everything
* `domain/` contains pure logic only (no DB/HTTP)
* `agents/` are isolated, pluggable AI modules

---

## 2.2 Frontend (Next.js / React)

```
frontend/
│
├── app/                     # Next.js app router
├── components/              # reusable UI components
├── features/                # feature-based modules
│   ├── simulation/
│   ├── evaluation/
│   ├── dashboard/
│   └── assignments/
│
├── hooks/                   # custom React hooks
├── services/                # API client layer
├── state/                   # global state (Zustand/Redux)
├── styles/                  # design system
├── lib/                     # utilities
└── types/
```

### Rules

* Use **feature-based structure**, not type-based chaos
* UI components must be **dumb/presentational where possible**
* Business logic lives in **hooks/services**, not components

---

## 2.3 AI Layer (Critical)

```
agents/
│
├── simulation/
├── evaluation/
├── orchestration/
└── base/
```

```
prompts/
│
├── simulation/
├── evaluation/
└── versions/
```

### Rules

* Prompts are **NOT embedded in code**
* Every prompt must be:

  * Versioned
  * Reusable
  * Testable

---

# 3. DEVELOPMENT WORKFLOW

### 3.1 Golden Rule

> Build ONE feature completely before starting another.

### 3.2 Feature Definition

Each feature must include:

* Backend logic (service + domain)
* API endpoint
* Frontend UI
* Working flow (user → system → result)

### 3.3 Execution Steps

1. Define feature scope (strictly minimal)
2. Build backend (domain → service → API)
3. Connect frontend UI
4. Validate full flow
5. Commit

### 3.4 Definition of Done

A feature is complete only if:

* Fully functional end-to-end
* No broken flows
* No placeholder logic (unless explicitly allowed)
* Can be demoed

---

# 4. FEATURE DEVELOPMENT RULES

* NEVER build multiple features in parallel
* ALWAYS connect:

  ```
  UI → API → Service → Domain → Response
  ```
* Avoid mock logic unless:

  * External dependency unavailable
* Replace mocks immediately after validation

---

# 5. CODE QUALITY STANDARDS

### 5.1 File Rules

* Max ~600 lines
* Split aggressively when approaching limit

### 5.2 Function Rules

* Max ~50 lines per function
* Must do ONE thing

### 5.3 Naming

* Use explicit names:

  * `simulateInterviewSession()`
  * NOT `processData()`

### 5.4 Structure

* Avoid deep nesting (>3 levels)
* Use early returns
* Use clear typing (Pydantic / TypeScript)

---

# 6. AI AGENT ARCHITECTURE RULES

### 6.1 Agent Design

Each agent must be:

* Stateless (except injected memory)
* Config-driven
* Replaceable

### 6.2 Types of Agents

* Simulation Agent (conversation)
* Evaluation Agent (scoring)
* Orchestrator Agent (multi-agent routing)

### 6.3 Prompt Rules

* Stored in `/prompts`
* Versioned (`v1`, `v2`, etc.)
* No inline prompt strings in services

### 6.4 Memory Rules

* Session memory (short-term)
* User memory (long-term)
* Must be injectable, not global

### 6.5 LLM Abstraction

* Never tie logic to one provider
* Use adapter pattern:

  ```
  OpenAIAdapter
  GroqAdapter
  LocalLLMAdapter
  ```

---

# 7. UI/UX DESIGN SYSTEM (CRITICAL)

This section is the **contract for all Squinia frontend work**. The live reference implementation is the **simulation** flow under `app/simulation/` plus tokens and utilities in `app/globals.css`. New screens must feel like the same product—not a template kit.

---

### 7.1 Product Shape (What We Are Building)

* Squinia is a **human performance training** surface: **enter → perform → reflect → improve** (state machine), not a generic SaaS dashboard.
* Primary experiences are **immersive rooms** (simulation, evaluation, adaptation)—not card grids, not “admin panels.”
* **Transcript-first** for text sessions: editorial **timeline**, not chat bubbles. **Voice / video** modes later swap **channel glyphs and chrome** only; the same calm system language stays.

---

### 7.2 North Star Aesthetic

**Editorial × system × simulation**

* **Editorial:** typography-led, generous vertical rhythm, reading comfort over decoration.
* **System:** mono caps labels, clocks, signals, sparse chrome—**signals**, not scoreboard charts.
* **Simulation:** full-viewport or focused columns, minimal distraction while performing.

**Non‑negotiable “never” list**

* No **dark-mode-by-default AI startup** look (no neon, no heavy gradients, no glow halos as primary emphasis).
* No **chat-app clone** (floating bubble threads, bubbly typing dots as the main metaphor).
* No **template SaaS** (dense card dashboards, data tables as the default hero, sidebar-first app chrome on performance surfaces).

---

### 7.3 Design Tokens (CSS Variables)

Defined in `app/globals.css` on `:root`—**extend here first**, then consume in Tailwind via `var(--token)` or mapped utilities.

| Token | Role |
|--------|------|
| `--background` | Warm canvas `#fafaf7` (not pure white). |
| `--foreground` | Ink `#111111`. |
| `--muted` | Secondary text `#5c5c55`. |
| `--faint` | Tertiary / labels `#8a8a82`. |
| `--rule`, `--rule-strong` | Hairlines and borders. |
| `--field` | Slightly recessed areas (composer field strip). |
| `--surface` | Elevated panels (header bar, inset wells). |
| `--accent` | Primary action green **`#32a852`** (solid). |
| `--accent-hover`, `--accent-active` | Hover / press. |
| `--accent-fg` | Text on accent (white). |
| `--focus-ring` | Keyboard focus `rgba(50, 168, 82, 0.45)`. |

**Accent usage:** primary commits only—**End session**, **Enter simulation**, **Send** (when enabled), and **mode toggles** when that mode is active. Do not sprinkle green as decoration.

---

### 7.4 Typography

* **Sans** for body and titles (Geist Sans via layout).
* **Mono** for system vocabulary: `SCENARIO`, `T+`, timestamps, signals, buttons labels—**uppercase + wide tracking** (`~0.24em–0.28em` on small caps).
* **Transcript body:** comfortable size (~18px), relaxed leading (~1.72), slight negative tracking on longform.
* **Scenario titles** in rails: one step **heavier** than body (`font-medium`) so hierarchy is obvious without a new color.

---

### 7.5 Geometry: Curves vs Lines

* **Prefer curves** on user-facing containment: header bar (`rounded-2xl`), primary buttons (`rounded-xl` / `0.75rem`), composer shell, rail sections, avatar chips.
* **Avoid naked straight rules** as the only separator: use **gradient hairlines** (`from-transparent via-[var(--rule)] to-transparent`) for transcript dividers, meta lists, and light section breaks.
* **Composer seam:** a **sculpted transition** from transcript to input (SVG valley + asymmetric radii)—not a single flat `border-t`. New “rooms” should reuse this **pattern** (curve + field strip), not copy arbitrary pixel values blindly.

---

### 7.6 Layout Patterns

**Performance surfaces (simulation, live evaluation, etc.)**

* **No persistent app sidebar** on these screens unless the product explicitly becomes multi-module; navigation is **back + end session + optional context drawer** on small viewports.
* **Three-column desktop** when needed: **persona / transcript / session metadata**; stack on small screens with **drawer** for session + persona overflow.
* **Composer docked** under the transcript column; max readable width aligned to transcript (`~40rem`).

**Marketing or account settings (later)**

* May use more conventional pages; still use **same tokens and accent discipline** so the brand is continuous.

---

### 7.7 Rails & Metadata

* **Right rail:** full column height, **`overflow-y: auto`** on the scroll region so metadata never forces page-level weirdness.
* **Sectioning:** scenario in a **tinted rounded block**; meta rows with **soft dividers**; long **persona** copy in a **bounded, scrollable** well; **signals** in a **light inset card** with gradient separators between rows—not identical to a data table.

---

### 7.8 Buttons & Control States

Use the shared classes in `globals.css`:

| Class | When |
|--------|------|
| `.sim-btn-accent` | Primary actions (solid `#32a852`, rounded, shadow discipline). |
| `.sim-btn-muted` | **Disabled** blocking state (e.g. Send while interviewer is composing). |
| `.sim-btn-send-idle` | Send **enabled but empty draft**—dashed green border, light fill; **not** the same as muted slab. |

**Interaction**

* **Shell:** wrap performance routes in `.sim-root` so `button:not(:disabled)` uses **`cursor: pointer`**; disabled controls use **`cursor: not-allowed`** where applicable.
* **Focus:** `.sim-root :focus-visible` uses `--focus-ring`; textarea gets slightly larger outline offset. Never ship focus-visible removal on interactive elements.

---

### 7.9 Motion

* **Short** opacity or layout transitions only (e.g. `~200–280ms` ease-out). Disposition / live panel micro-motions are optional **accent**, not entertainment.
* **`prefers-reduced-motion: reduce`:** disable entrance animations, composer shell transitions, and **pulse** loops; respect in all new keyframes.

---

### 7.10 Channel Modes (Future-Proofing)

* **Live transcript (text):** chat-styled **glyph** + arc underline in header (lens-like arc = family resemblance to future **camera**; bubble = **this** channel is text).
* **Voice / video (later):** swap the **mark + label** only (e.g. phone / camera icons); **do not** change the whole layout language per mode.

---

### 7.11 Implementation Rules (Frontend)

* **Stack:** Next.js App Router, **Tailwind CSS v4**, **no heavy UI kits** for core product surfaces unless explicitly approved.
* **Tokens first:** new colors/spacing go through **`globals.css`** and `:root` / `@theme` where appropriate.
* **Reuse patterns** from `app/simulation/[sessionId]/simulation-screen.tsx` before inventing parallel systems (composer, rails, header).
* **Accessibility:** semantic headings, `aria-live` for system status where content streams, visible focus, sufficient contrast on green-on-white controls.

---

### 7.12 Copy Tone (UI Strings)

* **System voice:** short, operational (“Wait for the interviewer…”, “Add a reply to enable Send.”).
* **Avoid** hype and **avoid** fake scores as final truth; **signals** (↑ → ↓) are live reads until evaluation is wired.

---

### 7.13 Definition of Done (UI)

A new screen or feature is **aligned** when:

1. It uses **documented tokens** and accent rules.
2. It does not introduce **forbidden patterns** in §7.2.
3. **Focus** and **reduced motion** are handled.
4. It **visually matches** the simulation reference at a glance (spacing, type, curves, green).

---

# 8. STATE MANAGEMENT & DATA FLOW

### 8.1 Frontend State

* Use **Zustand or Redux Toolkit**
* Separate:

  * UI state
  * Server state

### 8.2 API Communication

* Centralized API layer (`services/`)
* No direct fetch calls inside components

### 8.3 Real-Time

* WebSockets for:

  * Live simulations
  * Streaming responses
* Fallback to polling if needed

---

# 9. TESTING & VALIDATION

### 9.1 Minimum Requirements

Each feature must:

* Work end-to-end
* Handle basic edge cases

### 9.2 Backend

* Unit tests for services
* Integration tests for APIs

### 9.3 Frontend

* Component sanity checks
* Basic interaction tests

---

# 10. COMMIT STRATEGY

### 10.1 Rules

* One feature = one commit (or small set)
* No partial commits

### 10.2 Format

```
feat(simulation): add basic chat-based interview flow

- backend simulation service
- API endpoint
- frontend chat UI
- end-to-end working flow
```

### 10.3 Requirements

* Must be runnable after each commit
* No broken builds

---

# 11. WHAT TO AVOID (ANTI-PATTERNS)

### Absolute NOs:

* Giant monolithic files
* Mixing UI + business logic
* Hardcoding prompts inside services
* Tight coupling between modules
* Premature optimization
* Building features ahead of need

### Common Failures:

* “Let’s just add this quickly” → leads to tech debt
* Skipping end-to-end validation
* Over-engineering early stages

---

# 12. EXECUTION MINDSET

* Build like a **production system from Day 1**

* Every line of code should be:

  * Maintainable
  * Replaceable
  * Scalable

* Think in systems, not scripts

* Optimize for:

  * Speed of iteration
  * Long-term clarity

---

# FINAL DIRECTIVE

This codebase must evolve into a **category-defining AI platform**, not a prototype.

Every decision must pass this test:

> “Will this scale to 100,000+ users and a multi-team engineering org?”

If not — redesign it.

---
