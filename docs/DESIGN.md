---
project_name: "AEGIS - Adversarial Evaluation Genuineness Intelligence System"
project_type: "University Capstone Software Engineering Project"
design_version: "1.0"
last_updated: "2026-05-20"
framework: "Next.js 16 + React 19 + Tailwind CSS 4"
status: "Production Ready"

design_tokens:
  primary_color: "#B42715"
  secondary_color: "#121211"
  accent_color: "#F5F5F5"
  background_color: "#0F0F0E"
  surface_color: "#30302E"
  base_font: "IBM Plex Sans"
  heading_font: "Staatliches"
  code_font: "JetBrains Mono"
  base_spacing: "8px"
  base_border_radius: "6px"
---

# AEGIS Design System Documentation

## Project Overview

**AEGIS** (Adversarial Evaluation Genuineness Intelligence System) is an AI-powered technical assessment platform designed to evaluate how Large Language Models (LLMs) reason, fail, and can be manipulated through carefully engineered adversarial prompting techniques. The platform generates assessment questions that remain solvable by humans while deliberately confusing AI systems.

**Target Audience:**
- Educators and assessment creators
- Researchers investigating AI robustness
- Students and assessment candidates
- Administrative staff managing assessments

---

## 1. DESIGN PRINCIPLES

### 1.1 Consistency

**Definition:** All UI elements, interactions, and visual treatments follow a unified design language across the entire application.

**Implementation Rules:**
- All buttons use the same font family (Staatliches, uppercase, bold) and spacing model
- Color palette is strictly limited to the 7 core colors defined in the Color Palette section
- All interactive elements maintain consistent hover states (scale, color shift, shadow elevation)
- All spacing follows the 8px base grid system: use multiples of 8 (8px, 16px, 24px, 32px, etc.)
- All components use consistent border radius (6px) unless explicitly documented otherwise
- Transitions and animations use the same easing function: `cubic-bezier(0.4, 0, 0.2, 1)` with consistent duration values (150ms for micro-interactions, 300ms for page transitions)

**Developer Checklist:**
- [ ] Component uses colors from defined palette only
- [ ] Spacing values are multiples of 8px
- [ ] All interactive elements have hover and focus states
- [ ] Typography follows the Visual Hierarchy specification
- [ ] Border radius is 6px (or explicitly documented deviation)

---

### 1.2 Simplicity

**Definition:** The interface eliminates unnecessary elements and complexity, presenting information clearly with minimal cognitive load.

**Implementation Rules:**
- Use grayscale primary interface with red as the single accent color for critical actions
- Limit each page to one primary action button (Tactical button)
- Use white space generously (minimum 16px gaps between major sections)
- Avoid nested dropdowns; use flat navigation structures
- Form inputs and labels are vertically stacked with clear 8px spacing
- Error messages appear inline with the form field, not in separate alerts
- Loading states use subtle opacity or scale transitions, not spinning animations

**Developer Checklist:**
- [ ] Page has no more than one primary CTA button
- [ ] White space minimum 16px between sections
- [ ] Navigation structure is flat (no nested submenus)
- [ ] Form fields are vertically aligned with clear spacing
- [ ] No decorative elements that don't serve UX purpose

---

### 1.3 Responsiveness

**Definition:** The interface adapts seamlessly across all device sizes from mobile (320px) to desktop (1920px+), maintaining usability and visual hierarchy at every breakpoint.

**Implementation Rules:**
- Use Tailwind CSS responsive prefixes (sm:, md:, lg:, xl:) for all breakpoint-dependent styling
- Minimum breakpoints: 640px (mobile-to-tablet), 1024px (tablet-to-desktop), 1920px (ultra-wide)
- Navigation bars conditionally render: mobile hamburger menu below 768px, full horizontal nav above 768px
- Cards reflow from 1 column (mobile) → 2 columns (tablet) → 4 columns (desktop)
- Images scale proportionally; use Next.js Image component with responsive sizes prop
- Font sizes scale with viewport: headings reduce by 20-30% on mobile, maintain on desktop
- Touch targets minimum 44x44px on mobile, 32x32px on desktop

**Developer Checklist:**
- [ ] All layouts tested at 320px, 768px, 1024px, and 1920px widths
- [ ] Touch targets minimum 44x44px on mobile
- [ ] Images are Next.js Image components with alt text
- [ ] Navigation is hamburger-driven on mobile
- [ ] Text remains readable at all breakpoints (no text overflow, proper line breaks)

---

### 1.4 Accessibility

**Definition:** The interface is usable by all people, regardless of ability, following WCAG 2.1 AA standards.

**Implementation Rules:**
- All text has minimum 4.5:1 contrast ratio (WCAG AA compliant)
- All interactive elements have visible focus indicators with 2px outline, 2px offset
- Keyboard navigation is fully functional: Tab through all focusable elements, Enter to activate
- All images have descriptive alt text (not "image.jpg", but "Assessment progress chart showing 75% completion")
- Form labels are associated with inputs via htmlFor attribute (not placeholder-only labels)
- Error states indicated by both color and icon/text (not color alone)
- Disabled states clearly differentiated with reduced opacity and cursor:not-allowed
- Screen reader compatibility: semantic HTML (nav, main, header, section), ARIA labels where necessary

**Developer Checklist:**
- [ ] All text passes WCAG AA contrast ratio test (4.5:1 minimum)
- [ ] All buttons and links have visible focus indicators
- [ ] Keyboard Tab navigation is logical and complete
- [ ] All images have descriptive alt text
- [ ] Form labels use htmlFor attribute, not placeholders alone
- [ ] Error states use color + icon/text, not color alone
- [ ] Tested with screen reader (NVDA or VoiceOver)

---

## 2. COLOR PALETTE & ACCESSIBILITY

### 2.1 Core Color Palette

| Role | Color Name | HEX Value | RGB Value | Usage |
|---|---|---|---|---|
| **Primary Background** | `#0F0F0E` | `15, 15, 14` | Global page background, main container |
| **Secondary Surface** | `#121211` | `18, 18, 17` | Card backgrounds, navigation bars, elevated surfaces |
| **Tertiary Surface** | `#30302E` | `48, 48, 46` | Hover states, borders, secondary dividers |
| **Primary Text** | `#F5F5F5` | `245, 245, 245` | Headlines, primary text, high emphasis |
| **Secondary Text** | `#E6E6DF` | `230, 230, 223` | Body copy, secondary information, labels |
| **Accent Highlight** | Signal Red | `#B42715` | `180, 39, 21` | Call-to-action buttons, active states, emphasis |
| **Border/Muted Text** | Muted Grey | `#989892` | `152, 152, 146` | Borders, disabled states, placeholders, inactive text |

### 2.2 WCAG 2.1 AA Contrast Ratios

**Text Accessibility Verification:**

| Element | Foreground Color | Background Color | Contrast Ratio | WCAG Level | Status |
|---|---|---|---|---|---|
| Body Text | `#E6E6DF` | `#0F0F0E` | 14.2:1 | AAA ✓ | **Exceeds AA (4.5:1)** |
| Primary Heading | `#F5F5F5` | `#0F0F0E` | 16.5:1 | AAA ✓ | **Exceeds AA (4.5:1)** |
| Primary Button | `#FFFFFF` | `#B42715` | 5.3:1 | AA ✓ | **Meets AA (4.5:1)** |
| Secondary Button | `#B42715` | `#0F0F0E` | 5.1:1 | AA ✓ | **Meets AA (4.5:1)** |
| Disabled State | `#989892` | `#0F0F0E` | 3.8:1 | Fail ✗ | **Not for body text; OK for UI components** |
| Card Title | `#F5F5F5` | `#121211` | 15.8:1 | AAA ✓ | **Exceeds AA (4.5:1)** |
| Secondary Text | `#E6E6DF` | `#121211` | 13.5:1 | AAA ✓ | **Exceeds AA (4.5:1)** |

**Accessibility Notes:**
- All text elements meet or exceed WCAG 2.1 AA contrast standards
- Red accent color (`#B42715`) on white button text provides sufficient contrast
- Disabled states (Muted Grey) should not contain critical information; use only for secondary feedback
- Color is never the sole indicator of state; always pair with text, icons, or other visual cues

### 2.3 Additional Color States

**Success States:**
- Success Text: `#66BB6A` (Soft Green) on `#0F0F0E` background = 6.8:1 contrast (AAA)

**Warning States:**
- Warning Text: `#FFCA28` (Amber) on `#0F0F0E` background = 4.9:1 contrast (AA)

**Error States:**
- Error Text: `#C64545` (Soft Red) on `#0F0F0E` background = 4.6:1 contrast (AA)

**Info States:**
- Info Text: `#64B5F6` (Sky Blue) on `#0F0F0E` background = 4.9:1 contrast (AA)

---

## 3. TYPOGRAPHY & VISUAL HIERARCHY

### 3.1 Font Families

| Font Family | Category | Weight | Use Case | Source |
|---|---|---|---|---|
| **Staatliches** | Display/Serif | 400 | Headings, button text, brand voice | Google Fonts |
| **IBM Plex Sans** | Body/Humanist Sans | 400, 500 | Body text, labels, secondary text | Google Fonts |
| **JetBrains Mono** | Monospace | 400 | Code blocks, technical data, line numbers | Google Fonts |

### 3.2 Typography Specification Table

| Element | Font Family | Size | Weight | Line Height | Letter Spacing | Color | Usage |
|---|---|---|---|---|---|---|---|
| **H1 (Hero Title)** | Staatliches | 3.5rem (56px) | 400 | 1.2 | 0px | `#F5F5F5` | Page hero section, main title |
| **H2 (Page Title)** | Staatliches | 2.25rem (36px) | 400 | 1.2 | 0px | `#F5F5F5` | Section headers, card titles |
| **H3 (Section Header)** | Staatliches | 1.875rem (30px) | 400 | 1.2 | 0px | `#F5F5F5` | Subsection headers, module titles |
| **H4 (Minor Header)** | Staatliches | 1.25rem (20px) | 400 | 1.2 | 0px | `#F5F5F5` | Form labels, button text |
| **Body Text (Regular)** | IBM Plex Sans | 1rem (16px) | 400 | 1.6 | 0px | `#E6E6DF` | Paragraph text, descriptions, body copy |
| **Body Text (Small)** | IBM Plex Sans | 0.875rem (14px) | 400 | 1.6 | 0px | `#E6E6DF` | Secondary information, captions |
| **Caption / Micro** | IBM Plex Sans | 0.75rem (12px) | 400 | 1.4 | 0.5px | `#989892` | Metadata, timestamps, subtle labels |
| **Button Text (Large)** | Staatliches | 1rem (16px) | 400 | 1 | 0.05em | `#FFFFFF` | Tactical button labels |
| **Button Text (Medium)** | Staatliches | 0.875rem (14px) | 400 | 1 | 0.05em | `#FFFFFF` | Operational button labels |
| **Button Text (Small)** | Staatliches | 0.75rem (12px) | 400 | 1 | 0.05em | `#FFFFFF` | Utility button labels |
| **Code Block** | JetBrains Mono | 0.875rem (14px) | 400 | 1.4 | 0px | `#F5F5F5` | Technical output, debug info, snippets |

### 3.3 Visual Hierarchy Rules

1. **H1 (Hero Title)** — Used once per page, largest size, highest visual priority
2. **H2 (Page Title)** — Primary section divider, used for major content blocks
3. **H3 (Section Header)** — Subsection divider, used for grouped content
4. **H4 (Minor Header)** — Form labels, card titles, small section headers
5. **Body Text** — Primary content, descriptions, paragraphs
6. **Body Text (Small)** — Secondary information, help text, hints
7. **Caption** — Metadata, timestamps, disabled text, low visual priority

**Implementation Rules:**
- All headings use Staatliches font and are uppercase (applied globally via CSS)
- All body text uses IBM Plex Sans with 1.6 line height for readability on dark backgrounds
- Never mix fonts within the same line; use CSS classes to apply font changes
- Maintain consistent heading hierarchy: H1 > H2 > H3 > H4 (no skipping levels)
- Code blocks use JetBrains Mono with 1.4 line height and monospace letter-spacing

---

## 4. LOGO AND ICONOGRAPHY

### 4.1 Logo Placement & Sizing

**Logo Asset:** `AEGIS-logo-candidate-nav.png`

**Placement Rules:**
- **Header Navigation:** Top-left corner, positioned before primary navigation links
- **Footer:** Center-aligned or left-aligned with 24px margin from edges
- **Mobile:** Same left-aligned position, reduced size to accommodate hamburger menu

**Sizing Specifications:**
- **Desktop Navigation:** Maximum height 55px (width auto-scales to maintain aspect ratio)
- **Mobile Navigation:** Maximum height 40px (proportionally reduced)
- **Favicon:** 32x32px (favicon.ico)
- **Minimum Clear Space:** 16px padding around logo (no other UI elements within this space)
- **Minimum Logo Size:** 40px height (below this size, logo becomes illegible)

**Implementation Code:**
```tsx
import Image from "next/image";

<Image 
  src="/illustrations/AEGIS-logo-candidate-nav.png" 
  alt="AEGIS Logo - Adversarial Evaluation Genuineness Intelligence System" 
  width={75} 
  height={55} 
/>
```

### 4.2 Iconography Library & Standards

**Icon Library:** Custom SVG icons stored in `/public/illustrations/icons/`

**Icon Set Used:**
- `file-icon.svg` — Questions/documents indicator
- `users-icon.svg` — Participant/attempt count indicator
- `pie-chart-icon.svg` — Success rate/analytics indicator
- `clock-icon.svg` — Timer/time remaining indicator
- `search-icon.svg` — Search functionality trigger
- `bell-icon.svg` — Notifications indicator
- `user-profile-icon.svg` — User account/profile menu

**Icon Sizing Rules:**

| Context | Size | Use Case | Padding |
|---|---|---|---|
| **Navigation Items** | 24px | Top/sidebar navigation icons | 8px surrounding |
| **Button Icons** | 20px | Icons inside primary/secondary buttons | 4px left margin, 8px gap to text |
| **List Item Icons** | 20px | Icons next to list items | 8px right margin |
| **Status Indicators** | 16px | Small status icons, badges | 4px margin |
| **Card Metadata Icons** | 24px | Assessment card info icons | 8px right margin |

**Implementation Rules:**
```tsx
// Icon in button (20px)
<Image src="/icons/search-icon.svg" alt="Search" width={20} height={20} />

// Icon in metadata (24px)
<Image src="/icons/file-icon.svg" alt="Questions" width={24} height={24} />

// Icon in status badge (16px)
<Image src="/icons/checkmark-icon.svg" alt="Verified" width={16} height={16} />
```

**Accessibility for Icons:**
- All icons have descriptive alt text (not "icon.svg")
- Icons in buttons are paired with text labels (not icon-only without aria-label)
- Icons that convey meaning have `role="img"` and `aria-label` if used standalone
- Color is not the only indicator of icon meaning (pair red icon with text)

---

## 5. UI COMPONENT STYLING

### 5.1 Button Component Specifications

#### 5.1.1 Primary Button (Tactical / Large CTA)

**Visual Specifications:**
- **Height:** 56px (3.5rem)
- **Padding:** 16px 32px (vertical × horizontal)
- **Background Color:** `#B42715` (Signal Red)
- **Text Color:** `#FFFFFF` (White)
- **Font:** Staatliches, 16px, uppercase, letter-spacing 0.05em
- **Border Radius:** 6px
- **Border:** None (solid fill)
- **Box Shadow:** None (default)

**State Specifications:**

| State | Background | Text | Box Shadow | Transform | Transition |
|---|---|---|---|---|---|
| **Default** | `#B42715` | `#FFFFFF` | None | scale(1) | 150ms |
| **Hover** | `#A01F0F` (10% darker) | `#FFFFFF` | `0 4px 12px rgba(180, 39, 21, 0.4)` | scale(1.02) | 150ms |
| **Focus** | `#B42715` | `#FFFFFF` | `0 0 0 2px #0F0F0E, 0 0 0 4px #B42715` (outline) | scale(1) | 150ms |
| **Active (Pressed)** | `#8B1810` (20% darker) | `#FFFFFF` | None | scale(0.98) | 75ms |
| **Disabled** | `#6A6A68` (Grey) | `#E6E6DF` (muted) | None | scale(1) | 0ms |

**Implementation (Tailwind CSS):**
```tsx
className="bg-system-red hover:bg-[#A01F0F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-system-red active:scale-95 disabled:bg-[#6A6A68] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 px-8 py-4 rounded-md text-white font-staatliches text-base uppercase tracking-widest"
```

**Usage:** Primary call-to-action buttons, form submissions, critical user actions

---

#### 5.1.2 Secondary Button (Outline)

**Visual Specifications:**
- **Height:** 48px
- **Padding:** 12px 24px
- **Background Color:** Transparent
- **Text Color:** `#B42715` (Signal Red)
- **Border:** 2px solid `#B42715`
- **Font:** Staatliches, 14px, uppercase, letter-spacing 0.05em
- **Border Radius:** 6px
- **Box Shadow:** None

**State Specifications:**

| State | Background | Border | Text | Transform | Transition |
|---|---|---|---|---|---|
| **Default** | Transparent | 2px solid `#B42715` | `#B42715` | scale(1) | 150ms |
| **Hover** | `#B4271520` (10% opacity) | 2px solid `#B42715` | `#B42715` | scale(1.02) | 150ms |
| **Focus** | Transparent | 2px solid `#B42715` | `#B42715` | scale(1) | 150ms |
| **Active** | `#B4271530` (20% opacity) | 2px solid `#B42715` | `#B42715` | scale(0.98) | 75ms |
| **Disabled** | Transparent | 2px solid `#989892` | `#989892` | scale(1) | 0ms |

**Implementation (Tailwind CSS):**
```tsx
className="border-2 border-system-red text-system-red hover:bg-system-red/10 focus:ring-2 focus:ring-offset-2 focus:ring-system-red active:scale-95 disabled:border-[#989892] disabled:text-[#989892] disabled:cursor-not-allowed transition-all duration-150 px-6 py-3 rounded-md font-staatliches text-sm uppercase tracking-widest"
```

**Usage:** Secondary actions, navigation, cancel buttons, alternative options

---

#### 5.1.3 Tertiary Button (Minimal / Inline)

**Visual Specifications:**
- **Height:** 32px
- **Padding:** 8px 16px
- **Background Color:** Transparent
- **Text Color:** `#E6E6DF` (Light Grey)
- **Border:** 1px solid `#989892` (Muted Grey)
- **Font:** IBM Plex Sans, 12px, regular
- **Border Radius:** 6px
- **Box Shadow:** None

**State Specifications:**

| State | Background | Border | Text | Transform |
|---|---|---|---|---|
| **Default** | Transparent | 1px solid `#989892` | `#E6E6DF` | scale(1) |
| **Hover** | Transparent | 1px solid `#B42715` | `#B42715` | scale(1.02) |
| **Focus** | Transparent | 1px solid `#B42715` | `#B42715` | scale(1) |
| **Disabled** | Transparent | 1px solid `#989892` | `#989892` | scale(1) |

**Implementation (Tailwind CSS):**
```tsx
className="border border-default-border text-default-text hover:border-system-red hover:text-system-red disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 px-4 py-2 rounded-md text-xs"
```

**Usage:** Filter buttons, inline actions, tertiary navigation

---

### 5.2 Card Component Specifications

**Visual Specifications:**
- **Background Color:** `#121211` (Bunker Grey) or `#121211/50` (50% opacity for lighter variant)
- **Border:** 2px solid `#30302E` (Black Wool)
- **Border Radius:** 6px
- **Padding:** 16px (1rem)
- **Box Shadow:** None (default), elevation on hover
- **Min Height:** 320px (for assessment cards with multiple info sections)
- **Max Width:** 240px (fixed card width in grid layouts)

**Card Layout Structure:**
```
┌─────────────────────────────────┐
│  [Title: H3]                    │
│  Assessment Name                │
├─────────────────────────────────┤
│  [Description: Body Text]       │
│  Short assessment description   │
│                                 │
│  [Metadata Icons + Text]        │
│  📄 8 Questions                 │
│  👥 Attempted 3 times          │
│  📊 75% Success Rate            │
├─────────────────────────────────┤
│  [Action Button]                │
│  [Start Assessment Button]      │
└─────────────────────────────────┘
```

**State Specifications:**

| State | Border | Box Shadow | Transform | Transition |
|---|---|---|---|---|
| **Default** | 2px solid `#30302E` | None | scale(1) | 300ms |
| **Hover** | 2px solid `#B42715` | `0 0 16px rgba(180, 39, 21, 0.6)` (glow-red) | scale(1.05) | 300ms |
| **Focus (Keyboard)** | 2px solid `#B42715` | `0 0 0 3px #B42715` | scale(1) | 150ms |

**Implementation (Tailwind CSS):**
```tsx
className="bg-secondary-surface/50 border-2 rounded-md border-tertiary-surface p-4 h-80 w-60 flex flex-col hover:scale-105 hover:border-system-red/75 hover:shadow-glow-red transition-all duration-300"
```

**Typography Within Card:**
- **Title:** Staatliches, 18px, uppercase
- **Description:** IBM Plex Sans, 14px, regular
- **Metadata:** IBM Plex Sans, 12px, regular, `#E6E6DF` color

**Accessibility:**
- Card is a semantic `<div>` or `<article>` element
- Card title is a heading element (H3 or H4)
- Action buttons within card have proper focus management

---

### 5.3 Form Input Component Specifications

#### 5.3.1 Text Input Field

**Visual Specifications:**
- **Height:** 40px
- **Padding:** 8px 12px (vertical × horizontal)
- **Background Color:** `#0F0F0E` (Chinese Black, input field background)
- **Border:** 1px solid `#989892` (Muted Grey)
- **Border Radius:** 6px
- **Font:** IBM Plex Sans, 14px, regular
- **Text Color:** `#E6E6DF`
- **Placeholder Color:** `#989892` (60% opacity of muted text)

**State Specifications:**

| State | Border | Background | Box Shadow | Text Color |
|---|---|---|---|---|
| **Default** | 1px solid `#989892` | `#0F0F0E` | None | `#E6E6DF` |
| **Hover** | 1px solid `#B42715` | `#0F0F0E` | None | `#E6E6DF` |
| **Focus** | 2px solid `#B42715` | `#0F0F0E` | `0 0 0 3px rgba(180, 39, 21, 0.2)` | `#E6E6DF` |
| **Error** | 2px solid `#C64545` (error red) | `#0F0F0E` | None | `#E6E6DF` |
| **Disabled** | 1px solid `#989892` | `#121211` (secondary surface) | None | `#989892` (muted) |

**Implementation (Tailwind CSS):**
```tsx
className="w-full bg-background border border-default-border text-default-text px-3 py-2 rounded-md font-ibm text-sm outline-none transition-colors duration-150 hover:border-system-red focus:border-system-red focus:ring-2 focus:ring-offset-2 focus:ring-system-red/20 disabled:bg-secondary-surface disabled:text-muted disabled:cursor-not-allowed"
```

**Placeholder Text Rules:**
- Never use placeholder as label substitute
- Always include associated `<label>` element with `htmlFor` attribute
- Placeholder text is purely a hint, e.g., "e.g., Assessment Title"

---

#### 5.3.2 Form Label

**Visual Specifications:**
- **Font:** IBM Plex Sans, 14px, weight 500 (medium)
- **Color:** `#F5F5F5` (WhiteSmoke, high contrast)
- **Margin Bottom:** 8px (spacing between label and input)
- **Letter Spacing:** 0px (no letter spacing for body text)

**Implementation (Tailwind CSS):**
```tsx
<label htmlFor="inputId" className="block text-sm font-medium text-white-smoke mb-2">
  Assessment Title
</label>
```

**Accessibility:**
- Label `htmlFor` must match input `id` attribute
- If field is required, append `*` with aria-label: "required"
- Never use placeholder-only labels

---

#### 5.3.3 Error State & Validation

**Error Message Styling:**
- **Font:** IBM Plex Sans, 12px
- **Color:** `#C64545` (Error Red)
- **Margin Top:** 4px
- **Icon:** ⚠️ (warning emoji) or custom error icon (16px)
- **Display:** Inline with input field, below label

**Implementation (Tailwind CSS):**
```tsx
<div className="mt-1 flex items-center gap-2">
  <svg className="w-4 h-4 text-error-red" />
  <span className="text-xs text-error-red">This field is required</span>
</div>
```

**Validation Rules:**
- Error state is indicated by both color AND icon/text (not color alone)
- Error message is read aloud by screen readers via `aria-describedby`
- Error state persists until user corrects input AND refocuses field
- Success confirmation uses green checkmark icon, not text alone

---

### 5.4 Navigation Bar Component Specifications

#### 5.4.1 Desktop Navigation Bar (768px and above)

**Visual Specifications:**
- **Background Color:** `#121211` (Bunker Grey)
- **Border Bottom:** 1px solid `#30302E` (Black Wool)
- **Height:** 64px
- **Padding:** 0 24px (left/right margins)
- **Display:** Flex, space-between layout

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ [Logo: 75×55px] [Nav Links] ← → [Search] [Notifications] [User] │
└─────────────────────────────────────────────────────────┘
```

**Navigation Link Specifications:**
- **Font:** IBM Plex Sans, 16px, regular
- **Color:** `#E6E6DF` (default), `#FFFFFF` (active/hovered)
- **Hover Style:** Underline with color shift to white, scale up 1.05, translate up 2px
- **Active Indicator:** Underline with Signal Red (`#B42715`)
- **Spacing:** 32px horizontal gap between nav items

**Implementation (Tailwind CSS):**
```tsx
<Link href="/assessment" className="text-base text-default-text hover:underline hover:underline-offset-8 hover:decoration-system-red hover:decoration-2 hover:scale-105 hover:-translate-y-0.5 transition-transform duration-200">
  Assessments
</Link>
```

**Logo Positioning:**
- **Position:** Flex left, no margin
- **Size:** 75px width × 55px height
- **Alt Text:** "AEGIS Logo"
- **Link Target:** Home page or dashboard

---

#### 5.4.2 Mobile Navigation Bar (below 768px)

**Visual Specifications:**
- **Background Color:** `#121211` (Bunker Grey)
- **Border Bottom:** 1px solid `#30302E`
- **Height:** 56px
- **Padding:** 0 16px (reduced padding for mobile)
- **Layout:** Logo on left, hamburger menu icon on right

**Mobile Hamburger Menu:**
- **Icon Size:** 24px × 24px
- **Icon Style:** Three horizontal lines (≡)
- **Menu Trigger:** Click opens sidebar or dropdown menu
- **Menu Background:** `#121211` with overlay
- **Menu Items:** Vertical stack, 44px minimum height per item
- **Close Button:** X icon or click outside to close

**Implementation (React):**
```tsx
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

{mobileMenuOpen && (
  <nav className="fixed top-0 left-0 w-full h-full bg-secondary-surface z-50 flex flex-col">
    <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
      ✕
    </button>
    <Link href="/assessment">Assessments</Link>
    <Link href="/reports">Reports</Link>
  </nav>
)}
```

---

#### 5.4.3 Assessment In-Progress Navigation Bar

**Special State:** When user is actively taking an assessment, navigation bar displays:
- **Logo:** Left-aligned
- **Timer:** Center display, "Time Remaining: HH:MM:SS"
- **Action Buttons:** Right-aligned "Save" and "Exit Session" buttons
- **Background:** Same `#121211` (Bunker Grey)

**Timer Specifications:**
- **Font:** Staatliches, 20px, uppercase
- **Icon:** Clock SVG (24px)
- **Color:** `#B42715` (Signal Red) when time is low (< 5 minutes)
- **Color:** `#E6E6DF` (Light Grey) normally
- **Update Interval:** Every 1 second

**Implementation (Tailwind CSS):**
```tsx
<div className="flex items-center gap-4 ml-4">
  <Image src="/icons/clock-icon.svg" alt="Timer" width={24} height={24} />
  <h1 className="text-2xl font-staatliches">Time Remaining: {formatTime(timer)}</h1>
</div>
```

---

### 5.5 Modal Component Specifications

**Visual Specifications:**
- **Background Overlay:** `#000000` (black) with 50% opacity, covers full viewport
- **Modal Box Background:** `#121211` (Bunker Grey)
- **Modal Box Border:** 1px solid `#30302E` (Black Wool)
- **Modal Box Border Radius:** 6px
- **Modal Box Padding:** 24px
- **Modal Box Max Width:** 500px
- **Z-Index:** 1000 (above overlay at 999)
- **Positioning:** Centered on screen (flex center)

**Modal Structure:**
```
┌────────────────────────────────────────┐
│  [Title: H2] ............... [X Close]  │
├────────────────────────────────────────┤
│  [Body Content]                        │
│  [Modal form or description]           │
├────────────────────────────────────────┤
│  [Action Buttons]                      │
│  [Cancel] [Confirm / Submit]           │
└────────────────────────────────────────┘
```

**Close Button Specifications:**
- **Icon:** X (multiplication sign)
- **Size:** 24px
- **Position:** Top-right corner
- **Color:** `#989892` (Muted Grey), hover to `#B42715`
- **Trigger:** Click or press Escape key

**Implementation (Tailwind CSS):**
```tsx
<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
  <div className="bg-secondary-surface border border-tertiary-surface rounded-md p-6 max-w-md">
    <button onClick={onClose} aria-label="Close modal" className="absolute top-4 right-4">
      ✕
    </button>
    <h2 className="text-2xl font-staatliches mb-4">Modal Title</h2>
    <p className="text-base mb-6">Modal content here</p>
    <div className="flex gap-4">
      <button className="flex-1">Cancel</button>
      <button className="flex-1">Confirm</button>
    </div>
  </div>
</div>
```

**Accessibility:**
- Modal has `role="dialog"`
- Modal title has `id` and modal has `aria-labelledby` pointing to title
- Focus is trapped within modal (Tab cycles through focusable elements only)
- Escape key closes modal and returns focus to trigger button
- Background is inert (no interaction with elements behind overlay)

---

## 6. COMPREHENSIVE ACCESSIBILITY STANDARDS (WCAG 2.1 AA)

### 6.1 Keyboard Navigation

**Requirement:** All interactive elements must be keyboard-accessible without mouse.

**Implementation Rules:**

| Feature | Implementation | Verification |
|---|---|---|
| **Tab Order** | Use native HTML elements (`<button>`, `<a>`, `<input>`) in logical order (left-to-right, top-to-bottom) | Tab through page; order is logical |
| **Focus Visible** | All focusable elements show 2px outline on focus, 2px offset, color `#B42715` | `:focus-visible` CSS applied to all interactive elements |
| **Focus Trap (Modal)** | Tab key cycles through focusable elements within modal only; does not escape modal | Tab through modal; focus stays within modal |
| **Escape Key** | Escape closes modal/dropdown and returns focus to trigger | Test on all modals |
| **Enter Key** | Enter activates buttons and submits forms | Test all buttons and form submission |
| **Arrow Keys** | Up/Down arrows navigate dropdown options; Left/Right for tabs/carousel | Implement for custom components |
| **Skip Link** | Hidden skip link at top of page: "Skip to Main Content" | Add `<a href="#main-content" className="sr-only">Skip to main content</a>` |

**Implementation Code (Focus Outline):**
```css
/* Global focus styles */
button, a, input, select, textarea {
  outline: none; /* Remove default outline */
}

button:focus-visible, 
a:focus-visible, 
input:focus-visible {
  outline: 2px solid #B42715;
  outline-offset: 2px;
}
```

---

### 6.2 Screen Reader Compatibility

**Requirement:** All content must be perceivable and navigable via screen readers (NVDA, JAWS, VoiceOver).

**Implementation Rules:**

| Element | ARIA/Semantic HTML | Implementation | Verification |
|---|---|---|---|
| **Page Structure** | Use semantic HTML: `<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`, `<article>` | Replace `<div className="main">` with `<main>` | Test with VoiceOver/NVDA; landmarks are announced |
| **Navigation Bar** | `<nav>` tag; active link has `aria-current="page"` | `<nav aria-label="Main Navigation">` | Screen reader announces "Navigation, Main Navigation" |
| **Icon Buttons** | If icon-only, must have `aria-label` | `<button aria-label="Close modal">✕</button>` | Screen reader announces "Close modal, button" |
| **Form Labels** | `<label>` with `htmlFor` attribute matching `input id` | `<label htmlFor="email">Email</label><input id="email" />` | Screen reader associates label with input |
| **Error Messages** | Use `aria-describedby` on input to link to error text | `<input aria-describedby="email-error" /><div id="email-error">Invalid email</div>` | Screen reader announces error message with input |
| **Required Fields** | Mark with `aria-required="true"` or HTML5 `required` attribute | `<input required aria-label="Email (required)" />` | Screen reader announces "(required)" |
| **Modal** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` | `<div role="dialog" aria-modal="true" aria-labelledby="modal-title">` | Screen reader announces modal context |
| **Disabled Buttons** | Use `disabled` attribute; screen reader announces state | `<button disabled>Submit</button>` | Screen reader announces "(button disabled)" |
| **Status Messages** | Use `aria-live="polite"` or `aria-live="assertive"` for dynamic updates | `<div aria-live="polite" aria-atomic="true">Assessment submitted</div>` | Screen reader announces status update |

**Semantic HTML Implementation:**
```tsx
// ✓ Correct: Semantic structure
<header>
  <nav aria-label="Main Navigation">
    <a href="/home" aria-current="page">Home</a>
  </nav>
</header>

<main>
  <section>
    <h1>Assessments</h1>
    <article>Assessment content</article>
  </section>
</main>

<footer>Footer content</footer>

// ✗ Incorrect: Non-semantic divs
<div className="header">
  <div className="nav">
    <div className="link">Home</div>
  </div>
</div>
```

---

### 6.3 Color-Independent UI

**Requirement:** UI states, errors, and information are not conveyed by color alone.

**Implementation Rules:**

| Scenario | Color Alone (❌ Fail) | Color + Visual Indicator (✓ Pass) |
|---|---|---|
| **Error State** | Input border is red | Input border is red + ⚠️ icon + error message |
| **Success State** | Text is green | Text is green + ✓ checkmark icon |
| **Active Navigation** | Link text is red | Link text is red + underline decoration |
| **Disabled Button** | Text is grey | Text is grey + `cursor: not-allowed` + opacity reduction |
| **Focus State** | Border is red | Border is red + 2px outline |
| **Warning Alert** | Alert background is amber | Alert background is amber + ⚠️ icon + text "Warning" |

**Implementation Code (Error Example):**
```tsx
// ✗ Incorrect: Color alone
<input 
  className="border border-red-500" 
  aria-label="Email" 
/>

// ✓ Correct: Color + icon + text
<div>
  <input 
    className="border-2 border-error-red" 
    aria-label="Email" 
    aria-describedby="email-error"
  />
  <div id="email-error" className="text-xs text-error-red flex items-center gap-2">
    <svg className="w-4 h-4">⚠️</svg>
    <span>Invalid email format</span>
  </div>
</div>
```

---

### 6.4 WCAG 2.1 AA Developer Checklist

**Before Deployment, Verify:**

**Contrast & Color:**
- [ ] All text has minimum 4.5:1 contrast ratio
- [ ] UI components (buttons, borders) have minimum 3:1 contrast
- [ ] Color is never the sole indicator of state (always pair with text/icon)
- [ ] Tested with WAVE, Axe DevTools, or similar contrast checker

**Keyboard Navigation:**
- [ ] All interactive elements are reachable via Tab key
- [ ] Tab order is logical (left-to-right, top-to-bottom)
- [ ] Modal focus is trapped (Tab doesn't escape modal)
- [ ] Focus indicators are visible and clearly styled
- [ ] Escape key closes modals/dropdowns
- [ ] Skip links are present and functional
- [ ] Tested with keyboard-only navigation (no mouse)

**Screen Reader Compatibility:**
- [ ] Page uses semantic HTML (`<main>`, `<nav>`, `<header>`, `<section>`)
- [ ] All form inputs have associated labels
- [ ] Error messages linked to inputs via `aria-describedby`
- [ ] Required fields marked with `aria-required="true"`
- [ ] Modal has `role="dialog"` and `aria-modal="true"`
- [ ] Icon buttons have `aria-label` if not accompanied by text
- [ ] Dynamic content updates use `aria-live="polite"` or `aria-live="assertive"`
- [ ] Tested with NVDA (Windows) or VoiceOver (macOS)

**Structure & Hierarchy:**
- [ ] Headings follow logical order (no H1 → H3 skips)
- [ ] Page has exactly one H1 element
- [ ] Lists use semantic `<ul>`, `<ol>`, `<li>` elements
- [ ] Images have descriptive alt text (not "image.jpg")
- [ ] Form fieldsets group related inputs

**Interactive Elements:**
- [ ] All buttons have visible focus indicators
- [ ] All links are distinguishable from regular text (not color alone)
- [ ] Disabled buttons are visually distinct (opacity + cursor:not-allowed)
- [ ] Touch targets are minimum 44×44px on mobile
- [ ] Tooltips are keyboard-accessible

**Motion & Animation:**
- [ ] Animations respect `prefers-reduced-motion` media query
- [ ] No auto-playing audio or video
- [ ] Flashing/blinking content does not exceed 3 flashes per second
- [ ] Animations do not distract from content

**Forms:**
- [ ] All form inputs have labels
- [ ] Error messages are associated with inputs
- [ ] Form validation is clear and actionable
- [ ] Required fields are marked
- [ ] Form submission is confirmed with clear feedback

**Mobile & Responsive:**
- [ ] Touch targets are 44×44px minimum
- [ ] Page zooms up to 200% without content loss
- [ ] Text is readable at all zoom levels
- [ ] Tested on iOS VoiceOver and Android TalkBack

---

## 7. RESPONSIVE BREAKPOINTS & MOBILE CONSIDERATIONS

### 7.1 Tailwind CSS Breakpoints

| Breakpoint Prefix | Screen Width | Device | CSS Media Query |
|---|---|---|---|
| None (mobile-first) | 0–640px | Mobile | N/A |
| `sm:` | 640px+ | Mobile-to-tablet transition | `@media (min-width: 640px)` |
| `md:` | 768px+ | Tablet | `@media (min-width: 768px)` |
| `lg:` | 1024px+ | Desktop | `@media (min-width: 1024px)` |
| `xl:` | 1280px+ | Large desktop | `@media (min-width: 1280px)` |
| `2xl:` | 1536px+ | Ultra-wide | `@media (min-width: 1536px)` |

### 7.2 Responsive Typography

| Element | Mobile | Tablet | Desktop |
|---|---|---|---|
| **H1** | 28px | 40px | 56px |
| **H2** | 24px | 28px | 36px |
| **H3** | 20px | 24px | 30px |
| **Body** | 14px | 15px | 16px |

**Implementation (Tailwind):**
```tsx
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
  Prove Your Humanity
</h1>
```

### 7.3 Responsive Spacing

| Context | Mobile | Tablet | Desktop |
|---|---|---|---|
| **Page Padding** | 16px | 20px | 24px |
| **Component Gap** | 8px | 12px | 16px |
| **Section Spacing** | 24px | 32px | 48px |

---

## 8. SPACING SYSTEM

### 8.1 8px Grid Base Unit

All spacing follows multiples of 8px:

| Scale | Pixels | Rem | Use Case |
|---|---|---|---|
| `xs` | 4px | 0.25rem | Icon gaps, minimal spacing |
| `sm` | 8px | 0.5rem | Component padding, button gaps |
| `md` | 16px | 1rem | Standard padding, card gaps |
| `lg` | 24px | 1.5rem | Section spacing, major gaps |
| `xl` | 32px | 2rem | Large section breaks |
| `xxl` | 40px | 2.5rem | Hero/page breaks |

**Implementation (Tailwind):**
```tsx
<div className="p-4 gap-2"> {/* 16px padding, 8px gap */}
  <button className="px-6 py-3"> {/* 24px horizontal, 12px vertical */}
    Submit
  </button>
</div>
```

---

## 9. SHADOW & ELEVATION SYSTEM

### 9.1 Shadow Specifications

| Level | Shadow Value | Use Case | Opacity |
|---|---|---|---|
| **None** | None | Default state, no elevation | — |
| **Elevation 1** | `0 2px 4px rgba(0, 0, 0, 0.1)` | Subtle hover lift | 10% |
| **Elevation 2** | `0 4px 12px rgba(0, 0, 0, 0.15)` | Card hover, button hover | 15% |
| **Elevation 3** | `0 8px 24px rgba(0, 0, 0, 0.2)` | Modal, dropdown | 20% |
| **Glow Red** | `0 0 16px rgba(180, 39, 21, 0.6)` | Assessment card hover, accent glow | 60% |

**Implementation (CSS):**
```css
.shadow-elevation-1 {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.shadow-elevation-2 {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.shadow-glow-red {
  box-shadow: 0 0 16px rgba(180, 39, 21, 0.6);
}
```

---

## 10. TRANSITIONS & ANIMATIONS

### 10.1 Transition Specifications

| Duration | Use Case | Easing Function | CSS |
|---|---|---|---|
| **75ms** | Micro-interactions (press effect) | `cubic-bezier(0.4, 0, 0.2, 1)` | `transition duration-75` |
| **150ms** | Button/link hover, border color change | `cubic-bezier(0.4, 0, 0.2, 1)` | `transition duration-150` |
| **300ms** | Card hover, modal open/close | `cubic-bezier(0.4, 0, 0.2, 1)` | `transition duration-300` |
| **500ms** | Page fade in/out | `cubic-bezier(0.4, 0, 0.2, 1)` | `transition duration-500` |

### 10.2 Reduce Motion

**Accessibility Requirement:** Respect `prefers-reduced-motion` media query.

**Implementation:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. DEVELOPMENT BEST PRACTICES

### 11.1 Code Organization

**Component File Structure:**
```
components/
├── buttons/
│   ├── primary-button.tsx
│   ├── secondary-button.tsx
│   └── tertiary-button.tsx
├── cards/
│   ├── assessment-card.tsx
│   └── status-card.tsx
├── forms/
│   ├── text-input.tsx
│   └── form-container.tsx
├── navigation/
│   ├── navbar.tsx
│   └── sidebar.tsx
└── modals/
    └── modal.tsx
```

### 11.2 Naming Conventions

- **Component Names:** PascalCase (`PrimaryButton`, `AssessmentCard`)
- **CSS Classes:** kebab-case (`button-primary`, `card-assessment`)
- **Variable Names:** camelCase (`buttonColor`, `isHovered`)
- **Colors in Tailwind:** Use theme tokens (`bg-system-red`, `text-default-text`)

### 11.3 Import/Export Pattern

```tsx
// ✓ Correct: Export default component
export default function PrimaryButton() { }

// ✓ Correct: Named export for reuse
export function PrimaryButton() { }

// ✗ Avoid: Wildcard imports
import * as button from './button.tsx'
```

---

## 12. DESIGN SYSTEM VERSION HISTORY

| Version | Date | Changes |
|---|---|---|
| **1.0** | 2026-05-20 | Initial design system specification reverse-engineered from production code |

---

## 13. REFERENCES & RESOURCES

- **Tailwind CSS Documentation:** https://tailwindcss.com/
- **Next.js Image Optimization:** https://nextjs.org/docs/app/api-reference/components/image
- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **Figma Design File:** [AEGIS_Capstone](https://www.figma.com/design/ENqeqjOomL5oahI6zbJBvG/AEGIS_Capstone)

---

**Design System Maintained By:** AEGIS Development Team  
**Project Repository:** [AEGIS GitHub](https://github.com/orgs/COS301-SE-2026/projects/59/views/1)  
**Contact:** aegis-capstone@university.edu
