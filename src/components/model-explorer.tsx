"use client";

import dynamic from "next/dynamic";
import {
  layoutWithLines,
  prepareWithSegments,
  setLocale as setPretextLocale,
} from "@chenglou/pretext";
import katex from "katex";
import { Moon, Sun, SunMoon } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";

import { getCreatorStyle } from "@/lib/creator-style";
import {
  chartableModels,
  creatorsFromModels,
  findBalancedAlternatives,
  findStrictAlternatives,
  getKneeRecommendations,
  pickDefaultModel,
  searchModels,
  type Alternative,
  type KneeRecommendation,
} from "@/lib/model-logic";
import {
  isChartableModel,
  type ModelCatalog,
  type ModelPoint,
} from "@/lib/models";
import {
  LOCALE_OPTIONS,
  type Locale,
  type Translator,
  useLocale,
} from "@/lib/i18n";

function ChartLoading() {
  const { t } = useLocale();
  return <div className="empty-chart">{t("loading")}</div>;
}

const ModelScatterPlot = dynamic(
  () =>
    import("@/components/model-scatter-plot").then(
      (module) => module.ModelScatterPlot,
    ),
  {
    ssr: false,
    loading: () => <ChartLoading />,
  },
);

interface ModelExplorerProps {
  initialCatalog: ModelCatalog;
}

type ThemePreference = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";
type XAxisScale = "log" | "linear";

const THEME_STORAGE_KEY = "parallax-theme";

function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

const THEME_CHANGE_EVENT = "parallax-theme-change";

function subscribeToThemePreference(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

function subscribeToSystemTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function useThemePreference() {
  const preference = useSyncExternalStore(
    subscribeToThemePreference,
    getStoredThemePreference,
    () => "system" as const,
  );
  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    () => "light" as const,
  );

  useEffect(() => {
    document.documentElement.dataset.theme = preference;
  }, [preference]);

  const setPreference = (nextPreference: ThemePreference) => {
    document.documentElement.dataset.theme = nextPreference;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    } catch {
      // Private browsing and restricted storage should not block theme changes.
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return {
    preference,
    resolvedTheme: preference === "system" ? systemTheme : preference,
    setPreference,
  };
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.73.084-.73 1.205.084 1.84 1.237 1.84 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function ThemeToggle({
  preference,
  onChange,
  t,
}: {
  preference: ThemePreference;
  onChange: (preference: ThemePreference) => void;
  t: Translator;
}) {
  const nextPreference: ThemePreference =
    preference === "light"
      ? "dark"
      : preference === "dark"
        ? "system"
        : "light";
  const currentLabel =
    preference === "light"
      ? t("theme.light")
      : preference === "dark"
        ? t("theme.dark")
        : t("theme.system");

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={t("theme.toggleAria", { current: currentLabel })}
      title={t("theme.toggleTitle", { current: currentLabel })}
      onClick={() => onChange(nextPreference)}
    >
      {preference === "light" ? (
        <Sun className="theme-toggle__icon" aria-hidden="true" />
      ) : preference === "dark" ? (
        <Moon className="theme-toggle__icon" aria-hidden="true" />
      ) : (
        <SunMoon className="theme-toggle__icon" aria-hidden="true" />
      )}
    </button>
  );
}

function LocaleSwitcher({
  locale,
  onChange,
  t,
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
  t: Translator;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedIndex = LOCALE_OPTIONS.findIndex(
    (option) => option.value === locale,
  );
  const [activeIndex, setActiveIndex] = useState(
    selectedIndex >= 0 ? selectedIndex : 0,
  );
  const switcherRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = `locale-options-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !switcherRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  const closeMenu = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const selectLocale = (nextLocale: Locale) => {
    onChange(nextLocale);
    closeMenu();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (isOpen) closeMenu();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => {
        if (!isOpen) return selectedIndex >= 0 ? selectedIndex : 0;
        const direction = event.key === "ArrowDown" ? 1 : -1;
        return (
          (current + direction + LOCALE_OPTIONS.length) % LOCALE_OPTIONS.length
        );
      });
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }

      const option = LOCALE_OPTIONS[activeIndex];
      if (option) selectLocale(option.value);
    }
  };

  return (
    <div
      ref={switcherRef}
      className={`locale-switcher ${isOpen ? "is-open" : ""}`}
      onBlur={(event) => {
        const nextTarget = event.relatedTarget;
        if (
          !(nextTarget instanceof Node) ||
          !event.currentTarget.contains(nextTarget)
        ) {
          setIsOpen(false);
        }
      }}
    >
      <span className="sr-only" id={`${listId}-label`}>
        {t("language")}
      </span>
      <button
        ref={triggerRef}
        type="button"
        className="locale-switcher__trigger"
        role="combobox"
        aria-label={t("language")}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-activedescendant={
          isOpen ? `${listId}-${activeIndex}` : undefined
        }
        aria-labelledby={`${listId}-label`}
        onClick={() => {
          setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
          setIsOpen((current) => !current);
        }}
        onKeyDown={handleKeyDown}
      >
        {LOCALE_OPTIONS[selectedIndex >= 0 ? selectedIndex : 0]?.label}
      </button>
      {isOpen ? (
        <div
          id={listId}
          className="locale-switcher__menu"
          role="listbox"
          aria-label={t("language")}
        >
          {LOCALE_OPTIONS.map((option, index) => (
            <button
              key={option.value}
              id={`${listId}-${index}`}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={option.value === locale}
              className={`locale-switcher__option ${index === activeIndex ? "is-active" : ""}`}
              onPointerDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectLocale(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatCost(value: number | null): string {
  if (value === null) return "—";
  if (value < 0.01) return `$${value.toFixed(3)}`;
  if (value < 0.1) return `$${value.toFixed(3)}`;
  if (value < 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number | null, suffix = ""): string {
  if (value === null) return "—";
  return `${value.toFixed(value >= 100 ? 0 : 1)}${suffix}`;
}

function formatSyncedAt(value: string, locale: Locale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  }).format(date);
}

function formatReleaseDate(value: string | null, locale: Locale): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path d="M4 9h10M10 5l4 4-4 4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="m13 13 4 4" />
    </svg>
  );
}

function ModelSearch({
  models,
  theme,
  locale,
  t,
  onSelect,
}: {
  models: ModelPoint[];
  theme: ResolvedTheme;
  locale: Locale;
  t: Translator;
  onSelect: (id: string) => void;
}) {
  const resultsId = `model-search-results-${useId().replace(/:/g, "")}`;
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const matches = useMemo(() => searchModels(models, query), [models, query]);
  const visibleMatches = matches.slice(0, 8);
  const activeResult = visibleMatches[activeIndex];

  const selectModel = (model: ModelPoint) => {
    setQuery(model.name);
    setActiveIndex(0);
    setIsOpen(false);
    onSelect(model.id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      event.currentTarget.blur();
      return;
    }

    if (visibleMatches.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        isOpen ? (current + 1) % visibleMatches.length : 0,
      );
      setIsOpen(true);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (current) =>
          isOpen
            ? (current - 1 + visibleMatches.length) % visibleMatches.length
            : visibleMatches.length - 1,
      );
      setIsOpen(true);
    } else if (event.key === "Enter" && isOpen && activeResult) {
      event.preventDefault();
      selectModel(activeResult);
    }
  };

  return (
    <div
      className="model-search"
      role="search"
      onBlur={(event) => {
        const nextTarget = event.relatedTarget;
        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <div className="model-search__field">
        <SearchIcon />
        <input
          type="search"
          value={query}
          placeholder={t("search.placeholder")}
          aria-label={t("search.label")}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen && query.trim().length > 0}
          aria-controls={resultsId}
          aria-activedescendant={
            isOpen && activeResult
              ? `${resultsId}-${activeIndex}`
              : undefined
          }
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {query ? (
          <button
            type="button"
            className="model-search__clear"
            aria-label={t("search.clear")}
            onClick={() => {
              setQuery("");
              setActiveIndex(0);
              setIsOpen(false);
            }}
          >
            ×
          </button>
        ) : null}
      </div>

      {isOpen && query.trim() ? (
        <div className="model-search__popover">
          <div className="model-search__summary" aria-live="polite">
            {matches.length > 0
              ? t("search.matchingModels", { count: matches.length })
              : t("search.noMatches")}
          </div>
          {visibleMatches.length > 0 ? (
            <div className="model-search__results" id={resultsId} role="listbox">
              {visibleMatches.map((model, index) => {
                const creatorStyle = getCreatorStyle(model.creator, theme);

                return (
                  <button
                    type="button"
                    id={`${resultsId}-${index}`}
                    key={model.id}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`model-search__result ${index === activeIndex ? "is-active" : ""}`}
                    onPointerDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectModel(model)}
                  >
                    <span
                      className={`legend-marker legend-marker--${creatorStyle.shape}`}
                      style={{
                        backgroundColor: creatorStyle.color,
                        color: creatorStyle.color,
                      }}
                    />
                    <span className="model-search__result-main">
                      <strong>{model.name}</strong>
                      <span>
                        {model.creator} · {t("search.published", {
                          date: formatReleaseDate(model.releaseDate, locale),
                        })}
                      </span>
                    </span>
                    <span className="model-search__result-metrics">
                      <span>
                        {t("metric.intelligence")} {formatNumber(model.intelligence)}
                      </span>
                      <span>
                        {t("metric.cost")} {formatCost(model.costPerTask)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AlternativeRow({
  model,
  t,
  onSelect,
  onHover,
}: {
  model: Alternative;
  t: Translator;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const scoreText = `${model.scoreDelta >= 0 ? "+" : ""}${model.scoreDelta.toFixed(1)}`;
  const costPercent = Math.round(model.costDeltaRatio * 100);
  const costText = `${costPercent > 0 ? "+" : ""}${costPercent}%`;

  return (
    <button
      className="alternative-row"
      type="button"
      onClick={() => onSelect(model.id)}
      onMouseEnter={() => onHover(model.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(model.id)}
      onBlur={() => onHover(null)}
    >
      <span className="alternative-row__main">
        <strong>{model.name}</strong>
        <span>{model.creator}</span>
      </span>
      <span className="alternative-row__deltas">
        <span className={model.scoreDelta >= 0 ? "delta-positive" : "delta-neutral"}>
          {t("alternative.score")} {scoreText}
        </span>
        <span className={model.costDeltaRatio <= 0 ? "delta-positive" : "delta-neutral"}>
          {t("alternative.cost")} {costText}
        </span>
      </span>
      <ArrowIcon />
    </button>
  );
}

function RecommendationCard({
  model,
  t,
  isSelected,
  onSelect,
}: {
  model: KneeRecommendation;
  t: Translator;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={`recommendation-card ${isSelected ? "is-selected" : ""}`}
      aria-label={t("recommendations.select", { model: model.name })}
      onClick={() => onSelect(model.id)}
    >
      <span className="recommendation-card__main">
        <span className="recommendation-card__name">
          <strong>{model.name}</strong>
        </span>
      </span>
      <span className="recommendation-card__score">
        <small>{t("recommendations.score")}</small>
        <strong>{model.kneeScore.toFixed(3)}</strong>
      </span>
      <span className="recommendation-card__stats">
        <span>
          {t("metric.intelligence")} {formatNumber(model.intelligence)}
        </span>
        <span>
          {t("metric.cost")} {formatCost(model.costPerTask)}
        </span>
      </span>
    </button>
  );
}

const KNEE_COST_FORMULA = String.raw`
x = \frac{\log_{10}(C) - \log_{10}(C_0)}{\log_{10}(C_1) - \log_{10}(C_0)}`;
const KNEE_INTELLIGENCE_FORMULA = String.raw`
y = \frac{I - I_0}{I_1 - I_0}`;
const KNEE_SCORE_FORMULA = String.raw`\mathrm{kneeScore} = y - x`;
const KNEE_DISTANCE_FORMULA = String.raw`\mathrm{idealDistance} = \sqrt{x^2 + (1-y)^2}`;

const FORMULA_TOOLTIP_MAX_WIDTH = 400;
const FORMULA_TOOLTIP_VIEWPORT_GUTTER = 48;
const FORMULA_TOOLTIP_HORIZONTAL_INSET = 30;

let configuredPretextLocale: Locale | null = null;

function ensurePretextLocale(locale: Locale) {
  if (configuredPretextLocale === locale) return;
  setPretextLocale(locale);
  configuredPretextLocale = locale;
}

function useViewportWidth() {
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);
    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  return viewportWidth;
}

function getFormulaTooltipContentWidth(viewportWidth: number | null) {
  if (viewportWidth === null) return null;

  const tooltipWidth = Math.min(
    FORMULA_TOOLTIP_MAX_WIDTH,
    Math.max(0, viewportWidth - FORMULA_TOOLTIP_VIEWPORT_GUTTER),
  );
  return Math.max(1, tooltipWidth - FORMULA_TOOLTIP_HORIZONTAL_INSET);
}

function PretextParagraph({
  text,
  className,
  font,
  lineHeight,
  maxWidth,
  locale,
}: {
  text: string;
  className: string;
  font: string;
  lineHeight: number;
  maxWidth: number | null;
  locale: Locale;
}) {
  const [laidOutText, setLaidOutText] = useState<{
    font: string;
    maxWidth: number;
    source: string;
    value: string | null;
  } | null>(null);

  useEffect(() => {
    if (maxWidth === null || maxWidth <= 0) return;

    let nextLayout: string | null = null;
    try {
      ensurePretextLocale(locale);
      const prepared = prepareWithSegments(text, font);
      const { lines } = layoutWithLines(prepared, maxWidth, lineHeight);
      nextLayout = lines.map((line) => line.text).join("\n");
    } catch {
      // Canvas and Intl.Segmenter are required by Pretext. CSS remains the
      // fallback for restricted browser environments.
    }

    const updateTimer = window.setTimeout(
      () => setLaidOutText({ font, maxWidth, source: text, value: nextLayout }),
      0,
    );
    return () => window.clearTimeout(updateTimer);
  }, [font, lineHeight, locale, maxWidth, text]);

  const renderedText =
    maxWidth !== null &&
    laidOutText?.font === font &&
    laidOutText.maxWidth === maxWidth &&
    laidOutText.source === text
      ? (laidOutText.value ?? text)
      : text;

  return (
    <span className={`${className} recommendations__pretext`}>
      {renderedText}
    </span>
  );
}

function KaTeXFormula({ expression }: { expression: string }) {
  const markup = useMemo(
    () =>
      katex.renderToString(expression, {
        displayMode: false,
        throwOnError: false,
      }),
    [expression],
  );

  return (
    <span
      className="recommendations__formula-display"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

function KneeFormulaHint({ t, locale }: { t: Translator; locale: Locale }) {
  const viewportWidth = useViewportWidth();
  const tooltipContentWidth = getFormulaTooltipContentWidth(viewportWidth);

  return (
    <span
      className="recommendations__formula-hint"
      tabIndex={0}
      aria-label={t("recommendations.formulaTitle")}
    >
      ?
      <span className="recommendations__formula-tooltip" role="tooltip">
        <strong>{t("recommendations.formulaTitle")}</strong>
        <PretextParagraph
          text={t("recommendations.formulaText")}
          className="recommendations__formula-intro"
          font="650 12px Inter"
          lineHeight={18.6}
          maxWidth={tooltipContentWidth}
          locale={locale}
        />
        <PretextParagraph
          text={t("recommendations.formulaVariables")}
          className="recommendations__formula-variables"
          font="500 10px Inter"
          lineHeight={15}
          maxWidth={tooltipContentWidth}
          locale={locale}
        />
        <span className="recommendations__formula-list">
          <span className="recommendations__formula-row">
            <PretextParagraph
              text={t("recommendations.formulaCostLabel")}
              className="recommendations__formula-row-label"
              font="700 10px Inter"
              lineHeight={13}
              maxWidth={78}
              locale={locale}
            />
            <KaTeXFormula expression={KNEE_COST_FORMULA} />
          </span>
          <span className="recommendations__formula-row">
            <PretextParagraph
              text={t("recommendations.formulaIntelligenceLabel")}
              className="recommendations__formula-row-label"
              font="700 10px Inter"
              lineHeight={13}
              maxWidth={78}
              locale={locale}
            />
            <KaTeXFormula expression={KNEE_INTELLIGENCE_FORMULA} />
          </span>
          <span className="recommendations__formula-row">
            <PretextParagraph
              text={t("recommendations.formulaScoreLabel")}
              className="recommendations__formula-row-label"
              font="700 10px Inter"
              lineHeight={13}
              maxWidth={78}
              locale={locale}
            />
            <KaTeXFormula expression={KNEE_SCORE_FORMULA} />
          </span>
        </span>
        <PretextParagraph
          text={t("recommendations.formulaMeaning")}
          className="recommendations__formula-meaning"
          font="600 11px Inter"
          lineHeight={17.05}
          maxWidth={tooltipContentWidth}
          locale={locale}
        />
        <span className="recommendations__formula-tie">
          <PretextParagraph
            text={t("recommendations.formulaTieLabel")}
            className="recommendations__formula-tie-label"
            font="700 10px Inter"
            lineHeight={13}
            maxWidth={78}
            locale={locale}
          />
          <KaTeXFormula expression={KNEE_DISTANCE_FORMULA} />
        </span>
        <PretextParagraph
          text={t("recommendations.formulaSelection")}
          className="recommendations__formula-selection"
          font="500 11px Inter"
          lineHeight={16.5}
          maxWidth={tooltipContentWidth}
          locale={locale}
        />
      </span>
    </span>
  );
}

function getSelectedModel(
  catalog: ModelCatalog,
  selectedId: string | null,
): ModelPoint | null {
  if (selectedId === null) return null;
  return catalog.models.find((model) => model.id === selectedId) ?? null;
}

function getLocalizedSourceNotice(
  catalog: ModelCatalog,
  t: Translator,
): string | undefined {
  switch (catalog.source.noticeKey) {
    case "missingApiKey":
      return t("source.missingApiKey");
    case "apiError":
      return t("source.apiError", {
        status: catalog.source.noticeStatus ?? "?",
      });
    case "unavailable":
      return t("source.unavailable");
    default:
      return catalog.source.notice;
  }
}

export function ModelExplorer({ initialCatalog }: ModelExplorerProps) {
  const catalog = initialCatalog;
  const initialSelected = pickDefaultModel(initialCatalog.models);
  const { preference, resolvedTheme, setPreference } = useThemePreference();
  const { locale, setLocale, t } = useLocale();
  const chartMetaRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelected?.id ?? null,
  );
  const [activeCreators, setActiveCreators] = useState<Set<string>>(
    () => new Set(),
  );
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [xAxisScale, setXAxisScale] = useState<XAxisScale>("log");
  const [hoveredAlternativeId, setHoveredAlternativeId] = useState<string | null>(
    null,
  );
  const [isChartActionsWrapped, setIsChartActionsWrapped] =
    useState(false);

  const handleSelectModel = (id: string) => {
    setHoveredAlternativeId(null);
    setSelectedId(id);
  };

  const handleClearSelection = () => {
    setHoveredAlternativeId(null);
    setSelectedId(null);
  };

  useEffect(() => {
    const meta = chartMetaRef.current;
    if (!meta) return;

    const firstLegend = meta.firstElementChild;
    const actions = meta.querySelector<HTMLElement>(".chart-card__actions");
    if (!(firstLegend instanceof HTMLElement) || !actions) return;

    const updateWrapState = () => {
      const isWrapped = actions.offsetTop > firstLegend.offsetTop;
      setIsChartActionsWrapped((current) =>
        current === isWrapped ? current : isWrapped,
      );
    };

    updateWrapState();
    const observer =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(updateWrapState)
        : null;
    observer?.observe(meta);
    window.addEventListener("resize", updateWrapState);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateWrapState);
    };
  }, [locale]);

  const selected = getSelectedModel(catalog, selectedId);
  const selectedIsComparable = selected !== null && isChartableModel(selected);
  const chartModels = useMemo(
    () => chartableModels(catalog.models),
    [catalog.models],
  );
  const recommendedModels = useMemo(
    () => getKneeRecommendations(catalog.models, 5),
    [catalog.models],
  );
  const creators = useMemo(
    () => creatorsFromModels(chartModels),
    [chartModels],
  );
  const creatorCounts = useMemo(
    () =>
      new Map(
        creators.map((creator) => [
          creator,
          chartModels.filter((model) => model.creator === creator).length,
        ]),
      ),
    [chartModels, creators],
  );
  const strictAlternatives = useMemo(
    () => (selected ? findStrictAlternatives(catalog.models, selected) : []),
    [catalog.models, selected],
  );
  const balancedAlternatives = useMemo(
    () => (selected ? findBalancedAlternatives(catalog.models, selected) : []),
    [catalog.models, selected],
  );
  const alternativeIds = useMemo(
    () => new Set(strictAlternatives.map((model) => model.id)),
    [strictAlternatives],
  );
  const sourceNotice = getLocalizedSourceNotice(catalog, t);
  const xAxisScaleLabel = t(
    xAxisScale === "log" ? "chart.xScale.logCost" : "chart.xScale.linearCost",
  );

  if (chartModels.length === 0) {
    return (
      <main className="site-shell empty-state">
        <h1>{t("empty.noModels")}</h1>
        <p>{t("empty.checkApi")}</p>
      </main>
    );
  }

  return (
    <main>
      <header className="site-header site-shell">
        <a className="brand" href="#top" aria-label={t("brand.home")}>
          <span>
            <strong>Parallax</strong>
            <small>AI MODEL LANDSCAPE</small>
          </span>
        </a>
        <div className="site-header__actions">
          <div className="source-status">
            <span>
              {formatSyncedAt(catalog.syncedAt, locale)} {t("status.updated")}
            </span>
          </div>
          <a
            className="github-link"
            href="https://github.com/cr-zhichen/parallax"
            target="_blank"
            rel="noreferrer"
            aria-label={t("github.repository")}
            title={t("github.repository")}
          >
            <GitHubMark className="github-link__icon" />
          </a>
          <LocaleSwitcher locale={locale} onChange={setLocale} t={t} />
          <ThemeToggle preference={preference} onChange={setPreference} t={t} />
        </div>
      </header>

      <section className="hero site-shell" id="top">
        <div className="hero__copy">
          <p className="eyebrow">{t("hero.eyebrow")}</p>
          <h1>
            {t("hero.titleLead")}<span>{t("hero.titleAccent")}</span>
          </h1>
          <p className="hero__description">{t("hero.description")}</p>
        </div>
        <div className="hero__stats" aria-label={t("stats.overall")}>
          <div>
            <strong>{catalog.models.length}</strong>
            <span>{t("stats.overall")}</span>
          </div>
          <div>
            <strong>{chartModels.length}</strong>
            <span>{t("stats.comparable")}</span>
          </div>
          <div>
            <strong>{creators.length}</strong>
            <span>{t("stats.creators")}</span>
          </div>
        </div>
      </section>

      {sourceNotice ? (
        <section className="notice-bar site-shell" role="status">
          <span className="notice-bar__icon">i</span>
          <span>{sourceNotice}</span>
        </section>
      ) : null}

      <section className="explorer site-shell" aria-labelledby="explorer-title">
        <div className="explorer__heading">
          <div>
            <p className="section-index">{t("explorer.sectionIndex")}</p>
            <h2 id="explorer-title">{t("explorer.title")}</h2>
            <p>{t("explorer.description")}</p>
          </div>
          <ModelSearch
            models={catalog.models}
            theme={resolvedTheme}
            locale={locale}
            t={t}
            onSelect={(id) => {
              handleSelectModel(id);
              setActiveCreators(new Set());
            }}
          />
        </div>

        <div className="creator-legend" aria-label={t("creatorFilter.label")}>
          <button
            type="button"
            className={
              activeCreators.size === 0
                ? "legend-chip is-active"
                : "legend-chip"
            }
            aria-pressed={activeCreators.size === 0}
            onClick={() => setActiveCreators(new Set())}
          >
            <span className="legend-chip__all">ALL</span>
            {t("creatorFilter.all")}
          </button>
          {creators.map((creator) => {
            const creatorStyle = getCreatorStyle(creator, resolvedTheme);
            return (
              <button
                type="button"
                key={creator}
                className={
                  activeCreators.has(creator)
                    ? "legend-chip is-active"
                    : "legend-chip"
                }
                aria-pressed={activeCreators.has(creator)}
                onClick={() => {
                  setActiveCreators((current) => {
                    const next = new Set(current);
                    if (next.has(creator)) {
                      next.delete(creator);
                    } else {
                      next.add(creator);
                    }
                    return next;
                  });
                }}
              >
                <span
                  className={`legend-marker legend-marker--${creatorStyle.shape}`}
                  style={{
                    backgroundColor: creatorStyle.color,
                    color: creatorStyle.color,
                  }}
                />
                {creator}
                <small>{creatorCounts.get(creator)}</small>
              </button>
            );
          })}
        </div>

        {recommendedModels.length > 0 ? (
          <section
            className="recommendations"
            aria-labelledby="recommendations-title"
          >
            <div className="recommendations__heading">
              <div>
                <div className="recommendations__title-row">
                  <h3 id="recommendations-title">
                    {t("recommendations.title")}
                  </h3>
                </div>
                <p className="recommendations__subtitle">
                  {t("recommendations.subtitle")}
                </p>
              </div>
              <KneeFormulaHint t={t} locale={locale} />
            </div>
            <div className="recommendations__list">
              {recommendedModels.map((model) => (
                <RecommendationCard
                  key={model.id}
                  model={model}
                  t={t}
                  isSelected={selected?.id === model.id}
                  onSelect={(id) => {
                    handleSelectModel(id);
                    setActiveCreators(new Set());
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="analysis-grid">
          <section className="chart-card" aria-label={t("chart.areaLabel")}>
            <div className="chart-card__meta" ref={chartMetaRef}>
              <div>
                <span className="chart-key chart-key--frontier" />
                {t("chart.frontier")}
              </div>
              <div>
                <span className="chart-key chart-key--alternative" />
                {t("chart.strictAlternative")}
              </div>
              <div>
                <span className="chart-key chart-key--reasoning" />
                {t("chart.reasoningLevels")}
              </div>
              <div
                className={`chart-card__actions ${isChartActionsWrapped ? "is-wrapped" : ""}`}
              >
                <button
                  type="button"
                  className={`chart-label-toggle ${showAllLabels ? "is-active" : ""}`}
                  aria-pressed={showAllLabels}
                  onClick={() => setShowAllLabels((current) => !current)}
                >
                  <span aria-hidden="true" />
                  {t("chart.showAllLabels")}
                </button>
                <button
                  type="button"
                  className={`chart-scale-toggle ${xAxisScale === "log" ? "is-active" : ""}`}
                  aria-pressed={xAxisScale === "log"}
                  aria-label={t("chart.xScale.toggleAria", {
                    current: xAxisScaleLabel,
                  })}
                  title={t("chart.xScale.toggleTitle", {
                    current: xAxisScaleLabel,
                  })}
                  onClick={() =>
                    setXAxisScale((current) =>
                      current === "log" ? "linear" : "log",
                    )
                  }
                >
                  <span aria-hidden="true" />
                  {xAxisScaleLabel}
                </button>
              </div>
            </div>
            <ModelScatterPlot
              models={chartModels}
              selected={selected}
              hoveredModelId={hoveredAlternativeId}
              alternativeIds={alternativeIds}
              activeCreators={activeCreators}
              showAllLabels={showAllLabels}
              xAxisScale={xAxisScale}
              theme={resolvedTheme}
              locale={locale}
              onSelect={handleSelectModel}
              onClearSelection={handleClearSelection}
            />
          </section>

          <div
            className={`decision-card selected-model ${selected ? "" : "decision-card--empty"}`}
          >
            <div className="decision-card__heading selected-model__heading">
              <h4 className="selected-model__name">
                <span>{selected?.name ?? t("selection.placeholder")}</span>
              </h4>
              {selected && (
                <span className="selected-model__watermark">{selected.creator}</span>
              )}
            </div>
            {selected ? (
              <div className="metric-grid">
                <div className="metric-grid__item">
                  <span className="metric-grid__label">
                    {t("metric.intelligenceIndex")}
                  </span>
                  <strong className="metric-grid__value">
                    {formatNumber(selected.intelligence)}
                  </strong>
                </div>
                <div className="metric-grid__item">
                  <span className="metric-grid__label">{t("metric.taskCost")}</span>
                  <strong className="metric-grid__value">
                    {formatCost(selected.costPerTask)}
                  </strong>
                </div>
                <div className="metric-grid__item">
                  <span className="metric-grid__label">{t("metric.outputSpeed")}</span>
                  <strong className="metric-grid__value">
                    {formatNumber(selected.outputSpeed)}
                    {selected.outputSpeed !== null && (
                      <span className="metric-grid__unit">t/s</span>
                    )}
                  </strong>
                </div>
                <div className="metric-grid__item">
                  <span className="metric-grid__label">
                    {t("metric.firstTokenLatency")}
                  </span>
                  <strong className="metric-grid__value">
                    {formatNumber(selected.latency)}
                    {selected.latency !== null && (
                      <span className="metric-grid__unit">s</span>
                    )}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="decision-card__body decision-card__body--empty">
                <p className="selection-message">
                  {t("selection.emptyMessage")}
                </p>
              </div>
            )}
          </div>

          <aside className="decision-panel" aria-label={t("alternatives.panelLabel")}>
            <div
              className={`decision-card alternatives-section ${selected ? "" : "decision-card--empty"}`}
            >
              <div className="decision-card__heading">
                <div>
                  <h4>
                    {!selected
                      ? t("alternatives.label")
                      : !selectedIsComparable
                        ? t("alternatives.missingData")
                        : strictAlternatives.length > 0
                          ? t("alternatives.strictCount", {
                              count: strictAlternatives.length,
                            })
                          : t("alternatives.onFrontier")}
                  </h4>
                </div>
                <span className="decision-card__count">
                  {selectedIsComparable
                    ? String(strictAlternatives.length).padStart(2, "0")
                    : "—"}
                </span>
              </div>

              {!selected ? (
                <div className="decision-card__body decision-card__body--empty">
                  <p className="selection-message">
                    {t("alternatives.chooseFirst")}
                  </p>
                </div>
              ) : !selectedIsComparable ? (
                <div className="decision-card__body decision-card__body--empty">
                  <p className="selection-message">
                    {t("alternatives.strictMissingMessage")}
                  </p>
                </div>
              ) : strictAlternatives.length > 0 ? (
                <div className="alternative-list">
                  {strictAlternatives.map((model) => (
                    <AlternativeRow
                      key={model.id}
                      model={model}
                      t={t}
                      onSelect={handleSelectModel}
                      onHover={setHoveredAlternativeId}
                    />
                  ))}
                </div>
              ) : (
                <div className="decision-card__body decision-card__body--empty">
                  <p className="frontier-message">
                    {t("alternatives.none")}
                  </p>
                </div>
              )}
            </div>

            <div
              className={`decision-card alternatives-section alternatives-section--balanced ${selected ? "" : "decision-card--empty"}`}
            >
              <div className="decision-card__heading">
                <div>
                  <h4>
                    {!selected
                      ? t("alternatives.balancedLabel")
                      : !selectedIsComparable
                        ? t("alternatives.missingData")
                        : balancedAlternatives.length > 0
                          ? t("alternatives.balancedCount", {
                              count: balancedAlternatives.length,
                            })
                          : t("alternatives.balancedNone")}
                  </h4>
                </div>
                <span className="decision-card__count">
                  {selectedIsComparable
                    ? String(balancedAlternatives.length).padStart(2, "0")
                    : "—"}
                </span>
              </div>

              {!selected ? (
                <div className="decision-card__body decision-card__body--empty">
                  <p className="selection-message">
                    {t("alternatives.chooseFirst")}
                  </p>
                </div>
              ) : !selectedIsComparable ? (
                <div className="decision-card__body decision-card__body--empty">
                  <p className="selection-message">
                    {t("alternatives.balancedMissingMessage")}
                  </p>
                </div>
              ) : balancedAlternatives.length > 0 ? (
                <div className="alternative-list">
                  {balancedAlternatives.map((model) => (
                    <AlternativeRow
                      key={model.id}
                      model={model}
                      t={t}
                      onSelect={handleSelectModel}
                      onHover={setHoveredAlternativeId}
                    />
                  ))}
                </div>
              ) : (
                <div className="decision-card__body decision-card__body--empty">
                  <p className="frontier-message">
                    {t("alternatives.none")}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      <footer className="site-footer site-shell">
        <div>
          <span>{t("footer.tagline")}</span>
        </div>
        <p>
          {t("footer.sourcePrefix")}
          <a href={catalog.source.url} target="_blank" rel="noreferrer">
            Artificial Analysis
          </a>
        </p>
      </footer>
    </main>
  );
}
