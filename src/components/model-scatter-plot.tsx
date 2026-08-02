"use client";

import {
  layoutWithLines,
  prepareWithSegments,
  setLocale as setPretextLocale,
} from "@chenglou/pretext";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import * as echarts from "echarts/core";
import type { ComposeOption, EChartsType } from "echarts/core";
import {
  LineChart,
  ScatterChart,
  type LineSeriesOption,
  type ScatterSeriesOption,
} from "echarts/charts";
import {
  AriaComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  GridComponent,
  MarkAreaComponent,
  TooltipComponent,
  type AriaComponentOption,
  type DataZoomComponentOption,
  type GridComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";

import { getCreatorStyle, type MarkerShape } from "@/lib/creator-style";
import { translate, type Locale } from "@/lib/i18n";
import {
  getParetoFrontier,
  getReasoningVariantGroups,
  type ReasoningVariantGroup,
} from "@/lib/model-logic";
import { isChartableModel, type ModelPoint } from "@/lib/models";

echarts.use([
  AriaComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  GridComponent,
  LineChart,
  MarkAreaComponent,
  ScatterChart,
  SVGRenderer,
  TooltipComponent,
]);

type ChartOption = ComposeOption<
  | AriaComponentOption
  | DataZoomComponentOption
  | GridComponentOption
  | LineSeriesOption
  | ScatterSeriesOption
  | TooltipComponentOption
>;

type ChartableModel = ModelPoint & {
  intelligence: number;
  costPerTask: number;
};

interface ScatterDatum {
  costPerTask: number;
  modelId: string;
  name: string;
  value: [number, number];
}

interface ChartEventParams {
  data: unknown;
  name: string;
  seriesType?: string;
}

interface DataZoomState {
  id?: string;
  start?: number;
  end?: number;
}

interface PendingWheelZoom {
  chart: EChartsType;
  delta: number;
  originX: number;
  originY: number;
}

interface ModelScatterPlotProps {
  models: ModelPoint[];
  selected: ModelPoint | null;
  hoveredModelId: string | null;
  alternativeIds: Set<string>;
  activeCreators: ReadonlySet<string>;
  showAllLabels: boolean;
  xAxisScale: "log" | "linear";
  theme: "light" | "dark";
  locale: Locale;
  onSelect: (id: string) => void;
  onClearSelection: () => void;
}

interface InteractiveScatterPlotProps extends Omit<ModelScatterPlotProps, "models"> {
  chartModels: ChartableModel[];
  frontier: ChartableModel[];
  reasoningGroups: ReasoningVariantGroup[];
}

interface ChartPalette {
  background: string;
  axis: string;
  grid: string;
  muted: string;
  label: string;
  frontier: string;
  reasoning: string;
  pointBorder: string;
  selectionShadow: string;
  positiveArea: string;
  positiveBorder: string;
  accentArea: string;
  accentBorder: string;
  accent: string;
  sliderBackground: string;
  sliderFiller: string;
  sliderHandle: string;
  sliderHandleBorder: string;
  sliderEmphasis: string;
  tooltipBackground: string;
  tooltipText: string;
}

const LIGHT_CHART_PALETTE: ChartPalette = {
  background: "#fcfbf8",
  axis: "#bdb5ab",
  grid: "#d8d2c9",
  muted: "#81786f",
  label: "#655d55",
  frontier: "#887f76",
  reasoning: "#9a8d83",
  pointBorder: "#ffffff",
  selectionShadow: "rgba(47, 43, 39, 0.22)",
  positiveArea: "rgba(231, 238, 232, 0.72)",
  positiveBorder: "rgba(86, 115, 93, 0.22)",
  accentArea: "rgba(201, 100, 66, 0.14)",
  accentBorder: "rgba(201, 100, 66, 0.34)",
  accent: "#c96442",
  sliderBackground: "#f1eee8",
  sliderFiller: "rgba(201, 100, 66, 0.18)",
  sliderHandle: "#fcfbf8",
  sliderHandleBorder: "#a88f82",
  sliderEmphasis: "#f3e3db",
  tooltipBackground: "rgba(47, 43, 39, 0.97)",
  tooltipText: "#ffffff",
};

const DARK_CHART_PALETTE: ChartPalette = {
  background: "#211f1c",
  axis: "#756c62",
  grid: "#49433d",
  muted: "#a89d91",
  label: "#c8bdb2",
  frontier: "#a9a096",
  reasoning: "#ad9f94",
  pointBorder: "#211f1c",
  selectionShadow: "rgba(0, 0, 0, 0.45)",
  positiveArea: "rgba(92, 133, 102, 0.24)",
  positiveBorder: "rgba(142, 190, 151, 0.42)",
  accentArea: "rgba(224, 121, 86, 0.2)",
  accentBorder: "rgba(224, 121, 86, 0.5)",
  accent: "#e07956",
  sliderBackground: "#302c27",
  sliderFiller: "rgba(224, 121, 86, 0.28)",
  sliderHandle: "#211f1c",
  sliderHandleBorder: "#a18c7d",
  sliderEmphasis: "#4a3027",
  tooltipBackground: "rgba(18, 17, 15, 0.97)",
  tooltipText: "#f8f1e9",
};

const DESKTOP_GRID = { top: 28, right: 58, bottom: 112, left: 78 };
const MOBILE_GRID = { top: 20, right: 36, bottom: 104, left: 50 };
const MOBILE_CHART_MEDIA_QUERY = "(max-width: 720px)";
const MIN_DATA_ZOOM_SPAN = 8;
const WHEEL_ZOOM_SENSITIVITY = 0.16;
const DRAG_SELECTION_THRESHOLD = 8;
const POST_GESTURE_CLICK_BLOCK_MS = 240;

type ChartGrid = typeof DESKTOP_GRID;

function subscribeToMobileChart(listener: () => void): () => void {
  const mediaQuery = window.matchMedia(MOBILE_CHART_MEDIA_QUERY);
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }

  mediaQuery.addListener(listener);
  return () => mediaQuery.removeListener(listener);
}

function getMobileChartSnapshot(): boolean {
  return window.matchMedia(MOBILE_CHART_MEDIA_QUERY).matches;
}

function getMobileChartServerSnapshot(): boolean {
  return false;
}

function formatCost(value: number): string {
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 0.1) return `$${value.toFixed(3)}`;
  if (value < 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(value % 1 === 0 ? 0 : 1)}`;
}

function escapeTooltipText(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

const CHART_TOOLTIP_MAX_WIDTH = 600;
const CHART_TOOLTIP_VIEWPORT_GUTTER = 32;
const CHART_TOOLTIP_HORIZONTAL_PADDING = {
  mobile: 16,
  desktop: 20,
} as const;

let configuredChartTooltipPretextLocale: Locale | null = null;

function ensureChartTooltipPretextLocale(locale: Locale) {
  if (configuredChartTooltipPretextLocale === locale) return;
  setPretextLocale(locale);
  configuredChartTooltipPretextLocale = locale;
}

function getChartTooltipContentWidth(isMobileChart: boolean): number {
  const viewportWidth =
    typeof window === "undefined" ? CHART_TOOLTIP_MAX_WIDTH : window.innerWidth;
  const outerWidth = Math.min(
    CHART_TOOLTIP_MAX_WIDTH,
    Math.max(1, viewportWidth - CHART_TOOLTIP_VIEWPORT_GUTTER),
  );
  const horizontalPadding = isMobileChart
    ? CHART_TOOLTIP_HORIZONTAL_PADDING.mobile
    : CHART_TOOLTIP_HORIZONTAL_PADDING.desktop;
  return Math.max(1, outerWidth - horizontalPadding);
}

function layoutChartTooltipLines(
  text: string,
  font: string,
  maxWidth: number,
  locale: Locale,
  whiteSpace: "normal" | "pre-wrap",
  cache: Map<string, string[]>,
): string[] {
  const cacheKey = `${locale}\u0000${font}\u0000${maxWidth}\u0000${whiteSpace}\u0000${text}`;
  const cachedLines = cache.get(cacheKey);
  if (cachedLines) return cachedLines;

  try {
    ensureChartTooltipPretextLocale(locale);
    const prepared = prepareWithSegments(text, font, { whiteSpace });
    const { lines } = layoutWithLines(prepared, maxWidth, 22);
    const laidOutLines = lines.map((line) => line.text);
    cache.set(cacheKey, laidOutLines);
    return laidOutLines;
  } catch {
    // Canvas and Intl.Segmenter are required by Pretext. CSS remains the
    // fallback for restricted browser environments.
    const fallbackLines = [text];
    cache.set(cacheKey, fallbackLines);
    return fallbackLines;
  }
}

function renderChartTooltipLines(lines: string[]): string {
  return lines
    .map(
      (line) =>
        `<div class="model-chart-tooltip__line">${escapeTooltipText(line)}</div>`,
    )
    .join("");
}

function toChartCost(value: number, xAxisScale: "log" | "linear"): number {
  return xAxisScale === "log" ? Math.log10(value) : value;
}

function fromChartCost(value: number, xAxisScale: "log" | "linear"): number {
  return xAxisScale === "log" ? 10 ** value : value;
}

function toEChartsSymbol(shape: MarkerShape): string {
  return shape === "square" ? "rect" : shape;
}

function isScatterDatum(value: unknown): value is ScatterDatum {
  if (!value || typeof value !== "object") return false;
  return "modelId" in value && "value" in value;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function zoomRange(
  start: number,
  end: number,
  anchorRatio: number,
  scale: number,
): [number, number] {
  const currentSpan = Math.max(end - start, MIN_DATA_ZOOM_SPAN);
  const nextSpan = clamp(
    currentSpan / scale,
    MIN_DATA_ZOOM_SPAN,
    100,
  );
  const safeAnchorRatio = clamp(anchorRatio, 0, 1);
  const anchor = start + currentSpan * safeAnchorRatio;
  let nextStart = anchor - nextSpan * safeAnchorRatio;
  let nextEnd = nextStart + nextSpan;

  if (nextStart < 0) {
    nextStart = 0;
    nextEnd = nextSpan;
  } else if (nextEnd > 100) {
    nextEnd = 100;
    nextStart = 100 - nextSpan;
  }

  return [nextStart, nextEnd];
}

function zoomChartAtPoint(
  chart: EChartsType,
  grid: ChartGrid,
  originX: number,
  originY: number,
  scale: number,
) {
  const chartWidth = chart.getWidth();
  const chartHeight = chart.getHeight();
  const plotWidth = chartWidth - grid.left - grid.right;
  const plotHeight = chartHeight - grid.top - grid.bottom;

  if (
    originX < grid.left ||
    originX > grid.left + plotWidth ||
    originY < grid.top ||
    originY > grid.top + plotHeight
  ) {
    return false;
  }

  const dataZoom = (
    chart.getOption() as unknown as { dataZoom?: DataZoomState[] }
  ).dataZoom;
  const xState = dataZoom?.find((item) => item.id === "x-inside");
  const yState = dataZoom?.find((item) => item.id === "y-inside");

  if (
    typeof xState?.start !== "number" ||
    typeof xState.end !== "number" ||
    typeof yState?.start !== "number" ||
    typeof yState.end !== "number"
  ) {
    return false;
  }

  const xRange = zoomRange(
    xState.start,
    xState.end,
    (originX - grid.left) / plotWidth,
    scale,
  );
  const yRange = zoomRange(
    yState.start,
    yState.end,
    1 - (originY - grid.top) / plotHeight,
    scale,
  );

  chart.dispatchAction({
    type: "dataZoom",
    batch: [
      { dataZoomId: "x-inside", start: xRange[0], end: xRange[1] },
      { dataZoomId: "y-inside", start: yRange[0], end: yRange[1] },
    ],
  });
  return true;
}

function InteractiveScatterPlot({
  chartModels,
  frontier,
  reasoningGroups,
  selected,
  hoveredModelId,
  alternativeIds,
  activeCreators,
  showAllLabels,
  xAxisScale,
  theme,
  locale,
  onSelect,
  onClearSelection,
}: InteractiveScatterPlotProps) {
  const isMobileChart = useSyncExternalStore(
    subscribeToMobileChart,
    getMobileChartSnapshot,
    getMobileChartServerSnapshot,
  );
  const grid = isMobileChart ? MOBILE_GRID : DESKTOP_GRID;
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);
  const mobileDefaultRangeAppliedRef = useRef(false);
  const clearSelectionRef = useRef(onClearSelection);
  const selectRef = useRef(onSelect);
  const pendingWheelZoomRef = useRef<PendingWheelZoom | null>(null);
  const wheelZoomFrameRef = useRef<number | null>(null);
  const suppressChartClicksUntilRef = useRef(0);
  clearSelectionRef.current = onClearSelection;
  selectRef.current = onSelect;

  useEffect(
    () => () => {
      if (wheelZoomFrameRef.current !== null) {
        cancelAnimationFrame(wheelZoomFrameRef.current);
      }
    },
    [],
  );

  const chartSelected =
    selected && isChartableModel(selected) ? selected : null;
  const chartHovered =
    hoveredModelId === null
      ? null
      : chartModels.find((model) => model.id === hoveredModelId) ?? null;
  const palette = theme === "dark" ? DARK_CHART_PALETTE : LIGHT_CHART_PALETTE;
  const visibleLabelIds = useMemo(
    () =>
      new Set(
        showAllLabels
          ? chartModels.map((model) => model.id)
          : [
              ...(chartSelected ? [chartSelected.id] : []),
              ...(chartHovered ? [chartHovered.id] : []),
              ...Array.from(alternativeIds).slice(0, 1),
            ],
      ),
    [alternativeIds, chartHovered, chartModels, chartSelected, showAllLabels],
  );

  const option = useMemo<ChartOption>(() => {
    const tooltipLineCache = new Map<string, string[]>();
    const tooltipFontSize = isMobileChart ? 10 : 11;
    const tooltipFont = `650 ${tooltipFontSize}px Inter`;

    const costs = chartModels.map((model) => model.costPerTask);
    const scores = chartModels.map((model) => model.intelligence);
    const minCost = Math.max(Math.min(...costs) * 0.72, 0.0001);
    const maxCost = Math.max(...costs) * 1.28;
    // ECharts dataZoom maps its percentage window linearly over the raw axis
    // extent. A transformed value axis keeps slider distance, chart distance,
    // wheel zoom and dragging in the same coordinate space for both modes.
    const minX = toChartCost(minCost, xAxisScale);
    const maxX = toChartCost(maxCost, xAxisScale);
    const minY = Math.max(
      0,
      Math.floor((Math.min(...scores) - 3) / 5) * 5,
    );
    const maxY = Math.ceil((Math.max(...scores) + 3) / 5) * 5;

    const scatterData = chartModels.map((model) => {
      const creatorStyle = getCreatorStyle(model.creator, theme);
      const isSelected = model.id === chartSelected?.id;
      const isHovered = model.id === chartHovered?.id;
      const isMuted =
        activeCreators.size > 0 &&
        !activeCreators.has(model.creator) &&
        !isHovered;
      const showLabel = visibleLabelIds.has(model.id) && !isMuted;

      return {
        costPerTask: model.costPerTask,
        modelId: model.id,
        name: model.name,
        value: [
          toChartCost(model.costPerTask, xAxisScale),
          model.intelligence,
        ],
        symbol: toEChartsSymbol(creatorStyle.shape),
        symbolSize: isMobileChart
          ? isSelected || isHovered
            ? 17
            : 9
          : isSelected || isHovered
            ? 20
            : 11,
        cursor: "pointer",
        itemStyle: {
          color: creatorStyle.color,
          opacity: isMuted ? 0.1 : 1,
          borderColor: palette.pointBorder,
          borderWidth: isSelected || isHovered ? 3 : 2,
          shadowBlur: isSelected ? 14 : isHovered ? 10 : 0,
          shadowColor: `${creatorStyle.color}66`,
        },
        label: {
          show: showLabel,
          formatter: model.name,
          position: model.id.length % 2 === 0 ? "top" : "right",
          distance: isMobileChart ? 6 : 8,
          color: creatorStyle.color,
          fontSize: isMobileChart
            ? isSelected
              ? 10
              : 9
            : isSelected
              ? 11
              : 10,
          fontWeight: isSelected || isHovered ? 800 : 650,
          textBorderColor: palette.background,
          textBorderWidth: 4,
        },
        emphasis: {
          scale: 1.25,
          itemStyle: {
            opacity: 1,
            shadowBlur: 10,
            shadowColor: palette.selectionShadow,
          },
        },
      };
    });

    const reasoningSeries: LineSeriesOption[] = reasoningGroups.map(
      (group) => ({
        id: `reasoning-${group.key}`,
        name: `${group.baseName} ${translate(locale, "chart.reasoningSeries")}`,
        type: "line",
        data: group.models.map((model) => [
          toChartCost(model.costPerTask, xAxisScale),
          model.intelligence,
        ]),
        showSymbol: false,
        silent: true,
        z: 2,
        lineStyle: {
          color: getCreatorStyle(group.creator, theme).color,
          width: isMobileChart ? 1 : 1.2,
          type: "dashed",
          opacity:
            activeCreators.size === 0 || activeCreators.has(group.creator)
              ? 0.48
              : 0.07,
        },
        tooltip: { show: false },
      }),
    );

    const series: Array<ScatterSeriesOption | LineSeriesOption> = [
      ...reasoningSeries,
      {
        id: "pareto-frontier",
        name: translate(locale, "chart.frontier"),
        type: "line",
        data: frontier.map((model) => [
          toChartCost(model.costPerTask, xAxisScale),
          model.intelligence,
        ]),
        showSymbol: false,
        silent: true,
        z: 3,
        lineStyle: {
          color: palette.frontier,
          width: 1.3,
          opacity: 0.82,
        },
        tooltip: { show: false },
      },
      {
        id: "models",
        name: translate(locale, "chart.models"),
        type: "scatter",
        data: scatterData as ScatterSeriesOption["data"],
        z: 5,
        clip: true,
        animationDurationUpdate: 180,
        markArea: chartSelected
          ? {
              silent: true,
              z: 1,
              label: { show: false },
              data: [
                [
                  {
                    coord: [minX, chartSelected.intelligence],
                    itemStyle: {
                      color: palette.positiveArea,
                      borderColor: palette.positiveBorder,
                      borderWidth: 1,
                    },
                  },
                  {
                    coord: [
                      toChartCost(chartSelected.costPerTask, xAxisScale),
                      maxY,
                    ],
                  },
                ],
                [
                  {
                    coord: [
                      toChartCost(chartSelected.costPerTask, xAxisScale),
                      minY,
                    ],
                    itemStyle: {
                      color: palette.accentArea,
                      borderColor: palette.accentBorder,
                      borderWidth: 1,
                    },
                  },
                  {
                    coord: [maxX, chartSelected.intelligence],
                  },
                ],
              ],
            }
          : undefined,
      },
    ];

    if (chartSelected) {
      const guideStyle = {
        color: palette.accent,
        width: 1.5,
        type: "dashed" as const,
        opacity: 0.86,
      };

      series.push(
        {
          id: "selected-x-guide",
          type: "line",
          data: [
            [
              toChartCost(chartSelected.costPerTask, xAxisScale),
              minY,
            ],
            [
              toChartCost(chartSelected.costPerTask, xAxisScale),
              chartSelected.intelligence,
            ],
          ],
          showSymbol: false,
          silent: true,
          z: 4,
          lineStyle: guideStyle,
          tooltip: { show: false },
        },
        {
          id: "selected-y-guide",
          type: "line",
          data: [
            [minX, chartSelected.intelligence],
            [
              toChartCost(chartSelected.costPerTask, xAxisScale),
              chartSelected.intelligence,
            ],
          ],
          showSymbol: false,
          silent: true,
          z: 4,
          lineStyle: guideStyle,
          tooltip: { show: false },
        },
      );
    }

    const sliderStyle = {
      filterMode: "none" as const,
      realtime: true,
      showDataShadow: false,
      showDetail: false,
      brushSelect: false,
      minSpan: MIN_DATA_ZOOM_SPAN,
      handleSize: isMobileChart ? "80%" : "70%",
      borderColor: "transparent",
      backgroundColor: palette.sliderBackground,
      fillerColor: palette.sliderFiller,
      moveHandleStyle: { color: palette.accent },
      handleStyle: {
        color: palette.sliderHandle,
        borderColor: palette.sliderHandleBorder,
        borderWidth: 1,
      },
      emphasis: {
        handleStyle: {
          color: palette.sliderEmphasis,
          borderColor: palette.accent,
        },
        moveHandleStyle: { color: palette.accent },
      },
      textStyle: {
        color: palette.muted,
        fontSize: 9,
      },
    };

    return {
      animation: false,
      backgroundColor: palette.background,
      aria: {
        enabled: true,
        decal: { show: false },
        description: translate(
          locale,
          isMobileChart
            ? "chart.ariaDescriptionMobile"
            : "chart.ariaDescriptionDesktop",
          {
            scale: translate(
              locale,
              xAxisScale === "log" ? "chart.xScale.log" : "chart.xScale.linear",
            ),
          },
        ),
      },
      grid: {
        ...grid,
        containLabel: false,
        show: true,
        borderWidth: 0,
        backgroundColor: palette.background,
      },
      tooltip: {
        trigger: "item",
        renderMode: "html",
        confine: true,
        borderWidth: 0,
        padding: isMobileChart ? [7, 8] : [8, 10],
        backgroundColor: palette.tooltipBackground,
        className: "model-chart-tooltip",
        extraCssText:
          "max-width:min(600px,calc(100vw - 32px));white-space:normal;overflow-wrap:anywhere;word-break:break-word;line-height:22px;",
        textStyle: {
          color: palette.tooltipText,
          fontSize: isMobileChart ? 10 : 11,
          fontWeight: 650,
        },
        formatter: (params) => {
          const item = Array.isArray(params) ? params[0] : params;
          if (!item || !isScatterDatum(item.data)) {
            return escapeTooltipText(item?.name ?? "");
          }

          const metrics = `${translate(locale, "chart.tooltipAbility")} ${item.data.value[1].toFixed(1)}   ${translate(locale, "chart.tooltipCost")} ${formatCost(item.data.costPerTask)}`;
          const contentWidth = getChartTooltipContentWidth(isMobileChart);
          const modelNameLines = layoutChartTooltipLines(
            item.data.name,
            tooltipFont,
            contentWidth,
            locale,
            "normal",
            tooltipLineCache,
          );
          const metricLines = layoutChartTooltipLines(
            metrics,
            tooltipFont,
            contentWidth,
            locale,
            "pre-wrap",
            tooltipLineCache,
          );
          return `${renderChartTooltipLines(modelNameLines)}${renderChartTooltipLines(metricLines)}`;
        },
      },
      xAxis: {
        type: "value",
        min: minX,
        max: maxX,
        name: translate(
          locale,
          isMobileChart ? "chart.xAxisMobile" : "chart.xAxisDesktop",
          {
            scale: translate(
              locale,
              xAxisScale === "log" ? "chart.xScale.log" : "chart.xScale.linear",
            ),
          },
        ),
        nameLocation: "middle",
        nameGap: isMobileChart ? 34 : 44,
        splitNumber: isMobileChart ? 4 : 5,
        nameTextStyle: {
          color: palette.label,
          fontSize: isMobileChart ? 10 : 12,
          fontWeight: 650,
        },
        axisLine: { lineStyle: { color: palette.axis } },
        axisTick: { lineStyle: { color: palette.axis } },
        axisLabel: {
          color: palette.muted,
          fontSize: isMobileChart ? 9 : 10,
          fontWeight: 600,
          hideOverlap: true,
          margin: isMobileChart ? 6 : 8,
          formatter: (value: number) =>
            formatCost(fromChartCost(value, xAxisScale)),
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: palette.grid,
            type: "dashed",
            opacity: 0.7,
          },
        },
        minorSplitLine: { show: false },
      },
      yAxis: {
        type: "value",
        min: minY,
        max: maxY,
        name: translate(
          locale,
          isMobileChart ? "chart.yAxisMobile" : "chart.yAxisDesktop",
        ),
        nameLocation: "middle",
        nameGap: isMobileChart ? 36 : 54,
        splitNumber: 5,
        nameTextStyle: {
          color: palette.label,
          fontSize: isMobileChart ? 10 : 12,
          fontWeight: 650,
        },
        axisLine: {
          show: true,
          onZero: false,
          lineStyle: { color: palette.axis },
        },
        axisTick: { show: true, lineStyle: { color: palette.axis } },
        axisLabel: {
          color: palette.muted,
          fontSize: isMobileChart ? 9 : 10,
          fontWeight: 600,
          margin: isMobileChart ? 6 : 8,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: palette.grid,
            type: "dashed",
            opacity: 0.7,
          },
        },
      },
      dataZoom: [
        {
          id: "x-slider",
          type: "slider",
          xAxisIndex: 0,
          left: grid.left,
          right: grid.right,
          bottom: isMobileChart ? 10 : 12,
          height: isMobileChart ? 26 : 14,
          labelFormatter: (value: number) =>
            formatCost(fromChartCost(value, xAxisScale)),
          ...sliderStyle,
          defaultLocationEdgeGap: isMobileChart ? 8 : 15,
          handleSize: isMobileChart ? 30 : "70%",
          moveHandleSize: isMobileChart ? 18 : 7,
          showDetail: isMobileChart,
          handleStyle: {
            ...sliderStyle.handleStyle,
            borderWidth: isMobileChart ? 2 : 1,
          },
        },
        {
          id: "y-slider",
          type: "slider",
          yAxisIndex: 0,
          top: grid.top,
          bottom: grid.bottom,
          right: isMobileChart ? 4 : 12,
          width: isMobileChart ? 10 : 14,
          labelFormatter: (value: number) => value.toFixed(1),
          ...sliderStyle,
        },
        {
          id: "x-inside",
          type: "inside",
          xAxisIndex: 0,
          disabled: isMobileChart,
          filterMode: "none",
          minSpan: MIN_DATA_ZOOM_SPAN,
          zoomLock: true,
          zoomOnMouseWheel: false,
          moveOnMouseMove: !isMobileChart,
          moveOnMouseWheel: false,
          preventDefaultMouseMove: false,
        },
        {
          id: "y-inside",
          type: "inside",
          yAxisIndex: 0,
          disabled: isMobileChart,
          filterMode: "none",
          minSpan: MIN_DATA_ZOOM_SPAN,
          zoomLock: true,
          zoomOnMouseWheel: false,
          moveOnMouseMove: !isMobileChart,
          moveOnMouseWheel: false,
          preventDefaultMouseMove: false,
        },
      ],
      series,
    };
  }, [
    activeCreators,
    chartModels,
    chartSelected,
    chartHovered,
    frontier,
    grid,
    isMobileChart,
    palette,
    reasoningGroups,
    locale,
    theme,
    visibleLabelIds,
    xAxisScale,
  ]);

  const handleChartReady = useCallback((chart: EChartsType) => {
    const renderer = chart.getZr();
    let dragStart: { x: number; y: number } | null = null;
    let dragMoved = false;

    const suppressChartClicks = () => {
      suppressChartClicksUntilRef.current =
        Date.now() + POST_GESTURE_CLICK_BLOCK_MS;
    };

    renderer.on("mousedown", (event) => {
      dragStart = { x: event.offsetX, y: event.offsetY };
      dragMoved = false;
    });

    renderer.on("mousemove", (event) => {
      if (!dragStart || dragMoved) return;

      const distanceX = event.offsetX - dragStart.x;
      const distanceY = event.offsetY - dragStart.y;
      if (
        distanceX * distanceX + distanceY * distanceY >=
        DRAG_SELECTION_THRESHOLD * DRAG_SELECTION_THRESHOLD
      ) {
        dragMoved = true;
        suppressChartClicks();
      }
    });

    renderer.on("mouseup", () => {
      if (dragMoved) suppressChartClicks();
      dragStart = null;
      dragMoved = false;
    });

    renderer.on("click", (event) => {
      if (Date.now() < suppressChartClicksUntilRef.current) return;
      if (!event.target) clearSelectionRef.current();
    });

    renderer.on("mousewheel", (event) => {
      if (isMobileChart) return;

      const isInsidePlot =
        event.offsetX >= grid.left &&
        event.offsetX <= chart.getWidth() - grid.right &&
        event.offsetY >= grid.top &&
        event.offsetY <= chart.getHeight() - grid.bottom;

      if (!isInsidePlot) return;
      event.stop();

      const pending = pendingWheelZoomRef.current;
      pendingWheelZoomRef.current = {
        chart,
        delta: (pending?.delta ?? 0) + event.wheelDelta,
        originX: event.offsetX,
        originY: event.offsetY,
      };

      if (wheelZoomFrameRef.current !== null) {
        return;
      }

      wheelZoomFrameRef.current = requestAnimationFrame(() => {
        wheelZoomFrameRef.current = null;
        const nextZoom = pendingWheelZoomRef.current;
        pendingWheelZoomRef.current = null;
        if (!nextZoom || nextZoom.delta === 0) return;

        const delta = clamp(nextZoom.delta, -2, 2);
        zoomChartAtPoint(
          nextZoom.chart,
          grid,
          nextZoom.originX,
          nextZoom.originY,
          Math.exp(delta * WHEEL_ZOOM_SENSITIVITY),
        );
      });
    });

    renderer.on("pinch", (event) => {
      if (isMobileChart) return;

      if (
        zoomChartAtPoint(
          chart,
          grid,
          event.pinchX,
          event.pinchY,
          clamp(event.pinchScale, 0.8, 1.25),
        )
      ) {
        event.stop();
      }
    });
  }, [grid, isMobileChart]);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const chart = echarts.init(container, undefined, { renderer: "svg" });
    chartRef.current = chart;
    handleChartReady(chart);

    const handlePointClick = (params: ChartEventParams) => {
      if (Date.now() < suppressChartClicksUntilRef.current) return;
      if (params.seriesType !== "scatter" || !isScatterDatum(params.data)) {
        return;
      }
      selectRef.current(params.data.modelId);
    };
    const handleDataZoom = () => {
      suppressChartClicksUntilRef.current =
        Date.now() + POST_GESTURE_CLICK_BLOCK_MS;
    };
    const resize = () => chart.resize();

    chart.on("click", handlePointClick);
    chart.on("datazoom", handleDataZoom);
    window.addEventListener("resize", resize);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(resize);
    resizeObserver?.observe(container);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      chart.off("click", handlePointClick);
      chart.off("datazoom", handleDataZoom);
      chart.dispose();
      mobileDefaultRangeAppliedRef.current = false;
      if (chartRef.current === chart) chartRef.current = null;
    };
  }, [handleChartReady]);

  useEffect(() => {
    chartRef.current?.setOption(option, {
      lazyUpdate: true,
      replaceMerge: ["series"],
    });
  }, [option]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    chart.dispatchAction({ type: "hideTip" });
    if (hoveredModelId === null) return;

    const dataIndex = chartModels.findIndex(
      (model) => model.id === hoveredModelId,
    );
    if (dataIndex < 0) return;

    chart.dispatchAction({
      type: "showTip",
      seriesId: "models",
      dataIndex,
    });
  }, [chartModels, hoveredModelId, option]);

  useEffect(() => {
    if (!isMobileChart) {
      mobileDefaultRangeAppliedRef.current = false;
      return;
    }

    const chart = chartRef.current;
    if (!chart || mobileDefaultRangeAppliedRef.current) return;

    chart.dispatchAction({
      type: "dataZoom",
      batch: [
        { dataZoomId: "x-slider", start: 0, end: 50 },
        { dataZoomId: "x-inside", start: 0, end: 50 },
      ],
    });
    mobileDefaultRangeAppliedRef.current = true;
  }, [isMobileChart, option]);

  return (
    <div
      className="chart-stage"
      aria-label={translate(locale, "chart.aria")}
    >
      <div className="chart-scroll">
        <div
          ref={chartContainerRef}
          className="model-chart"
          style={{ height: "var(--model-chart-height)", width: "100%" }}
        />
      </div>
    </div>
  );
}

export function ModelScatterPlot(props: ModelScatterPlotProps) {
  const chartModels = useMemo(
    () => props.models.filter(isChartableModel),
    [props.models],
  );
  const frontier = useMemo(
    () => getParetoFrontier(props.models),
    [props.models],
  );
  const reasoningGroups = useMemo(
    () => getReasoningVariantGroups(chartModels),
    [chartModels],
  );

  if (chartModels.length === 0) {
    return (
      <div className="empty-chart">
        {translate(props.locale, "chart.empty")}
      </div>
    );
  }

  return (
    <InteractiveScatterPlot
      {...props}
      chartModels={chartModels}
      frontier={frontier}
      reasoningGroups={reasoningGroups}
    />
  );
}
