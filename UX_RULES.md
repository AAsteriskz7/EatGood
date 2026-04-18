# UX_RULES.md — UX Expert Reference
> Concise. Opinionated. Every rule is a decision filter — when the agent is unsure, it checks here first.

---

## 01 — Hierarchy Before Everything

The user's eye must always have one clear place to go first. If two things compete for attention, neither wins.

- One primary action per view. One. Everything else is secondary or tertiary.
- Visual weight (size, contrast, color) maps directly to importance. The most important thing is the most visually dominant thing.
- If you have to label something "important" or make it blink to get attention, the layout is broken — fix the hierarchy, not the component.

---

## 02 — Clarity Over Cleverness

If a user has to think about how something works, the design failed before the user did.

- Labels describe what happens when you interact, not what the thing is. "Save changes" beats "Submit." "Delete account" beats "Proceed."
- Icons never appear without a label unless the icon is universally understood (close, search, back). When in doubt, add the label.
- Empty states, loading states, and error states are not afterthoughts — they're the moments users are most likely to leave. Design them first.

---

## 03 — Feedback is a Feature

Every action needs a reaction. The interface must always communicate what just happened, what's happening now, and what will happen next.

- Buttons show loading state when they trigger async work. They disable after tap to prevent double-submission.
- Success and error are never silent. The user always knows if something worked.
- Destructive actions (delete, remove, disconnect) always require confirmation. The cost of an accidental tap is always higher than the cost of one extra step.

---

## 04 — Reduce Cognitive Load

Every piece of information on screen costs the user mental energy. Charge only for what's necessary.

- Show only what's relevant to the current task. Progressive disclosure — reveal detail only when the user asks for it.
- Group related things together. Separate unrelated things. Proximity communicates relationship.
- Default to the right answer. Pre-fill, pre-select, and pre-sort whenever there's a reasonable default — the user edits, they don't start from zero.

---

## 05 — Consistency Builds Trust

When things look the same, users assume they work the same. Break that assumption and you break trust.

- The same action always looks the same across the entire product. One style for primary buttons, everywhere.
- Navigation never moves. The user should never have to rediscover where things are.
- Terminology is locked. If it's called "workspace" on one screen, it's never called "project" on another.

---

## 06 — Error Prevention First, Error Recovery Second

The best error message is the one that never has to appear.

- Validate inline, before submission. Tell the user what's wrong while they can still fix it.
- Constrain inputs to valid options wherever possible — a date picker beats a free text date field.
- When errors do occur, tell the user exactly what went wrong and exactly how to fix it. "Something went wrong" is not an error message.

---

## 07 — Accessibility is Not Optional

If a user can't use it, the design isn't done.

- All interactive elements are reachable and operable by keyboard.
- Focus state is always visible — never remove the outline without replacing it with something equally clear.
- Color is never the only way to communicate meaning. Pair it with shape, label, or pattern.
- Touch targets are large enough to tap without precision. Small tap targets are a UX bug, not a style choice.

---

*7 rules. Check before shipping any screen.*
