# DeepTechly v1 Project Brief

## Product Name

**DeepTechly**

## Core Positioning

DeepTechly is an AI-native deep-tech research and intelligence platform.

It lets a user enter a company, patent, lab, technology, or government program and generates:

1. A public research profile
2. A feature article
3. A gated investor / institutional research dossier
4. Raw markdown versions of public pages for AI crawlers
5. Searchable and categorized research archives

The product should feel like a hybrid of:

- An institutional research terminal
- A deep-tech newsroom
- A VC diligence memo system
- A machine-readable intelligence archive

It should **not** feel like:

- A generic startup directory
- A casual AI chatbot
- A SaaS dashboard
- A blog template
- A social media app
- A noisy analytics dashboard

## Core User Promise

> Search any deep-tech company. We will research it.

## Hero Copy

**Headline**

Search any deep-tech company. We will research it.

**Subtitle**

DeepTechly pairs agentic research with newsroom-quality writing. Type a name. Get a researched profile, a feature article, and investor-ready analysis.

**Search placeholder**

Type any company, patent, lab or technology

**Access line**

Free to read · Free to research · Invite required for investor analysis

## Primary Visual Direction

Use the Startuply-style layout pattern as product inspiration, but create an original DeepTechly identity.

DeepTechly should use:

- Orange
- Black
- White / warm off-white
- Boxed desktop layout
- Strong editorial typography
- Thin borders
- Card-based research modules
- Terminal-like metadata labels
- Restrained animations
- Institutional language

Do **not** copy Startuply branding, text, code, logo, proprietary content, or exact visual assets.

## Brand Feel

DeepTechly should feel:

- Serious
- Technical
- Institutional
- Analytical
- Minimal
- Fast
- Premium
- Research-first
- Machine-readable
- Investor-grade

## Important Product Insight

DeepTechly is not a traditional news crawler.

DeepTechly is an entity-centered research generation engine.

The system does not need to start with full autonomous crawling. In v1, the core workflow is:

1. User submits an entity
2. A research job is created
3. The system searches and extracts public signals
4. The system verifies claims and fills gaps
5. The system generates a feature article, public profile, and investor dossier
6. The homepage displays the latest generated research narratives
7. Users can open the public dossier
8. Institutional users can unlock deeper sections

## V1 Product Architecture

```txt
Entity enters system
        ↓
Research queue starts
        ↓
AI gathers public signals
        ↓
AI verifies claims
        ↓
AI generates:
    - feature article
    - public profile
    - investor dossier
        ↓
Homepage publishes research narrative
        ↓
Article links to research dossier
        ↓
Institutional sections are gated
```

## Primary Inputs

Users should be able to research:

- Company name
- Company domain
- Patent title or patent number
- Research lab
- Deep-tech sector
- Government program
- NASA technology
- DARPA topic
- SBIR/STTR award
- Technical system
- Emerging technology

## Primary Outputs

### 1. Feature Article

A narrative article generated from public signals.

It should feel like a newsroom feature, but be generated from research synthesis.

### 2. Public Profile

A structured entity profile with summary, market, technical, and source sections.

### 3. Investor / Institutional Dossier

A premium research artifact with deeper technical, commercial, and risk analysis.

### 4. Markdown Page

Every public article and public profile should also be available as raw markdown by appending `.md`.

Example:

```txt
/article/titanym-sapphire-rf-stack
/article/titanym-sapphire-rf-stack.md

/startup/titanym
/startup/titanym.md

/patent/high-temperature-sige-on-sapphire
/patent/high-temperature-sige-on-sapphire.md
```

### 5. LLM Discovery Files

DeepTechly should include:

```txt
/llms.txt
/llms-full.txt
/sitemap.xml
```

## Sector Taxonomy

Top-level navigation should use a focused deep-tech taxonomy.

Recommended primary nav sectors:

```txt
SPACE
DEFENSE
ROBOTICS
ENERGY
SEMICONDUCTORS
```

Extended sector archive:

```txt
SPACE
AEROSPACE
DEFENSE
ROBOTICS
AUTONOMY
ENERGY
SEMICONDUCTORS
PHOTONICS
MATERIALS
SENSORS
MANUFACTURING
BIOINFRASTRUCTURE
QUANTUM
CLIMATE SYSTEMS
NUCLEAR
OCEAN SYSTEMS
CYBER-PHYSICAL SYSTEMS
```

## Homepage Sections

The homepage should include:

1. Header / Nav
2. Sector navigation strip
3. Orange hero search area
4. Today’s Edition bar
5. Top Stories
6. Also Reading / Side Research column on desktop
7. My Research / Your Research
8. Recent Research grid
9. Technology Signals
10. Government Signals
11. Patent Intelligence
12. White-Space Opportunities
13. Browse by Sector
14. Footer with AI-readable site index

## Article-to-Dossier Conversion Flow

Every article page should end with a prominent research dossier card.

Example:

```txt
RESEARCH DOSSIER

The full deep-tech research on [Company Name]

Technical architecture, patent signals, manufacturing constraints,
government relevance, commercialization scenarios, and the investor read.

Snapshot · Technology Stack · Patent Position · Risk Model · Government Relevance

PUBLIC + INSTITUTIONAL

Overview
Technology
Patents
Markets
Risks

OPEN DOSSIER →
```

## Public vs Gated Sections

### Public Dossier Includes

- Overview
- Technical Summary
- Market Position
- Competitive Landscape
- Sources
- Confidence Score

### Institutional Dossier Includes

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

## Pricing Model

Use a freemium model.

### Free

- Public articles
- Public profiles
- Public dossiers
- Basic research queue
- Markdown pages

### Analyst

Suggested price: $49/month

- Saved watchlists
- Research alerts
- PDF exports
- AI briefings
- Startup comparisons
- Patent monitoring

### Investor / Institutional

Suggested price: $499/month

- Revenue projections
- Risk modeling
- Scenario analysis
- Deeper private research
- TRL / MRL analysis
- Government relevance mapping
- Manufacturing constraints
- Commercialization scenarios
- Supply-chain intelligence

### Enterprise

Custom

- API
- Private datasets
- Team seats
- Custom research workflows
- Government / institutional packages

## Authentication

V1 should use email-only authentication.

Do not use LinkedIn sign-in in v1.

### Public Research Account

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

Use language like:

- Create Research Account
- Request Institutional Access
- Investor analysis and institutional intelligence features may require additional verification

## Queue UX

The queue is central to the perceived product value.

It should communicate that DeepTechly is doing serious research, not instantly generating a shallow AI answer.

Queue lifecycle:

```txt
Queued
Searching public sources
Extracting public signals
Filling data gaps
Verifying technical claims
Mapping patents
Analyzing technology stack
Evaluating manufacturing constraints
Mapping government relevance
Generating feature article
Generating public profile
Generating investor dossier
Publishing research profile
Finalizing institutional dossier
Complete
```

Example queue messages:

```txt
Searching public sources
```

```txt
Filling gaps: founders, headquarters, funding, open roles
```

```txt
Verifying technical claims (6 follow-up searches: patents, team, manufacturing, customers, funding, deployment)
```

```txt
Drafting article, public profile, and investor dossier in parallel
```

```txt
Research profile published — finalizing institutional dossier
```

```txt
DONE · OPEN DOSSIER
```

## Research Personas

Use restrained analyst roles, not gimmicky AI avatars.

Possible roles:

- Technical Systems Analyst
- Patent Intelligence Analyst
- Market Research Analyst
- Government Programs Analyst
- Manufacturing Readiness Analyst
- Investor Risk Analyst

Queue message example:

```txt
Drafting technical profile, investor analysis, and government relevance assessment in parallel
```

## Graphs for V1

Use simple analyst-style graphs.

Do not overbuild dashboard complexity.

Required v1 graph types:

1. Sector Activity Chart
2. Risk Radar
3. TRL / MRL Readiness Bars

Optional v1 graph types:

4. Funding Stage Breakdown
5. Scenario Revenue Chart
6. Source Mix Chart
7. Government Relevance Score

Charts should feel like research memo visuals, not SaaS analytics clutter.

Use Recharts.

## Source and Confidence Policy

Every report should distinguish:

- Confirmed facts
- Cited claims
- Reasoned inference
- Unconfirmed data
- Low-confidence sections

Every public page should include:

- Sources section
- Confidence score
- Source count
- Last updated timestamp

Suggested confidence labels:

```txt
HIGH CONFIDENCE
MODERATE CONFIDENCE
LIMITED PUBLIC DATA
LOW CONFIDENCE
```

Suggested evidence labels:

```txt
CONFIRMED
INFERRED
UNVERIFIED
CONFLICTING SOURCES
```

## Key Build Principle

Build the front-end, content model, queue UX, article pages, and dossier pages first.

Do not block v1 on a perfect crawler.

The first version can be AI-assisted and human-approved.

## V1 Success Criteria

DeepTechly v1 is successful if:

- The homepage feels premium and alive
- Users understand they can research any deep-tech entity
- The queue feels like a serious research pipeline
- Generated articles feel like institutional research narratives
- Dossiers feel valuable enough to gate
- Mobile experience is polished
- Desktop experience uses a beautiful centered boxed layout
- Public pages are machine-readable
- The visual identity feels meaningfully distinct from Startuply
