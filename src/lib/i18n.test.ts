import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  LOCALE_OPTIONS,
  detectLocale,
  isLocale,
  translate,
} from "@/lib/i18n";

describe("i18n", () => {
  it("supports the three configured locales", () => {
    expect(LOCALE_OPTIONS.map((option) => option.value)).toEqual([
      "zh-CN",
      "en",
      "ja",
    ]);
    expect(isLocale(DEFAULT_LOCALE)).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ja")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("interpolates locale-specific messages", () => {
    expect(translate("zh-CN", "search.matchingModels", { count: 3 })).toBe(
      "3 个匹配模型",
    );
    expect(translate("en", "search.matchingModels", { count: 3 })).toBe(
      "3 matching models",
    );
    expect(translate("ja", "search.matchingModels", { count: 3 })).toBe(
      "3 件の一致モデル",
    );
  });

  it("detects the first supported browser language and falls back to Chinese", () => {
    expect(detectLocale(["fr-FR", "ja-JP"])).toBe("ja");
    expect(detectLocale(["en-US", "zh-CN"])).toBe("en");
    expect(detectLocale(["zh-TW"])).toBe("zh-CN");
    expect(detectLocale(["fr-FR"])).toBe(DEFAULT_LOCALE);
  });
});
