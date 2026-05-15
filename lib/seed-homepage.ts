export type DeepTechlyAnalyst =
  | "Axon Reyes"
  | "Nyra Vale"
  | "Kairo Bell"
  | "Sable Okoro"
  | "Maren Holt"
  | "Ilya Stone"
  | "Talia Voss"
  | "Orin Cross"
  | "Lena Marr"
  | "Daxon Pierce"
  | "Eris Calder"
  | "Nova Mensah";

export type HomepageContentType =
  | "ARTICLE"
  | "PROFILE"
  | "DOSSIER"
  | "PATENT SIGNAL"
  | "GOVERNMENT SIGNAL";

export type HomepageConfidence = "High" | "Moderate" | "Limited";

export type HomepageVisualKind =
  | "chip"
  | "orbit"
  | "robotics"
  | "energy"
  | "materials"
  | "sensing";

export type HomepageStory = {
  id: string;
  rankLabel?: string;
  entityName: string;
  sector: string;
  headline: string;
  dek: string;
  analyst: DeepTechlyAnalyst;
  href: string;
  profileHref?: string;
  dossierHref?: string;
  heroImage?: string | null;
  researchMode?: string;
  tags: string[];
  time: string;
  confidence?: HomepageConfidence;
  sourceCount?: number;
};

export type HomepageArticle = HomepageStory & {
  visual: HomepageVisualKind;
};

export type HomepageResearchItem = {
  id: string;
  entityName: string;
  sector: string;
  status: "DONE" | "IN PROGRESS" | "VERIFYING CLAIMS" | "LIMITED PUBLIC DATA";
  updated: string;
  confidence: HomepageConfidence;
  profileHref: string;
  dossierHref: string;
};

export type TechnologySignal = {
  id: string;
  name: string;
  explanation: string;
  change: string;
};

export type GovernmentSignal = {
  id: string;
  agency: string;
  signal: string;
  href: string;
  sectors: string[];
};

export type PatentSignal = {
  id: string;
  source: string;
  title: string;
  labels: string[];
  href: string;
};

export type WhiteSpaceOpportunity = {
  id: string;
  title: string;
  href: string;
  tags: string[];
};

export type NewsstandItem = {
  id: string;
  type: HomepageContentType;
  title: string;
  entity?: string;
  sector: string;
  analyst: DeepTechlyAnalyst;
  time: string;
  sourceCount: number;
  confidence: HomepageConfidence;
  href: string;
  cta: string;
  gated?: boolean;
};

export type HomepageSector = {
  label: string;
  href: string;
};

export const homepageSeed = {
  topStories: [
    {
      id: "top-latticearc-robotics",
      entityName: "LatticeArc Robotics",
      sector: "Robotics",
      headline: "LatticeArc Robotics's semi-autonomous inspection stack for damaged, remote, or contested sites targets deep-tech bottlenecks",
      dek: "Field robotics systems for inspection and response in constrained infrastructure environments reduce technical readiness, market pressure, and the evidence still needed before the system can be treated as institutional-grade infrastructure.",
      analyst: "Axon Reyes",
      href: "/article/latticearc-robotics",
      tags: ["ROBOTICS", "TRL 6-7", "NORTH AMERICA"],
      time: "21h ago",
      confidence: "Moderate",
      sourceCount: 16
    },
    {
      id: "top-titanym-rf-substrates",
      entityName: "Titanym",
      sector: "Semiconductors",
      headline: "Titanym's sapphire substrate integration for RF, power, and compute packaging targets deep-tech bottlenecks",
      dek: "The public signal around harsh-environment substrates is becoming less about novelty and more about repeatable qualification for RF, power, and compute systems.",
      analyst: "Nyra Vale",
      href: "/article/titanym",
      tags: ["SEMICONDUCTORS", "TRL 4-5", "NORTH AMERICA"],
      time: "4h ago",
      confidence: "Moderate",
      sourceCount: 14
    },
    {
      id: "top-helioforge-thermal",
      entityName: "HelioForge Systems",
      sector: "Energy",
      headline: "HelioForge Systems's modular high-temperature process heat modules for industrial sites",
      dek: "Long-duration heat storage and process modules are starting to look like infrastructure, not a narrow climate-tech subplot.",
      analyst: "Kairo Bell",
      href: "/article/helioforge-systems",
      tags: ["ENERGY", "TRL 4-5", "NORTH AMERICA"],
      time: "8h ago",
      confidence: "Limited",
      sourceCount: 9
    },
    {
      id: "top-cislunar-optics",
      entityName: "Orbital Optics Labs",
      sector: "Space",
      headline: "Orbital Optics Labs's high-data-rate optical terminals for LEO and cislunar networks",
      dek: "The market signal is not just bandwidth; it is deployment, servicing, radiation tolerance, and operational replacement cycles.",
      analyst: "Talia Voss",
      href: "/sector/space",
      tags: ["SPACE", "TRL 6-7", "GLOBAL"],
      time: "8h ago",
      confidence: "Moderate",
      sourceCount: 12
    }
  ] satisfies HomepageStory[],

  alsoReading: [
    {
      id: "also-darpa-nom4d",
      entityName: "DARPA NOM4D",
      sector: "Defense",
      headline: "Resilient navigation programs keep moving toward edge deployment",
      dek: "Government demand is emphasizing contested operation and machine-readable validation trails.",
      analyst: "Talia Voss",
      href: "/sector/defense",
      tags: ["DEFENSE", "AUTONOMY"],
      time: "9h ago",
      confidence: "Moderate",
      sourceCount: 10
    },
    {
      id: "also-nasa-manufacturing",
      entityName: "NASA technology transfer",
      sector: "Space",
      headline: "In-space manufacturing is becoming a materials qualification problem",
      dek: "The technical question is whether orbital fabrication can meet mission assurance expectations.",
      analyst: "Maren Holt",
      href: "/patents",
      tags: ["NASA", "MATERIALS"],
      time: "10h ago",
      confidence: "High",
      sourceCount: 18
    },
    {
      id: "also-gan-rf",
      entityName: "GaN semiconductors",
      sector: "Semiconductors",
      headline: "Power and RF GaN demand is pulling packaging scrutiny forward",
      dek: "Device-level performance claims increasingly require supply-chain and thermal evidence.",
      analyst: "Nyra Vale",
      href: "/sector/semiconductors",
      tags: ["GAN", "RF SYSTEMS"],
      time: "11h ago",
      confidence: "High",
      sourceCount: 15
    },
    {
      id: "also-ocean-inspection",
      entityName: "Uncrewed maritime inspection",
      sector: "Ocean Systems",
      headline: "Maritime autonomy moves into inspection and persistence use cases",
      dek: "The buyer need is operational endurance in harsh, low-visibility environments.",
      analyst: "Nova Mensah",
      href: "/sector/ocean-systems",
      tags: ["OCEAN SYSTEMS", "AUTONOMY"],
      time: "12h ago",
      confidence: "Limited",
      sourceCount: 7
    },
    {
      id: "also-nano-forge",
      entityName: "Nano Forge Labs",
      sector: "Materials",
      headline: "Nano Forge Labs develops next-gen high-temp ceramic composites",
      dek: "Materials qualification remains a central watch item for high-temperature systems.",
      analyst: "Daxon Pierce",
      href: "/sector/materials",
      tags: ["MATERIALS", "CERAMICS"],
      time: "9h ago",
      confidence: "Limited",
      sourceCount: 7
    },
    {
      id: "also-rad-edge-compute",
      entityName: "Radiation-tolerant edge compute",
      sector: "Space",
      headline: "Edge compute for orbit is turning into a packaging and thermal race",
      dek: "The strongest signal is where radiation tolerance, power draw, and maintainability intersect.",
      analyst: "Daxon Pierce",
      href: "/sector/space",
      tags: ["SPACE", "COMPUTE"],
      time: "13h ago",
      confidence: "Moderate",
      sourceCount: 9
    }
  ] satisfies HomepageStory[],

  latestArticles: [
    {
      id: "latest-high-temp-electronics",
      entityName: "Extreme environment electronics",
      sector: "Semiconductors",
      headline: "The race for high-temperature electronics in extreme operating environments",
      dek: "Public signals point to a more serious qualification window for electronics that can operate through heat, vibration, and mission-critical stress.",
      analyst: "Eris Calder",
      href: "/articles",
      tags: ["SEMICONDUCTORS", "TRL 4-5", "DEFENSE"],
      time: "6h ago",
      confidence: "Moderate",
      sourceCount: 12,
      visual: "chip"
    },
    {
      id: "latest-orbital-servicing",
      entityName: "Orbital servicing",
      sector: "Space",
      headline: "Orbital servicing: the next infrastructure layer of cislunar operations",
      dek: "The servicing layer around satellites, depots, and cislunar assets is moving from mission concept into infrastructure thesis.",
      analyst: "Orin Cross",
      href: "/sector/space",
      tags: ["SPACE", "ROBOTICS", "INFRASTRUCTURE"],
      time: "8h ago",
      confidence: "Moderate",
      sourceCount: 10,
      visual: "orbit"
    },
    {
      id: "latest-industrial-inspection",
      entityName: "Industrial inspection robots",
      sector: "Robotics",
      headline: "Industrial inspection robots enter the age of autonomy and reliability",
      dek: "Field robotics is becoming a trust problem: environmental tolerance, repeatable autonomy, and integration into operations.",
      analyst: "Sable Okoro",
      href: "/article/latticearc-robotics",
      tags: ["ROBOTICS", "ENERGY", "INDUSTRIAL"],
      time: "11h ago",
      confidence: "Moderate",
      sourceCount: 16,
      visual: "robotics"
    },
    {
      id: "latest-thermal-storage",
      entityName: "Thermal storage",
      sector: "Energy",
      headline: "Thermal storage innovation for grid under stress",
      dek: "Industrial heat and grid storage are converging around durability, cheap materials, and deployment evidence.",
      analyst: "Ilya Stone",
      href: "/article/helioforge-systems",
      tags: ["ENERGY", "GRID", "STORAGE"],
      time: "13h ago",
      confidence: "Limited",
      sourceCount: 9,
      visual: "energy"
    }
  ] satisfies HomepageArticle[],

  myResearch: [
    {
      id: "research-titanym",
      entityName: "Titanym",
      sector: "Semiconductors",
      status: "DONE",
      updated: "Updated 4h ago",
      confidence: "High",
      profileHref: "/startup/titanym",
      dossierHref: "/dossier/titanym"
    },
    {
      id: "research-helioforge",
      entityName: "HelioForge Systems",
      sector: "Energy",
      status: "IN PROGRESS",
      updated: "Updated 6h ago",
      confidence: "Moderate",
      profileHref: "/startup/helioforge-systems",
      dossierHref: "/dossier/helioforge-systems"
    },
    {
      id: "research-orbital-optics",
      entityName: "Orbital Optics Labs",
      sector: "Space",
      status: "DONE",
      updated: "Updated 8h ago",
      confidence: "Moderate",
      profileHref: "/sector/space",
      dossierHref: "/research"
    },
    {
      id: "research-darpa-nom4d",
      entityName: "DARPA NOM4D",
      sector: "Defense",
      status: "VERIFYING CLAIMS",
      updated: "Updated 9h ago",
      confidence: "Moderate",
      profileHref: "/sector/defense",
      dossierHref: "/research"
    },
    {
      id: "research-nano-forge",
      entityName: "Nano Forge Labs",
      sector: "Materials",
      status: "LIMITED PUBLIC DATA",
      updated: "Updated 10h ago",
      confidence: "Limited",
      profileHref: "/sector/materials",
      dossierHref: "/research"
    },
    {
      id: "research-sige-sapphire",
      entityName: "SiGe on Sapphire",
      sector: "Semiconductors",
      status: "IN PROGRESS",
      updated: "Updated 11h ago",
      confidence: "Moderate",
      profileHref: "/sector/semiconductors",
      dossierHref: "/research"
    }
  ] satisfies HomepageResearchItem[],

  technologySignals: [
    {
      id: "signal-space-robotics",
      name: "Space robotics",
      explanation: "Increasing funding and commercial activity",
      change: "+42%"
    },
    {
      id: "signal-gan",
      name: "GaN semiconductors",
      explanation: "Power and RF GaN demand accelerating",
      change: "+18%"
    },
    {
      id: "signal-autonomous-manufacturing",
      name: "Autonomous manufacturing",
      explanation: "Factory autonomy adoption rising",
      change: "+27%"
    },
    {
      id: "signal-orbital-optical-comms",
      name: "Orbital optical communications",
      explanation: "High-bandwidth LEO links gaining attention",
      change: "+31%"
    },
    {
      id: "signal-high-temp-electronics",
      name: "High-temperature electronics",
      explanation: "Extreme-environment electronics demand",
      change: "+22%"
    },
    {
      id: "signal-battery-free-sensing",
      name: "Battery-free sensing",
      explanation: "Energy-harvesting and passive sensing",
      change: "+16%"
    }
  ] satisfies TechnologySignal[],

  governmentSignals: [
    {
      id: "gov-darpa-maritime",
      agency: "DARPA",
      signal: "Autonomous maritime sensing systems",
      href: "/sector/defense",
      sectors: ["DEFENSE", "SENSORS"]
    },
    {
      id: "gov-nasa-manufacturing",
      agency: "NASA",
      signal: "In-space manufacturing technology transfer",
      href: "/patents",
      sectors: ["SPACE", "MATERIALS"]
    },
    {
      id: "gov-doe-storage",
      agency: "DOE",
      signal: "Long-duration thermal storage",
      href: "/sector/energy",
      sectors: ["ENERGY", "GRID"]
    },
    {
      id: "gov-space-force-cislunar",
      agency: "Space Force",
      signal: "Cislunar domain awareness",
      href: "/sector/space",
      sectors: ["SPACE", "DEFENSE"]
    },
    {
      id: "gov-navy-maritime",
      agency: "Navy",
      signal: "Uncrewed maritime inspection",
      href: "/sector/ocean-systems",
      sectors: ["OCEAN SYSTEMS", "ROBOTICS"]
    }
  ] satisfies GovernmentSignal[],

  patentSignals: [
    {
      id: "patent-nasa-sige",
      source: "NASA",
      title: "SiGe on sapphire substrate integration",
      labels: ["PUBLIC SIGNAL", "HIGH RELEVANCE"],
      href: "/patents"
    },
    {
      id: "patent-darpa-assembly",
      source: "DARPA",
      title: "Adaptive autonomous assembly systems",
      labels: ["PUBLIC SIGNAL", "MODERATE RELEVANCE"],
      href: "/patents"
    },
    {
      id: "patent-doe-thermal",
      source: "DOE",
      title: "Long-duration thermal storage materials",
      labels: ["PUBLIC SIGNAL", "HIGH RELEVANCE"],
      href: "/patents"
    },
    {
      id: "patent-nasa-sensing",
      source: "NASA",
      title: "Battery-free wireless sensing nodes",
      labels: ["PUBLIC SIGNAL", "MODERATE RELEVANCE"],
      href: "/patents"
    }
  ] satisfies PatentSignal[],

  whiteSpaceOpportunities: [
    {
      id: "opportunity-orbital-debris",
      title: "Orbital debris robotics",
      href: "/sector/space",
      tags: ["SPACE", "ROBOTICS"]
    },
    {
      id: "opportunity-hot-packaging",
      title: "High-temperature semiconductor packaging",
      href: "/sector/semiconductors",
      tags: ["SEMICONDUCTORS", "PACKAGING"]
    },
    {
      id: "opportunity-battery-free-sensing",
      title: "Battery-free infrastructure sensing",
      href: "/sector/sensors",
      tags: ["SENSORS", "INFRASTRUCTURE"]
    },
    {
      id: "opportunity-inspection-swarms",
      title: "Autonomous industrial inspection swarms",
      href: "/sector/robotics",
      tags: ["ROBOTICS", "INDUSTRIAL"]
    },
    {
      id: "opportunity-rad-edge-compute",
      title: "Radiation-tolerant edge compute",
      href: "/sector/space",
      tags: ["SPACE", "COMPUTE"]
    },
    {
      id: "opportunity-thermal-small-sats",
      title: "Thermal management for small satellites",
      href: "/sector/space",
      tags: ["SPACE", "THERMAL"]
    }
  ] satisfies WhiteSpaceOpportunity[],

  newsstand: [
    {
      id: "newsstand-rf-substrates",
      type: "ARTICLE",
      title: "Next-gen RF substrates for extreme environments",
      entity: "SiGe on Sapphire",
      sector: "Semiconductors",
      analyst: "Nyra Vale",
      time: "4h ago",
      sourceCount: 12,
      confidence: "Moderate",
      href: "/articles",
      cta: "READ ARTICLE"
    },
    {
      id: "newsstand-titanym-profile",
      type: "PROFILE",
      title: "Titanym",
      sector: "Semiconductors",
      analyst: "Axon Reyes",
      time: "5h ago",
      sourceCount: 14,
      confidence: "High",
      href: "/startup/titanym",
      cta: "OPEN PROFILE"
    },
    {
      id: "newsstand-helioforge-dossier",
      type: "DOSSIER",
      title: "HelioForge Systems",
      sector: "Energy",
      analyst: "Kairo Bell",
      time: "5h ago",
      sourceCount: 9,
      confidence: "Moderate",
      href: "/dossier/helioforge-systems",
      cta: "OPEN DOSSIER",
      gated: true
    },
    {
      id: "newsstand-sige-signal",
      type: "PATENT SIGNAL",
      title: "SiGe on sapphire integration",
      sector: "NASA",
      analyst: "Kairo Bell",
      time: "6h ago",
      sourceCount: 8,
      confidence: "High",
      href: "/patents",
      cta: "VIEW SIGNAL"
    },
    {
      id: "newsstand-darpa-nom4d",
      type: "ARTICLE",
      title: "DARPA NOM4D: resilient navigation at the edge",
      sector: "Defense",
      analyst: "Talia Voss",
      time: "7h ago",
      sourceCount: 10,
      confidence: "Moderate",
      href: "/sector/defense",
      cta: "READ ARTICLE"
    },
    {
      id: "newsstand-orbital-profile",
      type: "PROFILE",
      title: "Orbital Optics Labs",
      sector: "Space",
      analyst: "Orin Cross",
      time: "8h ago",
      sourceCount: 12,
      confidence: "Moderate",
      href: "/sector/space",
      cta: "OPEN PROFILE"
    },
    {
      id: "newsstand-orbital-dossier",
      type: "DOSSIER",
      title: "Orbital Optics Labs",
      sector: "Space",
      analyst: "Orin Cross",
      time: "8h ago",
      sourceCount: 12,
      confidence: "Moderate",
      href: "/research",
      cta: "OPEN DOSSIER",
      gated: true
    },
    {
      id: "newsstand-assembly-signal",
      type: "PATENT SIGNAL",
      title: "Adaptive autonomous assembly systems",
      sector: "DARPA",
      analyst: "Eris Calder",
      time: "9h ago",
      sourceCount: 6,
      confidence: "Moderate",
      href: "/patents",
      cta: "VIEW SIGNAL"
    },
    {
      id: "newsstand-nasa-manufacturing",
      type: "GOVERNMENT SIGNAL",
      title: "NASA in-space manufacturing challenge",
      sector: "NASA",
      analyst: "Maren Holt",
      time: "10h ago",
      sourceCount: 11,
      confidence: "High",
      href: "/patents",
      cta: "VIEW SIGNAL"
    },
    {
      id: "newsstand-industrial-heat",
      type: "ARTICLE",
      title: "Industrial heat modules for grid and industry",
      sector: "Energy",
      analyst: "Ilya Stone",
      time: "11h ago",
      sourceCount: 9,
      confidence: "Limited",
      href: "/article/helioforge-systems",
      cta: "READ ARTICLE"
    },
    {
      id: "newsstand-nano-forge",
      type: "PROFILE",
      title: "Nano Forge Labs",
      sector: "Materials",
      analyst: "Daxon Pierce",
      time: "12h ago",
      sourceCount: 7,
      confidence: "Limited",
      href: "/sector/materials",
      cta: "OPEN PROFILE"
    },
    {
      id: "newsstand-battery-free",
      type: "PATENT SIGNAL",
      title: "Battery-free wireless sensing nodes",
      sector: "NASA",
      analyst: "Lena Marr",
      time: "13h ago",
      sourceCount: 8,
      confidence: "Moderate",
      href: "/patents",
      cta: "VIEW SIGNAL"
    }
  ] satisfies NewsstandItem[],

  sectors: [
    { label: "Space", href: "/sector/space" },
    { label: "Aerospace", href: "/sector/aerospace" },
    { label: "Defense", href: "/sector/defense" },
    { label: "Robotics", href: "/sector/robotics" },
    { label: "Autonomy", href: "/sector/autonomy" },
    { label: "Energy", href: "/sector/energy" },
    { label: "Semiconductors", href: "/sector/semiconductors" },
    { label: "Photonics", href: "/sector/photonics" },
    { label: "Materials", href: "/sector/materials" },
    { label: "Sensors", href: "/sector/sensors" },
    { label: "Manufacturing", href: "/sector/manufacturing" },
    { label: "Bioinfrastructure", href: "/sector/bioinfrastructure" },
    { label: "Quantum", href: "/sector/quantum" },
    { label: "Climate Systems", href: "/sector/climate-systems" },
    { label: "Nuclear", href: "/sector/nuclear" },
    { label: "Ocean Systems", href: "/sector/ocean-systems" }
  ] satisfies HomepageSector[]
};
