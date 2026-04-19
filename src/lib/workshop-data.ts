import type { StageInfo, PollQuestion, SharkProject, LegoCard, StressTest, WarmUpQuestion, ConceptCard, FacilitatorStep, AgentSimStep, SimulationStep, WhatIfScenario, CrisisAgent, SimCheckpoint } from "./types";

export const stages: StageInfo[] = [
  {
    id: 1,
    title: "The Awakening",
    subtitle: "Moment of insight",
    time: "13:00 – 13:45",
    durationMin: 45,
    icon: "⚡",
    description:
      'Break the old idea that "AI is just a chatbot" and feel how Agentic AI can reason and execute.',
    videoTitle: "Before you ask AI, ask yourself three questions",
    videoUrl: "/videos/stage1_before_you_ask_ai.mp4",
    videoStart: 0,
    videoEnd: 211,
    videoQuote:
      "CCF is not about writing better prompts — it's about defining better decisions. AI generates text that looks like truth. Your job is to verify.",
    videoQuoteCn:
      "CCF is not about writing prompts—it is about defining decisions. AI does not output truth; it outputs text that looks like truth. Your job is to verify.",
    videoSpeaker: "Decision Intelligence Briefing",
    openingScript:
      "The video made one core point—before you open an AI tool, ask three questions: What decision am I making? What options exist? What evidence would change my mind? Stage 1 starts here. You will learn CCF, see hallucinations firsthand, and contrast chatbots with Agentic AI.",
    participantNote:
      "Focus: experience chatbot-style AI first, then watch Agentic AI plan, call tools, and close the loop—understand the gap.",
    beforeAfter: {
      before: "One S&OP exception review took 2–3 days with five people manually consolidating data",
      after: "AI drafts a full analysis in ~30 minutes; humans review and decide",
    },
    gameName: "Million-Dollar Prompt Challenge",
    gameDurationMin: 25,
    debriefQuestion:
      "Of the three prompts you wrote, which worked best—and why? More context, tighter constraints, or clearer format?",
    learningOutcomes: [
      "Write strong instructions with CCF (Context + Constraints + Format)",
      "Spot hallucinations and know when not to trust model output",
      "Contrast chatbots vs Agentic AI—reactive answers vs proactive execution",
    ],
  },
  {
    id: 2,
    title: "Demystifying the Tech",
    subtitle: "Seeing the stack clearly",
    time: "13:45 – 14:30",
    durationMin: 45,
    icon: "🔧",
    description:
      "Use simple physical props so non-technical leaders grasp how MCP and SAP HANA let AI land in the enterprise.",
    videoTitle: "The four-layer foundation behind the magic",
    videoUrl: "/videos/stage2_four_layers.mp4",
    videoStart: 0,
    videoEnd: 260,
    videoQuote:
      "AI is not magic, it's engineering. And the first lesson of engineering is: if the foundation is unstable, nothing you build on top will stand.",
    videoQuoteCn:
      "AI is engineering, not magic. Lesson one: shaky foundations mean nothing above stands. Without MCP, you are handing DB passwords to an intern.",
    videoSpeaker: "Decision Intelligence Briefing",
    openingScript:
      "The video stressed that enterprise AI is four layers, not one tool. Data is the heart, MCP is the gate, the LLM is the brain, Agents are the hands. Next you will assemble the four blocks, run the simulation, and stress-test each layer with What-If.",
    participantNote:
      "Focus: build HANA→MCP→LLM→Agent, run the flow, and use What-If tests to see why each layer matters.",
    beforeAfter: {
      before: "Data scattered across SAP, Excel, and email—hours to consolidate manually",
      after: "MCP connects live data so AI can read the enterprise and generate insight",
    },
    gameName: "AI Architecture LEGO",
    gameDurationMin: 25,
    debriefQuestion:
      "In the architecture you built, where is Lumitech farthest today—dirty data, blocked interfaces, or culture that will not let Agents execute?",
    learningOutcomes: [
      "Sketch HANA→MCP→LLM→Agent and explain each layer",
      "Explain why MCP is the safety hinge for enterprise AI",
      "Judge how data quality disasters break AI decisions",
    ],
  },
  {
    id: 3,
    title: "Crisis War Room",
    subtitle: "Crisis rescue sprint",
    time: "14:45 – 15:45",
    durationMin: 60,
    icon: "🚨",
    description:
      "Multiple crises hit at once—use Agentic AI to draft an S&OP rescue plan in 15 minutes and evolve from responder to orchestrator.",
    videoTitle: "AI analyzes; humans judge—never flip that",
    videoUrl: "/videos/stage3_ai_analyzes_you_decide.mp4",
    videoStart: 0,
    videoEnd: 319,
    videoQuote:
      "AI analyzes, humans judge — never reverse this. If you wouldn't rubber-stamp an intern's recommendation, don't rubber-stamp AI's either.",
    videoQuoteCn:
      "AI analyzes; humans judge—never reverse. If you would not rubber-stamp an intern, do not rubber-stamp AI.",
    videoSpeaker: "Decision Intelligence Briefing",
    openingScript:
      "The video warned about Automation Bias—the prettier and more confident the output, the easier it is to accept without review. This stage lets you feel it: analyze with AI, lock your decision, then run three specialist Agents. When they disagree, do you change or hold the line?",
    participantNote:
      "Focus: decide with AI support, then orchestrate three Agents. They may conflict—you must justify approvals. Compare your first call to the Agent readout: what did AI really change?",
    beforeAfter: {
      before: "Crisis response relied on experience and calls—2–3 days for a first plan",
      after: "AI fuses global data in minutes and surfaces multiple contingency options for humans to choose",
    },
    gameName: "Agent Command Center · Crisis Rescue",
    gameDurationMin: 35,
    debriefQuestion:
      "Did Agents change your initial plan? If yes—was it new information or just polish? If no—did you verify, or ignore dissent?",
    learningOutcomes: [
      "Orchestrate multiple Agents through a complex crisis and handle conflicts",
      "Separate new signal from professional-looking packaging—avoid Automation Bias",
      "Decide under time pressure with evidence, not vibes",
    ],
  },
  {
    id: 4,
    title: "Action & Outlook",
    subtitle: "From ideas to action",
    time: "15:45 – 16:45",
    durationMin: 60,
    icon: "🚀",
    description:
      "Move from ideas to reality—within budget and talent limits, decide which AI bets to fund first and draft a crisp action plan.",
    videoTitle: "The costliest decision is doing nothing",
    videoUrl: "/videos/stage4_cost_of_inaction.mp4",
    videoStart: 0,
    videoEnd: 235,
    videoQuote:
      "Sometimes the most expensive mistake isn't investing in the wrong project — it's investing in nothing at all.",
    videoQuoteCn:
      "Sometimes the priciest mistake is not a bad bet—it is betting nothing. Sequencing matters: find the step that unlocks the most optionality.",
    videoSpeaker: "Decision Intelligence Briefing",
    openingScript:
      "The video flagged two traps—only safe Quick Wins, or only flashy moonshots. This stage is not just picking a project—it is decision hygiene: define criteria before options, write voting rules before chips, then audit bias.",
    participantNote:
      "Focus: standards before projects, principles before votes. After results, run a bias audit—did you vote data or gut?",
    beforeAfter: {
      before: "AI picks followed vendor hype and intuition—no quant frame",
      after: "Blend business priority, data readiness, and ROI to score each opportunity",
    },
    gameName: "Shark Tank Investment Game",
    gameDurationMin: 35,
    debriefQuestion:
      "Did your written \"what would change my mind\" actually change your vote? Which bias-audit question stung most—that discomfort is the lesson.",
    learningOutcomes: [
      "Set criteria before evaluating options—avoid confirmation bias",
      "Prioritize AI bets with reversibility, readiness, and ROI",
      "Spot cognitive traps (halo, herd, sunk cost) in a bias audit",
    ],
  },
];

export const pollQuestions: PollQuestion[] = [
  {
    stageId: 1,
    question: "After steering a frontier model hands-on, what resonates most?",
    options: [
      {
        id: "A",
        label: "Excited: the reasoning blew me away—I want this in my team now.",
        emoji: "🚀",
      },
      {
        id: "B",
        label: "Anxious: feeding company secrets feels risky.",
        emoji: "🔒",
      },
      {
        id: "C",
        label: "Humbled: I need to level up my prompting skills.",
        emoji: "🎯",
      },
    ],
  },
  {
    stageId: 2,
    question:
      "To reach the intelligent loop we just built, what is Lumitech's hardest gap?",
    options: [
      {
        id: "A",
        label:
          "🫀 Data (HANA): master data is messy—garbage in, garbage out.",
        emoji: "🫀",
      },
      {
        id: "B",
        label: "🔌 Interfaces (MCP): silos across teams/systems block connectivity.",
        emoji: "🔌",
      },
      {
        id: "C",
        label: "🤖 Culture (Agent): leaders fear autonomy—everything needs manual sign-off.",
        emoji: "🤖",
      },
    ],
  },
  {
    stageId: 3,
    question:
      "If Lumitech faced this crisis tomorrow, what worries you most?",
    options: [
      {
        id: "A",
        label: "AI proposes the \"best\" plan, but leaders won't trust or use it.",
        emoji: "🔒",
      },
      {
        id: "B",
        label: "Our data cannot support real-time AI—if data is stale, decisions are stale.",
        emoji: "📉",
      },
      {
        id: "C",
        label: "No one knows how to instruct AI—tools without skill equal no tools.",
        emoji: "🧑‍💻",
      },
    ],
  },
  {
    stageId: 4,
    question:
      "To advance the priority you voted for, what is your first move back at the desk?",
    options: [
      {
        id: "A",
        label:
          "Clean Core: start cleansing core/master data in my function.",
        emoji: "🧹",
      },
      {
        id: "B",
        label: "Team upskilling: run AI/prompting basics for the team.",
        emoji: "📚",
      },
      {
        id: "C",
        label:
          "Process mapping: document flows and red lines AI must never cross.",
        emoji: "🗺️",
      },
    ],
  },
];

export const sharkProjects: SharkProject[] = [
  {
    id: "copilot",
    name: "Reporting Copilot",
    type: "Quick Win",
    description:
      "Query HANA in natural language and auto-build daily/weekly supply reports with anomaly digests.",
    plainDescription:
      "No SQL, no IT ticket—ask in plain language which SKUs were short in East China last week; AI returns the table and narrative.",
    icon: "📊",
    cost: "€80K",
    costValue: 80,
    timeline: "6 weeks",
    risk: "Low",
    prerequisites: "HANA read access and standardized report templates",
    expectedBenefits: "~10 leadership hours saved weekly on reporting; 50% faster exception response",
    targetTeams: "All teams (Demand, Supply, Order Desk, Logistics)",
    mondayAction: "Ask IT for read-only HANA access; inventory current report catalog",
  },
  {
    id: "order-parse",
    name: "Multimodal order intake",
    type: "Quick Win",
    description:
      "Parse PDFs, emails, and images into structured orders automatically.",
    plainDescription:
      "Customer PDFs, attachments, even photos of handwritten POs—AI extracts fields and posts them without manual keying.",
    icon: "📄",
    cost: "€120K",
    costValue: 120,
    timeline: "8 weeks",
    risk: "Low",
    prerequisites: "Collect 200+ historical order samples for training",
    expectedBenefits: "~70% faster order entry; human error <2%",
    targetTeams: "Order Desk primary; Demand Planning benefits",
    mondayAction: "Export last 3 months of order attachments from mail; tag by type",
  },
  {
    id: "digital-twin",
    name: "End-to-end digital twin",
    type: "Strategic Bet",
    description:
      "Model the full chain for what-if resilience testing.",
    plainDescription:
      "A virtual twin of the real network—simulate plant shutdowns or +30% freight without touching operations.",
    icon: "🌐",
    cost: "€500K+",
    costValue: 500,
    timeline: "6–9 months",
    risk: "High",
    prerequisites: "E2E process mapping, historical data cleansing, infra upgrades",
    expectedBenefits: "What-if cycles drop from days to ~10 minutes; step-change in resilience insight",
    targetTeams: "Supply Planning leads; cross-functional",
    mondayAction: "Kick off E2E mapping; name a Data Champion",
    dependencies: ["copilot"],
    conflicts: ["dynamic-routing"],
  },
  {
    id: "auto-replenish",
    name: "Self-healing replenishment agent",
    type: "Strategic Bet",
    description:
      "Detect stock exceptions and trigger replenishment with dynamic supplier switching.",
    plainDescription:
      "When stock dips below safety, AI picks the best supplier PO and can failover to alternates—a 24/7 replen clerk.",
    icon: "🤖",
    cost: "€350K",
    costValue: 350,
    timeline: "4–6 months",
    risk: "Medium",
    prerequisites: "Clean Core for master/material data + MCP endpoints live",
    expectedBenefits: "Stockouts −30–40%; safety stock −15%",
    targetTeams: "Supply Planning + Logistics",
    mondayAction: "Run master-data QA on top 50 SKUs",
    dependencies: ["copilot"],
  },
  {
    id: "dynamic-routing",
    name: "Dynamic routing & dispatch",
    type: "Strategic Bet",
    description:
      "Optimize lanes using live traffic, weather, and warehouse status.",
    plainDescription:
      "AI picks fastest/cheapest routes per shipment and reroutes on disruption.",
    icon: "🛣️",
    cost: "€400K",
    costValue: 400,
    timeline: "5–8 months",
    risk: "Medium",
    prerequisites: "Logistics APIs, GPS feeds, WMS connectivity",
    expectedBenefits: "Logistics cost −8–12%; on-time delivery +15%",
    targetTeams: "Logistics leads",
    mondayAction: "Shortlist logistics API vendors; assess GPS feasibility",
    dependencies: ["order-parse"],
    conflicts: ["digital-twin"],
  },
  {
    id: "compliance-scan",
    name: "Supplier compliance scanner",
    type: "Quick Win",
    description:
      "Crawl public signals and score supplier compliance risk with alerts.",
    plainDescription:
      "AI watches news, disputes, and financials for every supplier—early warning instead of late surprise.",
    icon: "🛡️",
    cost: "€60K",
    costValue: 60,
    timeline: "4 weeks",
    risk: "Low",
    prerequisites: "Define scoring rubric and supplier universe",
    expectedBenefits: "Compliance reviews from 2 weeks to 2 days; 100% coverage",
    targetTeams: "Supply Planning (supplier management)",
    mondayAction: "Pull full supplier list and current compliance policy from procurement",
  },
];

export const legoCards: LegoCard[] = [
  {
    id: "hana",
    label: "SAP HANA",
    icon: "🫀",
    color: "#ef4444",
    isDistractor: false,
    description: "Enterprise data hub—orders, inventory, suppliers, logistics",
    dataRole: "Data source",
    inputs: "Business transactions write in",
    outputs: "Structured query results",
  },
  {
    id: "mcp",
    label: "MCP connector",
    icon: "🔌",
    color: "#f97316",
    isDistractor: false,
    description: "Model Context Protocol—standard interface for safe reads/writes",
    dataRole: "Connector",
    inputs: "AI data requests / action commands",
    outputs: "Formatted enterprise data / confirmations",
  },
  {
    id: "llm",
    label: "Large Language Model (LLM)",
    icon: "🧠",
    color: "#94a3b8",
    isDistractor: false,
    description: "Reasoning engine—language, analysis, recommendations",
    dataRole: "Reasoning",
    inputs: "Structured data + user instructions",
    outputs: "Analysis / plans / generated text",
  },
  {
    id: "agent",
    label: "AI Agent",
    icon: "🤖",
    color: "#f59e0b",
    isDistractor: false,
    description: "Orchestrator—plans steps and calls tools end-to-end",
    dataRole: "Orchestration",
    inputs: "User goals / LLM conclusions",
    outputs: "Actions (email, stock moves, workflows)",
  },
  {
    id: "excel",
    label: "Excel reports",
    icon: "📊",
    color: "#6b7280",
    isDistractor: true,
    description: "Legacy—manual builds, stale files, version chaos",
    dataRole: "Distractor",
    inputs: "Manual typing",
    outputs: "Static spreadsheets",
  },
  {
    id: "wechat",
    label: "Chat groups",
    icon: "💬",
    color: "#6b7280",
    isDistractor: true,
    description: "Unstructured chat—fragmented, unauditable",
    dataRole: "Distractor",
    inputs: "Human messages",
    outputs: "Human replies",
  },
];

export const GAME1_SCENARIO = {
  title: "Sudden crisis",
  description:
    "Overnight, a country slaps 60% tariffs on a core component while our largest Tier-1 supplier's port is shut by strikes.",
  task: "In 15 minutes, prompt AI to deliver a restructuring brief with alt-supplier picks, stock moves, and cost estimates.",
  rules: [
    "Each team may submit only three prompts to the model",
    "Pack Context, Constraints, and Format in each prompt",
    "The most actionable plan without hallucinations wins",
  ],
  briefing: {
    company: {
      title: "Company snapshot",
      items: [
        { label: "Company", value: "Lumitech (global lighting leader)" },
        { label: "Hero products", value: "BeamLink connected streetlights, Aura smart lamps" },
        { label: "Plants", value: "China (Shanghai), India, Poland, Indonesia" },
        { label: "Revenue", value: "~€6.9B" },
      ],
    },
    suppliers: {
      title: "Impacted suppliers",
      items: [
        { name: "Alpha Semicon (Vietnam)", status: "🔴 Port strike — full stop", share: "45% supply", component: "LED driver ICs" },
        { name: "Beta Optics (Korea)", status: "🟡 Running but capacity tight", share: "30% supply", component: "Optics modules" },
        { name: "Gamma Electric (Mexico)", status: "🟢 Normal ops", share: "25% supply", component: "Power management ICs" },
      ],
    },
    inventory: {
      title: "Current inventory",
      items: [
        { label: "LED driver ICs", value: "Covers ~18 days of production", status: "warning" },
        { label: "Optics modules", value: "Covers ~30 days", status: "ok" },
        { label: "PMICs", value: "Covers ~25 days", status: "ok" },
        { label: "Finished goods (Shanghai DC)", value: "~12k units", status: "ok" },
        { label: "Finished goods (EU DC)", value: "~8k units", status: "ok" },
      ],
    },
    constraints: {
      title: "Key constraints",
      items: [
        "New supplier qualification typically needs 4–8 weeks",
        "Customer SLA: ship delays cannot exceed 5 business days",
        "Extra quarterly cost must stay within +15% (~€2.5M cap)",
        "LED driver cover below 14 days triggers Red Alert",
        "Must also protect Q3 EU B2C peak builds",
      ],
    },
  },
};

export const GAME2_SCENARIO = {
  title: "VIP order delay",
  description:
    "A VIP order slipped three days because of weather. Design an AI flow that reassures the customer and reschedules shipment.",
  hint: "Which component owns inventory and orders? How does data reach AI? Who executes after the model suggests?",
  challenge: "Watch the distractors—not every tile belongs in the intelligent loop.",
  validationCriteria: [
    { id: "data-source", label: "Data source", desc: "Show a clear enterprise source of truth", icon: "💾" },
    { id: "connector", label: "Safe connect", desc: "AI must not raw-connect to the database", icon: "🔗" },
    { id: "reasoning", label: "Reasoning", desc: "Need semantic understanding and analysis", icon: "🧠" },
    { id: "execution", label: "Execution", desc: "Analysis must close the loop with an actor", icon: "⚡" },
  ],
  designQuestions: [
    "Where does data originate, and why that source?",
    "How does AI reach enterprise data safely—what sits in between?",
    "When AI proposes an action, who turns suggestion into execution?",
    "Which tiles did you exclude, and why are they out of the loop?",
  ],
  stressTests: [
    {
      id: "no-mcp",
      scenario: "Remove MCP and let AI hit the database directly",
      question: "What breaks?",
      options: [
        { id: "a", label: "Nothing—fewer hops is faster", correct: false },
        { id: "b", label: "Security risk: AI might run dangerous SQL (e.g., deletes)", correct: true },
        { id: "c", label: "Only formatting issues—minor", correct: false },
      ],
      insight: "MCP is the guardrail—controls read/write/execute. Without it, AI is an intern with every password.",
    },
    {
      id: "no-agent",
      scenario: "LLM only—no Agent",
      question: "Can the VIP delay still be handled automatically?",
      options: [
        { id: "a", label: "Yes—the LLM can analyze and execute", correct: false },
        { id: "b", label: "LLM can analyze, but nothing sends mail or updates orders", correct: true },
        { id: "c", label: "Agents are optional polish", correct: false },
      ],
      insight: "LLM is the brain; Agent is the hands. Without Agents you get advice, not shipped parcels—advisor downgrades to report generator.",
    },
    {
      id: "dirty-data",
      scenario: "HANA inventory has not refreshed for three days",
      question: "What happens?",
      options: [
        { id: "a", label: "AI auto-corrects stale data", correct: false },
        { id: "b", label: "Garbage in, garbage out—bad data drives bad decisions", correct: true },
        { id: "c", label: "MCP filters stale rows", correct: false },
      ],
      insight: "Data quality is the foundation. AI will not question freshness—it treats three-day-old stock as truth. Clean Core is a business problem, not only IT.",
    },
  ] as StressTest[],
};

export const CRISIS_SCENARIO = {
  date: "Aug 15, 2026 · 09:00",
  intro:
    "SAP HANA just pushed a red S&OP alert to your control tower through MCP.",
  events: [
    {
      id: "A",
      tag: "Demand shock",
      color: "#f97316",
      icon: "💥",
      title: "Event A",
      description:
        "A Middle East smart-city B2B program (50k BeamLink poles) must pull in from November to end of September per government mandate. Penalty: €2M.",
    },
    {
      id: "B",
      tag: "Supply break",
      color: "#ef4444",
      icon: "💥",
      title: "Event B",
      description:
        "A typhoon hit your core SEA contract plant—power out, monthly capacity cut 50%.",
    },
    {
      id: "C",
      tag: "Logistics choke",
      color: "#94a3b8",
      icon: "💥",
      title: "Event C",
      description:
        "Red Sea delays add ~15 days to ocean legs; Q3 peak pushed air rates +300%.",
    },
  ],
  inventory: [
    { location: "Shanghai hub", qty: "15k units", icon: "🏭" },
    { location: "EU hub (Rotterdam)", qty: "5k units", icon: "🏬" },
  ],
  financials: {
    title: "Financials",
    items: [
      { label: "BeamLink unit price", value: "€85/unit" },
      { label: "Standard gross margin", value: "32%" },
      { label: "Middle East B2B contract", value: "€4.25M (50k units)" },
      { label: "Late penalty", value: "€2M (within 30 days late)" },
      { label: "Ocean (normal lane)", value: "€5/unit" },
      { label: "Ocean (Cape route)", value: "€8/unit" },
      { label: "Air (current spike)", value: "€45/unit" },
      { label: "B2C monthly run rate", value: "~8k units" },
    ],
  },
  timeline: {
    title: "Timeline",
    items: [
      { label: "Today", value: "Aug 15" },
      { label: "B2B must-arrive", value: "Sep 30 (46 days)" },
      { label: "SEA plant recovery (est.)", value: "Sep 5 (earliest)" },
      { label: "Ocean to Middle East (normal)", value: "~18–20 days" },
      { label: "Ocean to Middle East (Cape)", value: "~33–35 days" },
      { label: "Air to Middle East", value: "~3–5 days" },
      { label: "Shanghai → Rotterdam ocean", value: "~30 days" },
    ],
  },
  customerPriority: {
    title: "Customers & markets",
    items: [
      { label: "Middle East B2B", priority: "Tier S", revenue: "€4.25M", note: "Flagship; could add 100k units follow-on" },
      { label: "EU B2C (Aura retail)", priority: "Tier A", revenue: "€2.4M/qtr", note: ">2 weeks stockout risks shelf loss" },
      { label: "APAC B2C", priority: "Tier B", revenue: "€1.1M/qtr", note: "Higher substitutability" },
    ],
  },
  dilemmas: [
    {
      title: "Protect the B2B whale vs. retail shelf",
      description:
        "If you push all stock and capacity to the Middle East B2B build, EU/APAC Aura shelves may stock out within two weeks—share to rivals.",
    },
    {
      title: "Service vs. margin",
      description:
        "Hitting Sep 30 may require +300% air (€45 vs €5 ocean), crushing margin on that program.",
    },
    {
      title: "System view vs. internal politics",
      description:
        "Some stock is pre-locked by KAMs—rebalancing needs cross-functional alignment and exec approval.",
    },
  ],
  outputRequirements: [
    {
      id: "inventory",
      label: "Stock moves",
      description: "How to split the 20k units on hand",
      icon: "📦",
    },
    {
      id: "logistics",
      label: "Lane mix",
      description: "Ocean vs air split with cost estimate",
      icon: "🚢",
    },
    {
      id: "sacrifice",
      label: "Sacrifice statement",
      description: "State which profit pool or secondary market you give up",
      icon: "⚖️",
    },
  ],
  decisions: {
    inventoryAllocation: {
      label: "Stock split strategy",
      description: "20k units total (Shanghai 15k + Rotterdam 5k)—how do you allocate?",
      type: "slider" as const,
      leftLabel: "All-in for B2B (Middle East)",
      rightLabel: "All-in for B2C retail",
      default: 70,
    },
    logistics: {
      label: "Logistics path",
      description: "How do you move goods to the Middle East?",
      type: "radio" as const,
      options: [
        { id: "sea-normal", label: "Normal ocean (18–20d, €5/unit)", note: "Red Sea risk is extreme" },
        { id: "sea-cape", label: "Cape routing (33–35d, €8/unit)", note: "Tight but possible" },
        { id: "air", label: "All air (3–5d, €45/unit)", note: "Fastest, cost spike" },
        { id: "mix", label: "Hybrid: urgent air + bulk ocean", note: "Requires batching discipline" },
      ],
    },
    sacrifice: {
      label: "Sacrifice choices",
      description: "Under tight capacity, what do you give up? (multi-select)",
      type: "checkbox" as const,
      options: [
        { id: "margin", label: "Accept margin hit (use air)" },
        { id: "b2c-eu", label: "Pause EU B2C for 2–3 weeks" },
        { id: "b2c-apac", label: "Pause APAC B2C" },
        { id: "partial-b2b", label: "Negotiate phased delivery with Middle East client" },
        { id: "overtime", label: "Overtime/other plants backfill (extra cost)" },
      ],
    },
    priority: {
      label: "Customer priority",
      description: "When resources clash, who wins?",
      type: "radio" as const,
      options: [
        { id: "b2b-first", label: "Tier S: Middle East B2B first", note: "Protect the whale" },
        { id: "balanced", label: "Balanced split", note: "Everyone gets something" },
        { id: "b2c-first", label: "Tier A: EU retail first", note: "Protect shelf share" },
      ],
    },
  },
  rules: [
    "Step 1: Analyze crisis data—ask the AI consultant for help (5 min)",
    "Step 2: Lock team decisions—no edits after lock",
    "Step 3: Orchestrate three specialist Agents; justify approvals",
    "Step 4: Compare your first call to Agent outputs; submit final plan",
    "Timebox: each team sends one rep for a 2-minute elevator pitch",
  ],
  aiConsultant: {
    intro: "Before locking decisions, query the AI consultant—or paste the brief into Gemini/ChatGPT.",
    clipboardPrompt: `You are a supply-chain analyst for Lumitech (fictional lighting OEM). Use ONLY the facts below.

[Crisis brief]
Date: Aug 15, 2026
- Event A (demand): Middle East B2B (50k BeamLink) pull-in to Sep 30; penalty €2M if late
- Event B (supply): SEA core plant typhoon outage; capacity −50% this month
- Event C (logistics): Red Sea +15d transit; air rates +300%

[Inventory] Shanghai 15k + Rotterdam 5k = 20k units FG
[Finance] BeamLink €85/unit, GM 32%, ocean normal €5, Cape €8, air €45
[Timeline] Due Sep 30 (46d), plant recovery ~Sep 5, ocean normal 18–20d, Cape 33–35d, air 3–5d
[Customers] ME B2B Tier S €4.25M | EU B2C Tier A €2.4M/qtr | APAC B2C Tier B €1.1M/qtr`,
    questions: [
      {
        id: "gap",
        label: "Inventory vs demand gap",
        icon: "📊",
        answer: "[Gap analysis]\n\nDemand (next ~6 weeks):\n• ME B2B: 50,000 units\n• EU B2C run rate ~8,000/mo\n• APAC B2C ~3,000/mo\n→ ~67,000 units needed\n\nSupply:\n• On-hand FG: 20,000 (15k SH + 5k RTM)\n• SEA plant (halved): ~15k/mo × 1.5 mo ≈ 22,500\n• Other plants slack (PL+IN): ~13k/mo\n→ ~55,500 supply in window\n\n⚠️ ~11,500 unit shortfall—cannot serve all channels; must choose.",
      },
      {
        id: "cost",
        label: "Air vs ocean economics",
        icon: "💰",
        answer: "[Logistics cost — 50k ME units]\n\nA) All air: 50k × €45 = €2.25M; 3–5d transit; GM ~32% → ~15%\nB) All ocean (Cape): 50k × €8 = €400k; 33–35d; any slip misses Sep 30\nC) Hybrid 5k air + 45k ocean: €225k + €360k = €585k; first air ~5d, bulk ~35d\n\n💡 Air is ~5.6× ocean; all-air eats roughly half the margin.",
      },
      {
        id: "sacrifice",
        label: "Cost of pausing B2C",
        icon: "⚖️",
        answer: "[B2C pause impacts]\n\nPause EU B2C ~3 weeks:\n• Revenue hit ~€2.4M/qtr ÷ 13 wks × 3 wks ≈ €554k\n• Shelf risk: competitors may take Aura slots; recovery 3–6 months\n• Severity: high\n\nPause APAC B2C:\n• Revenue hit ~€1.1M/qtr ÷ 13 × 3 ≈ €254k; easier to win back share\n\nValue of saving ME B2B:\n• €4.25M contract + avoid €2M penalty ≈ €6.25M upside\n• Strategic follow-on up to +100k units\n\n💡 Pure finance favors sacrificing APAC B2C (€254k) to save ME (€6.25M)—but EU shelf equity still matters.",
      },
      {
        id: "timeline",
        label: "Can we hit Sep 30?",
        icon: "⏱",
        answer: "[Timeline feasibility]\n\nToday 8/15 → due 9/30 = 46-day window\n\nPath 1 SH → air → ME (3–5d): ship 15k from Shanghai stock by ~8/20 ✅\nPath 2 RTM → ocean → ME (~10d): 5k by ~8/25 ✅\nPath 3 SEA recovery 9/5 → prod → Cape (35d): earliest land ~10/10 ❌ unless air assist\nPath 4 Poland pivot from 8/18 @8k/mo + 14d ocean to ME: first wave ~9/4 ✅\n\n📋 Combo of stock air + RTM ocean + Poland pivot can land ~28k by 9/30—still ~22k short vs 50k target → need phased delivery talks.",
      },
      {
        id: "priority",
        label: "Which crisis first?",
        icon: "🎯",
        answer: "[Priority by urgency × $]\n\n1) Event A (demand pull-in): hard 9/30 date + €2M penalty → align everything here first\n2) Event C (logistics): sets feasible paths for A; air vs ocean delta up to ~€1.85M\n3) Event B (plant outage): recovery ~9/5 gives some buffer; alt capacity ~€500k switch cost\n\n💡 Events couple: logistics choice for A depends on C; B caps mid-term supply—do not optimize in silos.",
      },
    ],
  },
};

export const warmUpQuizzes: Record<number, WarmUpQuestion[]> = {
  1: [
    {
      question: "Which question style usually gets a better answer from AI?",
      options: [
        { id: "A", label: "\"Analyze my supply chain\"" },
        { id: "B", label: "\"As SCM lead, analyze Shanghai DC inventory anomalies last week—Top 5 causes and actions\"" },
      ],
      correctId: "B",
      insight: "Good prompts = Context + Constraints + Format. How you ask beats how \"smart\" the model is.",
    },
    {
      question: "Where does AI tend to shine most?",
      options: [
        { id: "A", label: "Inventing a novel strategy from scratch" },
        { id: "B", label: "Finding anomalies across 100k order lines" },
        { id: "C", label: "Deciding if a supplier is trustworthy" },
      ],
      correctId: "B",
      insight: "Models excel at large-scale pattern spotting—not judgment calls that need human wisdom.",
    },
    {
      question: "A report cites an ISO standard you have never heard of. You should?",
      options: [
        { id: "A", label: "Cite it—AI knows more standards than I do" },
        { id: "B", label: "Verify first—models can confidently fabricate plausible standards" },
      ],
      correctId: "B",
      insight: "Hallucination: polished formatting around fiction. Always verify critical facts.",
    },
  ],
  2: [
    {
      question: "Biggest risk of wiring AI straight to your corporate database?",
      options: [
        { id: "A", label: "It will be too slow" },
        { id: "B", label: "Dangerous operations (e.g., deletes) without guardrails" },
        { id: "C", label: "No risk—more direct is better" },
      ],
      correctId: "B",
      insight: "MCP is the safety gate between AI and data—controlling what can be read or written.",
    },
    {
      question: "What role does SAP HANA play in the stack?",
      options: [
        { id: "A", label: "The AI brain" },
        { id: "B", label: "The memory—stores enterprise ground truth" },
        { id: "C", label: "The hands—executes actions" },
      ],
      correctId: "B",
      insight: "HANA is the data plane. All reasoning sits on that substrate—garbage in, garbage out.",
    },
    {
      question: "Correct order for the four enterprise-AI layers?",
      options: [
        { id: "A", label: "LLM → Agent → MCP → HANA" },
        { id: "B", label: "HANA → MCP → LLM → Agent" },
        { id: "C", label: "Agent → LLM → HANA → MCP" },
      ],
      correctId: "B",
      insight: "Data → connect → reason → act. Each layer depends on the one below—weak base, brittle top.",
    },
  ],
  3: [
    {
      question: "Three supply-chain fires at once—what is the best first move?",
      options: [
        { id: "A", label: "Emergency bridge call with everyone talking" },
        { id: "B", label: "Let AI synthesize global data, then debate decisions" },
        { id: "C", label: "Allocate from gut based on past crises" },
      ],
      correctId: "B",
      insight: "Let AI crunch data volume; humans focus on trade-offs—from responder to orchestrator.",
    },
    {
      question: "Which decision should NOT be delegated to AI alone?",
      options: [
        { id: "A", label: "Compare logistics lane costs" },
        { id: "B", label: "Choose which market to sacrifice for a strategic customer" },
        { id: "C", label: "Forecast supplier recovery timing" },
      ],
      correctId: "B",
      insight: "Value trade-offs stay human—AI supplies analysis; humans decide.",
    },
    {
      question: "You have Analyst, Logistics, and Comms Agents. A VIP screams for shipment—whom do you run first?",
      options: [
        { id: "A", label: "Comms Agent—calm the customer first" },
        { id: "B", label: "Analyst Agent—confirm inventory and capacity facts" },
        { id: "C", label: "Logistics Agent—book freight immediately" },
      ],
      correctId: "B",
      insight: "Comms without facts is noise; logistics without facts is blind. Start with data.",
    },
    {
      question: "An Agent recommends dropping APAC to save a Middle East VIP—with slick charts. Which response is most professional?",
      options: [
        { id: "A", label: "Approve—looks thorough" },
        { id: "B", label: "Validate data freshness, then judge against long-term strategy" },
        { id: "C", label: "Ignore it—AI does not understand our business" },
      ],
      correctId: "B",
      insight: "Automation bias: polished outputs get rubber-stamped. Check sources, then apply judgment.",
    },
  ],
  4: [
    {
      question: "First question when judging an AI investment?",
      options: [
        { id: "A", label: "How cutting-edge is the tech?" },
        { id: "B", label: "Is our data actually ready?" },
        { id: "C", label: "Are competitors already doing it?" },
      ],
      correctId: "B",
      insight: "Flashy models on dirty data are sandcastles—readiness is the first gate.",
    },
    {
      question: "How should Quick Wins and Strategic Bets combine?",
      options: [
        { id: "A", label: "Only Quick Wins—lowest risk" },
        { id: "B", label: "Only Strategic Bets—highest upside" },
        { id: "C", label: "Quick Wins build confidence and data; Strategic Bets lock long-term moats" },
      ],
      correctId: "C",
      insight: "Quick Wins fund learning and assets—not just short ROI.",
    },
    {
      question: "Digital twin needs Clean Core, which needs governance first. What does that imply?",
      options: [
        { id: "A", label: "Skip Clean Core and launch the twin" },
        { id: "B", label: "Sequencing beats budget size—dependencies set order" },
        { id: "C", label: "Run both in parallel with no interaction" },
      ],
      correctId: "B",
      insight: "Dependency chains define investment order—data foundations before moonshots.",
    },
  ],
};

export const conceptCards: Record<number, ConceptCard[]> = {
  1: [
    {
      front: "Before using AI, ask yourself what?",
      back: "Three questions: What decision am I making? What options exist? What evidence would change my mind? Define the decision before the tool—AI is a means, not the goal.",
      icon: "🧭",
    },
    {
      front: "What is the CCF framework?",
      back: "Context + Constraints + Format—the three ingredients of a strong prompt. Precision in, quality out.",
      icon: "🎯",
    },
    {
      front: "How is Agentic AI different from ChatGPT?",
      back: "Chatbots answer chats; Agentic AI plans, calls tools, and runs multi-step work—from assistant to coworker.",
      icon: "🤖",
    },
    {
      front: "How do prompting skills relate to directing Agents?",
      back: "Prompts are the control language for Agents. Clear goals (CCF) make planning and execution sharper—from asking well to defining outcomes.",
      icon: "🔗",
    },
  ],
  2: [
    {
      front: "What is MCP?",
      back: "Model Context Protocol—a universal socket so any AI can safely read/write enterprise systems without bespoke plumbing each time.",
      icon: "🔌",
    },
    {
      front: "How many layers for enterprise AI?",
      back: "HANA (data) → MCP (connect) → LLM (reason) → Agent (act)—all four matter.",
      icon: "🏗️",
    },
    {
      front: "Why does data quality beat model choice?",
      back: "Models do not question stale inventory. Three-day-old stock becomes \"truth.\" Clean Core is the first gate to success.",
      icon: "🧹",
    },
  ],
  3: [
    {
      front: "What is S&OP?",
      back: "Sales & Operations Planning—the core demand/supply alignment rhythm. AI can compress days of balancing into minutes.",
      icon: "⚖️",
    },
    {
      front: "What is the supply-chain \"impossible triangle\"?",
      back: "Speed, cost, quality—you cannot max all three. Crises force explicit trade-offs.",
      icon: "🔺",
    },
    {
      front: "Where is the human vs AI decision line?",
      back: "AI: mass analysis, costing, option grids. Humans: values, relationships, strategic calls, final accountability.",
      icon: "🤝",
    },
    {
      front: "What is Automation Bias?",
      back: "We accept AI answers because they sound expert. When approving Agents, ask: would I sign this if an intern proposed it?",
      icon: "⚠️",
    },
  ],
  4: [
    {
      front: "What is data readiness for AI?",
      back: "Not just having data—completeness, freshness, and standardization decide if AI can land. Clean Core is prerequisite.",
      icon: "📊",
    },
    {
      front: "How do you measure AI ROI?",
      back: "Quick Wins: near-term ROI (~6 weeks). Strategic Bets: moats that show in 6–12 months. You need both.",
      icon: "💰",
    },
    {
      front: "Why does sequencing beat budget size?",
      back: "Twins need clean data (Copilot first); self-healing needs interfaces (MCP first)—dependencies set the roadmap.",
      icon: "🔗",
    },
  ],
};

// ---------------------------------------------------------------------------
// AI Fiasco Demo — Stage 1 "hallucination ride"
// ---------------------------------------------------------------------------
export interface FiascoError {
  id: number;
  segmentIndex: number;
  markerText: string;
  explanation: string;
  realFact: string;
}

export const AI_FIASCO_DEMO = {
  prompt: "Analyze Lumitech's supply chain for me",
  segments: [
    { text: "Based on analysis, Lumitech's supply chain looks like this:\n\n1. **Key supplier**: Lumitech's largest Tier-1 supplier is ", errorId: null },
    { text: "Shenzhen HuaCore Electronics", errorId: 0 },
    { text: ", representing 42% of spend; in 2024 it earned", errorId: null },
    { text: " ISO 58401 supply-chain resilience certification", errorId: 1 },
    { text: ", and the relationship is stable.\n\n2. **Inventory**: Shanghai DC LED driver stock", errorId: null },
    { text: "covers 45 days", errorId: 2 },
    { text: " of production—above the 30-day safety benchmark.\n\n3. **Logistics**: HCMC→Shanghai ocean averages 3–5 days with freight down 12% YoY—cost control looks solid.", errorId: null },
  ] as { text: string; errorId: number | null }[],
  errors: [
    {
      id: 0,
      segmentIndex: 1,
      markerText: "Shenzhen HuaCore Electronics",
      explanation: "The model invented a supplier name. Without real supplier facts in the prompt, it will confidently fabricate.",
      realFact: "True supplier master data lives in SAP; the model cannot magically know it.",
    },
    {
      id: 1,
      segmentIndex: 3,
      markerText: "ISO 58401 supply-chain resilience certification",
      explanation: "ISO 58401 does not exist—the model mimicked ISO numbering to sound legitimate.",
      realFact: "Real supply-chain security standards include ISO 28000. Hallucinations often look structurally correct but are false.",
    },
    {
      id: 2,
      segmentIndex: 5,
      markerText: "covers 45 days",
      explanation: "The model invented coverage days without querying live HANA inventory.",
      realFact: "Ground truth inventory must flow via MCP from HANA. Never trust specific business numbers unless the model has the source.",
    },
  ] as FiascoError[],
  insight:
    "That is hallucination—confident fiction. CCF (rich context + tight constraints) sharply cuts this risk.",
};

// ---------------------------------------------------------------------------
// Facilitator Timeline — Presenter View
// ---------------------------------------------------------------------------
export const facilitatorTimeline: Record<number, FacilitatorStep[]> = {
  1: [
    { action: "video", label: "Play Jensen Huang clip", duration: "5 min", tips: "CES 2025 Agentic AI—test audio early" },
    { action: "script", label: "Opening bridge", duration: "3 min", tips: "Stress Agentic AI ≠ chatbot" },
    { action: "game", label: "Start Prompt Challenge timer", duration: "20 min", tips: "Teams read the brief before prompting" },
    { action: "game", label: "Agent mode contrast", duration: "5 min", tips: "Walk the Agent Simulator vs chatbot on Stage page" },
    { action: "debrief", label: "Lead debrief", duration: "7 min", tips: "Ask: biggest chatbot vs Agent gap?" },
    { action: "poll", label: "Open live poll", duration: "5 min" },
  ],
  2: [
    { action: "video", label: "Play Sam Altman clip", duration: "5 min", tips: "DevDay 2025 MCP segment" },
    { action: "script", label: "Opening bridge", duration: "3 min", tips: "Context = real enterprise data" },
    { action: "game", label: "Start LEGO architect timer", duration: "25 min", tips: "Three beats: build → simulate → What-If stress" },
    { action: "debrief", label: "Lead debrief", duration: "7 min", tips: "Ask: farthest gap—data, interface, or culture?" },
    { action: "poll", label: "Open live poll", duration: "5 min" },
  ],
  3: [
    { action: "video", label: "Play Dave Clark clip", duration: "5 min", tips: "Manifest 2025 supply-chain AI" },
    { action: "script", label: "Opening bridge", duration: "3 min", tips: "Messy physical-world data = AI upside" },
    { action: "game", label: "Start Agent command center", duration: "35 min", tips: "5m decide → 15m orchestrate → 10m approvals → 5m submit" },
    { action: "debrief", label: "Lead debrief", duration: "12 min", tips: "Ask: how did you route Agents? what changed on approval? what stayed human?" },
    { action: "poll", label: "Open live poll", duration: "5 min" },
  ],
  4: [
    { action: "video", label: "Play Gavin Baker clip", duration: "5 min", tips: "Unique data > newest model" },
    { action: "script", label: "Opening bridge", duration: "3 min", tips: "Scan projects before voting" },
    { action: "game", label: "Start Shark Tank timer", duration: "35 min", tips: "Three chips each—discuss before betting" },
    { action: "debrief", label: "Lead debrief", duration: "12 min", tips: "Ask: if budget halved, what do you cut first?" },
    { action: "poll", label: "Open live poll", duration: "5 min" },
  ],
};

// ---------------------------------------------------------------------------
// Completion Quiz
// ---------------------------------------------------------------------------
export const completionQuiz: WarmUpQuestion[] = [
  {
    question: "What is the three-part prompting framework called?",
    options: [
      { id: "A", label: "ABC (Accuracy + Brevity + Clarity)" },
      { id: "B", label: "CCF (Context + Constraints + Format)" },
    ],
    correctId: "B",
    insight: "Context sets scene, Constraints set rules, Format sets shape—three steps, sharper outputs.",
  },
  {
    question: "HANA data is three days stale yet an Agent still issued a PO. Which layer failed?",
    options: [
      { id: "A", label: "LLM reasoning too weak" },
      { id: "B", label: "Data (HANA) quality—garbage in, garbage out" },
      { id: "C", label: "Agent permissions too broad" },
    ],
    correctId: "B",
    insight: "Models do not question staleness—chain quality bottoms at the data plane. That is Clean Core.",
  },
  {
    question: "An Agent proposes exiting APAC to save a Middle East VIP—with charts. You should?",
    options: [
      { id: "A", label: "Approve—AI is faster and smarter" },
      { id: "B", label: "Verify its data trail, but humans own strategic market calls" },
      { id: "C", label: "Ignore it—go with gut only" },
    ],
    correctId: "B",
    insight: "Market sacrifice is a values call—AI frames analysis; humans sign the trade-off (orchestrator role).",
  },
  {
    question: "You want AI to run daily replenishment. What is the sensible first step?",
    options: [
      { id: "A", label: "Deploy the fanciest Agent immediately" },
      { id: "B", label: "Audit data quality and interface readiness, then decide on Agents" },
      { id: "C", label: "Wait for competitors to prove it" },
    ],
    correctId: "B",
    insight: "Readiness → MCP connectivity → model choice → Agent rollout. Skipping the first two is a house of cards.",
  },
];

// ── Part A: Stage 1 Agent Simulator ──────────────────────────────

export const AGENT_SIMULATION_STEPS: AgentSimStep[] = [
  {
    type: "receive",
    label: "Receive goal",
    thinking: "Goal: analyze tariff crisis and redesign suppliers. I need to decompose it.",
    icon: "📥",
  },
  {
    type: "plan",
    label: "Autonomous plan",
    thinking: "Four steps: 1) stock check 2) supplier status 3) alt-cost math 4) emergency buy + notify",
    icon: "🗺️",
  },
  {
    type: "tool_call",
    label: "Call SAP HANA — inventory",
    thinking: "Confirm how many days LED driver stock covers.",
    toolCall: "query_hana(\"SELECT item, stock_days, status FROM inventory WHERE category='LED_driver'\")",
    result: "{ item: \"LED_driver_IC\", stock_days: 18, status: \"WARNING\", reorder_point: 14 }",
    icon: "💾",
  },
  {
    type: "tool_call",
    label: "Call SAP HANA — suppliers",
    thinking: "18 days is thin—I need who can still ship.",
    toolCall: "query_hana(\"SELECT * FROM suppliers WHERE component='LED_driver' AND status != 'terminated'\")",
    result: "[\n  { name: \"Alpha Semicon\", status: \"BLOCKED\", reason: \"port_strike\" },\n  { name: \"Beta Optics\", status: \"ACTIVE\", capacity_available: \"30%\" },\n  { name: \"Gamma Electric\", status: \"ACTIVE\", capacity_available: \"80%\" }\n]",
    icon: "💾",
  },
  {
    type: "reasoning",
    label: "Analyze & decide",
    thinking: "Alpha blocked, Beta tight (30%), Gamma has 80% slack. Best path: surge Gamma to 15k units and max Beta. Extra cost ~€1.2M—inside €2.5M guardrail.",
    icon: "🧠",
  },
  {
    type: "action",
    label: "Act — send urgent mail",
    thinking: "Plan locked—notify Gamma to ramp immediately.",
    toolCall: "send_email(to=\"procurement@gamma-electric.mx\", subject=\"URGENT: surge capacity - LED drivers\", body=\"...\")",
    result: "{ status: \"sent\", message_id: \"MSG-20260815-001\", eta_reply: \"within 2h\" }",
    icon: "📧",
  },
  {
    type: "action",
    label: "Act — create PO",
    thinking: "Mirror in SAP with expedited approval path.",
    toolCall: "update_sap(action=\"create_purchase_order\", supplier=\"gamma_electric\", item=\"LED_driver\", qty=15000, priority=\"URGENT\")",
    result: "{ po_number: \"PO-2026-4521\", status: \"pending_approval\", approver: \"VP_Supply_Chain\" }",
    icon: "📋",
  },
  {
    type: "report",
    label: "Generate exec brief",
    thinking: "All actions logged—package for leadership sign-off.",
    result: "✅ Completed 3 actions:\n• Stock alert confirmed (LED cover 18 days)\n• Urgent mail sent to Gamma Electric\n• PO PO-2026-4521 created (VP approval pending)\n\n📊 Est. extra cost €1.2M (within €2.5M cap)\n⏱ Est. supply recovery ~12 business days",
    icon: "📊",
  },
];

export const CHATBOT_COMPARISON = {
  chatbotResult: "Chatbot gives prose—you still fetch data, send mail, and file the PO yourself",
  agentResult: "Agent already ran three actions: queried HANA, sent mail, created the PO",
  keyDifference: "Chatbot = Q&A advisor\nAgent = you set a goal; it plans, calls tools, executes",
  humanRole: "Shift from asker to supervisor—approve Agent plans instead of hand-running every step",
};

// ── Part B: Stage 2 Architecture Simulation ──────────────────────

export const ARCHITECTURE_SIM_STEPS: SimulationStep[] = [
  { from: "trigger", to: "agent", label: "VIP complaint arrives", data: "\"Order #VIP-2026-888 is 3 days late—customer furious\"" },
  { from: "agent", to: "mcp", label: "Agent issues query", data: "query_order(id='VIP-2026-888')" },
  { from: "mcp", to: "hana", label: "MCP translates to SQL", data: "SELECT * FROM orders WHERE id='VIP-2026-888'" },
  { from: "hana", to: "mcp", label: "HANA returns facts", data: "{ status: 'delayed', eta: 'Aug 18', reason: 'typhoon' }" },
  { from: "mcp", to: "agent", label: "MCP shapes payload", data: "3-day slip, cause typhoon, new ETA 8/18" },
  { from: "agent", to: "llm", label: "Agent asks for analysis", data: "\"Assess impact and propose remedy package\"" },
  { from: "llm", to: "agent", label: "LLM proposes", data: "1) apology mail 2) 10% voucher 3) expedite ship" },
  { from: "agent", to: "mcp", label: "Agent executes", data: "send_email(to='vip_client', template='apology') + update_order(priority='URGENT')" },
  { from: "mcp", to: "hana", label: "Persist order change", data: "UPDATE orders SET priority='URGENT' WHERE id='VIP-2026-888'" },
  { from: "hana", to: "complete", label: "Done", data: "✅ Mail sent + order expedited" },
];

export const WHAT_IF_SCENARIOS: WhatIfScenario[] = [
  {
    id: "no-mcp",
    toggleOff: "mcp",
    label: "Remove MCP",
    breakAt: "agent→hana",
    errorMessage: "⚠️ AI hits the database raw... no policy checks... DELETE risk!",
    insight: "MCP is the gate—controls reads/writes. Without it, AI is an intern with every password.",
    predictions: [
      { id: "a", label: "Still fine—just one fewer hop", correct: false },
      { id: "b", label: "Agent talks straight to DB—no authZ, security breaks", correct: true },
      { id: "c", label: "LLM cannot see any data", correct: false },
    ],
  },
  {
    id: "no-agent",
    toggleOff: "agent",
    label: "Remove Agent",
    breakAt: "llm→?",
    errorMessage: "⚠️ LLM wrote advice... nobody shipped it. No mail, no expedite—customer still waits.",
    insight: "LLM thinks; Agent acts. Without Agents you slide from operator to slide deck.",
    predictions: [
      { id: "a", label: "MCP will execute for the Agent", correct: false },
      { id: "b", label: "Advice only—no executor, no mail, no order change", correct: true },
      { id: "c", label: "Total crash on boot", correct: false },
    ],
  },
  {
    id: "dirty-data",
    toggleOff: "hana-quality",
    label: "Stale HANA data",
    breakAt: "hana→mcp",
    errorMessage: "⚠️ HANA returns three-day-old stock... Agent promises expedite for inventory that is already gone.",
    insight: "Garbage in, garbage out—models do not freshness-check. Data discipline is the base layer.",
    predictions: [
      { id: "a", label: "Agent auto-stops on stale timestamps", correct: false },
      { id: "b", label: "MCP auto-heals the feed", correct: false },
      { id: "c", label: "Bad data → bad promise—cannot fulfill expedite", correct: true },
    ],
  },
];

// ── Part C: Stage 3 Crisis Agents ────────────────────────────────

export const CRISIS_AGENTS: CrisisAgent[] = [
  {
    id: "analyst",
    name: "Data Analyst Agent",
    icon: "📊",
    specialty: "Stock math, cost models, risk scoring",
    color: "#f97316",
    workflows: {
      A: {
        crisisId: "A",
        steps: [
          { action: "Query HANA", detail: "SELECT stock, capacity FROM inventory WHERE product='BeamLink'", duration: "2s" },
          { action: "Gap math", detail: "Need 50k − on-hand 15k − WIP 12k = 23k short", duration: "3s" },
          { action: "Cost model", detail: "Surge +15% adds ~€540k; air vs ocean delta ~€1.8M", duration: "4s" },
          { action: "Risk score", detail: "On-time prob: air 87%, pure ocean 42%, hybrid 73%", duration: "3s" },
        ],
        output: "📋 Gap 23k units—recommend hybrid (air first slice + ocean bulk), extra ~€1.1M, 73% on-time.",
        decisionComments: {
          air: "✅ All-air lifts on-time odds to 87% but burns €2.25M freight—margin ~15%. Sanity-check if all 50k need air.",
          "sea-cape": "⚠️ Cape-only shows ~42% on-time; 33–35d legs leave no slip—at least air the first tranche.",
          mix: "✅ Hybrid matches the model—air head + ocean tail balances cost vs clock.",
          "sea-normal": "❌ Normal lane ignores Red Sea risk—reassess immediately.",
        },
        conflictNote: "⚡ vs Logistics: they want 5k first air; data says 3k covers demo needs—extra 2k wastes ~€90k.",
      },
      B: {
        crisisId: "B",
        steps: [
          { action: "Query HANA", detail: "SELECT capacity, recovery_date FROM factories WHERE region='SEA'", duration: "2s" },
          { action: "Capacity read", detail: "SEA plant 30k/mo → 15k after outage; recovery ~Sep 5", duration: "3s" },
          { action: "Alt capacity", detail: "Poland slack ~8k/mo, India ~5k/mo → 13k bridge", duration: "4s" },
          { action: "Cost compare", detail: "Switch freight PL +€3/u, IN +€7/u; OT +€2/u", duration: "3s" },
        ],
        output: "📋 ~15k/mo hole; PL+IN cover 13k—still 2k needs stock draw.",
        decisionComments: {
          overtime: "✅ OT path works—~€2/u × 13k ≈ €26k/mo extra.",
          "b2c-apac": "📊 Pausing APAC B2C frees ~3k/mo—helps but does not close the gap alone.",
        },
      },
      C: {
        crisisId: "C",
        steps: [
          { action: "Query HANA", detail: "SELECT route, cost, transit_days FROM logistics WHERE active=true", duration: "2s" },
          { action: "Lane review", detail: "Red Sea +15d direct; Cape +18d; air 3–5d but +300% rate", duration: "3s" },
          { action: "Batching", detail: "Air 5k (€225k) then 45k Cape waves", duration: "4s" },
          { action: "Schedule", detail: "Air lands ~8/20; ocean tranches 9/18–9/25", duration: "3s" },
        ],
        output: "📋 Hybrid plan—air secures demo window, ocean carries bulk; total freight ~€625k.",
        decisionComments: {
          air: "📊 All-air avoids split planning but €2.25M is 3.6× hybrid.",
          "sea-cape": "📊 Single Cape string is simple but 9/25 land leaves only ~5d buffer.",
          mix: "✅ Hybrid—air 5k on 8/17, ocean main on 8/22.",
        },
        conflictNote: "⚡ vs Comms: they want 3k samples first; install plan needs 5k—under-shipping risks a second escalation.",
      },
    },
  },
  {
    id: "logistics",
    name: "Logistics Dispatcher Agent",
    icon: "🚛",
    specialty: "Lane optimization, capacity matching, scheduling",
    color: "#f59e0b",
    workflows: {
      A: {
        crisisId: "A",
        steps: [
          { action: "Capacity search", detail: "Air lift PVG→DXB 8/17 shows 2t available", duration: "2s" },
          { action: "Plan waves", detail: "First 3k units air 8/17, lands customer DC 8/20", duration: "3s" },
          { action: "Ocean book", detail: "Cape sailing booked 8/22, ETA 9/25", duration: "3s" },
          { action: "BOL package", detail: "Three batches, carriers assigned, docs issued", duration: "2s" },
        ],
        output: "🚛 Scheduled: Batch-1 air 5k → 8/20 | Batch-2 ocean 20k → 9/25 | Batch-3 ocean 25k → 10/5",
        decisionComments: {
          air: "🚛 All-air locked five flights 8/17–8/22; 50k across five waves, last lands ~8/25.",
          "sea-cape": "🚛 Cape string set—first sail 8/22, ETA 9/25 with zero buffer.",
          mix: "🚛 Hybrid live—5k air 8/17, 45k ocean 8/22.",
        },
        conflictNote: "⚡ vs Analyst: they say 3k air covers demo; ops needs 5k for install wave 1—extra 2t costs only ~€6k.",
      },
      B: {
        crisisId: "B",
        steps: [
          { action: "Relay study", detail: "PL→SH rail 22d; PL→ME direct ocean 14d", duration: "2s" },
          { action: "Line change", detail: "Poland BeamLink line swap, ~3d tooling", duration: "3s" },
          { action: "Container pull", detail: "Move 5k empties from Rotterdam to PL plant", duration: "2s" },
          { action: "Schedule out", detail: "PL line starts 8/18; first 8k ready 9/1", duration: "3s" },
        ],
        output: "🚛 Poland line live 8/18—8k units ready 9/1 for direct ME sailings.",
        decisionComments: {
          overtime: "🚛 OT plan lifts PL to ~10k/mo—adds ~€20k/mo OT burn.",
        },
      },
      C: {
        crisisId: "C",
        steps: [
          { action: "Rate talks", detail: "Three carriers bid; best bulk €42/u vs spot €45", duration: "3s" },
          { action: "Space lock", detail: "Hold 8/17 + 8/19 flights, 5t total", duration: "2s" },
          { action: "Ocean backup", detail: "Twelve 20' Cape boxes, sail 8/22", duration: "3s" },
          { action: "Contingency", detail: "Rail-sea alt: China-Europe block train → Istanbul → ME ocean", duration: "2s" },
        ],
        output: "🚛 Booked: air head €42/u ×5k | Cape main €8/u | rail-sea alt €18/u",
        decisionComments: {
          air: "🚛 Negotiated all-air to €42/u—~€2.1M total, capacity secured.",
          mix: "🚛 Hybrid executing—air leg €42×5k = €210k, ocean €8/u remainder.",
        },
      },
    },
  },
  {
    id: "comms",
    name: "Comms & Stakeholder Agent",
    icon: "💬",
    specialty: "Customer calm, supplier talks, internal cascades",
    color: "#94a3b8",
    workflows: {
      A: {
        crisisId: "A",
        steps: [
          { action: "Draft VIP mail", detail: "ME VIP: pull-in response plan + first air timeline", duration: "3s" },
          { action: "Supplier brief", detail: "Gamma surge talking points—volume for priority", duration: "3s" },
          { action: "Exec ping", detail: "Crisis note + approval ask to VP Supply Chain", duration: "2s" },
          { action: "Workflow blast", detail: "SAP workflow triggers + mail cascade", duration: "2s" },
        ],
        output: "💬 Sent VIP mail with plan | supplier pack ready | VP approval ping fired",
        decisionComments: {
          "b2b-first": "💬 Narrative aligned to B2B-first—promise all-in for ME while prepping B2C delay templates.",
          balanced: "💬 Balanced split cannot promise \"all-in\"—language shifts to \"best effort\" ⚠️ trust risk.",
          "b2c-first": "⚠️ B2C-first risks €2M ME penalty—prep breach talks + relationship repair.",
        },
      },
      B: {
        crisisId: "B",
        steps: [
          { action: "Plant outreach", detail: "SEA site: damage, recovery ETA, insurance", duration: "3s" },
          { action: "Alt plants", detail: "PL/IN: line switch asks, timing, tech support", duration: "3s" },
          { action: "Channel alert", detail: "B2C partners: stock risk, promo pacing", duration: "2s" },
          { action: "Exec report", detail: "First impact brief to leadership dashboard <24h", duration: "2s" },
        ],
        output: "💬 Recovery plan confirmed | PL/IN notified | B2C warned",
        decisionComments: {
          "b2c-eu": "💬 EU pause mail stresses \"temporary adjustment\" not \"stockout\"—promise restore <3wks.",
          "b2c-apac": "💬 APAC pause draft pairs with next-qtr promo to protect relationships.",
        },
      },
      C: {
        crisisId: "C",
        steps: [
          { action: "Carrier talks", detail: "Batch discount push to €42 vs €45 spot", duration: "3s" },
          { action: "Customer update", detail: "ME VIP: phased plan—air samples, ocean bulk follows", duration: "3s" },
          { action: "Insurance", detail: "File route change, confirm coverage", duration: "2s" },
          { action: "Cross-sync", detail: "15m huddle Supply/Logistics/Finance", duration: "2s" },
        ],
        output: "💬 Rates at €42/u | customer phased note sent | insurance filed | meeting booked",
        conflictNote: "⚡ vs Analyst: they want 3k sample-only first; customer expects install-scale first drop—under 5k risks trust hit.",
      },
    },
  },
];

// ── Stage 2 Enhancements ─────────────────────────────────────────

export const SIMULATION_CHECKPOINTS: SimCheckpoint[] = [
  {
    afterStep: 0,
    question: "VIP complaint hits the Agent—what is step one?",
    options: [
      { id: "a", label: "Reply immediately: \"We are on it\"", correct: false },
      { id: "b", label: "Query order facts in HANA via MCP", correct: true },
      { id: "c", label: "Ask the LLM to draft an apology first", correct: false },
    ],
    explanation: "Facts before prose—Agents fetch ground truth through MCP before messaging anyone.",
  },
  {
    afterStep: 4,
    question: "Agent has data: 3-day slip, typhoon cause. Who is next?",
    options: [
      { id: "a", label: "Push MCP to flip order status now", correct: false },
      { id: "b", label: "Hand to LLM for impact + remedy options", correct: true },
      { id: "c", label: "Mail the customer immediately", correct: false },
    ],
    explanation: "Data is not a decision—LLM weighs options and compensation design.",
  },
  {
    afterStep: 6,
    question: "LLM proposes apology + 10% credit + expedite. Who executes?",
    options: [
      { id: "a", label: "The LLM sends mail itself", correct: false },
      { id: "b", label: "Agent executes via MCP (mail + order bump)", correct: true },
      { id: "c", label: "Humans re-key everything manually", correct: false },
    ],
    explanation: "LLM thinks; Agent acts—MCP is the safe actuator into HANA.",
  },
];

export const CONNECTION_LABEL_HINTS = [
  "SQL query",
  "Shape payload",
  "Analysis ask",
  "Recommended plan",
  "Execute command",
  "Ack / confirm",
  "Data return",
  "Natural-language intent",
];

export const REFERENCE_ARCHITECTURE = {
  nodes: ["hana", "mcp", "llm", "agent"],
  connections: [
    { from: "agent", to: "mcp", label: "Query / execute" },
    { from: "mcp", to: "hana", label: "SQL read / write" },
    { from: "mcp", to: "agent", label: "Formatted payload back" },
    { from: "agent", to: "llm", label: "Analysis ask + facts" },
    { from: "llm", to: "agent", label: "Reasoning / proposed plan" },
  ],
  explanation: "Agent orchestrates—down through MCP into HANA, up to LLM for reasoning. Data always crosses MCP.",
};

export const ARCHITECTURE_PRINCIPLES = [
  {
    icon: "🏗️",
    title: "Data is the foundation",
    detail: "AI quality cannot exceed data quality—Clean Core is prerequisite, not nice-to-have.",
  },
  {
    icon: "🔒",
    title: "Never skip the safety layer",
    detail: "MCP is the only governed door to systems—bypassing it is handing DB creds to an intern.",
  },
  {
    icon: "🧠",
    title: "Thinking ≠ doing",
    detail: "LLM reasons; Agent executes—drop either and you only ship half the job.",
  },
];
