export interface GlossaryEntry {
  term: string;
  english?: string;
  definition: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  prompt: {
    term: "Prompt",
    english: "Instruction to the model",
    definition:
      "Instructions you give the AI—like briefing a very smart new hire with no company context. The clearer you are, the more reliable the output.",
  },
  "agentic-ai": {
    term: "Agentic AI",
    english: "Agent",
    definition:
      "Not just chat—AI that plans steps, calls tools, and runs end-to-end workflows like an \"AI coworker.\"",
  },
  mcp: {
    term: "MCP",
    english: "Model Context Protocol",
    definition:
      "A standard \"USB port\" for AI—lets models safely read and act on enterprise systems without bespoke integrations for every app.",
  },
  llm: {
    term: "LLM",
    english: "Large Language Model",
    definition:
      "The family behind ChatGPT, Gemini, etc.—the \"AI brain\" that understands language, analyzes data, and generates text.",
  },
  sop: {
    term: "S&OP",
    english: "Sales & Operations Planning",
    definition:
      "The core process that aligns demand forecasts with supply capacity—usually run weekly or monthly.",
  },
  "clean-core": {
    term: "Clean Core",
    english: "Clean, standardized core data",
    definition:
      "Keeping SAP and other core systems clean and standardized. Even the best model fails if the data feeding it is garbage.",
  },
  "digital-twin": {
    term: "Digital Twin",
    english: "Virtual replica",
    definition:
      "A virtual copy of the real supply chain where you can run experiments (\"what if we shut a plant?\") without touching production.",
  },
  "what-if": {
    term: "What-if simulation",
    english: "Scenario analysis",
    definition:
      "\"If X happens, what happens next?\"—test assumptions quickly in a sandbox to prepare responses.",
  },
  hana: {
    term: "SAP HANA",
    english: "Enterprise data hub",
    definition:
      "Lumitech's core database—orders, inventory, suppliers, logistics, and other critical business data.",
  },
  agent: {
    term: "AI Agent",
    english: "Autonomous agent",
    definition:
      "Software that plans tasks, calls tools, and completes workflows—not only answering questions but doing work.",
  },
  ccf: {
    term: "CCF framework",
    english: "Context + Constraints + Format",
    definition:
      "The three-part prompt recipe taught here: Context (background) + Constraints (rules) + Format (output shape). Nail these three and quality jumps.",
  },
  hallucination: {
    term: "Hallucination",
    english: "Fabricated output",
    definition:
      "The model confidently outputs fiction—fake numbers, nonexistent standards, bogus citations. Looks professional; verify anyway.",
  },
  token: {
    term: "Token",
    english: "Text chunk",
    definition:
      "The smallest unit models process. Roughly 1–2 tokens per Chinese character and ~1 per English word. Token count drives cost and context limits.",
  },
  rag: {
    term: "RAG",
    english: "Retrieval-Augmented Generation",
    definition:
      "Retrieve relevant documents first, then generate grounded answers—cuts hallucinations and improves accuracy.",
  },
  copilot: {
    term: "Copilot",
    english: "Embedded assistant",
    definition:
      "AI embedded in daily tools—suggesting while you write email, reports, or code. It augments you rather than replacing you.",
  },
  "b2b-b2c": {
    term: "B2B / B2C",
    english: "Business vs consumer channels",
    definition:
      "B2B sells to businesses (e.g., Lumitech to retailers); B2C sells to consumers. Supply-chain complexity differs sharply.",
  },
  po: {
    term: "PO",
    english: "Purchase Order",
    definition:
      "Formal buy instruction to a supplier—SKU, quantity, price, dates. Agents can draft POs and route them for approval.",
  },
  roi: {
    term: "ROI",
    english: "Return on Investment",
    definition:
      "Core payoff metric: (gain − cost) ÷ cost. Quick Wins chase near-term ROI; Strategic Bets chase long-term moats.",
  },
  eta: {
    term: "ETA",
    english: "Estimated Time of Arrival",
    definition:
      "Logistics milestone—when goods should land. In crises, ETA accuracy drives trust and planning.",
  },
};
