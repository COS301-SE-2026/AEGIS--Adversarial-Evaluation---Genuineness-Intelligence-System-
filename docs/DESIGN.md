# Project "Human Logic" | Technical Design System

## Figma Design File
- [AEGIS Capstone Figma File](https://www.figma.com/design/ENqeqjOomL5oahI6zbJBvG/AEGIS_Capstone?node-id=0-1&t=KZ9dZ0raUn1VShqz-1&utm_source=chatgpt.com)

---

# 1. Design Inspiration

## The Narrative
**Human Reasoning vs. AI Logic**

## The Objective
Find vulnerabilities in AI logic through adversarial prompt engineering.

## The Aesthetic
WWII Propaganda *(bold, stenciled, gritty)* merged with Modern Cyber-Warfare *(terminal HUDs, red-teaming)*.

---

# 2. Core Color Palette (Primary)

| Purpose | Color Name | Hex |
|---|---|---|
| Global Background | Chinese Black | `#121211` |
| Nav & Cards | Bunker Grey | `#292C2F` |
| Borders | Black Wool | `#333331` |
| Primary Text | WhiteSmoke | `#F5F5F5` |
| Human Accent | Signal Red | `#D32F2F` |
| AI/System Accent | Pure White | `#FFFFFF` |

## Color Usage Notes

### Global Background (Chinese Black) — `#121211`
The base "void" of the bunker interface.

### Nav & Cards (Bunker Grey) — `#292C2F`
Secondary surfaces and component containers.

### Borders (Black Wool) — `#333331`
Dividers, input strokes, and line numbers.

### Primary Text (WhiteSmoke) — `#F5F5F5`
High-contrast readability for all instructions.

### Human Accent (Signal Red) — `#D32F2F`
Brand color used for human-driven effort and actions.

### AI/System Accent (Pure White) — `#FFFFFF`
Clinical, high-tech feedback and AI data.

---

# 3. Typography Specifications

## Headings & Primary CTAs
### Font: Staatliches
- Weight: `400`
- Style: `Uppercase`
- Letter Spacing: `0.05rem`

## Body & Labels
### Font: IBM Plex Sans
- Weight: `400 (Regular)` / `500 (Medium)`
- Line Height: `1.6`

## Technical/System Data
### Font: JetBrains Mono
- Weight: `400`
- Feature: `Discretionary ligatures enabled`

---

# 4. Component Dimensions & Spacing

To maintain an engineered, military-grade feel, all components follow a strict **8px grid system**.

---

## Button Tiers

### Tactical (Large)
- Height: `64px`
- Horizontal Padding: `40px`
- Text Size: `24px`
- Font: `Staatliches`
- Use Case: Hero Section, `"Start Assessment"`

### Operational (Medium)
- Height: `48px`
- Horizontal Padding: `24px`
- Text Size: `18px`
- Font: `Staatliches`
- Use Case: Submit Solution, General Form Actions

### Utility (Small)
- Height: `32px`
- Horizontal Padding: `16px`
- Text Size: `14px`
- Font: `Staatliches`
- Use Case: Nav Bar, Footer Links, Filters

---

## Forms & Input Fields

### Standard Text Input
- Height: `48px`
- Internal Padding: `16px Left/Right`
- Font Size: `16px`
- Font: `IBM Plex Sans`
- Border: `1px solid Black Wool`
- Focus State: `2px solid Signal Red`

### Textarea (Code/Prompt Entry)
- Minimum Height: `160px`
- Padding: `16px`
- Font: `JetBrains Mono`
- Font Size: `14px`

### Form Labels
- Font Size: `16px`
- Weight: `500 (Medium)`
- Bottom Margin: `8px`
- Style: `Uppercase`

### Selection Controls (Checkboxes/Radios)
- Size: `20px x 20px`
- Checkbox Radius: `2px`
- Radio Radius: `50%`
- Active Accent: `Signal Red`

### Field Spacing (Form Group)
- Vertical Gap: `24px`

---

## Iconography

### Status Icons (Alerts)
- Size: `48px x 48px`
- Stroke Weight: `2px`

### Navigation Icons
- Size: `24px x 24px`
- Stroke Weight: `1.5px`

### Inline/Micro Icons
- Size: `16px x 16px`
- Stroke Weight: `1px`

### Icon Requirement
All icons must be **outlined/stroked** *(not filled)* to mimic digital HUDs.

---

# 5. Component Color Mapping

| Component | Styling |
|---|---|
| Primary Action (Human) | Background: Signal Red \| Text: WhiteSmoke |
| Secondary Action | Background: Transparent \| Border: Signal Red \| Text: Signal Red |
| Input Fields | Background: Chinese Black \| Border: Black Wool \| Focus: Signal Red |
| AI Indicators | Stroke/Data: Pure White \| Motion: Pure White (Pulse) |

---

# 6. Interactive & Forensic States

## Hover (Human)
Increase Signal Red brightness by **15%** on hover.

## Processing (System)
Containers receive a **1px pulsing border** in Pure White.

## Error / AI Detected
- `1px solid Signal Red` border
- Signal Red error text

---

## The Code Editor

### Active Line
- `5%` opacity Signal Red background

### Active Indicator
- `2px solid Signal Red` left border on the active line

---

# 7. Constraints & Accessibility

## Radius
All components use a **2px maximum radius**.  
Hard, square edges are preferred.

## Contrast
Body text *(WhiteSmoke at 85% opacity)* must maintain a **7:1 ratio** against Chinese Black.

## Visual Hierarchy
- Use **Staatliches** for commands/actions
- Use **IBM Plex Sans** for long-form reading