import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      // Home page
      "home.title": "My Bias Gallery",
      "home.subtitle": "Capture your precious memories beautifully",

      // Uploader
      "uploader.title": "Capture your precious moments",
      "uploader.dragActive": "Drop here",
      "uploader.dragInactive": "Drag or click to add photos",
      "uploader.button": "Add Photos",

      // Editor
      "editor.undo": "Undo",
      "editor.redo": "Redo",
      "editor.apply": "Apply",
      "editor.close": "Close",
      "editor.lockAspectRatio": "Lock aspect ratio",
      "editor.unlockAspectRatio": "Unlock aspect ratio",
      "editor.processing": "Processing...",
      "editor.pleaseWait": "Please wait",

      // Editor - AI Enhancement
      "editor.ai.limitReached": "You've used all AI enhancements for today. Please try again tomorrow!",
      "editor.ai.preparingImage": "Preparing image...",
      "editor.ai.requestingServer": "Requesting AI server...",
      "editor.ai.analyzingFaces": "AI is analyzing faces...",
      "editor.ai.enhancingSkinTone": "Enhancing skin tone...",
      "editor.ai.sharpeningEyes": "Sharpening eyes...",
      "editor.ai.enhancingDetails": "Enhancing details...",
      "editor.ai.almostDone": "Almost done!",
      "editor.ai.downloadingImage": "Downloading image...",
      "editor.ai.failed": "AI enhancement failed. Please try again.",

      // Share Modal
      "share.title": "Share",
      "share.kakaotalk": "KakaoTalk",
      "share.copyLink": "Copy Link",
      "share.saveImage": "Save Image",
      "share.message": "Photo created in My Bias Gallery!",
      "share.linkCopiedKakao": "Link copied. Please paste in KakaoTalk!",
      "share.shareFromKakaoApp": "Please share directly from KakaoTalk app.",
      "share.linkCopied": "Link copied!",
      "share.copyFailed": "Failed to copy link.",
      "share.viewOnWeb": "View on Web",
    },
  },
  ko: {
    translation: {
      // Home page
      "home.title": "나만의 바이어스 갤러리",
      "home.subtitle": "소중한 추억을 아름답게 담아보세요",

      // Uploader
      "uploader.title": "소중한 순간을 담아주세요",
      "uploader.dragActive": "여기에 놓아주세요",
      "uploader.dragInactive": "사진을 드래그하거나 클릭해서 추가하세요",
      "uploader.button": "사진 추가하기",

      // Editor
      "editor.undo": "되돌리기",
      "editor.redo": "다시 실행",
      "editor.apply": "완료",
      "editor.close": "닫기",
      "editor.lockAspectRatio": "비율 고정",
      "editor.unlockAspectRatio": "비율 고정 해제",
      "editor.processing": "처리 중...",
      "editor.pleaseWait": "잠시만 기다려주세요",

      // Editor - AI Enhancement
      "editor.ai.limitReached": "오늘의 AI 보정 횟수를 모두 사용했습니다. 내일 다시 시도해주세요!",
      "editor.ai.preparingImage": "이미지 준비 중...",
      "editor.ai.requestingServer": "AI 서버에 요청 중...",
      "editor.ai.analyzingFaces": "AI가 얼굴을 분석하고 있어요...",
      "editor.ai.enhancingSkinTone": "피부 톤을 보정하고 있어요...",
      "editor.ai.sharpeningEyes": "눈동자를 선명하게 하고 있어요...",
      "editor.ai.enhancingDetails": "디테일을 살리고 있어요...",
      "editor.ai.almostDone": "거의 다 됐어요!",
      "editor.ai.downloadingImage": "이미지 다운로드 중...",
      "editor.ai.failed": "AI 보정에 실패했습니다. 다시 시도해주세요.",

      // Share Modal
      "share.title": "공유하기",
      "share.kakaotalk": "카카오톡",
      "share.copyLink": "링크 복사",
      "share.saveImage": "이미지 저장",
      "share.message": "나만의 바이어스 갤러리에서 만든 사진이에요!",
      "share.linkCopiedKakao": "링크가 복사되었습니다. 카카오톡에서 붙여넣기 해주세요!",
      "share.shareFromKakaoApp": "카카오톡 앱에서 직접 공유해주세요.",
      "share.linkCopied": "링크가 복사되었습니다!",
      "share.copyFailed": "링크 복사에 실패했습니다.",
      "share.viewOnWeb": "웹으로 보기",
    },
  },
  es: {
    translation: {
      // Home page
      "home.title": "Mi Galería de Bias",
      "home.subtitle": "Captura tus recuerdos preciosos hermosamente",

      // Uploader
      "uploader.title": "Captura tus momentos preciosos",
      "uploader.dragActive": "Suelta aquí",
      "uploader.dragInactive": "Arrastra o haz clic para agregar fotos",
      "uploader.button": "Agregar Fotos",

      // Editor
      "editor.undo": "Deshacer",
      "editor.redo": "Rehacer",
      "editor.apply": "Aplicar",
      "editor.close": "Cerrar",
      "editor.lockAspectRatio": "Bloquear proporción",
      "editor.unlockAspectRatio": "Desbloquear proporción",
      "editor.processing": "Procesando...",
      "editor.pleaseWait": "Por favor espera",

      // Editor - AI Enhancement
      "editor.ai.limitReached": "Has usado todas las mejoras de IA por hoy. ¡Inténtalo de nuevo mañana!",
      "editor.ai.preparingImage": "Preparando imagen...",
      "editor.ai.requestingServer": "Solicitando servidor de IA...",
      "editor.ai.analyzingFaces": "IA está analizando rostros...",
      "editor.ai.enhancingSkinTone": "Mejorando tono de piel...",
      "editor.ai.sharpeningEyes": "Afilando ojos...",
      "editor.ai.enhancingDetails": "Mejorando detalles...",
      "editor.ai.almostDone": "¡Casi listo!",
      "editor.ai.downloadingImage": "Descargando imagen...",
      "editor.ai.failed": "La mejora de IA falló. Inténtalo de nuevo.",

      // Share Modal
      "share.title": "Compartir",
      "share.kakaotalk": "KakaoTalk",
      "share.copyLink": "Copiar Enlace",
      "share.saveImage": "Guardar Imagen",
      "share.message": "¡Foto creada en Mi Galería de Bias!",
      "share.linkCopiedKakao": "Enlace copiado. ¡Por favor pega en KakaoTalk!",
      "share.shareFromKakaoApp": "Por favor comparte directamente desde la app de KakaoTalk.",
      "share.linkCopied": "¡Enlace copiado!",
      "share.copyFailed": "Error al copiar enlace.",
      "share.viewOnWeb": "Ver en Web",
    },
  },
  ja: {
    translation: {
      // Home page
      "home.title": "マイバイアスギャラリー",
      "home.subtitle": "大切な思い出を美しく保存しましょう",

      // Uploader
      "uploader.title": "大切な瞬間を保存してください",
      "uploader.dragActive": "ここにドロップ",
      "uploader.dragInactive": "ドラッグまたはクリックして写真を追加",
      "uploader.button": "写真を追加",

      // Editor
      "editor.undo": "元に戻す",
      "editor.redo": "やり直し",
      "editor.apply": "適用",
      "editor.close": "閉じる",
      "editor.lockAspectRatio": "縦横比を固定",
      "editor.unlockAspectRatio": "縦横比の固定を解除",
      "editor.processing": "処理中...",
      "editor.pleaseWait": "お待ちください",

      // Editor - AI Enhancement
      "editor.ai.limitReached": "本日のAI補正回数を使い切りました。明日また試してください！",
      "editor.ai.preparingImage": "画像を準備中...",
      "editor.ai.requestingServer": "AIサーバーに要請中...",
      "editor.ai.analyzingFaces": "AIが顔を分析しています...",
      "editor.ai.enhancingSkinTone": "肌色を補正しています...",
      "editor.ai.sharpeningEyes": "瞳を鮮明にしています...",
      "editor.ai.enhancingDetails": "ディテールを向上させています...",
      "editor.ai.almostDone": "もうすぐ完了！",
      "editor.ai.downloadingImage": "画像をダウンロード中...",
      "editor.ai.failed": "AI補正に失敗しました。もう一度試してください。",

      // Share Modal
      "share.title": "共有",
      "share.kakaotalk": "KakaoTalk",
      "share.copyLink": "リンクをコピー",
      "share.saveImage": "画像を保存",
      "share.message": "マイバイアスギャラリーで作成した写真です！",
      "share.linkCopiedKakao": "リンクがコピーされました。KakaoTalkに貼り付けてください！",
      "share.shareFromKakaoApp": "KakaoTalkアプリから直接共有してください。",
      "share.linkCopied": "リンクがコピーされました！",
      "share.copyFailed": "リンクのコピーに失敗しました。",
      "share.viewOnWeb": "Webで見る",
    },
  },
  zh: {
    translation: {
      // Home page
      "home.title": "我的偏爱画廊",
      "home.subtitle": "美好地保存您的珍贵回忆",

      // Uploader
      "uploader.title": "保存您的珍贵瞬间",
      "uploader.dragActive": "放在这里",
      "uploader.dragInactive": "拖放或点击添加照片",
      "uploader.button": "添加照片",

      // Editor
      "editor.undo": "撤销",
      "editor.redo": "重做",
      "editor.apply": "应用",
      "editor.close": "关闭",
      "editor.lockAspectRatio": "锁定纵横比",
      "editor.unlockAspectRatio": "解锁纵横比",
      "editor.processing": "处理中...",
      "editor.pleaseWait": "请稍候",

      // Editor - AI Enhancement
      "editor.ai.limitReached": "今天的AI增强次数已用完。请明天再试！",
      "editor.ai.preparingImage": "准备图像中...",
      "editor.ai.requestingServer": "请求AI服务器中...",
      "editor.ai.analyzingFaces": "AI正在分析面部...",
      "editor.ai.enhancingSkinTone": "增强肤色中...",
      "editor.ai.sharpeningEyes": "锐化眼睛中...",
      "editor.ai.enhancingDetails": "增强细节中...",
      "editor.ai.almostDone": "快完成了！",
      "editor.ai.downloadingImage": "下载图像中...",
      "editor.ai.failed": "AI增强失败。请重试。",

      // Share Modal
      "share.title": "分享",
      "share.kakaotalk": "KakaoTalk",
      "share.copyLink": "复制链接",
      "share.saveImage": "保存图像",
      "share.message": "在我的偏爱画廊创建的照片！",
      "share.linkCopiedKakao": "链接已复制。请在KakaoTalk中粘贴！",
      "share.shareFromKakaoApp": "请直接从KakaoTalk应用分享。",
      "share.linkCopied": "链接已复制！",
      "share.copyFailed": "复制链接失败。",
      "share.viewOnWeb": "在网页查看",
    },
  },
};

i18n
  .use(LanguageDetector) // ✅ Detect user browser language (navigator.language)
  .use(initReactI18next) // ✅ Connect with React
  .init({
    resources,
    fallbackLng: "en", // Default language if detection fails
    debug: false, // Set to false in production

    interpolation: {
      escapeValue: false, // React already prevents XSS
    },

    // Detection options
    detection: {
      order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],
      caches: ["localStorage", "cookie"], // Save selected language in browser
    },
  });

export default i18n;
