# Adaptive Homework Tutor — System Design

## Overview
The system is a client-side, single-page web application that helps learners solve circuit problems step-by-step with immediate feedback and optional guidance. It combines a structured problem workspace, an interactive guidance panel, a lightweight chat-like tutor, and a drawing canvas for working through ideas. The UI is optimized for clarity, speed, and focus.

## Core Architecture
- **Front-end only**: Pure HTML/CSS/JavaScript; no build step or server dependency. All logic runs in the browser.
- **Tri-pane layout**: Left problem workspace, optional center guidance panel, and right drawing/canvas pane with dynamic resizing.
- **State and DOM utilities**: Simple utility modules (`state.js`, `dom-utils.js`, and config helpers) support responsive UI behavior and structured state updates.
- **Problem definition**: Problems are defined as a list with fields (labels, placeholders, expected answers, and per-field saved status).
- **Guide engine**: A small, policy-driven step system renders hints, checks answers with tolerances, and unlocks next steps.
- **UX components**: Modal overlays, toasts, badges, progress bar, and confetti for completion.

## Key Modules
- `index.html`: Main UI, layout styles, interactive logic, guide and modal implementations, progress, and confetti.
- `config.js`: Configuration and utility helpers (formatting, tolerance checks, debounce/throttle, performance measurement).
- `dom-utils.js`: DOM manager for event delegation, batching, showing/hiding elements with transitions, and cleanups.
- `state.js`: Minimal state manager for structured updates, subscriptions, snapshots, and restore.

## UI Structure
- **Top bar**: App branding and a To-Do drawer trigger with a dynamic badge.
- **Left pane (Problem)**:
  - Problem header with title and description.
  - Answer fields list: Each field has label, input, feedback, and per-field actions.
  - Submission and clear actions, progress bar (percentage only).
  - Navigation buttons to move between fields; first/last field constraints applied.
- **Center pane (Guide)**:
  - Optional inline/popup guidance showing steps, micro-questions, and hints.
  - Dynamic policies adjust hint detail based on user performance.
- **Right pane (Canvas)**:
  - Freehand drawing, shapes, text, and image upload.
  - Selection tool for region-based “ask AI about sketch” flow.
  - Undo/redo history and simple toolbar interactions.

## Interaction Flow
1. User reads the problem and enters values into answer fields.
2. On submit:
   - Input is validated against expected answer with tolerance.
   - Field status updates (`ok`/`err`), feedback is shown.
   - “Guide Me” is available for each item until it is correct.
3. Progress updates based on correctly answered fields.
4. When all fields are correct, a congratulations modal appears with confetti.
5. Users can switch to guidance to unlock step-by-step hints and summary knowledge.

## State Management
- **Per-field persistence**: The application saves `value`, `status`, and `wrongCount` in the problem data to preserve state across re-renders.
- **Clear behavior**: Resets field values, statuses, `wrongCount`, and UI feedback elements.
- **Progress**: Calculated from `.field-in.ok` counts and reflected in the progress bar fill width.
- **Settings**: Modal exposes controls to preview response style, tone, and accessibility.

## Guidance System (Strong Adaptive)
- **Operating mode**: This system operates in Strong Adaptive mode by default.
- **Policy engine**: Controls hint style and depth based on attempt history and per‑step mistakes.
- **Step types**: Multiple-choice and numeric input with tolerance-based checking.
- **Unlock logic**: Each step becomes available upon correct answer; summary is shown at the end.
- **Inline vs popup**: Guidance can be embedded or shown as a popup panel.
- **Strong Adaptive behavior**: Repeated mistakes at a single step escalate hints to include explicit formulas, substitutions, and verification heuristics (e.g., sum of drops equals source voltage, parallel \(R_{\mathrm{eq}}\) must be < min branch).

### How Dynamic Guidance Manifests
- **Policy Resolution**: The system computes a policy (`variant` and `hintTier`) from your recent performance: wrong/correct streaks and per‑step wrong counts.
- **Rendering Effects**: Steps are rewritten based on the policy with concept scaffolds, verification heuristics, and sense‑checks. Repeated mistakes elevate hints at the current step.

### Concrete Examples (Baseline vs Strong Adaptive)

- Example: R_parallel (R2||R3) equivalent in “Total Resistance”
  - Baseline:
    - “Formula: (R2 * R3) / (R2 + R3). Here: (30 * 50) / (30 + 50).”
  - Strong Adaptive (after repeated mistakes on this step):
    - “\(R_{\mathrm{eq}} = \dfrac{R_2 R_3}{R_2 + R_3}\). Substitute R2=30Ω and R3=50Ω. Concept test: result must be < 30Ω.”

- Example: Total Current (I_total)
  - Baseline:
    - “Use the Source Voltage (10V) and the Total Resistance (58.75Ω). I = 10 / 58.75.”
  - Strong Adaptive:
    - “Frame: Whole‑circuit Ohm’s Law. Known: \(V_{\text{source}}=10\,\mathrm{V}\), \(R_{\text{total}}\). Goal: \(I_{\text{total}}=V/R\). Sense‑check: Larger \(R_{\text{total}}\) → smaller current; units are A.”

- Example: Parallel Voltage (V_parallel)
  - Baseline:
    - “V = I_total * R_parallel.”
  - Strong Adaptive:
    - “Idea: Series chain shares the same current. Check: \(V_{R_1}+V_{\text{parallel}}+V_{R_4}=V_{\text{source}}.\) If not, one term is miscomputed.”

- Example: Branch Currents (I_R2 vs I_R3)
  - Baseline:
    - “I = V_parallel / R.”
  - Strong Adaptive:
    - “Same voltage across branches; current divides by resistance. Since \(R_3>30\,\Omega\), expect \(I_{R_3}<I_{R_2}\).”

### Dual File Profiles
- Advanced (minimal guidance): include `mode-advanced.js` after the main script to enforce compact hints (no escalation). Other features remain identical.
- Novice (hand-holding guidance): include `mode-novice.js` after the main script to enforce supportive hints with maximum scaffolding and inline guide.

Usage:
- In your HTML, add one of:
  - `<script src="mode-advanced.js"></script>`
  - `<script src="mode-novice.js"></script>`

Behavior:
- Advanced: `resolveGuidePolicy` returns `{variant:'compact', hintTier:0}` — concise hints, no step-level escalation.
- Novice: `resolveGuidePolicy` returns `{variant:'supportive', hintTier:2}` — concept scaffolds, verification heuristics, and step-level handholding.

Code references:
- Policy override via profile scripts: global `resolveGuidePolicy` replacement
- Inline guide open: `guideUiVariant='inline'` with `setGuideInlineOpen(true)`
 
### Web Profiles (URL)
- Select version directly via URL parameters:
  - Advanced: `/?profile=advanced`
  - Novice: `/?profile=novice`
- If `profile` is not specified, the address will automatically normalize to `?profile=advanced` (no page refresh, other parameters preserved).
- Can be used simultaneously with dynamic hint levels:
  - Example: `/?profile=novice&dyn=2`
- Specify guide display method:
  - `/?profile=novice&guide=popup` or `guide=inline` (default is inline, popup when `guide=popup` in URL)
- Post-deployment examples:
  - `https://your-domain.com/?profile=advanced`
  - `https://your-domain.com/?profile=novice`
## Experience the Dynamic Behavior
- **How it manifests**: Make mistakes on the same step or within a topic. The system escalates hints from baseline to concept scaffolds, verification heuristics (e.g., sum of voltage drops), and comparative reasoning.
- **How to use**:
  - Click “Guide Me” on any item.
  - Intentionally answer the current step incorrectly more than once to see step‑level escalation.
  - Observe the guide header badge and labels switching modes and the hints becoming more structured and conceptual.
- **Code reference**:
  - Policy resolver & hint tiers: `index.html:2367–2399`
  - Concept‑driven, verification hints rendering: `index.html:2399–2466`


## Feedback and Completion
- **Field feedback**: Immediate textual feedback (“Correct” or “Incorrect — try again”).
- **Guide Me visibility**: Available for each item until it is correct.
- **Progress bar**: Shows percentage completion (no numeric “X/8” text).
- **Completion celebration**: Modal overlay + animated confetti canvas.
- **Toasts**: Used for general UX messages; “X/8 correct” and next/previous field toasts are removed.

## To-Do Drawer
- **Badge count**: Updates based on items not marked `.done`.
- **Item toggle**: Clicking an item toggles completion and updates the badge.
- **Progress linking**: Todo items are linked to learning progress - clicking on uncompleted items jumps to the corresponding problem.
- **Extensibility**: Can import tasks from a markdown list format (e.g., `- [ ] task`) if wired to fetch a `TODO.md`.

## Draft Pad
- **Quick notes**: Dedicated area for quick calculations and notes during problem solving.
- **One-click copy**: Copy all content with a single click for easy sharing or reference.
- **Persistent**: Content persists during the session for reference across problems.

## Learning Summary
- **Export functionality**: Copy learning summary to clipboard with one click.
- **Progress tracking**: Automatically tracks completed problems and learning steps.
- **Shareable**: Summary can be shared or saved for review purposes.

## Canvas System
- **Tools**: Pen, line, rectangle, circle, text input, select, and eraser.
- **Vector Drawing**: All drawing tools now use SVG vector paths for crisp, scalable graphics. Free handwriting uses SVG paths with pen pressure simulation and smoothing algorithms.
- **Pen Features**: Dynamic stroke width based on drawing speed (pressure simulation), quadratic Bezier curve smoothing for natural handwriting.
- **Text input**: Temporary HTML input converted to canvas text with size/color mapping.
- **Images**: User-uploaded image previews and scaled insertion.
- **History**: Undo/redo stacks with snapshot images; clear resets the canvas.

## Performance and Accessibility
- **Batching**: DOM operations are batched and transitions are minimized for responsiveness.
- **Debounce/throttle**: Used in interactive operations to avoid excessive updates.
- **Keyboard and pointer**: Basic keyboard interactions and pointer events are consistent across tools.
- **Accessibility**: Font sizes, contrasts, and focus states aim to be readable and friendly.

## Extensibility
- **Problem sets**: Add more problems by extending the `PROBLEMS` array with labels and answers.
- **Guidance topics**: Extend `GUIDE_TOPICS` and step policies to add new guided flows.
- **Integrations**: Rules and tasks can be loaded from external markdown files and mapped to UI elements.

## File Map
- `index.html`: Main SPA, layout, logic, guidance, modals, progress, confetti.
- `config.js`: Config and shared utilities.
- `dom-utils.js`: DOM manager helpers.
- `state.js`: Simple state container.
- `README.md`: This design document.
- `RULES.md`: Team/process rules (to be defined by you).
- `TODO.md`: Task list for next actions (to be defined by you).
