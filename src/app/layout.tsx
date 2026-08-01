import type { Metadata } from "next";

import "./globals.css";

const themeBootstrapScript = `
(() => {
  try {
    const stored = window.localStorage.getItem("parallax-theme");
    const theme = stored === "light" || stored === "dark" ? stored : "system";
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = "system";
  }
})();
`;

const localeBootstrapScript = `
(() => {
  const detectLocale = () => {
    const languages =
      Array.isArray(navigator.languages) && navigator.languages.length > 0
        ? navigator.languages
        : navigator.language
          ? [navigator.language]
          : [];

    for (const language of languages) {
      const normalized = String(language).trim().toLowerCase().replace(/_/g, "-");
      if (normalized === "zh" || normalized.startsWith("zh-")) return "zh-CN";
      if (normalized === "en" || normalized.startsWith("en-")) return "en";
      if (normalized === "ja" || normalized.startsWith("ja-")) return "ja";
    }

    return "zh-CN";
  };

  try {
    const stored = window.localStorage.getItem("parallax-locale");
    const locale =
      stored === "en" || stored === "ja" || stored === "zh-CN"
        ? stored
        : detectLocale();
    document.documentElement.lang = locale;
  } catch {
    document.documentElement.lang = detectLocale();
  }
})();
`;

export const metadata: Metadata = {
  title: "Parallax · AI 模型版图",
  description: "从能力、成本和替代关系探索 AI 模型版图。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-theme="system" suppressHydrationWarning>
      <head>
        <script
          id="theme-bootstrap"
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
        <script
          id="locale-bootstrap"
          dangerouslySetInnerHTML={{ __html: localeBootstrapScript }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
