# DeepTechly Components and Interactions

## Technology Stack Recommendation

Use:

```txt
Next.js App Router
TypeScript
Tailwind CSS
Framer Motion
Recharts
Supabase or Postgres
Supabase Auth or Clerk
Trigger.dev / Inngest / BullMQ for jobs
Vercel for frontend deployment
Supabase Storage / Vercel Blob / Cloudinary for images
```

## Component List

Build components in a reusable structure.

Recommended folder structure:

```txt
/components
  /layout
    SiteHeader.tsx
    SectorNav.tsx
    SiteFooter.tsx
    BoxedContainer.tsx
    SectionHeader.tsx

  /home
    HeroResearchSearch.tsx
    TodaysEditionBar.tsx
    TopStories.tsx
    FeaturedStory.tsx
    CompactRankedStory.tsx
    AlsoReading.tsx
    MyResearch.tsx
    RecentResearchGrid.tsx
    ResearchCard.tsx
    TechnologySignals.tsx
    GovernmentSignals.tsx
    PatentIntelligence.tsx
    WhiteSpaceOpportunities.tsx
    BrowseBySector.tsx

  /research
    ResearchQueueForm.tsx
    ResearchQueueList.tsx
    ResearchQueueCard.tsx
    QueueProgressBar.tsx
    ResearchStatusBadge.tsx
    EvidenceMetrics.tsx

  /article
    ArticleHero.tsx
    ArticleBody.tsx
    KeyFactsBox.tsx
    ArticleSourceList.tsx
    ArticleDossierCTA.tsx
    RelatedResearch.tsx

  /dossier
    DossierHeader.tsx
    DossierSection.tsx
    LockedDossierSection.tsx
    ConfidenceScoreCard.tsx
    SourceCountCard.tsx
    RiskRadarChart.tsx
    ReadinessBars.tsx
    RevenueScenarioChart.tsx
    SourceMixChart.tsx

  /auth
    AuthLayout.tsx
    JoinForm.tsx
    SignInForm.tsx
    AccessTabs.tsx

  /ui
    Button.tsx
    Input.tsx
    Tag.tsx
    Card.tsx
    Badge.tsx
    Divider.tsx
    IconButton.tsx
```

## BoxedContainer

All major content sections should use this.

Example behavior:

```tsx
<div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
  {children}
</div>
```

For article body:

```tsx
<div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
  {children}
</div>
```

## Animation System

Use Framer Motion.

Create common variants:

```ts
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08
    }
  }
}
```

Respect reduced motion.

## Cursor-Aware Card Hover

Use pointer position to create subtle accent movement.

Behavior:

- On hover, card lifts 2-4px
- Border becomes orange
- Shadow shifts hard to bottom-right
- Optional orange radial highlight follows cursor at low opacity

Do not make this heavy or distracting.

## Button Interaction

Primary button:

- Orange background
- Black border
- White text or black text depending contrast
- Arrow icon moves right on hover
- Hard shadow offset
- Pressed state moves shadow back

Secondary button:

- White background
- Black border
- Black text
- Orange hover border

Institutional button:

- Black background
- White text
- Orange border on hover

## Search Interaction

Hero search behavior:

1. User types query
2. Button activates
3. On submit:
   - create job
   - route to `/research/[jobId]`
   - show inline loading state if needed
4. Button text changes to:
   - `QUEUING`
   - then route

Input focus:

- Orange outline
- Search icon slight scale
- Border remains black

## Research Queue Interactions

The research queue should feel alive.

### Polling

Poll job status every 2-5 seconds.

### Progress Bar

- Animated width
- Orange fill
- Gray track
- Smooth transitions
- Never jump backward

### Status Text

Change status text as job progresses.

### Completion

When complete:

- Show green/orange check
- Replace progress bar with Open Dossier button
- Header says `ALL CAUGHT UP` if no active jobs

## Queue Card Visual

Desktop:

```txt
[spinner/check] Entity Name
Progress bar
Stage message
STATUS · TIME AGO
[Open Dossier button if complete]
```

Mobile:

- Stack content
- Center entity name if it improves readability
- Progress full width
- Button centered
- No clipped text

## Dossier Gating Interaction

Locked institutional sections should show:

- Section title
- Short preview
- Blur or faded content block
- Lock icon
- CTA button

CTA copy:

```txt
Unlock institutional analysis
```

Subcopy:

```txt
Institutional access includes technical risk modeling, readiness analysis, government relevance mapping, and commercialization scenarios.
```

## Graph Components

### RiskRadarChart

Inputs:

```ts
type RiskRadarData = {
  technicalRisk: number
  manufacturingRisk: number
  regulatoryRisk: number
  supplyChainRisk: number
  capitalIntensity: number
  deploymentRisk: number
}
```

Display labels:

```txt
Technical
Manufacturing
Regulatory
Supply Chain
Capital
Deployment
```

### ReadinessBars

Inputs:

```ts
type ReadinessData = {
  trl: number
  mrl: number
}
```

Display:

```txt
TRL 4 / 9
MRL 3 / 10
```

Use horizontal bars.

### SectorActivityChart

Inputs:

```ts
type SectorActivity = {
  sector: string
  activity: number
  change: number
}
```

Use simple bar chart.

### RevenueScenarioChart

Inputs:

```ts
type RevenueScenario = {
  scenario: string
  year1: number
  year2: number
  year3: number
}
```

Use line chart.

## Mobile-Specific Requirements

Every major component must be reviewed at:

```txt
320px
375px
390px
430px
768px
1024px
1280px
```

### Mobile Rules

- Center hero text
- Center search form
- Center CTA buttons
- Center images
- Center cards
- Tags wrap cleanly
- Buttons full-width when needed
- No horizontal overflow
- Header remains readable
- Sector nav scrolls horizontally if needed
- Article body remains readable
- Dossier cards stack vertically
- Graphs fit container

## Desktop-Specific Requirements

- Boxed layout
- Maximum content width
- Strong two-column layout where helpful
- Also Reading side column on homepage/article pages
- Card grids use 3 columns
- No content too wide
- No full-width dashboard sprawl

## Homepage Interaction Details

### Top Stories

- Save/star button on each story
- Hovering story highlights the read link
- Featured story has stronger hover border
- Clicking story opens article
- Clicking dossier badge opens dossier if present

### Recent Research

- Hover card reveals:
  - Open Profile
  - Open Dossier
- Image slightly scales on hover
- Tags brighten

### Technology Signals

- Hover signal row shows short explanation
- Optional mini chart animation

### Government Signals

- Hover government item reveals matched sectors

## Article Page Interaction Details

- Sticky mini progress optional
- Dossier CTA at bottom should be prominent
- Source links should be clear
- Related research should be card-based

## Footer Interaction Details

- Links turn orange on hover
- `llms.txt` and `XML sitemap` should be visible
- Footer should include machine-readable positioning text

## Empty States

### No Research Yet

```txt
No research queued yet.

Search any company, patent, lab, or technology to generate your first DeepTechly dossier.
```

### No Top Stories

```txt
No edition published yet.

Queue research to generate today’s first story.
```

### No Sources Found

```txt
Limited public data found.

DeepTechly could not identify enough reliable sources to generate a high-confidence profile.
```

## Error States

If research fails:

```txt
Research failed

We could not complete this research job. Try a more specific company name, domain, patent number, or source URL.
```

Do not silently fail.

## Loading States

Use real skeletons, not generic spinners everywhere.

For article cards:

- skeleton image
- skeleton label
- skeleton headline
- skeleton metadata

For queue:

- progress bar
- status text

## Performance Requirements

- Optimize images
- Lazy-load below-fold sections
- Avoid heavy animations on mobile
- Use dynamic imports for charts if needed
- Minimize client-side JavaScript for article pages
- Use server components where possible

## SEO Requirements

Each article/profile/dossier page should include:

- Title
- Description
- Open Graph image
- Canonical URL
- Structured data where appropriate
- Published/updated date
- Sector tags

## AI-Readable Requirements

Each public page should have:

- Markdown route
- Clean semantic HTML
- Proper headings
- Source lists
- Last updated
- Confidence label

## Do Not Build in V1

Do not build these until the core is working:

- LinkedIn sign-in
- Full autonomous crawler
- Complex knowledge graph UI
- Real-time social feed ingestion
- Large enterprise admin console
- Full API product
- Complex team permissions
- AI chat assistant
- Browser extension

## V1 Priority

Build this order:

1. Visual system
2. Homepage
3. Research queue UI
4. Article page
5. Dossier page
6. Auth pages
7. Pricing page
8. Markdown routes
9. Seed data
10. Basic research job backend
11. AI generation pipeline
12. Admin review workflow
