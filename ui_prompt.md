Here is your highly targeted engineering prompt for Windsurf. It explicitly mandates gutting the placeholder DXY chart from the "For You" / "Capital Flow" card and building a custom visual tracking system that maps inter-asset institutional capital flow exactly like the original.

Engineering & UI Refinement Specification: Capital Flow & For You Card Overhaul
Objective: Overhaul the "For You Summary Card" on the Ark Intelligence Dashboard to achieve pixel-perfect parity with the original HybridTrader aesthetic. Replace the generic placeholder DXY line chart with a dedicated, custom institutional Capital Flow Graph that visually tracks liquidity movement across global assets.

References:

Target Git Repository: https://github.com/noahmuler/Ark_Intelligence (Focus on the newly pushed files for the For You / Briefing card)

Original UI Reference: https://hybridtrader.ai/

Please execute the following codebase modifications while strictly locking in our dark purple glassmorphic theme:

1. Capital Flow Visual Graph Overhaul (CRITICAL)
The Directive: Completely remove the generic placeholder chart (e.g., the standalone DXY line chart) currently slapped inside the card.

The New Component: Build or implement a high-fidelity, relational liquidity tracking chart that demonstrates relative velocity and direction of institutional funds (e.g., moving out of Risk-On assets like NQ/ES/BTC and rotating into Safes/Risk-Off like DXY/XAU).

Implementation Details: * Use a clean relational layout (such as a normalized multi-line performance variance chart, a beautiful stacked area velocity graph, or a custom chord/Sankey layout using paths via Recharts/Framer Motion).

The visual weights, stroke thicknesses, and glowing gradients must match the high-end minimalist styling of HybridTrader.

2. High-Density "For You" Info Hierarchy
Typography & Density: Pack data tightly. Strip away excessive vertical padding and use clean, small-caps, medium-opacity sub-headers for titles.

Key-Value Realignment: Group macroeconomic metrics, directional flags, and net flow percentages into an immediate, clean horizontal or structured grid alignment. The text blocks should read compactly as a rapid pre-session cheat sheet.

3. DOM Codebase Housekeeping & Purge
Prune Redundant Layers: Aggressively clean up any legacy chart logic, commented-out Canvas configurations, or fallback data objects from previous layout testing.

Flatten Container Nesting: Ensure the card structure leverages a single, optimized glassmorphic container layer (backdrop-filter: blur(12px), border: 1px solid rgba(147, 51, 234, 0.15)). Eliminate nested wrapper boxes that create double-border backgrounds or padding misalignments.

Windsurf Execution Checklist:
Is the placeholder DXY chart completely gone and replaced by an interconnected Capital Flow visualization?

Does the entire component cleanly integrate with our signature dark purple theme and glowing sub-borders?

Has the underlying code been audited to scrub all duplicate styles or unused boilerplate structures?

Go.

🛠️ Reference: Extracted UI Libraries
For your reference during development or if you need to pull interactive structural elements, here are the UI libraries listed in your prompt:

Metal UI: https://metal.jakubantalik.com/

Style UI: https://styleui.dev/

Skiper UI: https://skiper-ui.com/components

Ali Imam Docs: https://aliimam.in/docs/components

Watermelon UI: https://ui.watermelon.sh/

Cult UI: https://www.cult-ui.com/docs

Dot Matrix: https://dotmatrix.zzzzshawn.cloud/

Componentry: https://www.componentry.fun/docs

Balloons JS: https://arturbien.github.io/balloons-js/
