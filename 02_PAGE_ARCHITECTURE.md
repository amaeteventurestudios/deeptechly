# DeepTechly Page Architecture

## Required Routes

Use Next.js App Router.

Recommended route map:

```txt
/
  Homepage

/news
  News / article archive

/article/[slug]
  Human-readable feature article

/article/[slug].md
  Raw markdown article

/research
  Queue research page

/research/[jobId]
  Research job status page

/startups
  Research profile archive

/startup/[slug]
  Public startup / company profile

/startup/[slug].md
  Raw markdown company profile

/patents
  Patent archive

/patent/[slug]
  Patent profile

/patent/[slug].md
  Raw markdown patent profile

/dossier/[slug]
  Public + gated research dossier

/dossier/[slug].md
  Raw markdown public dossier

/sectors
  Sector archive

/sector/[slug]
  Sector page

/sign-in
  Sign in

/join
  Create research account / request institutional access

/pricing
  Pricing

/methodology
  Methodology and source policy

/llms.txt
  LLM crawler guide

/llms-full.txt
  Expanded LLM crawler guide

/sitemap.xml
  XML sitemap
```

## Homepage Requirements

The homepage is the core product surface.

It should communicate:

1. Search any deep-tech entity
2. DeepTechly will research it
3. Latest research narratives are being published
4. Full dossiers are available
5. Investor analysis is gated

### Homepage Section Order

1. Header
2. Sector nav strip
3. Hero search area
4. Today's Edition bar
5. Top Stories
6. Also Reading side column on desktop
7. My Research
8. Recent Research
9. Technology Signals
10. Government Signals
11. Patent Intelligence
12. White-Space Opportunities
13. Browse by Sector
14. Footer

## Header Component

Component name:

```txt
SiteHeader
```

Desktop:

- Logo left
- Main nav right
- Research button
- Sign in

Mobile:

- Logo centered or left
- Research button visible if possible
- Menu toggle
- Sector nav horizontally scrollable

Nav items:

```txt
News
Explore
Research
```

Sector strip:

```txt
SPACE
DEFENSE
ROBOTICS
ENERGY
SEMICONDUCTORS
```

## Hero Component

Component name:

```txt
HeroResearchSearch
```

Props:

```ts
type HeroResearchSearchProps = {
  headline: string
  subtitle: string
  placeholder: string
  accessLine: string
}
```

Behavior:

- User types entity
- Presses Research
- Creates research job
- Redirects to `/research/[jobId]` or updates queue inline
- If not signed in, allow guest queue or prompt to create account depending on implementation

Required visual:

- Orange background
- Diagonal texture
- Large white headline
- Search bar with hard black border and shadow
- Orange button
- Centered mobile layout

## Today's Edition Component

Component name:

```txt
TodaysEditionBar
```

Fields:

```ts
type TodaysEditionBarProps = {
  date: string
  archiveHref: string
}
```

Display:

```txt
↗ TODAY'S EDITION · SUNDAY, MAY 10
FULL ARCHIVE →
```

## Top Stories Component

Component name:

```txt
TopStories
```

Input:

```ts
type Story = {
  id: string
  rank: number
  companyName: string
  slug: string
  headline: string
  summary: string
  sector: string
  stage?: string
  region?: string
  sourceCount?: number
  confidence?: 'HIGH' | 'MODERATE' | 'LIMITED' | 'LOW'
  authorName?: string
  publishedAt: string
  articleHref: string
  dossierHref: string
  isSaved?: boolean
}
```

Rendering logic:

```txt
if story.rank === 1:
  render FeaturedStory
else:
  render CompactRankedStory
```

### Featured Story

Should include:

- Orange vertical rule
- Company label
- Timestamp
- Large headline
- Summary
- Tags
- Author
- Read article CTA
- Save button

### Compact Story

Should include:

- Pale rank number
- Company label
- Timestamp
- Headline
- Summary
- Tags
- Author
- Save button

## Also Reading Component

Component name:

```txt
AlsoReading
```

Desktop side column.

Content:

- 5 to 8 compact story links
- Sector label
- Time
- Headline
- Tiny save/open icon

Hide or move below Top Stories on mobile.

## My Research Component

Component name:

```txt
MyResearch
```

Shows user’s saved / queued / recent research.

If signed out:

- Show callout to create research account

If signed in:

- Show recent research cards
- Status labels
- Open profile buttons

## Recent Research Grid

Component name:

```txt
RecentResearchGrid
```

Card fields:

```ts
type ResearchCard = {
  id: string
  title: string
  entityName: string
  sector: string
  imageUrl?: string
  fallbackTheme?: string
  description: string
  tags: string[]
  sourceCount?: number
  confidence?: string
  updatedAt: string
  href: string
}
```

Grid:

- 1 column mobile
- 2 columns tablet
- 3 columns desktop
- Boxed centered layout

## Technology Signals Section

Component name:

```txt
TechnologySignals
```

Purpose:

Show what is gaining activity.

Example rows:

```txt
↑ Space Robotics +42%
↑ GaN Semiconductors +18%
↑ Autonomous Manufacturing +27%
↓ Urban EVTOL Funding -14%
↑ Orbital Optical Comms +31%
```

Use simple cards or a small chart.

## Government Signals Section

Component name:

```txt
GovernmentSignals
```

Example:

```txt
DARPA · Autonomous maritime sensing systems
NASA · In-space manufacturing challenge
DOE · Long-duration thermal storage
Space Force · Cislunar domain awareness
```

## Patent Intelligence Section

Component name:

```txt
PatentIntelligence
```

Show:

- Recent patents
- NASA / DARPA / DOE technologies
- Patent-to-market potential
- Related companies

## White-Space Opportunities Section

Component name:

```txt
WhiteSpaceOpportunities
```

Show areas with no dominant player detected.

Example:

```txt
Orbital debris robotics
High-temperature semiconductor packaging
Battery-free infrastructure sensing
Autonomous industrial inspection swarms
```

## Research Queue Page

Route:

```txt
/research
```

Title:

```txt
Queue deep-tech research
```

Subtitle:

```txt
Type a company, patent, lab, technology, or government program. DeepTechly will search public sources, distill the facts, verify claims, and generate an institutional-grade profile, feature article, and research dossier.
```

Warning / heads-up bar:

```txt
HEADS UP: research can take several minutes per entity. Keep this tab open and we will update the queue as each profile is prepared.
```

Input placeholder:

```txt
e.g. Anduril, NASA SiGe on sapphire, DARPA NOM4D, or openai.com
```

Queue warning if busy:

```txt
BUSY QUEUE: there are [number] research jobs ahead of yours. You can safely close this tab and come back later.
```

## Queue Card

Component name:

```txt
ResearchQueueCard
```

Fields:

```ts
type ResearchJob = {
  id: string
  entityName: string
  status: 'queued' | 'searching' | 'extracting' | 'verifying' | 'writing' | 'finalizing' | 'done' | 'failed'
  stageLabel: string
  progress: number
  startedAt: string
  updatedAt: string
  sourceCount?: number
  detectedPatents?: number
  detectedGovernmentRefs?: number
  followUpSearches?: string[]
  articleHref?: string
  profileHref?: string
  dossierHref?: string
}
```

Visual states:

### Queued

```txt
QUEUED · JUST NOW
```

### Searching

```txt
Searching public sources
SEARCHING · 1M AGO
```

### Filling gaps

```txt
Filling gaps: founders, headquarters, founded year, funding, open roles
SEARCHING · 2M AGO
```

### Verifying

```txt
Verifying technical claims (6 follow-up searches: patents, team, manufacturing, customers, funding, deployment)
SEARCHING · 4M AGO
```

### Writing

```txt
Drafting article, public profile, and investor dossier in parallel
WRITING · 5M AGO
```

### Finalizing

```txt
Research profile published — finalizing institutional dossier
WRITING · 6M AGO
```

### Done

```txt
DONE · 8M AGO
OPEN DOSSIER →
```

## Article Page

Route:

```txt
/article/[slug]
```

Purpose:

Feature article generated from the researched entity.

Article structure:

1. Header / nav
2. Sector breadcrumb
3. Hero gradient / visual
4. Entity label
5. Headline
6. Summary deck
7. Metadata tags
8. Article body
9. Key facts callout
10. Simple table if relevant
11. Risk / next months section
12. Sources
13. Research dossier CTA card
14. Related research
15. Footer

Article should include a dossier card near the bottom.

### Article Dossier CTA

Component:

```txt
ArticleDossierCTA
```

Copy:

```txt
RESEARCH DOSSIER

The full deep-tech research on [Company Name]

Technical architecture, patent signals, manufacturing constraints, government relevance, commercialization scenarios, and the investor read.

Snapshot · Technology Stack · Patent Position · Risk Model · Government Relevance

PUBLIC + INSTITUTIONAL

Overview
Technology
Patents
Markets
Risks

OPEN DOSSIER →
```

## Public Profile Page

Route:

```txt
/startup/[slug]
```

Purpose:

Structured company profile.

Sections:

1. Snapshot
2. What the company does
3. Technical Summary
4. Market Position
5. Competitive Landscape
6. Technology Tags
7. Sources
8. Confidence Score
9. Link to Article
10. Link to Dossier

## Dossier Page

Route:

```txt
/dossier/[slug]
```

Purpose:

Public + gated research dossier.

Header:

- Company/entity name
- Sector
- Region
- Research status
- Source count
- Confidence score
- Last updated

Public sections:

- Overview
- Technical Summary
- Market Position
- Competitive Landscape
- Sources
- Confidence Score

Gated sections:

- Technology Stack
- White-Space Analysis
- Government Relevance
- Patent Position
- TRL / MRL Analysis
- Manufacturing Constraints
- Deployment Constraints
- Supply Chain Dependencies
- Revenue Scenarios
- Commercialization Scenarios
- Risk Modeling
- Capital Intensity
- Regulatory Complexity
- Acquisition Potential
- Strategic Outlook

Gated sections should show a preview blur or locked card.

CTA:

```txt
Unlock institutional analysis
```

## Dossier Graphs

Include:

1. Risk Radar
2. TRL / MRL bars
3. Revenue scenario chart if available
4. Source mix chart optional

## Pricing Page

Route:

```txt
/pricing
```

Tiers:

### Free

$0

- Public articles
- Public profiles
- Basic research queue
- Public dossier snapshot
- Markdown access

### Analyst

$49/month

- Saved watchlists
- Research alerts
- Deep reports
- PDF exports
- Startup comparisons
- Patent monitoring

### Institutional

$499/month

- Revenue projections
- Risk modeling
- Scenario analysis
- Investor dossiers
- TRL / MRL analysis
- Government relevance mapping
- Manufacturing constraints
- Commercialization scenarios

### Enterprise

Custom

- Team access
- API
- Private datasets
- Custom workflows
- Strategic intelligence

## Methodology Page

Route:

```txt
/methodology
```

Explain:

- How research is generated
- How sources are collected
- Difference between confirmed facts and inferences
- Confidence scoring
- Source policy
- Human review policy
- AI generation policy
- Investment advice disclaimer

This page is very important for trust.

## Markdown Routes

Every public article, profile, patent profile, and public dossier must have markdown output.

Markdown format:

```md
# Title

## Summary

## Key Facts

## Technical Summary

## Market Position

## Sources

## Confidence

## Related Pages
```

No private institutional content should be exposed in public markdown unless user is authenticated and authorized, and even then do not expose gated content to public crawler routes.

## /llms.txt

Should include:

```txt
# DeepTechly

DeepTechly is an AI-native research and intelligence platform for deep-tech companies, patents, labs, government technologies, and emerging infrastructure systems.

Every public article, profile, patent page, and public dossier is available as raw markdown by appending .md to the URL.

Important routes:
- /article/[slug]
- /article/[slug].md
- /startup/[slug]
- /startup/[slug].md
- /patent/[slug]
- /patent/[slug].md
- /dossier/[slug]
- /dossier/[slug].md
- /sitemap.xml

Research categories:
Space, Defense, Robotics, Energy, Semiconductors, Photonics, Materials, Manufacturing, Sensors, Autonomy, Quantum, Bioinfrastructure.

Use public markdown pages for summaries and citations. Institutional analysis may be gated and unavailable to crawlers.
```
