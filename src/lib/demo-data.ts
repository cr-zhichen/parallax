import {
  CATALOG_REFRESH_MS,
  type ModelCatalog,
  type ModelPoint,
  type SourceNoticeKey,
} from "@/lib/models";

type DemoModel = Pick<
  ModelPoint,
  | "name"
  | "slug"
  | "creator"
  | "intelligence"
  | "costPerTask"
  | "outputSpeed"
> &
  Partial<ModelPoint>;

const demoRows: DemoModel[] = [
  { name: "GPT-5.6 Luna (medium)", slug: "gpt-5-6-luna-medium", creator: "OpenAI", intelligence: 38.1, costPerTask: 0.015, outputSpeed: 188 },
  { name: "GPT-5.6 Luna (high)", slug: "gpt-5-6-luna-high", creator: "OpenAI", intelligence: 46.0, costPerTask: 0.029, outputSpeed: 172 },
  { name: "GPT-5.6 Luna (xhigh)", slug: "gpt-5-6-luna-xhigh", creator: "OpenAI", intelligence: 49.0, costPerTask: 0.043, outputSpeed: 151 },
  { name: "GPT-5.6 Terra (high)", slug: "gpt-5-6-terra-high", creator: "OpenAI", intelligence: 49.2, costPerTask: 0.31, outputSpeed: 126 },
  { name: "GPT-5.6 Terra (max)", slug: "gpt-5-6-terra-max", creator: "OpenAI", intelligence: 55.8, costPerTask: 0.52, outputSpeed: 91 },
  { name: "GPT-5.6 Sol (medium)", slug: "gpt-5-6-sol-medium", creator: "OpenAI", intelligence: 54.6, costPerTask: 0.64, outputSpeed: 84 },
  { name: "GPT-5.6 Sol (xhigh)", slug: "gpt-5-6-sol-xhigh", creator: "OpenAI", intelligence: 57.6, costPerTask: 1.18, outputSpeed: 68 },
  { name: "GPT-5.5 (high)", slug: "gpt-5-5-high", creator: "OpenAI", intelligence: 53.1, costPerTask: 0.82, outputSpeed: 93 },
  { name: "GPT-5 mini (high)", slug: "gpt-5-mini-high", creator: "OpenAI", intelligence: 25.3, costPerTask: 0.034, outputSpeed: 245 },
  { name: "GPT-4.1 nano", slug: "gpt-4-1-nano", creator: "OpenAI", intelligence: 9.5, costPerTask: 0.035, outputSpeed: 318 },
  { name: "Claude Opus 5 (high)", slug: "claude-opus-5-high", creator: "Anthropic", intelligence: 58.8, costPerTask: 1.22, outputSpeed: 79 },
  { name: "Claude Opus 5 (max)", slug: "claude-opus-5-max", creator: "Anthropic", intelligence: 60.6, costPerTask: 2.32, outputSpeed: 62 },
  { name: "Claude Sonnet 4.8 (max)", slug: "claude-sonnet-4-8-max", creator: "Anthropic", intelligence: 55.7, costPerTask: 1.98, outputSpeed: 86 },
  { name: "Claude Sonnet 4.6 (max)", slug: "claude-sonnet-4-6-max", creator: "Anthropic", intelligence: 47.1, costPerTask: 1.22, outputSpeed: 101 },
  { name: "Claude Sonnet 5", slug: "claude-sonnet-5", creator: "Anthropic", intelligence: 43.5, costPerTask: 0.44, outputSpeed: 109 },
  { name: "Gemini 3.5 Flash", slug: "gemini-3-5-flash", creator: "Google", intelligence: 51.4, costPerTask: 0.45, outputSpeed: 264 },
  { name: "Gemini 3.6 Flash", slug: "gemini-3-6-flash", creator: "Google", intelligence: 49.8, costPerTask: 0.52, outputSpeed: 282 },
  { name: "Gemini 3.1 Pro Preview", slug: "gemini-3-1-pro-preview", creator: "Google", intelligence: 46.2, costPerTask: 0.34, outputSpeed: 132 },
  { name: "Gemini 2.5 Pro", slug: "gemini-2-5-pro", creator: "Google", intelligence: 26.0, costPerTask: 0.21, outputSpeed: 156 },
  { name: "Gemma 4 26B A4B", slug: "gemma-4-26b-a4b", creator: "Google", intelligence: 25.7, costPerTask: 0.044, outputSpeed: 231 },
  { name: "DeepSeek V4 Flash (max)", slug: "deepseek-v4-flash-max", creator: "DeepSeek", intelligence: 40.2, costPerTask: 0.0235, outputSpeed: 201 },
  { name: "DeepSeek V4 Flash 0731 (max)", slug: "deepseek-v4-flash-0731-max", creator: "DeepSeek", intelligence: 49.8, costPerTask: 0.027, outputSpeed: 194 },
  { name: "DeepSeek V4 Pro (max)", slug: "deepseek-v4-pro-max", creator: "DeepSeek", intelligence: 44.2, costPerTask: 0.048, outputSpeed: 176 },
  { name: "DeepSeek V4 Flash (high)", slug: "deepseek-v4-flash-high", creator: "DeepSeek", intelligence: 37.4, costPerTask: 0.049, outputSpeed: 215 },
  { name: "DeepSeek V3 (Dec)", slug: "deepseek-v3-dec", creator: "DeepSeek", intelligence: 14.2, costPerTask: 0.024, outputSpeed: 145 },
  { name: "Grok 4.5 (high)", slug: "grok-4-5-high", creator: "xAI", intelligence: 52.7, costPerTask: 0.47, outputSpeed: 119 },
  { name: "Grok 4.3 (high)", slug: "grok-4-3-high", creator: "xAI", intelligence: 36.5, costPerTask: 0.095, outputSpeed: 164 },
  { name: "MiniMax M3", slug: "minimax-m3", creator: "MiniMax", intelligence: 44.3, costPerTask: 0.14, outputSpeed: 186 },
  { name: "Kimi K3 (max)", slug: "kimi-k3-max", creator: "Kimi", intelligence: 57.0, costPerTask: 0.86, outputSpeed: 123 },
  { name: "Kimi K2.7 Code", slug: "kimi-k2-7-code", creator: "Kimi", intelligence: 41.9, costPerTask: 0.22, outputSpeed: 178 },
  { name: "GLM-5.2 (max)", slug: "glm-5-2-max", creator: "Z AI", intelligence: 51.0, costPerTask: 0.29, outputSpeed: 167 },
  { name: "GLM-4.7", slug: "glm-4-7", creator: "Z AI", intelligence: 33.6, costPerTask: 0.36, outputSpeed: 208 },
  { name: "Qwen3.7 Max", slug: "qwen3-7-max", creator: "Alibaba", intelligence: 46.0, costPerTask: 1.28, outputSpeed: 141 },
  { name: "Qwen3.6 Plus", slug: "qwen3-6-plus", creator: "Alibaba", intelligence: 39.6, costPerTask: 0.36, outputSpeed: 193 },
  { name: "Qwen3.5 122B A10B", slug: "qwen3-5-122b-a10b", creator: "Alibaba", intelligence: 32.2, costPerTask: 0.26, outputSpeed: 226 },
  { name: "Nemotron 3 Ultra", slug: "nemotron-3-ultra", creator: "NVIDIA", intelligence: 38.9, costPerTask: 0.41, outputSpeed: 198 },
  { name: "Mistral Medium 3.5", slug: "mistral-medium-3-5", creator: "Mistral", intelligence: 30.0, costPerTask: 0.64, outputSpeed: 237 },
  { name: "Llama 4 Scout", slug: "llama-4-scout", creator: "Meta", intelligence: 10.0, costPerTask: 0.0105, outputSpeed: 289 },
  { name: "Nova 2.0 Pro Preview", slug: "nova-2-pro-preview", creator: "Amazon", intelligence: 21.8, costPerTask: 0.18, outputSpeed: 192 },
  { name: "Hy3", slug: "hy3", creator: "Other", intelligence: 41.2, costPerTask: 0.033, outputSpeed: 147 },
];

function toModel(row: DemoModel, index: number): ModelPoint {
  return {
    id: `demo-${row.slug}-${index}`,
    slug: row.slug,
    name: row.name,
    creator: row.creator,
    creatorId: null,
    releaseDate: row.releaseDate ?? null,
    reasoning:
      row.reasoning ??
      (row.name.toLowerCase().includes("high") ||
        row.name.toLowerCase().includes("max")),
    intelligence: row.intelligence,
    coding: row.coding ?? null,
    agentic: row.agentic ?? null,
    costPerTask: row.costPerTask,
    inputPrice: row.inputPrice ?? null,
    outputPrice: row.outputPrice ?? null,
    blendedPrice: row.blendedPrice ?? null,
    outputSpeed: row.outputSpeed,
    latency: row.latency ?? null,
  };
}

export function getDemoCatalog(
  notice?: string,
  noticeKey?: SourceNoticeKey,
  noticeStatus?: number,
): ModelCatalog {
  return {
    models: demoRows.map(toModel),
    syncedAt: new Date().toISOString(),
    refreshIntervalMs: CATALOG_REFRESH_MS,
    indexVersion: 4.1,
    source: {
      mode: "demo",
      provider: "Artificial Analysis",
      tier: "demo",
      url: "https://artificialanalysis.ai/",
      notice:
        notice ??
        "未检测到 API Key，当前使用示例数据。配置后会自动切换为实时数据。",
      noticeKey: noticeKey ?? (notice ? undefined : "missingApiKey"),
      noticeStatus,
    },
  };
}
