/**
 * Supported language codes
 */
export enum LanguageCode {
  EN = "en",
  KO = "ko",
  ES = "es",
  JA = "ja",
  ZH = "zh",
}

/**
 * Language configuration
 */
export interface Language {
  code: LanguageCode;
  name: string;
}

/**
 * Available languages
 */
export const LANGUAGES: readonly Language[] = [
  { code: LanguageCode.EN, name: "English" },
  { code: LanguageCode.KO, name: "한국어" },
  { code: LanguageCode.ES, name: "Español" },
  { code: LanguageCode.JA, name: "日本語" },
  { code: LanguageCode.ZH, name: "中文" },
] as const;

/**
 * Default language
 */
export const DEFAULT_LANGUAGE = LanguageCode.EN;
