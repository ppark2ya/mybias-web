import { createFileRoute } from "@tanstack/react-router";
import Uploader from "../components/Uploader";
import "./index.css";

export const Route = createFileRoute("/")({
  component: Home,
});

export function Home() {
  const handleUpload = (files: File[]) => {
    console.log("Uploaded files:", files);
    // 여기에 파일 업로드 로직을 추가할 수 있습니다
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="home-title">나만의 바이어스 갤러리</h1>
        <p className="home-subtitle">소중한 추억을 아름답게 담아보세요 ✨</p>
      </header>

      <main className="home-main">
        <Uploader onUpload={handleUpload} />
      </main>
    </div>
  );
}

export default Home;
