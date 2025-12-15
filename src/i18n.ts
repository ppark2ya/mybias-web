import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// 1. 번역 리소스 (실제로는 public/locales/ko.json 등으로 분리하는 것이 좋습니다)
const resources = {
  en: {
    translation: {
      title: "Welcome to React",
      description: "This is a multi-language support sample.",
      button: "Change to Korean",
      current_lang: "Current Language: English",
    },
  },
  ko: {
    translation: {
      title: "리액트에 오신 것을 환영합니다",
      description: "이것은 다국어 지원 샘플입니다.",
      button: "영어로 변경",
      current_lang: "현재 언어: 한국어",
    },
  },
};

i18n
  .use(LanguageDetector) // ✅ 사용자 브라우저 언어 감지 (navigator.language)
  .use(initReactI18next) // ✅ 리액트와 연결
  .init({
    resources,
    fallbackLng: "en", // 감지 실패 시 사용할 기본 언어
    debug: true, // 개발 콘솔에 로그 출력

    interpolation: {
      escapeValue: false, // 리액트는 기본적으로 XSS를 방지하므로 false 설정
    },

    // 감지 옵션 (필요시 순서 조정 가능)
    detection: {
      order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],
      caches: ["localStorage", "cookie"], // 선택한 언어를 브라우저에 저장
    },
  });

export default i18n;
