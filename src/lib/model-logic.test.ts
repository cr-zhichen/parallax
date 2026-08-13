import { describe, expect, it } from "vitest";

import {
  findBalancedAlternatives,
  findStrictAlternatives,
  getKneeRecommendations,
  getParetoFrontier,
  getReasoningVariantGroups,
  pickDefaultModel,
  searchModels,
} from "@/lib/model-logic";
import type { ModelPoint } from "@/lib/models";

function model(
  id: string,
  intelligence: number,
  costPerTask: number,
): ModelPoint {
  return {
    id,
    slug: id,
    name: id,
    creator: "Test",
    creatorId: null,
    releaseDate: null,
    reasoning: false,
    intelligence,
    coding: null,
    agentic: null,
    costPerTask,
    inputPrice: null,
    outputPrice: null,
    blendedPrice: null,
    outputSpeed: null,
    latency: null,
  };
}

describe("findStrictAlternatives", () => {
  it("only returns models that are no weaker and no more expensive", () => {
    const selected = model("selected", 50, 0.5);
    const strongerCheaper = model("stronger-cheaper", 54, 0.3);
    const equalCheaper = model("equal-cheaper", 50, 0.4);
    const weakerCheaper = model("weaker-cheaper", 49, 0.2);
    const strongerExpensive = model("stronger-expensive", 56, 0.6);

    const result = findStrictAlternatives(
      [
        selected,
        strongerCheaper,
        equalCheaper,
        weakerCheaper,
        strongerExpensive,
      ],
      selected,
    );

    expect(result.map((item) => item.id)).toEqual([
      "stronger-cheaper",
      "equal-cheaper",
    ]);
  });
});

describe("findBalancedAlternatives", () => {
  it("allows a small score loss or cost increase but excludes strict alternatives", () => {
    const selected = model("selected", 50, 0.5);
    const strict = model("strict", 52, 0.4);
    const closeScore = model("close-score", 48.5, 0.3);
    const modestPremium = model("modest-premium", 53, 0.6);
    const tooWeak = model("too-weak", 46, 0.2);

    const result = findBalancedAlternatives(
      [selected, strict, closeScore, modestPremium, tooWeak],
      selected,
    );

    expect(result.map((item) => item.id)).toEqual([
      "modest-premium",
      "close-score",
    ]);
  });
});

describe("getParetoFrontier", () => {
  it("keeps each new intelligence maximum as cost increases", () => {
    const result = getParetoFrontier([
      model("a", 20, 0.1),
      model("dominated", 18, 0.2),
      model("b", 30, 0.3),
      model("c", 35, 0.7),
      model("also-dominated", 32, 0.8),
    ]);

    expect(result.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });
});

describe("pickDefaultModel", () => {
  it("selects the global knee on the Pareto frontier in log-cost space", () => {
    const result = pickDefaultModel([
      model("cheapest", 10, 0.01),
      model("global-knee", 45, 0.03),
      model("later-frontier", 50, 0.2),
      model("strongest", 60, 1),
    ]);

    expect(result?.id).toBe("global-knee");
  });

  it("excludes dominated models before finding the knee", () => {
    const result = pickDefaultModel([
      model("cheapest", 10, 0.01),
      model("global-knee", 45, 0.03),
      model("dominated", 44, 0.04),
      model("strongest", 60, 1),
    ]);

    expect(result?.id).toBe("global-knee");
  });

  it("uses distance to the ideal point when the frontier has no distinct knee", () => {
    const result = pickDefaultModel([
      model("cheapest", 10, 0.01),
      model("balanced", 35, 0.1),
      model("strongest", 60, 1),
    ]);

    expect(result?.id).toBe("balanced");
  });
});

describe("getKneeRecommendations", () => {
  it("ranks Pareto-frontier models by knee score and excludes dominated models", () => {
    const result = getKneeRecommendations(
      [
        model("cheapest", 10, 0.01),
        model("global-knee", 45, 0.03),
        model("later-frontier", 50, 0.2),
        model("strongest", 60, 1),
        model("dominated", 44, 0.04),
      ],
      3,
    );

    expect(result.map((item) => item.id)).toEqual([
      "global-knee",
      "later-frontier",
      "cheapest",
    ]);
    expect(result[0].kneeScore).toBeGreaterThan(result[1].kneeScore);
    expect(result.every((item) => item.id !== "dominated")).toBe(true);
  });

  it("returns a zero-score recommendation for a single-model frontier", () => {
    const [result] = getKneeRecommendations([model("only", 40, 0.1)]);

    expect(result.id).toBe("only");
    expect(result.kneeScore).toBe(0);
    expect(result.idealDistance).toBe(0);
  });
});

describe("getReasoningVariantGroups", () => {
  it("groups explicit reasoning levels by creator and base model in level order", () => {
    const models = [
      {
        ...model("luna-non-reasoning", 30, 0.008),
        name: "GPT Luna (Non-reasoning)",
        creator: "OpenAI",
      },
      {
        ...model("luna-high", 46, 0.029),
        name: "GPT Luna (high)",
        creator: "OpenAI",
      },
      {
        ...model("luna-medium", 38, 0.015),
        name: "GPT Luna (medium)",
        creator: "OpenAI",
      },
      {
        ...model("luna-xhigh", 49, 0.043),
        name: "GPT Luna (x-high)",
        creator: "OpenAI",
      },
      {
        ...model("other-creator", 50, 0.05),
        name: "GPT Luna (max)",
        creator: "Other",
      },
    ];

    const result = getReasoningVariantGroups(models);

    expect(result).toHaveLength(1);
    expect(result[0].baseName).toBe("GPT Luna");
    expect(result[0].models.map((item) => item.id)).toEqual([
      "luna-non-reasoning",
      "luna-medium",
      "luna-high",
      "luna-xhigh",
    ]);
  });

  it("accepts non-reasoning as the first reasoning variant", () => {
    const models = [
      {
        ...model("luna-non-reasoning", 30, 0.008),
        name: "GPT Luna (Non-reasoning, High Effort)",
        creator: "OpenAI",
      },
      {
        ...model("luna-high", 46, 0.029),
        name: "GPT Luna (high)",
        creator: "OpenAI",
      },
    ];

    const result = getReasoningVariantGroups(models);

    expect(result[0].models.map((item) => item.name)).toEqual([
      "GPT Luna (Non-reasoning, High Effort)",
      "GPT Luna (high)",
    ]);
  });

  it("does not infer reasoning levels from ordinary model-name words", () => {
    const models = [
      { ...model("qwen-max", 40, 0.2), name: "Qwen Max" },
      { ...model("qwen-high", 42, 0.3), name: "Qwen High" },
      { ...model("dated", 44, 0.4), name: "Qwen (Dec)" },
      { ...model("context", 46, 0.5), name: "Qwen (High Context)" },
    ];

    expect(getReasoningVariantGroups(models)).toEqual([]);
  });

  it("matches reasoning effort labels inside shared parenthesized details", () => {
    const models = [
      {
        ...model("deepseek-high", 44, 0.05),
        name: "DeepSeek V4 Pro (Reasoning, High Effort)",
        creator: "DeepSeek",
      },
      {
        ...model("deepseek-max", 48, 0.08),
        name: "DeepSeek V4 Pro (Reasoning, Max Effort)",
        creator: "DeepSeek",
      },
      {
        ...model("deepseek-preview", 42, 0.04),
        name: "DeepSeek V4 Pro (Preview)",
        creator: "DeepSeek",
      },
    ];

    const result = getReasoningVariantGroups(models);

    expect(result).toHaveLength(1);
    expect(result[0].baseName).toBe("DeepSeek V4 Pro");
    expect(result[0].models.map((item) => item.id)).toEqual([
      "deepseek-high",
      "deepseek-max",
    ]);
  });

  it("matches reasoning levels independently of other parenthesized details", () => {
    const models = [
      {
        ...model("claude-opus-5-low", 50.6, 0.4263),
        name: "Claude Opus 5 (Adaptive Reasoning, Low Effort)",
        creator: "Anthropic",
      },
      {
        ...model("claude-opus-5-medium", 56.3, 0.7224),
        name: "Claude Opus 5 (Adaptive Reasoning, Medium Effort)",
        creator: "Anthropic",
      },
      {
        ...model("claude-opus-5-max-preview", 60.7, 2.3365),
        name: "Claude Opus 5 (Adaptive Reasoning, Max Effort, Preview)",
        creator: "Anthropic",
      },
    ];

    const result = getReasoningVariantGroups(models);

    expect(result).toHaveLength(1);
    expect(result[0].baseName).toBe("Claude Opus 5");
    expect(result[0].models.map((item) => item.id)).toEqual([
      "claude-opus-5-low",
      "claude-opus-5-medium",
      "claude-opus-5-max-preview",
    ]);
  });
});

describe("searchModels", () => {
  it("matches model names, slugs, and creators without case sensitivity", () => {
    const models = [
      {
        ...model("one", 20, 0.1),
        name: "Claude Sonnet",
        slug: "claude-sonnet",
        creator: "Anthropic",
      },
      {
        ...model("two", 30, 0.2),
        name: "GPT Mini",
        slug: "gpt-mini",
        creator: "OpenAI",
      },
    ];

    expect(searchModels(models, "SONNET").map((item) => item.id)).toEqual([
      "one",
    ]);
    expect(searchModels(models, "gpt-mini").map((item) => item.id)).toEqual([
      "two",
    ]);
    expect(searchModels(models, "anthropic").map((item) => item.id)).toEqual([
      "one",
    ]);
  });

  it("supports multi-word matches across different fields", () => {
    const models = [
      {
        ...model("one", 20, 0.1),
        name: "Claude Sonnet",
        slug: "claude-sonnet",
        creator: "Anthropic",
      },
      {
        ...model("two", 30, 0.2),
        name: "Claude Opus",
        slug: "claude-opus",
        creator: "Anthropic",
      },
    ];

    expect(searchModels(models, "anthropic sonnet").map((item) => item.id)).toEqual([
      "one",
    ]);
  });

  it("sorts matches by release date descending and places unknown dates last", () => {
    const models = [
      {
        ...model("old", 20, 0.1),
        name: "GPT Old",
        releaseDate: "2025-02-10",
      },
      { ...model("unknown", 30, 0.2), name: "GPT Unknown" },
      {
        ...model("new", 40, 0.3),
        name: "GPT New",
        releaseDate: "2026-07-01",
      },
    ];

    expect(searchModels(models, "gpt").map((item) => item.id)).toEqual([
      "new",
      "old",
      "unknown",
    ]);
  });

  it("ignores blank queries", () => {
    const models = [model("one", 20, 0.1)];

    expect(searchModels(models, "   ")).toEqual([]);
  });
});
