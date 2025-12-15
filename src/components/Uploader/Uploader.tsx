import { useState, useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'

interface UploaderProps {
  onUpload?: (files: File[]) => void
}

export function Uploader({ onUpload }: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
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
      onUpload?.(files)
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []

    if (files.length > 0) {
      onUpload?.(files)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const getDropzoneClasses = () => {
    const baseClasses = `
      relative w-full flex items-center justify-center
      min-h-[350px] sm:min-h-[400px] lg:min-h-[500px]
      border-3 border-dashed rounded-2xl sm:rounded-3xl cursor-pointer
      transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden
      before:content-[''] before:absolute before:inset-0
      before:bg-gradient-to-br before:from-violet-500/5 before:to-blue-500/5
      before:opacity-0 before:transition-opacity before:duration-300
      hover:border-violet-400 hover:bg-gradient-to-br hover:from-white hover:to-gray-50
      hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(139,92,246,0.15)]
      hover:before:opacity-100
    `

    if (isDragging) {
      return `${baseClasses} border-violet-500 bg-gradient-to-br from-violet-50 to-violet-100 scale-[1.02] shadow-[0_25px_60px_rgba(139,92,246,0.25)] before:opacity-100`
    }

    return `${baseClasses} border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100`
  }

  return (
    <div className="w-full max-w-[800px] mx-auto p-2 sm:p-4 lg:p-8">
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

        <div className="relative z-10 text-center py-6 px-4 sm:py-8 sm:px-6 lg:py-12 lg:px-8 w-full">
          <div className={`
            inline-flex items-center justify-center
            w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] lg:w-[120px] lg:h-[120px]
            mx-auto mb-4 sm:mb-6 lg:mb-8
            bg-gradient-to-br from-violet-500 to-indigo-500
            rounded-full text-white
            shadow-[0_10px_40px_rgba(139,92,246,0.3)]
            transition-all duration-300
            group-hover:scale-110 group-hover:rotate-[5deg]
            group-hover:shadow-[0_15px_50px_rgba(139,92,246,0.4)]
            ${isDragging ? 'scale-[1.15] -rotate-[5deg] animate-bounce' : ''}
          `}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>

          <h2 className="
            text-xl sm:text-2xl lg:text-[2rem] font-bold m-0 mb-2 sm:mb-3 lg:mb-4 leading-tight
            bg-gradient-to-br from-violet-500 to-indigo-500
            bg-clip-text text-transparent
          ">
            소중한 순간을 담아주세요
          </h2>

          <p className="text-sm sm:text-base lg:text-lg text-gray-500 m-0 mb-4 sm:mb-6 lg:mb-8 leading-relaxed">
            {isDragging
              ? '여기에 놓아주세요'
              : '사진을 드래그하거나 클릭해서 추가하세요'}
          </p>

          <button
            className="
              inline-flex items-center gap-2 sm:gap-2.5 lg:gap-3
              py-3 px-6 sm:py-3.5 sm:px-8 lg:py-4 lg:px-10
              text-sm sm:text-base lg:text-lg font-semibold text-white
              bg-gradient-to-br from-violet-500 to-indigo-500
              border-none rounded-xl sm:rounded-2xl cursor-pointer
              transition-all duration-300
              shadow-[0_10px_30px_rgba(139,92,246,0.3)]
              hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(139,92,246,0.4)]
              active:translate-y-0
            "
            type="button"
          >
            <span className="text-lg sm:text-xl lg:text-2xl animate-pulse">📸</span>
            사진 추가하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default Uploader
