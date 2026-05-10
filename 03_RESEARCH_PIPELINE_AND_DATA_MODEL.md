# DeepTechly Research Pipeline and Data Model

## V1 Research Philosophy

DeepTechly v1 should use a controlled AI-assisted research pipeline.

Do not attempt to build a perfect autonomous web crawler in v1.

V1 should support:

- User-submitted research jobs
- Admin-created research jobs
- AI-assisted search and extraction
- Human-approved publishing if admin workflow is enabled
- Generated feature articles
- Generated public profiles
- Generated investor dossiers
- Public markdown routes
- Gated institutional sections

## Research Job Lifecycle

```txt
User submits entity
        ↓
Create research job
        ↓
Search public web
        ↓
Extract candidate sources
        ↓
Classify source quality
        ↓
Identify entity facts
        ↓
Fill gaps with follow-up searches
        ↓
Verify claims
        ↓
Generate structured profile
        ↓
Generate feature article
        ↓
Generate investor dossier
        ↓
Generate charts and scores
        ↓
Generate markdown
        ↓
Publish or queue for approval
```

## Research Job Statuses

Use these statuses:

```txt
queued
searching
extracting
filling_gaps
verifying
analyzing
writing
finalizing
done
failed
```

## Research Progress Stages

Recommended progress mapping:

```txt
queued: 0-5%
searching: 5-20%
extracting: 20-35%
filling_gaps: 35-50%
verifying: 50-65%
analyzing: 65-75%
writing: 75-88%
finalizing: 88-98%
done: 100%
```

## Queue Status Messages

Use stage-specific messages.

### Queued

```txt
Queued for research
```

### Searching

```txt
Searching public sources
```

### Extracting

```txt
Extracting company, technology, funding, and market signals
```

### Filling Gaps

```txt
Filling gaps: founders, headquarters, founding year, funding, open roles
```

Deep-tech variants:

```txt
Filling gaps: patents, technical claims, manufacturing process, deployment environment
```

### Verifying

```txt
Verifying claims (6 follow-up searches: team, patents, customers, funding, manufacturing, deployment)
```

### Analyzing

```txt
Mapping technology stack, market position, and government relevance
```

### Writing

```txt
Drafting feature article, public profile, and investor dossier in parallel
```

### Finalizing

```txt
Research profile published — finalizing institutional dossier
```

### Done

```txt
Research complete
```

## Source Types

The system should detect and label source types:

```txt
company_website
press_release
news_article
patent
research_paper
government_page
sbir_award
sec_filing
fcc_filing
fda_record
job_posting
github_repo
app_store
social_profile
investor_page
podcast
conference_page
pdf
unknown
```

## Source Quality Levels

```txt
primary
high
medium
low
unknown
```

### Primary Sources

- Company website
- Official press releases
- Government databases
- Patent databases
- SEC filings
- FCC filings
- FDA records
- Official grant or award pages
- Research lab pages

### High-Quality Sources

- Reputable industry publications
- Established news outlets
- University pages
- Standards bodies
- Recognized analyst reports

### Medium Sources

- Blogs
- Aggregators
- Startup databases
- Conference bios
- Podcasts

### Low Sources

- Unsourced summaries
- Social posts
- Scraped directories
- Low-quality SEO pages

## Evidence Labels

Every claim should be internally labeled as:

```txt
confirmed
cited
inferred
unverified
conflicting
```

## Public Output Rule

Do not state inferred or unverified claims as fact.

Use phrasing such as:

```txt
Public sources indicate...
The company appears to...
This suggests...
DeepTechly could not confirm...
No public evidence was found for...
```

## Confidence Score

Use 0-100.

Suggested logic:

```txt
source_count_score: 0-25
primary_source_score: 0-25
claim_consistency_score: 0-20
recency_score: 0-10
technical_specificity_score: 0-10
data_completeness_score: 0-10
```

Labels:

```txt
80-100: HIGH CONFIDENCE
60-79: MODERATE CONFIDENCE
40-59: LIMITED PUBLIC DATA
0-39: LOW CONFIDENCE
```

## Research Depth Score

Separate from confidence.

Research depth measures how much material the system found.

Example:

```txt
Research depth: 72%
Sources analyzed: 18
Patents detected: 3
Government references detected: 2
Research papers matched: 4
```

## Entity Types

```txt
company
patent
technology
lab
government_program
sector
person
product
unknown
```

## Core Database Tables

Use Postgres / Supabase recommended.

### entities

```sql
id uuid primary key
name text not null
slug text unique not null
type text not null
website_url text
description text
sector text
region text
country text
stage text
founded_year integer
headquarters text
employee_count text
created_at timestamp
updated_at timestamp
```

### research_jobs

```sql
id uuid primary key
entity_id uuid references entities(id)
submitted_query text not null
submitted_by uuid
status text not null
stage_label text
progress integer default 0
queue_position integer
source_count integer default 0
detected_patents integer default 0
detected_government_refs integer default 0
follow_up_searches jsonb
error_message text
started_at timestamp
completed_at timestamp
created_at timestamp
updated_at timestamp
```

### sources

```sql
id uuid primary key
entity_id uuid references entities(id)
job_id uuid references research_jobs(id)
title text
url text not null
domain text
source_type text
quality_level text
published_at timestamp
retrieved_at timestamp
excerpt text
raw_text text
metadata jsonb
created_at timestamp
```

### articles

```sql
id uuid primary key
entity_id uuid references entities(id)
job_id uuid references research_jobs(id)
title text not null
slug text unique not null
deck text
body_md text
body_html text
author_name text
sector text
status text
rank integer
edition_date date
is_top_story boolean default false
image_url text
fallback_image_theme text
published_at timestamp
created_at timestamp
updated_at timestamp
```

### profiles

```sql
id uuid primary key
entity_id uuid references entities(id)
job_id uuid references research_jobs(id)
slug text unique not null
summary text
technical_summary text
market_position text
competitive_landscape text
tags text[]
source_count integer
confidence_score integer
confidence_label text
public_md text
published_at timestamp
created_at timestamp
updated_at timestamp
```

### dossiers

```sql
id uuid primary key
entity_id uuid references entities(id)
job_id uuid references research_jobs(id)
slug text unique not null
overview text
technical_summary text
market_position text
competitive_landscape text
sources_summary text
confidence_score integer
confidence_label text
technology_stack jsonb
white_space_analysis text
government_relevance text
patent_position text
trl_score integer
mrl_score integer
manufacturing_constraints text
deployment_constraints text
supply_chain_dependencies text
revenue_scenarios jsonb
commercialization_scenarios jsonb
risk_model jsonb
capital_intensity text
regulatory_complexity text
acquisition_potential text
strategic_outlook text
public_md text
gated_md text
published_at timestamp
created_at timestamp
updated_at timestamp
```

### sectors

```sql
id uuid primary key
name text not null
slug text unique not null
description text
parent_sector text
created_at timestamp
updated_at timestamp
```

### article_tags

```sql
id uuid primary key
article_id uuid references articles(id)
tag text not null
tag_type text
```

### saved_research

```sql
id uuid primary key
user_id uuid not null
entity_id uuid references entities(id)
article_id uuid references articles(id)
dossier_id uuid references dossiers(id)
created_at timestamp
```

### users_profile

```sql
id uuid primary key
auth_user_id uuid unique not null
full_name text
email text not null
organization text
access_tier text default 'free'
is_institutional_verified boolean default false
created_at timestamp
updated_at timestamp
```

### invite_codes

```sql
id uuid primary key
code text unique not null
tier text
max_uses integer
used_count integer default 0
expires_at timestamp
created_at timestamp
```

## Research Generation Sections

### Feature Article Output

Required fields:

```txt
title
deck
body
key facts
sources
dossier CTA
related links
```

Article body structure:

```md
# Headline

Opening synthesis paragraph.

## Why this matters

## The technical / market angle

## What the company appears to be building

## Risks and open questions

## The next twelve months

## Sources
```

### Public Profile Output

Required sections:

```md
# Entity Name

## Snapshot

## Overview

## Technical Summary

## Market Position

## Competitive Landscape

## Sources

## Confidence Score
```

### Investor Dossier Output

Required sections:

```md
# Entity Name Research Dossier

## Overview

## Technical Summary

## Technology Stack

## Market Position

## White-Space Analysis

## Competitive Landscape

## Government Relevance

## Patent Position

## TRL / MRL Analysis

## Manufacturing Constraints

## Deployment Constraints

## Supply Chain Dependencies

## Revenue Scenarios

## Commercialization Scenarios

## Risk Modeling

## Capital Intensity

## Regulatory Complexity

## Acquisition Potential

## Strategic Outlook

## Sources

## Confidence Score
```

## Dossier Section Instructions

### Overview

Plain-language summary of what the entity does and why it matters.

### Technical Summary

Explain the technical capability without hype. Include what is confirmed and what is inferred.

### Technology Stack

Break down:

```txt
core technology
materials
hardware
software
sensors
compute
power
thermal systems
communications
manufacturing method
deployment environment
```

### Market Position

Explain:

```txt
target market
customer type
business model
category
market timing
adoption constraints
```

### White-Space Analysis

Identify gaps in the market where no dominant player is visible.

### Competitive Landscape

List direct and adjacent competitors. Separate confirmed competitors from inferred category peers.

### Government Relevance

Map possible relevance to:

```txt
NASA
DARPA
DoD
DOE
NSF
NIH
DHS
Space Force
Air Force
Navy
Army
FEMA
VA
```

Only state relevance as fact if sourced. Otherwise label as inferred.

### Patent Position

Explain:

```txt
known patents
related patents
licensing opportunities
freedom-to-operate unknowns
research lineage
```

### TRL / MRL Analysis

Estimate readiness carefully.

Use language:

```txt
Estimated TRL based on public evidence
Estimated MRL based on public evidence
```

Do not overclaim.

### Manufacturing Constraints

Explain manufacturing risks and constraints.

Examples:

```txt
specialized materials
foundry dependency
precision assembly
environmental testing
certification
quality systems
low-volume production
supplier bottlenecks
```

### Deployment Constraints

Explain what must be true for field deployment.

Examples:

```txt
ruggedization
thermal cycling
power availability
operator training
field maintenance
regulatory approval
integration with existing systems
```

### Supply Chain Dependencies

List key dependencies.

### Revenue Scenarios

Use conservative, base, and aggressive scenarios.

Do not invent precise numbers if sources do not support them. Use ranges and assumptions.

### Commercialization Scenarios

Examples:

```txt
direct enterprise sales
government-first pathway
licensing
OEM integration
joint venture
vertical integration
```

### Risk Modeling

Use categories:

```txt
technical risk
manufacturing risk
regulatory risk
capital intensity
deployment risk
supply chain risk
market adoption risk
competitive risk
```

### Capital Intensity

Classify:

```txt
Low
Moderate
High
Very High
```

Explain why.

### Regulatory Complexity

Classify:

```txt
Low
Moderate
High
Very High
```

Explain why.

### Acquisition Potential

Identify likely strategic acquirer categories, not unsupported specific claims.

### Strategic Outlook

Summarize the investment / commercialization read.

## Charts Data Model

### Risk Radar

```json
{
  "technicalRisk": 7,
  "manufacturingRisk": 8,
  "regulatoryRisk": 5,
  "supplyChainRisk": 6,
  "capitalIntensity": 8,
  "deploymentRisk": 7
}
```

### TRL / MRL

```json
{
  "trl": 4,
  "mrl": 3
}
```

### Revenue Scenarios

```json
[
  { "scenario": "Conservative", "year1": 0.2, "year2": 0.8, "year3": 2.5 },
  { "scenario": "Base", "year1": 0.5, "year2": 2.0, "year3": 7.5 },
  { "scenario": "Aggressive", "year1": 1.0, "year2": 5.0, "year3": 18.0 }
]
```

## Image Pipeline

For each entity/article:

1. Try source OG image
2. Try company logo
3. Try favicon
4. Try screenshot of website hero
5. Generate branded fallback card

Store:

```txt
image_url
image_source
image_credit
fallback_image_theme
```

## Admin Publishing Flow

V1 should support human approval.

Admin actions:

- Review draft article
- Edit article
- Review profile
- Review dossier
- Mark public / private sections
- Publish
- Unpublish
- Assign Today’s Edition rank
- Mark as Top Story
- Add image
- Edit tags

## Homepage Population Logic

Homepage should pull from published content.

Top Stories:

```txt
articles where edition_date = today and is_top_story = true
order by rank ascending
```

Recent Research:

```txt
profiles or dossiers where published_at exists
order by published_at desc
```

My Research:

```txt
saved_research for logged-in user
order by created_at desc
```

Technology Signals:

```txt
computed or seeded sector trend data
```

V1 can use seeded signal data.

## Important Implementation Rule

If automation is incomplete, seed realistic sample data.

The UI should be functional and impressive before the full crawler is built.
