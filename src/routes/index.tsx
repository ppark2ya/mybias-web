import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Uploader from "../components/Uploader";
import Editor from "../components/Editor";

export const Route = createFileRoute("/")({
  component: Home,
});

export function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleUpload = (files: File[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleCloseEditor = () => {
    setUploadedFiles([]);
  };

  const isEditing = uploadedFiles.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 py-4 px-2 sm:py-6 sm:px-4 lg:py-8 lg:px-6">
      <header className="text-center mb-4 py-2 sm:mb-6 sm:py-4 lg:mb-8 lg:py-6">
        <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white m-0 mb-2 sm:mb-3 lg:mb-4 drop-shadow-[0_4px_20px_rgba(0,0,0,0.25)] tracking-tight">
          나만의 바이어스 갤러리
        </h1>
        <p className="text-sm sm:text-base lg:text-xl text-white/90 m-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
          소중한 추억을 아름답게 담아보세요
        </p>
      </header>

      <main className="max-w-[1200px] mx-auto">
        {isEditing ? (
          <Editor files={uploadedFiles} onClose={handleCloseEditor} />
        ) : (
          <Uploader onUpload={handleUpload} />
        )}
      </main>
    </div>
  );
}

export default Home;
