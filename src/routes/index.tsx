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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 py-8 px-4 md:py-4 md:px-2">
      <header className="text-center mb-12 py-8 md:mb-8 md:py-4">
        <h1 className="text-5xl font-extrabold text-white m-0 mb-4 drop-shadow-[0_4px_20px_rgba(0,0,0,0.2)] tracking-tight md:text-3xl">
          나만의 바이어스 갤러리
        </h1>
        <p className="text-xl text-white/90 m-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.1)] md:text-base">
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
