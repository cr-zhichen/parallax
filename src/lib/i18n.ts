import { useEffect, useSyncExternalStore } from "react";

export const LOCALE_STORAGE_KEY = "parallax-locale";
export const LOCALE_CHANGE_EVENT = "parallax-locale-change";

export const LOCALE_OPTIONS = [
  { value: "zh-CN", label: "中文" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
] as const;

export type Locale = (typeof LOCALE_OPTIONS)[number]["value"];
export const DEFAULT_LOCALE: Locale = "zh-CN";

const zhCN = {
  "metadata.title": "Parallax · AI 模型版图",
  "metadata.description": "从能力、成本和替代关系探索 AI 模型版图。",
  language: "语言",
  "theme.light": "浅色",
  "theme.dark": "深色",
  "theme.system": "系统",
  "theme.toggleAria": "切换主题，当前为{current}",
  "theme.toggleTitle": "当前主题：{current}。点击切换",
  "github.repository": "在 GitHub 打开 cr-zhichen/parallax 仓库",
  "status.updated": "更新",
  loading: "正在载入散点图…",
  "search.placeholder": "搜索模型、厂商或标识",
  "search.label": "搜索模型",
  "search.clear": "清除搜索",
  "search.matchingModels": "{count} 个匹配模型",
  "search.noMatches": "没有找到匹配模型",
  "search.published": "发布 {date}",
  "metric.intelligence": "能力",
  "metric.cost": "成本",
  "metric.intelligenceIndex": "能力指数",
  "metric.taskCost": "单项成本",
  "metric.outputSpeed": "输出速度",
  "metric.firstTokenLatency": "首字延迟",
  "alternative.score": "能力",
  "alternative.cost": "成本",
  "empty.noModels": "还没有可展示的模型",
  "empty.checkApi": "请检查 API 配置后重试。",
  "brand.home": "Parallax 首页",
  "hero.eyebrow": "BETWEEN MODELS",
  "hero.titleLead": "选择，",
  "hero.titleAccent": "有迹可循。",
  "hero.description": "当能力与成本落在同一张图上，答案便从差异中浮现。",
  "stats.overall": "全部模型",
  "stats.comparable": "可比较模型",
  "stats.creators": "模型厂商",
  "explorer.sectionIndex": "01 / DECISION MAP",
  "explorer.title": "找到合适的落点",
  "explorer.description": "能力有高低，成本有轻重，方向藏在坐标之间。",
  "creatorFilter.label": "按厂商多选筛选",
  "creatorFilter.all": "全部",
  "chart.areaLabel": "散点图区域",
  "chart.models": "模型",
  "chart.frontier": "帕累托前沿",
  "chart.strictAlternative": "严格替代",
  "chart.reasoningLevels": "思考等级",
  "chart.hintSelected": "拖动平移，点击空白处取消选择",
  "chart.hintUnselected": "拖动平移，点击数据点选择模型",
  "chart.showAllLabels": "显示全部名称",
  "selection.placeholder": "选择模型后显示详情",
  "selection.emptyMessage": "点击图表中的任意数据点，查看能力、成本和替代建议。",
  "alternatives.panelLabel": "替代建议",
  "alternatives.label": "替代建议",
  "alternatives.missingData": "缺少比较数据",
  "alternatives.strictCount": "{count} 个更优选择",
  "alternatives.onFrontier": "已位于有效前沿",
  "alternatives.chooseFirst": "请先选择模型。",
  "alternatives.strictMissingMessage": "当前模型缺少能力指数或任务成本，暂时无法生成替代建议。",
  "alternatives.none": "暂无符合条件的模型。",
  "alternatives.balancedLabel": "相近候选",
  "alternatives.balancedCount": "{count} 个相近选择",
  "alternatives.balancedNone": "暂无匹配候选",
  "alternatives.balancedMissingMessage": "补充能力指数与任务成本后，才能计算相近候选。",
  "footer.tagline": "Parallax · Explore the frontier of model capability and cost.",
  "footer.sourcePrefix": "数据来源：",
  "source.missingApiKey": "未检测到 API Key，当前使用示例数据。配置后会自动切换为实时数据。",
  "source.apiError": "实时数据源返回 {status}，暂时显示示例数据。请检查 API Key 与订阅层级。",
  "source.unavailable": "实时数据源暂时不可用，当前显示示例数据。",
  "chart.aria": "模型能力与成本散点图",
  "chart.ariaDescriptionMobile": "模型能力与任务成本散点图。横轴为单项任务成本，对数刻度；纵轴为 Artificial Analysis Intelligence Index。点击数据点选择模型，拖动轴边滑块调整显示范围。",
  "chart.ariaDescriptionDesktop": "模型能力与任务成本散点图。横轴为单项任务成本，对数刻度；纵轴为 Artificial Analysis Intelligence Index。同一模型的不同思考等级使用虚线连接。可拖动图表平移，或使用轴边滑动条和滚轮缩放。",
  "chart.tooltipAbility": "能力",
  "chart.tooltipCost": "成本",
  "chart.xAxisMobile": "任务成本（USD · 对数）",
  "chart.xAxisDesktop": "单项任务成本（USD，对数刻度）",
  "chart.yAxisMobile": "能力指数",
  "chart.yAxisDesktop": "Artificial Analysis Intelligence Index",
  "chart.gestureDesktop": "拖动图表平移 · 轻滚轮缩放 · 拖动轴边滑块调整范围",
  "chart.gestureMobile": "拖动轴边滑块调整范围 · 点击数据点选择",
  "chart.empty": "当前数据中没有同时包含能力分数与任务成本的模型。",
  "chart.reasoningSeries": "思考等级",
} as const;

export type TranslationKey = keyof typeof zhCN;
export type TranslationParams = Record<string, string | number>;
export type Translator = (
  key: TranslationKey,
  params?: TranslationParams,
) => string;

const en: Record<TranslationKey, string> = {
  "metadata.title": "Parallax · AI Model Landscape",
  "metadata.description": "Explore the AI model landscape through capability, cost, and alternatives.",
  language: "Language",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",
  "theme.toggleAria": "Switch theme. Current: {current}",
  "theme.toggleTitle": "Current theme: {current}. Click to switch",
  "github.repository": "Open the cr-zhichen/parallax repository on GitHub",
  "status.updated": "updated",
  loading: "Loading scatter plot…",
  "search.placeholder": "Search models, creators, or IDs",
  "search.label": "Search models",
  "search.clear": "Clear search",
  "search.matchingModels": "{count} matching models",
  "search.noMatches": "No matching models found",
  "search.published": "Published {date}",
  "metric.intelligence": "Intelligence",
  "metric.cost": "Cost",
  "metric.intelligenceIndex": "Intelligence index",
  "metric.taskCost": "Task cost",
  "metric.outputSpeed": "Output speed",
  "metric.firstTokenLatency": "First-token latency",
  "alternative.score": "Intelligence",
  "alternative.cost": "Cost",
  "empty.noModels": "No models to display",
  "empty.checkApi": "Check the API configuration and try again.",
  "brand.home": "Parallax home",
  "hero.eyebrow": "BETWEEN MODELS",
  "hero.titleLead": "Choose,",
  "hero.titleAccent": "with evidence.",
  "hero.description": "When capability and cost share one map, the answer emerges from the differences.",
  "stats.overall": "All models",
  "stats.comparable": "Comparable",
  "stats.creators": "Creators",
  "explorer.sectionIndex": "01 / DECISION MAP",
  "explorer.title": "Find the right point",
  "explorer.description": "Capability varies, cost carries weight, and direction hides in the coordinates.",
  "creatorFilter.label": "Filter by creator",
  "creatorFilter.all": "All",
  "chart.areaLabel": "Scatter plot area",
  "chart.models": "Models",
  "chart.frontier": "Pareto frontier",
  "chart.strictAlternative": "Strict alternatives",
  "chart.reasoningLevels": "Reasoning levels",
  "chart.hintSelected": "Drag to pan, click empty space to clear selection",
  "chart.hintUnselected": "Drag to pan, click a data point to select a model",
  "chart.showAllLabels": "Show all names",
  "selection.placeholder": "Select a model to view details",
  "selection.emptyMessage": "Click any point on the chart to view capability, cost, and alternatives.",
  "alternatives.panelLabel": "Alternatives",
  "alternatives.label": "Alternatives",
  "alternatives.missingData": "Comparison data missing",
  "alternatives.strictCount": "{count} better options",
  "alternatives.onFrontier": "On the efficient frontier",
  "alternatives.chooseFirst": "Select a model first.",
  "alternatives.strictMissingMessage": "This model is missing an intelligence index or task cost, so alternatives cannot be generated yet.",
  "alternatives.none": "No qualifying models.",
  "alternatives.balancedLabel": "Similar candidates",
  "alternatives.balancedCount": "{count} similar options",
  "alternatives.balancedNone": "No matching candidates",
  "alternatives.balancedMissingMessage": "Add an intelligence index and task cost to calculate similar candidates.",
  "footer.tagline": "Parallax · Explore the frontier of model capability and cost.",
  "footer.sourcePrefix": "Data source: ",
  "source.missingApiKey": "No API key detected. Showing demo data until a key is configured.",
  "source.apiError": "The live data source returned {status}; showing demo data for now. Check your API key and subscription tier.",
  "source.unavailable": "The live data source is temporarily unavailable; showing demo data for now.",
  "chart.aria": "Model capability and cost scatter plot",
  "chart.ariaDescriptionMobile": "Scatter plot of model capability and task cost. The horizontal axis is task cost on a logarithmic scale; the vertical axis is the Artificial Analysis Intelligence Index. Select a model by clicking a point, and adjust the view with the edge sliders.",
  "chart.ariaDescriptionDesktop": "Scatter plot of model capability and task cost. The horizontal axis is task cost on a logarithmic scale; the vertical axis is the Artificial Analysis Intelligence Index. Dashed lines connect reasoning levels of the same model. Drag to pan, or use the edge sliders and mouse wheel to zoom.",
  "chart.tooltipAbility": "Intelligence",
  "chart.tooltipCost": "Cost",
  "chart.xAxisMobile": "Task cost (USD · log)",
  "chart.xAxisDesktop": "Task cost (USD, logarithmic scale)",
  "chart.yAxisMobile": "Intelligence index",
  "chart.yAxisDesktop": "Artificial Analysis Intelligence Index",
  "chart.gestureDesktop": "Drag to pan · light wheel to zoom · drag edge sliders to adjust range",
  "chart.gestureMobile": "Drag edge sliders to adjust range · click a point to select",
  "chart.empty": "No models currently include both an intelligence score and task cost.",
  "chart.reasoningSeries": "reasoning levels",
};

const ja: Record<TranslationKey, string> = {
  "metadata.title": "Parallax · AI モデルランドスケープ",
  "metadata.description": "能力、コスト、代替候補から AI モデルの全体像を探索します。",
  language: "言語",
  "theme.light": "ライト",
  "theme.dark": "ダーク",
  "theme.system": "システム",
  "theme.toggleAria": "テーマを切り替えます。現在：{current}",
  "theme.toggleTitle": "現在のテーマ：{current}。クリックして切り替え",
  "github.repository": "GitHub で cr-zhichen/parallax リポジトリを開く",
  "status.updated": "更新",
  loading: "散布図を読み込んでいます…",
  "search.placeholder": "モデル、提供元、IDを検索",
  "search.label": "モデルを検索",
  "search.clear": "検索をクリア",
  "search.matchingModels": "{count} 件の一致モデル",
  "search.noMatches": "一致するモデルがありません",
  "search.published": "公開日 {date}",
  "metric.intelligence": "能力",
  "metric.cost": "コスト",
  "metric.intelligenceIndex": "能力指数",
  "metric.taskCost": "タスクコスト",
  "metric.outputSpeed": "出力速度",
  "metric.firstTokenLatency": "初回トークン遅延",
  "alternative.score": "能力",
  "alternative.cost": "コスト",
  "empty.noModels": "表示できるモデルがありません",
  "empty.checkApi": "API 設定を確認して、もう一度お試しください。",
  "brand.home": "Parallax ホーム",
  "hero.eyebrow": "BETWEEN MODELS",
  "hero.titleLead": "選択に、",
  "hero.titleAccent": "根拠を。",
  "hero.description": "能力とコストを一つの図に置くと、違いの中から答えが見えてきます。",
  "stats.overall": "全モデル",
  "stats.comparable": "比較可能",
  "stats.creators": "提供元",
  "explorer.sectionIndex": "01 / DECISION MAP",
  "explorer.title": "最適な位置を見つける",
  "explorer.description": "能力には幅があり、コストには重みがあります。方向は座標の間に隠れています。",
  "creatorFilter.label": "提供元で絞り込む",
  "creatorFilter.all": "すべて",
  "chart.areaLabel": "散布図エリア",
  "chart.models": "モデル",
  "chart.frontier": "パレートフロンティア",
  "chart.strictAlternative": "厳密な代替候補",
  "chart.reasoningLevels": "推論レベル",
  "chart.hintSelected": "ドラッグで移動、空白をクリックして選択を解除",
  "chart.hintUnselected": "ドラッグで移動、データ点をクリックしてモデルを選択",
  "chart.showAllLabels": "すべての名前を表示",
  "selection.placeholder": "モデルを選択すると詳細を表示します",
  "selection.emptyMessage": "グラフのデータ点をクリックすると、能力・コスト・代替候補を確認できます。",
  "alternatives.panelLabel": "代替候補",
  "alternatives.label": "代替候補",
  "alternatives.missingData": "比較データが不足しています",
  "alternatives.strictCount": "より良い候補 {count} 件",
  "alternatives.onFrontier": "有効フロンティア上です",
  "alternatives.chooseFirst": "まずモデルを選択してください。",
  "alternatives.strictMissingMessage": "能力指数またはタスクコストがないため、代替候補を生成できません。",
  "alternatives.none": "条件に合うモデルはありません。",
  "alternatives.balancedLabel": "近い候補",
  "alternatives.balancedCount": "近い候補 {count} 件",
  "alternatives.balancedNone": "一致する候補はありません",
  "alternatives.balancedMissingMessage": "能力指数とタスクコストを追加すると、近い候補を計算できます。",
  "footer.tagline": "Parallax · モデルの能力とコストのフロンティアを探索。",
  "footer.sourcePrefix": "データソース：",
  "source.missingApiKey": "API キーが検出されないため、サンプルデータを表示しています。設定するとリアルタイムデータに切り替わります。",
  "source.apiError": "リアルタイムデータソースが {status} を返したため、サンプルデータを表示しています。API キーと契約プランを確認してください。",
  "source.unavailable": "リアルタイムデータソースは一時的に利用できないため、サンプルデータを表示しています。",
  "chart.aria": "モデルの能力とコストの散布図",
  "chart.ariaDescriptionMobile": "モデルの能力とタスクコストの散布図です。横軸は対数スケールのタスクコスト、縦軸は Artificial Analysis Intelligence Index です。データ点をクリックしてモデルを選択し、端のスライダーで表示範囲を調整できます。",
  "chart.ariaDescriptionDesktop": "モデルの能力とタスクコストの散布図です。横軸は対数スケールのタスクコスト、縦軸は Artificial Analysis Intelligence Index です。同じモデルの推論レベルは破線で結ばれます。ドラッグで移動し、端のスライダーやマウスホイールでズームできます。",
  "chart.tooltipAbility": "能力",
  "chart.tooltipCost": "コスト",
  "chart.xAxisMobile": "タスクコスト (USD · 対数)",
  "chart.xAxisDesktop": "タスクコスト (USD、対数スケール)",
  "chart.yAxisMobile": "能力指数",
  "chart.yAxisDesktop": "Artificial Analysis Intelligence Index",
  "chart.gestureDesktop": "ドラッグで移動 · 軽くスクロールしてズーム · 端のスライダーで範囲を調整",
  "chart.gestureMobile": "端のスライダーで範囲を調整 · データ点をクリックして選択",
  "chart.empty": "現在、能力スコアとタスクコストの両方を含むモデルはありません。",
  "chart.reasoningSeries": "推論レベル",
};

const messages: Record<Locale, Record<TranslationKey, string>> = {
  "zh-CN": zhCN,
  en,
  ja,
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "zh-CN" || value === "en" || value === "ja";
}

export function detectLocale(languages: readonly string[] | undefined): Locale {
  for (const language of languages ?? []) {
    const normalized = language.trim().toLowerCase().replace(/_/g, "-");
    if (normalized === "zh" || normalized.startsWith("zh-")) return "zh-CN";
    if (normalized === "en" || normalized.startsWith("en-")) return "en";
    if (normalized === "ja" || normalized.startsWith("ja-")) return "ja";
  }

  return DEFAULT_LOCALE;
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  params: TranslationParams = {},
): string {
  const template = messages[locale][key] ?? messages[DEFAULT_LOCALE][key];
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name)
      ? String(params[name])
      : match,
  );
}

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Restricted storage should not disable browser-language detection.
  }

  const languages =
    navigator.languages?.length > 0
      ? navigator.languages
      : navigator.language
        ? [navigator.language]
        : undefined;
  return detectLocale(languages);
}

function subscribeToLocale(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LOCALE_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LOCALE_CHANGE_EVENT, onStoreChange);
  };
}

export function useLocale() {
  const locale = useSyncExternalStore(
    subscribeToLocale,
    getStoredLocale,
    () => DEFAULT_LOCALE,
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = translate(locale, "metadata.title");
    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (description) {
      description.content = translate(locale, "metadata.description");
    }
  }, [locale]);

  const setLocale = (nextLocale: Locale) => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    } catch {
      // Restricted storage should not block language changes.
    }
    document.documentElement.lang = nextLocale;
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  };

  const t: Translator = (key, params) => translate(locale, key, params);

  return { locale, setLocale, t };
}
