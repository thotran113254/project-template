# Magic UI Quick Reference Guide

## What is Magic UI?
150+ free, open-source animated React components built with TailwindCSS and Framer Motion. Copy-paste architecture (like shadcn/ui). MIT licensed. Perfect for dashboards and interactive UIs.

**Site:** https://magicui.design | **GitHub:** github.com/magicuidesign/magicui (19K stars)

---

## Installation (One-Time)

```bash
cd apps/web

# Initialize (if not done)
pnpm dlx shadcn-ui@latest init

# Add components you need
pnpm dlx shadcn@latest add @magicui/magic-card
pnpm dlx shadcn@latest add @magicui/animated-theme-toggler
pnpm dlx shadcn@latest add @magicui/animated-list
```

Components go to: `src/components/ui/[component-name]/`

---

## Best Components for Admin Panels

### Navigation & Theme
- `AnimatedThemeToggler` - Dark/light mode switch

### Cards & Display
- `MagicCard` - Interactive dashboard card
- `NeonGradientCard` - Premium card styling
- `BentoGrid` - Feature/metric layout

### Data & Lists
- `AnimatedList` - Animated list items
- `AvatarCircles` - User groups, team display
- `FileTree` - Hierarchical structure

### Buttons & Feedback
- `ShimmerButton` - Animated button
- `RippleButton` - Ripple effect button
- `PulsatingButton` - Pulsing effect

### Text & Emphasis
- `SparklesText` - Sparkle animation
- `AnimatedGradientText` - Gradient text
- `TextHighlighter` - Text highlighting

### Patterns & Backgrounds
- `AnimatedGridPattern` - Animated grid background
- `RetroGrid` - Retro grid pattern
- `FlickeringGrid` - Subtle flickering background

### Metrics & Progress
- `NumberTicker` - Animated number counter
- `ScrollProgress` - Scroll position indicator
- `Marquee` - Infinite scrolling text/content

---

## Usage Pattern

```tsx
import { MagicCard } from "@/components/ui/magic-card"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"

export function AdminDashboard() {
  return (
    <div>
      <AnimatedThemeToggler />
      <MagicCard className="p-4">
        Dashboard Content
      </MagicCard>
    </div>
  )
}
```

---

## Key Features

✅ **Copy-paste** - Own all code, full customization
✅ **TailwindCSS v4** - Native support, no config needed
✅ **Framer Motion** - Smooth, performant animations
✅ **shadcn/ui compatible** - Works seamlessly together
✅ **Dark mode** - Built-in theme toggler
✅ **MIT License** - Free for commercial use
✅ **No external deps** - Components self-contained

---

## Dependencies Auto-Installed

- `framer-motion` - Animations
- `tailwindcss-animate` - CSS animations
- `clsx` - Class utilities
- `tailwind-merge` - Class merging

---

## Integration Strategy

1. Keep shadcn/ui for basic UI (buttons, inputs, dialogs)
2. Add Magic UI for animated, premium elements
3. Use together in same project without conflicts
4. Both follow same copy-paste pattern

---

## Full Documentation

- **Components:** https://magicui.design/docs/components
- **Installation:** https://magicui.design/docs/installation
- **Blog:** https://magicui.design/blog (guides & tutorials)

---

## Component Count by Category

| Category | Count |
|----------|-------|
| Text Effects | 9 |
| Buttons | 8 |
| Patterns/Grids | 6 |
| Visual Effects | 11+ |
| Data Display | 4 |
| Media/Interactive | 7 |
| Utilities | 5+ |
| **Total** | **50+** |

---

## Recommended Setup for project-template

**Phase 1 (Essential):**
```bash
pnpm dlx shadcn@latest add @magicui/magic-card
pnpm dlx shadcn@latest add @magicui/animated-theme-toggler
pnpm dlx shadcn@latest add @magicui/animated-list
```

**Phase 2 (Recommended):**
```bash
pnpm dlx shadcn@latest add @magicui/shimmer-button
pnpm dlx shadcn@latest add @magicui/sparkles-text
pnpm dlx shadcn@latest add @magicui/bento-grid
pnpm dlx shadcn@latest add @magicui/number-ticker
```

**Phase 3 (Optional Polish):**
```bash
pnpm dlx shadcn@latest add @magicui/neon-gradient-card
pnpm dlx shadcn@latest add @magicui/animated-grid-pattern
pnpm dlx shadcn@latest add @magicui/avatar-circles
```

---

## Compatibility Matrix

| Requirement | Status |
|-------------|--------|
| React 18+ | ✅ Required |
| TailwindCSS v4 | ✅ Native support |
| TailwindCSS v3 | ✅ Via v3.magicui.design |
| Node 16+ | ✅ Required |
| shadcn/ui | ✅ Full compatibility |
| Next.js | ✅ Works great |
| Vite | ✅ Fully supported |

---

**Last Updated:** 2026-03-03
