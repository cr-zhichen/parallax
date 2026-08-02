import { useEffect, useSyncExternalStore } from "react";

export const LOCALE_STORAGE_KEY = "parallax-locale";
export const LOCALE_CHANGE_EVENT = "parallax-locale-change";

export const LOCALE_OPTIONS = [
  { value: "zh-CN", label: "中文" },
  { value: "zh-TW", label: "繁體中文" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
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
  "chart.xScale.log": "对数",
  "chart.xScale.linear": "线性",
  "chart.xScale.logCost": "对数成本",
  "chart.xScale.linearCost": "线性成本",
  "chart.xScale.toggleAria": "切换横轴刻度，当前为{current}",
  "chart.xScale.toggleTitle": "当前横轴：{current}。点击切换",
  "recommendations.title": "膝点推荐",
  "recommendations.subtitle": "在能力与成本之间，找到值得优先考虑的模型。",
  "recommendations.score": "膝点",
  "recommendations.select": "选择推荐模型：{model}",
  "recommendations.formulaTitle": "膝点与评分公式",
  "recommendations.formulaText": "膝点是能力与成本的折中位置：沿着帕累托前沿继续提升能力时，成本开始明显增加。",
  "recommendations.formulaVariables": "C 是任务成本，I 是能力指数；下标 0 和 1 分别表示成本端点与能力端点。",
  "recommendations.formulaCostLabel": "归一化成本",
  "recommendations.formulaIntelligenceLabel": "归一化能力",
  "recommendations.formulaScoreLabel": "膝点评分",
  "recommendations.formulaMeaning": "分数越高，表示单位成本带来的能力提升越明显，因此越值得优先推荐。",
  "recommendations.formulaTieLabel": "并列处理",
  "recommendations.formulaSelection": "若膝点评分相同，则选择 idealDistance 更小的模型；仍相同则选择成本更低者。",
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
  "chart.ariaDescriptionMobile": "模型能力与任务成本散点图。横轴为单项任务成本，{scale}刻度；纵轴为 Artificial Analysis Intelligence Index。点击数据点选择模型，拖动轴边滑块调整显示范围。",
  "chart.ariaDescriptionDesktop": "模型能力与任务成本散点图。横轴为单项任务成本，{scale}刻度；纵轴为 Artificial Analysis Intelligence Index。同一模型的不同思考等级使用虚线连接。可拖动图表平移，或使用轴边滑动条和滚轮缩放。",
  "chart.tooltipAbility": "能力",
  "chart.tooltipCost": "成本",
  "chart.xAxisMobile": "任务成本（USD · {scale}）",
  "chart.xAxisDesktop": "单项任务成本（USD，{scale}刻度）",
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
  "chart.xScale.log": "logarithmic",
  "chart.xScale.linear": "linear",
  "chart.xScale.logCost": "Log cost",
  "chart.xScale.linearCost": "Linear cost",
  "chart.xScale.toggleAria": "Switch the horizontal-axis scale. Current: {current}",
  "chart.xScale.toggleTitle": "Current horizontal axis: {current}. Click to switch",
  "recommendations.title": "Knee recommendations",
  "recommendations.subtitle": "Find the models worth prioritizing across capability and cost.",
  "recommendations.score": "Knee",
  "recommendations.select": "Select recommended model: {model}",
  "recommendations.formulaTitle": "Knee point and scoring",
  "recommendations.formulaText": "The knee is the trade-off point where pushing capability higher starts to increase cost sharply along the Pareto frontier.",
  "recommendations.formulaVariables": "C is task cost and I is the intelligence index; subscripts 0 and 1 mark the cost and intelligence endpoints.",
  "recommendations.formulaCostLabel": "Normalized cost",
  "recommendations.formulaIntelligenceLabel": "Normalized intelligence",
  "recommendations.formulaScoreLabel": "Knee score",
  "recommendations.formulaMeaning": "A higher score means each increase in cost buys a clearer capability gain, so the model is preferred sooner.",
  "recommendations.formulaTieLabel": "Tie-break",
  "recommendations.formulaSelection": "If scores tie, choose the smaller idealDistance; if still tied, choose the lower cost.",
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
  "chart.ariaDescriptionMobile": "Scatter plot of model capability and task cost. The horizontal axis is task cost on a {scale} scale; the vertical axis is the Artificial Analysis Intelligence Index. Select a model by clicking a point, and adjust the view with the edge sliders.",
  "chart.ariaDescriptionDesktop": "Scatter plot of model capability and task cost. The horizontal axis is task cost on a {scale} scale; the vertical axis is the Artificial Analysis Intelligence Index. Dashed lines connect reasoning levels of the same model. Drag to pan, or use the edge sliders and mouse wheel to zoom.",
  "chart.tooltipAbility": "Intelligence",
  "chart.tooltipCost": "Cost",
  "chart.xAxisMobile": "Task cost (USD · {scale})",
  "chart.xAxisDesktop": "Task cost (USD, {scale} scale)",
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
  "chart.xScale.log": "対数",
  "chart.xScale.linear": "線形",
  "chart.xScale.logCost": "対数コスト",
  "chart.xScale.linearCost": "線形コスト",
  "chart.xScale.toggleAria": "横軸のスケールを切り替えます。現在：{current}",
  "chart.xScale.toggleTitle": "現在の横軸：{current}。クリックして切り替え",
  "recommendations.title": "膝点のおすすめ",
  "recommendations.subtitle": "能力とコストのバランスから、優先して検討したいモデルを見つけます。",
  "recommendations.score": "膝点",
  "recommendations.select": "おすすめモデルを選択：{model}",
  "recommendations.formulaTitle": "膝点とスコアの式",
  "recommendations.formulaText": "膝点は能力とコストの折衷点です。パレートフロンティア上で能力を上げると、コストが大きく増え始める位置を示します。",
  "recommendations.formulaVariables": "C はタスクコスト、I は能力指数です。下付きの 0 と 1 はコスト端点と能力端点を表します。",
  "recommendations.formulaCostLabel": "正規化コスト",
  "recommendations.formulaIntelligenceLabel": "正規化した能力",
  "recommendations.formulaScoreLabel": "膝点スコア",
  "recommendations.formulaMeaning": "スコアが高いほど、コストの増加に対して能力の向上が大きく、優先して選ぶ価値があります。",
  "recommendations.formulaTieLabel": "同点処理",
  "recommendations.formulaSelection": "スコアが同じ場合は idealDistance が小さい候補を選び、それでも同じなら低コストを優先します。",
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
  "chart.ariaDescriptionMobile": "モデルの能力とタスクコストの散布図です。横軸は{scale}スケールのタスクコスト、縦軸は Artificial Analysis Intelligence Index です。データ点をクリックしてモデルを選択し、端のスライダーで表示範囲を調整できます。",
  "chart.ariaDescriptionDesktop": "モデルの能力とタスクコストの散布図です。横軸は{scale}スケールのタスクコスト、縦軸は Artificial Analysis Intelligence Index です。同じモデルの推論レベルは破線で結ばれます。ドラッグで移動し、端のスライダーやマウスホイールでズームできます。",
  "chart.tooltipAbility": "能力",
  "chart.tooltipCost": "コスト",
  "chart.xAxisMobile": "タスクコスト (USD · {scale})",
  "chart.xAxisDesktop": "タスクコスト (USD、{scale}スケール)",
  "chart.yAxisMobile": "能力指数",
  "chart.yAxisDesktop": "Artificial Analysis Intelligence Index",
  "chart.gestureDesktop": "ドラッグで移動 · 軽くスクロールしてズーム · 端のスライダーで範囲を調整",
  "chart.gestureMobile": "端のスライダーで範囲を調整 · データ点をクリックして選択",
  "chart.empty": "現在、能力スコアとタスクコストの両方を含むモデルはありません。",
  "chart.reasoningSeries": "推論レベル",
};

const zhTW: Record<TranslationKey, string> = {
  "metadata.title": "Parallax · AI 模型版圖",
  "metadata.description": "從能力、成本和替代關係探索 AI 模型版圖。",
  language: "語言",
  "theme.light": "淺色",
  "theme.dark": "深色",
  "theme.system": "系統",
  "theme.toggleAria": "切換主題，目前為{current}",
  "theme.toggleTitle": "目前主題：{current}。點擊切換",
  "github.repository": "在 GitHub 開啟 cr-zhichen/parallax 倉庫",
  "status.updated": "更新",
  loading: "正在載入散點圖…",
  "search.placeholder": "搜尋模型、廠商或標識",
  "search.label": "搜尋模型",
  "search.clear": "清除搜尋",
  "search.matchingModels": "{count} 個相符模型",
  "search.noMatches": "沒有找到相符模型",
  "search.published": "發布 {date}",
  "metric.intelligence": "能力",
  "metric.cost": "成本",
  "metric.intelligenceIndex": "能力指數",
  "metric.taskCost": "單項成本",
  "metric.outputSpeed": "輸出速度",
  "metric.firstTokenLatency": "首字延遲",
  "alternative.score": "能力",
  "alternative.cost": "成本",
  "empty.noModels": "還沒有可展示的模型",
  "empty.checkApi": "請檢查 API 設定後重試。",
  "brand.home": "Parallax 首頁",
  "hero.eyebrow": "BETWEEN MODELS",
  "hero.titleLead": "選擇，",
  "hero.titleAccent": "有跡可循。",
  "hero.description": "當能力與成本落在同一張圖上，答案便從差異中浮現。",
  "stats.overall": "全部模型",
  "stats.comparable": "可比較模型",
  "stats.creators": "模型廠商",
  "explorer.sectionIndex": "01 / DECISION MAP",
  "explorer.title": "找到合適的落點",
  "explorer.description": "能力有高低，成本有輕重，方向藏在座標之間。",
  "creatorFilter.label": "按廠商多選篩選",
  "creatorFilter.all": "全部",
  "chart.areaLabel": "散點圖區域",
  "chart.models": "模型",
  "chart.frontier": "帕累托前沿",
  "chart.strictAlternative": "嚴格替代",
  "chart.reasoningLevels": "思考等級",
  "chart.hintSelected": "拖曳平移，點擊空白處取消選擇",
  "chart.hintUnselected": "拖曳平移，點擊資料點選擇模型",
  "chart.showAllLabels": "顯示全部名稱",
  "chart.xScale.log": "對數",
  "chart.xScale.linear": "線性",
  "chart.xScale.logCost": "對數成本",
  "chart.xScale.linearCost": "線性成本",
  "chart.xScale.toggleAria": "切換橫軸刻度，目前為{current}",
  "chart.xScale.toggleTitle": "目前橫軸：{current}。點擊切換",
  "recommendations.title": "膝點推薦",
  "recommendations.subtitle": "在能力與成本之間，找到值得優先考慮的模型。",
  "recommendations.score": "膝點",
  "recommendations.select": "選擇推薦模型：{model}",
  "recommendations.formulaTitle": "膝點與評分公式",
  "recommendations.formulaText": "膝點是能力與成本的折衷位置：沿著帕累托前沿繼續提升能力時，成本開始明顯增加。",
  "recommendations.formulaVariables": "C 是任務成本，I 是能力指數；下標 0 和 1 分別表示成本端點與能力端點。",
  "recommendations.formulaCostLabel": "正規化成本",
  "recommendations.formulaIntelligenceLabel": "正規化能力",
  "recommendations.formulaScoreLabel": "膝點評分",
  "recommendations.formulaMeaning": "分數越高，表示單位成本帶來的能力提升越明顯，因此越值得優先推薦。",
  "recommendations.formulaTieLabel": "並列處理",
  "recommendations.formulaSelection": "若膝點評分相同，則選擇 idealDistance 更小的模型；仍相同則選擇成本更低者。",
  "selection.placeholder": "選擇模型後顯示詳情",
  "selection.emptyMessage": "點擊圖表中的任意資料點，查看能力、成本和替代建議。",
  "alternatives.panelLabel": "替代建議",
  "alternatives.label": "替代建議",
  "alternatives.missingData": "缺少比較資料",
  "alternatives.strictCount": "{count} 個更優選擇",
  "alternatives.onFrontier": "已位於有效前沿",
  "alternatives.chooseFirst": "請先選擇模型。",
  "alternatives.strictMissingMessage": "目前模型缺少能力指數或任務成本，暫時無法產生替代建議。",
  "alternatives.none": "暫無符合條件的模型。",
  "alternatives.balancedLabel": "相近候選",
  "alternatives.balancedCount": "{count} 個相近選擇",
  "alternatives.balancedNone": "暫無相符候選",
  "alternatives.balancedMissingMessage": "補充能力指數與任務成本後，才能計算相近候選。",
  "footer.tagline": "Parallax · Explore the frontier of model capability and cost.",
  "footer.sourcePrefix": "資料來源：",
  "source.missingApiKey": "未偵測到 API Key，目前使用範例資料。設定後會自動切換為即時資料。",
  "source.apiError": "即時資料來源回傳 {status}，暫時顯示範例資料。請檢查 API Key 與訂閱層級。",
  "source.unavailable": "即時資料來源暫時無法使用，目前顯示範例資料。",
  "chart.aria": "模型能力與成本散點圖",
  "chart.ariaDescriptionMobile": "模型能力與任務成本散點圖。橫軸為單項任務成本，{scale}刻度；縱軸為 Artificial Analysis Intelligence Index。點擊資料點選擇模型，拖曳軸邊滑桿調整顯示範圍。",
  "chart.ariaDescriptionDesktop": "模型能力與任務成本散點圖。橫軸為單項任務成本，{scale}刻度；縱軸為 Artificial Analysis Intelligence Index。同一模型的不同思考等級使用虛線連接。可拖曳圖表平移，或使用軸邊滑動條和滾輪縮放。",
  "chart.tooltipAbility": "能力",
  "chart.tooltipCost": "成本",
  "chart.xAxisMobile": "任務成本（USD · {scale}）",
  "chart.xAxisDesktop": "單項任務成本（USD，{scale}刻度）",
  "chart.yAxisMobile": "能力指數",
  "chart.yAxisDesktop": "Artificial Analysis Intelligence Index",
  "chart.gestureDesktop": "拖曳圖表平移 · 輕滾輪縮放 · 拖曳軸邊滑桿調整範圍",
  "chart.gestureMobile": "拖曳軸邊滑桿調整範圍 · 點擊資料點選擇",
  "chart.empty": "目前資料中沒有同時包含能力分數與任務成本的模型。",
  "chart.reasoningSeries": "思考等級",
};

const ko: Record<TranslationKey, string> = {
  "metadata.title": "Parallax · AI 모델 지형",
  "metadata.description": "능력, 비용, 대체 관계를 통해 AI 모델 지형을 탐색합니다.",
  language: "언어",
  "theme.light": "라이트",
  "theme.dark": "다크",
  "theme.system": "시스템",
  "theme.toggleAria": "테마 전환. 현재: {current}",
  "theme.toggleTitle": "현재 테마: {current}. 클릭하여 전환",
  "github.repository": "GitHub에서 cr-zhichen/parallax 저장소 열기",
  "status.updated": "업데이트",
  loading: "산점도를 불러오는 중…",
  "search.placeholder": "모델, 제공사 또는 ID 검색",
  "search.label": "모델 검색",
  "search.clear": "검색 지우기",
  "search.matchingModels": "일치 모델 {count}개",
  "search.noMatches": "일치하는 모델을 찾을 수 없습니다",
  "search.published": "출시 {date}",
  "metric.intelligence": "능력",
  "metric.cost": "비용",
  "metric.intelligenceIndex": "능력 지수",
  "metric.taskCost": "작업 비용",
  "metric.outputSpeed": "출력 속도",
  "metric.firstTokenLatency": "첫 토큰 지연",
  "alternative.score": "능력",
  "alternative.cost": "비용",
  "empty.noModels": "표시할 모델이 없습니다",
  "empty.checkApi": "API 설정을 확인한 후 다시 시도하세요.",
  "brand.home": "Parallax 홈",
  "hero.eyebrow": "BETWEEN MODELS",
  "hero.titleLead": "선택에,",
  "hero.titleAccent": "근거를.",
  "hero.description": "능력과 비용이 한 장의 지도에 놓이면, 차이들 속에서 답이 드러납니다.",
  "stats.overall": "전체 모델",
  "stats.comparable": "비교 가능",
  "stats.creators": "모델 제공사",
  "explorer.sectionIndex": "01 / DECISION MAP",
  "explorer.title": "알맞은 지점을 찾으세요",
  "explorer.description": "능력에는 높낮이가, 비용에는 무게가 있고, 방향은 좌표 사이에 숨어 있습니다.",
  "creatorFilter.label": "제공사로 다중 선택 필터",
  "creatorFilter.all": "전체",
  "chart.areaLabel": "산점도 영역",
  "chart.models": "모델",
  "chart.frontier": "파레토 프론티어",
  "chart.strictAlternative": "엄격 대체",
  "chart.reasoningLevels": "추론 수준",
  "chart.hintSelected": "드래그로 이동, 빈 곳 클릭으로 선택 해제",
  "chart.hintUnselected": "드래그로 이동, 데이터 포인트 클릭으로 모델 선택",
  "chart.showAllLabels": "모든 이름 표시",
  "chart.xScale.log": "로그",
  "chart.xScale.linear": "선형",
  "chart.xScale.logCost": "로그 비용",
  "chart.xScale.linearCost": "선형 비용",
  "chart.xScale.toggleAria": "가로축 눈금 전환. 현재: {current}",
  "chart.xScale.toggleTitle": "현재 가로축: {current}. 클릭하여 전환",
  "recommendations.title": "무릎점 추천",
  "recommendations.subtitle": "능력과 비용 사이에서 우선 검토할 모델을 찾습니다.",
  "recommendations.score": "무릎점",
  "recommendations.select": "추천 모델 선택: {model}",
  "recommendations.formulaTitle": "무릎점과 점수 공식",
  "recommendations.formulaText": "무릎점은 능력과 비용의 절충점입니다. 파레토 프론티어를 따라 능력을 더 높이면 비용이 급격히 증가하기 시작하는 위치입니다.",
  "recommendations.formulaVariables": "C는 작업 비용, I는 능력 지수이며, 아래 첨자 0과 1은 각각 비용 끝점과 능력 끝점을 나타냅니다.",
  "recommendations.formulaCostLabel": "정규화 비용",
  "recommendations.formulaIntelligenceLabel": "정규화 능력",
  "recommendations.formulaScoreLabel": "무릎점 점수",
  "recommendations.formulaMeaning": "점수가 높을수록 비용 증가 대비 능력 향상이 뚜렷해 우선 추천할 가치가 큽니다.",
  "recommendations.formulaTieLabel": "동점 처리",
  "recommendations.formulaSelection": "점수가 같으면 idealDistance가 더 작은 모델을 고르고, 그래도 같으면 비용이 낮은 쪽을 선택합니다.",
  "selection.placeholder": "모델을 선택하면 상세 정보가 표시됩니다",
  "selection.emptyMessage": "차트의 데이터 포인트를 클릭하면 능력, 비용, 대체 제안을 볼 수 있습니다.",
  "alternatives.panelLabel": "대체 제안",
  "alternatives.label": "대체 제안",
  "alternatives.missingData": "비교 데이터 부족",
  "alternatives.strictCount": "더 나은 선택 {count}개",
  "alternatives.onFrontier": "유효 프론티어에 위치",
  "alternatives.chooseFirst": "먼저 모델을 선택하세요.",
  "alternatives.strictMissingMessage": "이 모델에 능력 지수 또는 작업 비용이 없어 대체 제안을 생성할 수 없습니다.",
  "alternatives.none": "조건에 맞는 모델이 없습니다.",
  "alternatives.balancedLabel": "유사 후보",
  "alternatives.balancedCount": "유사 선택 {count}개",
  "alternatives.balancedNone": "일치하는 후보 없음",
  "alternatives.balancedMissingMessage": "능력 지수와 작업 비용을 보완해야 유사 후보를 계산할 수 있습니다.",
  "footer.tagline": "Parallax · 모델 능력과 비용의 프론티어를 탐색합니다.",
  "footer.sourcePrefix": "데이터 출처: ",
  "source.missingApiKey": "API 키가 감지되지 않아 데모 데이터를 표시합니다. 설정 후 실시간 데이터로 전환됩니다.",
  "source.apiError": "실시간 데이터 소스가 {status}를 반환해 데모 데이터를 표시합니다. API 키와 구독 등급을 확인하세요.",
  "source.unavailable": "실시간 데이터 소스를 일시적으로 사용할 수 없어 데모 데이터를 표시합니다.",
  "chart.aria": "모델 능력과 비용 산점도",
  "chart.ariaDescriptionMobile": "모델 능력과 작업 비용 산점도입니다. 가로축은 {scale} 눈금의 작업 비용, 세로축은 Artificial Analysis Intelligence Index입니다. 데이터 포인트를 클릭해 모델을 선택하고, 축 가장자리 슬라이더로 표시 범위를 조정하세요.",
  "chart.ariaDescriptionDesktop": "모델 능력과 작업 비용 산점도입니다. 가로축은 {scale} 눈금의 작업 비용, 세로축은 Artificial Analysis Intelligence Index입니다. 같은 모델의 추론 수준은 점선으로 연결됩니다. 드래그로 이동하거나 축 가장자리 슬라이더와 마우스 휠로 확대/축소할 수 있습니다.",
  "chart.tooltipAbility": "능력",
  "chart.tooltipCost": "비용",
  "chart.xAxisMobile": "작업 비용(USD · {scale})",
  "chart.xAxisDesktop": "작업 비용(USD, {scale} 눈금)",
  "chart.yAxisMobile": "능력 지수",
  "chart.yAxisDesktop": "Artificial Analysis Intelligence Index",
  "chart.gestureDesktop": "드래그로 이동 · 살짝 휠로 확대/축소 · 축 가장자리 슬라이더로 범위 조정",
  "chart.gestureMobile": "축 가장자리 슬라이더로 범위 조정 · 데이터 포인트 클릭으로 선택",
  "chart.empty": "현재 능력 점수와 작업 비용을 모두 포함한 모델이 없습니다.",
  "chart.reasoningSeries": "추론 수준",
};

const messages: Record<Locale, Record<TranslationKey, string>> = {
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  en,
  ja,
  ko,
};

export function isLocale(value: string | null | undefined): value is Locale {
  return LOCALE_OPTIONS.some((option) => option.value === value);
}

function matchLocale(normalized: string): Locale | null {
  if (
    normalized === "zh-tw" ||
    normalized === "zh-hk" ||
    normalized === "zh-mo" ||
    normalized.includes("hant")
  ) {
    return "zh-TW";
  }
  if (normalized === "zh" || normalized.startsWith("zh-")) return "zh-CN";
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  if (normalized === "ja" || normalized.startsWith("ja-")) return "ja";
  if (normalized === "ko" || normalized.startsWith("ko-")) return "ko";
  return null;
}

export function detectLocale(languages: readonly string[] | undefined): Locale {
  for (const language of languages ?? []) {
    const normalized = language.trim().toLowerCase().replace(/_/g, "-");
    const matched = matchLocale(normalized);
    if (matched) return matched;
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
