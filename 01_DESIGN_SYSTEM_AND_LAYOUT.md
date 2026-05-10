# DeepTechly Design System and Layout Specification

## Design Objective

Create a premium, mobile-first, orange-black-white deep-tech research platform.

The design should feel like:

- Institutional research
- Engineering intelligence
- A serious newsroom
- A deep-tech diligence terminal
- A modern editorial product

It should not feel like:

- A generic AI SaaS app
- A crypto dashboard
- A blog template
- A colorful startup directory
- A social network
- A full-width corporate landing page

## Required Desktop Layout Behavior

Desktop must use a **boxed centered layout**.

Do not let primary content stretch edge-to-edge across the full viewport.

### Desktop Container Rules

Use centered max-width wrappers.

Recommended max widths:

```txt
Main page shell: max-width 1280px
Article body: max-width 760px
Dossier content: max-width 1040px
Grid sections: max-width 1120px
Header inner: max-width 1280px
Footer inner: max-width 1280px
```

The body background can extend full width, but content must sit inside centered boxes.

### Desktop Layout Style

Use:

- Centered containers
- Strong vertical rhythm
- Thin black borders
- Editorial columns
- White / off-white section backgrounds
- Black dividers
- Orange accents
- Box shadows that feel printed / editorial, not soft SaaS cards

Avoid:

- Giant full-width dashboard rows
- Overly wide paragraphs
- Centered hero only with no structure
- Floating glassmorphism
- Random gradients outside the hero

## Required Mobile Layout Behavior

Mobile must be **mobile-first**.

On mobile:

- Text should be centered unless it is long article body text
- Hero headline centered
- Hero subtitle centered
- CTA buttons centered
- Search form centered
- Images centered
- Cards centered
- Headers centered
- Section titles centered where appropriate
- Article body can remain left-aligned for readability
- All touch targets must be large
- No horizontal scrolling
- No text clipping
- No fixed-width desktop elements
- No tiny tags that become unreadable
- Navigation should collapse cleanly

Mobile design is not an afterthought. Build from mobile upward.

## Responsive Breakpoints

Recommended Tailwind breakpoints:

```txt
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

Mobile first:

- Default styles target mobile
- Add `md:` and `lg:` enhancements
- Boxed desktop layout begins at `lg`

## Color System

### Core Palette

```txt
DeepTech Orange: #FF5A00
Burnt Orange: #E94D00
Dark Orange: #C93F00
Soft Orange: #FFB17A
Pale Orange: #FFF1E8

Black: #0E0E0E
Near Black: #151515
Charcoal: #262626
Border Black: #111111

White: #FFFFFF
Warm Off White: #F7F3EE
Paper: #FAF8F4
Muted Gray: #737373
Light Border: #E5E0D8
```

### Color Usage

Orange:

- Hero background
- Primary buttons
- Active nav borders
- Sector labels
- Queue progress
- Links
- Key metadata
- Icon highlights

Black:

- Header
- Footer
- Section bars
- Text
- Borders
- Dossier callouts

White / Paper:

- Page content
- Cards
- Article body
- Auth pages
- Dossier body

## Typography

Use typography that combines editorial authority with technical clarity.

Recommended font pairing:

### Option A

- Headings: Inter Tight, Archivo, or Neue Haas Grotesk style
- Body: Georgia or Source Serif style for long-form editorial text
- UI / metadata: Inter, IBM Plex Sans, or Space Grotesk

### Option B

- Headings: Satoshi / Inter
- Body: Literata / Georgia
- Metadata: IBM Plex Mono or Space Mono

## Typography Rules

### Hero Headline

- Very large
- Heavy weight
- Tight line-height
- White text on orange
- Centered on mobile
- Left-aligned inside boxed layout on desktop is acceptable, but centered is preferred if it retains visual strength

Recommended sizes:

```txt
Mobile: 48px to 64px
Tablet: 72px to 92px
Desktop: 92px to 128px
Line height: 0.9 to 1.0
Weight: 800 or 900
```

### Section Labels

Use uppercase tracking.

```txt
letter-spacing: 0.18em
font-size: 12px
font-weight: 700
```

### Article Body

Long-form article text should use a readable serif.

```txt
font-size: 18px to 20px
line-height: 1.65
max-width: 720px
```

### Metadata

Use small uppercase sans or mono.

```txt
font-size: 11px to 13px
letter-spacing: 0.12em
font-weight: 700
```

## Logo Direction

DeepTechly logo should be simple.

Suggested mark:

- Orange shield
- Hexagonal shield
- Small central dot / aperture / chip shape
- Minimal
- Works at favicon size
- White mark inside orange shield

Header lockup:

```txt
[orange shield mark] DeepTechly
```

Do not overdesign the logo.

## Header

Desktop header should include:

```txt
DeepTechly logo
News
Explore
Research button
Sign in icon / link
```

Sector nav below:

```txt
SPACE
DEFENSE
ROBOTICS
ENERGY
SEMICONDUCTORS
```

Extended categories appear in Explore.

Header style:

- Black background
- White text
- Orange accent
- Thin divider
- Boxed centered inner content
- Sticky optional, but avoid intrusive sticky behavior on mobile

Research button:

- Border orange
- Text orange
- Uppercase
- On hover: orange fill with black text or white text
- Subtle cursor interaction

## Hero Section

Hero should be orange with subtle diagonal line texture.

Use:

- Full-width orange background
- Boxed centered content inside
- Large headline
- Subtitle
- Search form
- Access note

Hero background may extend full viewport width, but content must remain boxed.

### Hero Texture

Subtle diagonal lines:

- Low opacity
- Slightly darker or lighter orange
- No distracting pattern
- Should look like technical paper / industrial signal lines

### Hero Search Form

Desktop:

```txt
[search icon + input] [RESEARCH →]
```

Mobile:

- Stack or remain horizontal if width allows
- Input and button must be easy to tap
- Centered
- Strong black border
- Slight hard shadow offset

Search form style:

- White input
- Black border
- Orange button
- Black shadow offset
- Large height, about 64px desktop
- Mobile height about 56px

## Today’s Edition Bar

Black bar below hero.

Content:

```txt
↗ TODAY'S EDITION · SUNDAY, MAY 10
FULL ARCHIVE →
```

Desktop:

- Left and right aligned inside boxed container

Mobile:

- Center stacked or split carefully
- Keep text readable

## Top Stories Section

Top Stories should use ranked editorial layout.

### Story #1

Featured lead story:

- Orange left vertical rule
- Company label
- Timestamp
- Large headline
- Summary
- Tags
- Author
- Read article link
- Save/star button optional

### Stories #2 onward

Compact ranked layout:

- Large pale rank number
- Company label
- Timestamp
- Headline
- Summary
- Tags
- Author
- Save/star button optional

### Mobile

On mobile:

- Center story cards when possible
- Headlines may be left-aligned inside cards for readability
- Rank numbers should not crowd content
- Tags wrap cleanly
- No overflow

## Story Card Metadata

Each story should display:

- Company name
- Time since generated
- Headline
- Summary
- Sector
- Stage
- Region
- Technology tags if available
- Author / analyst persona
- Read article link

DeepTechly-specific additions:

- Source count
- Confidence score
- Research mode
- Technology tags

Example:

```txt
SPACE ROBOTICS · 14 SOURCES · HIGH CONFIDENCE
```

## Recent Research Grid

Use card grid.

Desktop:

- 3 columns
- Boxed centered
- Equal card heights
- Strong but clean card borders

Tablet:

- 2 columns

Mobile:

- 1 column
- Cards centered
- Max width around 360px to 420px

Card content:

- Image / generated visual top
- Sector label
- Company name
- Short description
- Time
- Tags
- Source count
- Confidence label

## Images and Generated Fallback Cards

When a research story has no suitable image:

Generate fallback branded cards.

Fallback card style:

- Orange / black gradient
- DeepTechly logo
- Sector label
- Company name
- Technical pattern
- Clean typography

Image hierarchy:

1. Use article/company OG image
2. Use company logo
3. Use favicon / brand asset
4. Generate DeepTechly fallback card

All images must be centered and responsive on mobile.

## Graph Visual Style

Graphs should be clean, editorial, and analyst-like.

Use:

- Recharts
- White cards
- Black borders
- Orange highlight
- Minimal grid lines
- Clear labels
- No rainbow palettes
- No excessive 3D effects

Graph cards should include:

- Title
- Short interpretation
- Chart
- Source / generated timestamp if relevant

### Required Graphs

1. Sector Activity
2. Risk Radar
3. TRL / MRL Readiness Bars

## Animations

Use animations, but keep them restrained and premium.

Use Framer Motion.

### Required Animations

1. Hero headline reveal
2. Search form entrance
3. Button hover movement
4. Cursor-aware card hover
5. Queue progress animation
6. Research card fade-in
7. Graph value animation
8. Section entrance on scroll

### Animation Rules

- Animations should feel fast and confident
- Do not use slow floating animations everywhere
- No excessive bouncing
- No gimmicky AI orb
- No particle overload
- Respect `prefers-reduced-motion`

## Cursor Interactions

Desktop should have amazing but restrained cursor interactions.

Suggested interactions:

### Research Cards

On hover:

- slight upward movement
- orange border highlight
- subtle shadow offset
- metadata brightens

### Buttons

On hover:

- arrow moves slightly right
- background fills
- border thickens or shadow shifts

### Hero Search

On focus:

- orange outline
- search icon animates slightly
- button becomes more saturated

### Sector Tags

On hover:

- orange background
- black text or white text
- subtle transform

### Dossier CTA Card

On hover:

- orange corner accent expands
- arrow moves
- shadow deepens

Do not create cursor trails unless implemented very subtly and performance-safe.

## Auth Page Design

Auth pages should be minimal and institutional.

Layout:

- Centered narrow column
- Logo at top
- White / paper background
- Black text
- Orange active button
- Thin borders
- Large form fields

### Research Account

Fields:

- Full Name
- Email
- Password

### Institutional Access

Fields:

- Full Name
- Organization
- Work Email
- Password
- Invite Code

Tabs:

```txt
RESEARCH ACCESS
INSTITUTIONAL ACCESS
```

Copy:

```txt
Join DeepTechly
Choose the access path that matches your role. Research accounts are free. Institutional analysis may require verification or an invite code.
```

## Footer

Footer should be similar in structure to the reference, but original in content.

### Black Footer Top

Columns:

1. Brand and mission
2. Sections
3. Intelligence
4. Platform

Brand text:

```txt
DeepTechly

AI-native research and intelligence infrastructure for deep-tech companies, patents, labs, and emerging systems.
```

Sections:

```txt
SPACE
DEFENSE
SEMICONDUCTORS
ROBOTICS
ENERGY
PHOTONICS
MATERIALS
AUTONOMY
SENSORS
MANUFACTURING
QUANTUM
BIOINFRASTRUCTURE
```

Intelligence:

```txt
Research
Patent Intelligence
Government Signals
White-Space Analysis
Technology Signals
Market Maps
```

Platform:

```txt
Home
Research
Investor Access
Pricing
Methodology
API
Sign In
```

### Footer Bottom

Include AI-readable statement:

```txt
DeepTechly.ai — independent AI-native research and reporting on deep-tech companies, patents, government technologies, and emerging infrastructure systems.

Every public research page is also available as raw markdown by appending .md to the URL.

Site index: Articles · Research Profiles · Patent Intelligence · llms.txt · XML sitemap
```

Also include:

```txt
Independent research · Not investment advice
```

## Accessibility

Required:

- Keyboard navigable
- Visible focus states
- Sufficient color contrast
- Semantic headings
- Alt text for images
- Form labels
- Reduced motion support
- Responsive text sizes
- Avoid tiny tap targets

## Visual Quality Bar

The UI should be good enough that the user immediately feels:

> This is a serious institutional research product.

If an element feels like a generic SaaS dashboard, redesign it.
