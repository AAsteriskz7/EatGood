Frontend Design System Rules
## Rule 00
Always use shadcn ui components when there is a chance. all new additions must follow the rules. No new hardcoded things.

## Rule 01 — Design Token Supremacy

Every visual decision — color, space, size, radius, shadow, type — must trace back to a named token. If a value isn't in the token system, it doesn't belong in the code.

**Principles**
- Never hardcode a color, spacing value, or radius. Always reference a token.
- Tokens are organized in tiers: primitive (raw values) → semantic (purpose-named) → component (scoped). Write semantic and component tokens; never expose primitives in components.
- Semantic naming describes intent, not appearance. `color-surface-elevated` is correct. `color-gray-100` in a component is not.
- Tokens must exist before a component is built — not created to justify a one-off.
- When a design decision changes, it changes in the token. Every component that uses that token updates automatically. This is the entire point.

**The test:** If you change one token value and more than one visual thing doesn't update — your abstraction is broken.

---

## Rule 02 — The Spacing Contract

All spacing comes from a single multiplicative scale. Nothing is eyeballed. The rhythm this creates is what makes an app feel like a unified system rather than assembled parts.

**Principles**
- Pick one base unit and derive everything from it multiplicatively. Every gap, padding, margin, and size is a multiple of that base — no exceptions.
- Spacing is not applied arbitrarily. Inner spacing (padding inside a component) is smaller than outer spacing (gap between components). This creates visual hierarchy through rhythm.
- Component padding follows a consistent internal contract: the same component type always uses the same padding scale. A card's padding is always the same — it doesn't differ from instance to instance.
- Vertical and horizontal spacing use the same scale but are not always equal — taller vertical rhythm feels more readable. Honor this asymmetry intentionally.
- When in doubt, add more space. Density should be a deliberate design decision, not the default.

**Why this matters:** Inconsistent spacing is the single most visible signal that an interface wasn't designed as a system. The eye detects rhythm before it reads content.

---

## Rule 03 — The Surface & Elevation System

Every container — card, panel, modal, tooltip — belongs to an elevation tier. Tiers define background, border, and shadow as a group. You don't mix properties across tiers.

**Principles**
- Define a small set of elevation levels (e.g. base, raised, floating, overlay). Each level maps to a specific surface token combination — background + border + shadow are always set together, never independently.
- Higher elevation = more visual separation from the base. Achieve this through background lightness shift, border opacity, or subtle shadow — never by dramatically changing color.
- Cards are always the same tier. If two surfaces look different, it's because they have different content — not because one card is styled differently than another.
- Never nest elevated surfaces of the same tier. A card inside a card requires one of them to shift tiers to maintain depth hierarchy.
- Modals and overlays are always the highest tier and always include a scrim behind them. This is not optional — it communicates that interaction is blocked below.

**The ecosystem principle:** The "one big ecosystem" feeling comes almost entirely from every surface being on a consistent elevation ladder. If two things look like cards, they must behave and look identical.

---

## Rule 04 — Typography as Hierarchy, Not Decoration

A typographic scale defines the entire visual hierarchy of the page. Type size, weight, and color are always used in combination — never independently to create emphasis.

**Principles**
- Define a scale with named roles: display, heading, subheading, body, label, caption, code. Every text element uses one of these roles. There is no "slightly bigger body text."
- Hierarchy is created through the combination of size + weight + color. A heading is larger, heavier, and uses primary text color. A caption is smaller, regular weight, and uses tertiary text color. Mixing these signals creates confusion.
- Font weight is used sparingly. Two or three weights maximum across the entire system. Adding a new weight is a system decision, not a component decision.
- Line-height and letter-spacing are part of the scale — not tweaked per-component. Consistent line-height is what makes text blocks feel like they belong together.
- Never use font-size alone to draw attention. If something needs emphasis within body text, bold it. If it needs more prominence than body, it needs a named typographic role.

**Red flag:** If you find yourself writing a raw font-size value anywhere that isn't a token definition, the type system is being bypassed.

---

## Rule 05 — Component Composition Contract

Components don't style their own outer spacing. They define their interior — padding, gap, internal layout. The space between components is always the responsibility of the parent layout.

**Principles**
- A component owns its internal padding. It never owns its margin or its position relative to siblings — that is the layout's job.
- Components accept a consistent set of variant props that map to token-defined states: size, variant, state. Arbitrary style overrides via className or style props are a signal that a variant is missing from the system.
- Composition over configuration. A complex component is built by composing smaller ones — not by adding more props to one component. When a component has more than ~5 variant props, it should be split.
- Spacing between composed components comes from a layout primitive (stack, grid, cluster) that uses scale tokens. Never put margin directly on a component to push it away from a sibling.
- Components are context-unaware. A Card doesn't know it's inside a grid. A Button doesn't know it's inside a Card. This is what makes them reusable.

**Layout primitives:** Build Stack, Grid, and Cluster layout components that accept a gap prop from the spacing scale. These become the only way to space components relative to each other.

---

## Rule 06 — Color as Communication

Color carries meaning before it carries aesthetics. Every color decision must be justifiable by what it communicates, not by what it looks like.

**Principles**
- Semantic color tokens define usage intent: `color-feedback-error`, `color-interactive-primary`, `color-surface-brand`. The same hue can exist in multiple semantic tokens for different purposes.
- Interactive elements — links, buttons, focus rings — always use the same `interactive` color tier. A user learns this color means "I can act on this." Using it decoratively breaks that contract.
- Feedback colors (error, success, warning, info) are never used outside feedback contexts, regardless of aesthetics. Red is for errors, full stop.
- Sufficient contrast is non-negotiable. Text on any surface must meet accessibility contrast ratios. This is validated against all surfaces the text can appear on.
- Brand color is used with restraint. It marks the one or two most important interactive or brand-expressive moments per view — not scattered as decoration.

**The rule:** If you can't explain in one sentence why a color is used, it's decorative. Decorative color creates noise and dilutes the meaning of purposeful color.

---

## Rule 07 — Motion with Intention

Animation communicates state changes and spatial relationships. It is never used to make things feel "alive" at the cost of clarity or performance.

**Principles**
- Every animation answers one question: where did this element come from, or where did it go? If the animation doesn't answer that question, it shouldn't exist.
- Duration and easing come from a defined motion scale, not from per-component judgment. Fast interactions (button press, toggle) use short durations with ease-out. Larger transitions (modal, page) use longer durations with ease-in-out.
- Reduced motion preference must always be respected. Every animation has a no-animation fallback that still communicates the state change via instant show/hide or color change.
- Exit animations are as important as entrance animations. An element disappearing without animation feels broken — it communicates nothing about where the content went.
- Staggered animations on lists create a sense of layout without being noise — use a consistent, short stagger delay token so every list in the app staggers identically.

**Principle:** Motion should make the interface feel responsive and continuous, not theatrical. If a user notices an animation as an animation rather than as information, it's too prominent.

---

## Rule 08 — Adaptability Without Breakage

The system must be extendable without requiring rewrites. New components, themes, and tokens must be addable without touching existing implementations.

**Principles**
- Token additions are always safe. Removing or renaming tokens is a breaking change and requires a migration — not a find-and-replace.
- Component variants are additive. Adding a new size or variant value must never change the behavior of existing values.
- Theming is achieved entirely by swapping token values — not by rewriting components. If theming requires component changes, the abstraction layer is wrong.
- Dark mode is not a theme — it's a token value swap. Every token has a light and dark value. Components never contain light/dark conditional logic.
- Design decisions that affect the whole system (spacing scale, type scale, elevation levels) require a deliberate system-wide review — not ad hoc per-component changes.

**Changeability test:** If changing the primary brand color requires touching more than the token file, the system is not properly abstracted.

---

## Rule 09 — Consistency Over Creativity

Every novel design decision made at the component level is a deviation from the system. Deviations accumulate into inconsistency. Consistency is the goal — creativity happens at the system design level.

**Principles**
- When building a component, reach for existing tokens, variants, and primitives first. Only add something new if it genuinely can't be expressed with what exists.
- If two components look similar but aren't using the same tokens, that's a bug — not a design choice. Audit and unify.
- Visual consistency is more important than pixel-perfect adherence to a spec. If following the spec breaks the visual rhythm of the system, the spec should be updated.
- All interactive states (hover, focus, active, disabled) must be defined for every interactive component. Leaving any state unstyled means the system is incomplete.
- When in doubt, copy the pattern that already exists. The system's value comes from repetition, not invention.

**The endgame:** A user who never thinks about the interface — because every element behaves exactly as expected — is a user who experiences a complete system.

---

## Rule 10 — Responsive Thinking, Not Responsive Breakpoints

Components should be intrinsically responsive — able to adapt to any container width — rather than depending on device-level breakpoints to change their appearance.

**Principles**
- Prefer fluid layouts using proportional units, min/max constraints, and auto-fit grids over fixed breakpoint-based switches wherever possible.
- Breakpoints are a last resort for major structural shifts (e.g. sidebar collapses to drawer). They are never used for fine-grained adjustments like font size or padding.
- Every component is designed and tested at its smallest usable size before its largest. Mobile constraints reveal design problems that desktop hides.
- Spacing tokens scale with the layout — define compact and comfortable spacing tiers that activate based on container size, not viewport size.
- Touch targets have a minimum size defined as a system token. No interactive element is smaller than this regardless of screen size.

**Principle:** A component that works in a narrow sidebar and a wide main content area without changes is a well-designed component. A component that only works at one width is a layout assumption wearing a component costume.

---

## Rule 11 — The Anti-Vibecode Blacklist

Every pattern below is an AI default — the result of a model trained on millions of Dribbble shots, Tailwind templates, and shadcn dashboards reaching for the statistically "safe" choice. They are banned not because they're trendy, but because they signal that no one made a decision. None of these belong in a system built with intention.

### Banned Patterns

**Purple / Indigo Default**
`bg-indigo-500` is Tailwind's original default button color. Every AI trained on that data inherited the bias. If the primary color is indigo-ish and wasn't chosen deliberately, it wasn't chosen at all.

**Blue-to-Purple Gradient Hero**
The single most common AI-generated page signature. Dark background, gradient headline fading blue to violet, subtle mesh in the corner. Immediately marks the product as undesigned.

**Glassmorphism Cards**
Frosted blur cards floating over gradient backgrounds. The vibe-coding "glassy baseline" — looks stunning in isolation, fails on real devices with real content, destroys text contrast.

**Mesh / Aurora Backgrounds**
Blurred multi-color gradient blob backgrounds. Were interesting in 2021. Now the universal signal of "I asked an AI to make it look premium." The background supports content — it doesn't compete with it.

**Space Grotesk / Inter by Default**
Both are fine fonts made meaningless by overuse. Space Grotesk = default techy startup. Inter = default neutral everything. If the agent picked it, it's because millions of apps picked it first. Use fonts with a point of view defined in the type token.

**Gradient Headline Text**
CSS `background-clip: text` with a color gradient. Was a bold move in 2020. Now it's clip-art. If the most important text on the page needs a gradient to feel exciting, the copy is the problem — not the styling.

**Neon Glow / Glowing Accents**
Box shadows in electric blue, purple, or green. Glow should mean something — active state, critical alert, interaction feedback. Ambient glow is decoration pretending to be design.

**Seven Competing Accent Colors**
AI defaults to using every palette color at full saturation across one screen. A real system uses one primary action color and neutral everything else. Multiple loud colors means no hierarchy.

**Heavy Drop Shadows on Cards**
Adding dramatic shadows to make cards "pop" is a patch over a broken surface system. The real fix is a subtle background tone shift between the card and its parent. Elevation is about tone, not shadow size.

**Pill Buttons on Everything**
`border-radius: 9999px` applied to every button regardless of context. Pill shape communicates friendliness — use it where friendliness is the message. Applied universally, it communicates nothing.

**Emoji as Icons**
🚀 Features. ✨ Benefits. 🎯 Goals. Emoji bullets are visually distinct without requiring a design decision. They read as a personal project, not a product. Use a proper icon system or nothing.

**Neumorphism / Soft UI**
Matching inset/outset shadows creating raised plastic-looking components. Fails all contrast requirements. A design Twitter moment from 2020 that never shipped well — still showing up in AI outputs because it's in the training data.

**Breathing / Pulsing Ambient Animations**
Background blobs that slowly drift. Gradient orbs that breathe. Infinite looping scale animations on decorative elements. Motion communicates state or interaction — never ambience.

**Buzzword Microcopy**
"Seamless," "powerful," "robust," "transformative." AI-generated UI comes with AI-generated labels. Every label, heading, and button text must describe an action or outcome — not an adjective.

### The Principle Behind the Ban

- Every banned pattern is a statistical choice, not a design choice. The agent never reaches for a default because it's common — it reaches for the token system because it's defined.
- Color is chosen by auditing the brand token. If no brand color is defined, ask — don't default to indigo.
- Fonts are specified in the type token. The agent never selects a font independently.
- Decorative effects (gradients, glows, blurs, ambient motion) require an explicit design decision documented in the system. They are never added as polish or filler.
- If a design decision can't be traced to a token or a deliberate choice, it doesn't ship.


