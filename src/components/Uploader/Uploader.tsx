import { useState, useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'

interface UploaderProps {
  onUpload?: (files: File[]) => void
}

export function Uploader({ onUpload }: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    )

    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files])
      onUpload?.(files)
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []

    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files])
      onUpload?.(files)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const getDropzoneClasses = () => {
    const baseClasses = `
      relative w-full min-h-[500px] flex items-center justify-center
      border-3 border-dashed rounded-3xl cursor-pointer
      transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden
      before:content-[''] before:absolute before:inset-0
      before:bg-gradient-to-br before:from-violet-500/5 before:to-blue-500/5
      before:opacity-0 before:transition-opacity before:duration-300
      hover:border-violet-400 hover:bg-gradient-to-br hover:from-white hover:to-gray-50
      hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(139,92,246,0.15)]
      hover:before:opacity-100
      md:min-h-[400px]
    `

    if (isDragging) {
      return `${baseClasses} border-violet-500 bg-gradient-to-br from-violet-50 to-violet-100 scale-[1.02] shadow-[0_25px_60px_rgba(139,92,246,0.25)] before:opacity-100`
    }

    if (uploadedFiles.length > 0) {
      return `${baseClasses} border-emerald-500 bg-gradient-to-br from-green-50 to-green-100`
    }

    return `${baseClasses} border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100`
  }

  return (
    <div className="w-full max-w-[800px] mx-auto p-8 md:p-4">
      <div
        className={getDropzoneClasses()}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="relative z-10 text-center py-12 px-8 w-full md:py-8 md:px-4">
          <div className={`
            inline-flex items-center justify-center
            w-[120px] h-[120px] mx-auto mb-8
            bg-gradient-to-br from-violet-500 to-indigo-500
            rounded-full text-white
            shadow-[0_10px_40px_rgba(139,92,246,0.3)]
            transition-all duration-300
            group-hover:scale-110 group-hover:rotate-[5deg]
            group-hover:shadow-[0_15px_50px_rgba(139,92,246,0.4)]
            md:w-[100px] md:h-[100px]
            ${isDragging ? 'scale-[1.15] -rotate-[5deg] animate-bounce' : ''}
          `}>
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="md:w-[60px] md:h-[60px]"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>

          <h2 className="
            text-[2rem] font-bold m-0 mb-4 leading-tight
            bg-gradient-to-br from-violet-500 to-indigo-500
            bg-clip-text text-transparent
            md:text-2xl
          ">
            {uploadedFiles.length > 0
              ? `${uploadedFiles.length}장의 사진이 추가되었어요`
              : '소중한 순간을 담아주세요'}
          </h2>

          <p className="text-lg text-gray-500 m-0 mb-8 leading-relaxed md:text-base">
            {isDragging
              ? '여기에 놓아주세요'
              : '사진을 드래그하거나 클릭해서 추가하세요'}
          </p>

          {uploadedFiles.length === 0 && (
            <button
              className="
                inline-flex items-center gap-3
                py-4 px-10 text-lg font-semibold text-white
                bg-gradient-to-br from-violet-500 to-indigo-500
                border-none rounded-2xl cursor-pointer
                transition-all duration-300
                shadow-[0_10px_30px_rgba(139,92,246,0.3)]
                hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(139,92,246,0.4)]
                active:translate-y-0
                md:py-3.5 md:px-8 md:text-base
              "
              type="button"
            >
              <span className="text-2xl animate-pulse">📸</span>
              사진 추가하기
            </button>
          )}
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-12">
          <h3 className="text-2xl font-semibold text-gray-800 m-0 mb-6">
            업로드된 사진
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6 md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:gap-4">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="
                  bg-white rounded-2xl overflow-hidden
                  shadow-[0_4px_20px_rgba(0,0,0,0.08)]
                  transition-all duration-300
                  hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]
                "
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-[200px] object-cover md:h-[150px]"
                />
                <p className="p-4 text-sm text-gray-500 m-0 whitespace-nowrap overflow-hidden text-ellipsis">
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Uploader
