/**
 * Supported language codes
 */
export const LanguageCode = {
  EN: "en",
  KO: "ko",
  ES: "es",
  JA: "ja",
  ZH: "zh",
  TH: "th",
  VI: "vi",
} as const;

/**
 * Language code type
 */
export type LanguageCodeType = typeof LanguageCode[keyof typeof LanguageCode];

/**
 * Language configuration
 */
export interface Language {
  code: LanguageCodeType;
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
  { code: LanguageCode.TH, name: "ไทย" },
  { code: LanguageCode.VI, name: "Tiếng Việt" },
] as const;

/**
 * Default language
 */
export const DEFAULT_LANGUAGE = LanguageCode.EN;
