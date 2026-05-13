export type RunMode = "live" | "mock";

export interface ModeStatus {
  mode: RunMode;
  missingKeys: string[];
}

export function detectMode(): ModeStatus {
  if (process.env.MOCK_MODE === "true") {
    return { mode: "mock", missingKeys: ["forced via MOCK_MODE=true"] };
  }

  const required = [
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "COHERE_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  const missing = required.filter((k) => !process.env[k]);
  return missing.length > 0
    ? { mode: "mock", missingKeys: missing }
    : { mode: "live", missingKeys: [] };
}
