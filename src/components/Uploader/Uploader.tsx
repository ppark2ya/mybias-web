import { useState, useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { ImagePlus, Sparkles } from 'lucide-react'
import { trackFileUpload } from '../../utils/analytics'

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
      const totalSize = files.reduce((sum, file) => sum + file.size, 0)
      trackFileUpload(files.length, totalSize)
      onUpload?.(files)
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []

    if (files.length > 0) {
      const totalSize = files.reduce((sum, file) => sum + file.size, 0)
      trackFileUpload(files.length, totalSize)
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
      before:bg-gradient-to-br before:from-fuchsia-500/5 before:to-cyan-500/5
      before:opacity-0 before:transition-opacity before:duration-300
      hover:border-fuchsia-400 hover:bg-gradient-to-br hover:from-white hover:to-gray-50
      hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(217,70,239,0.15)]
      hover:before:opacity-100
    `

    if (isDragging) {
      return `${baseClasses} border-fuchsia-500 bg-gradient-to-br from-fuchsia-50 to-purple-100 scale-[1.02] shadow-[0_25px_60px_rgba(217,70,239,0.25)] before:opacity-100`
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
            bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400
            rounded-full text-white
            shadow-[0_10px_40px_rgba(217,70,239,0.3)]
            transition-all duration-300
            group-hover:scale-110 group-hover:rotate-[5deg]
            group-hover:shadow-[0_15px_50px_rgba(217,70,239,0.4)]
            ${isDragging ? 'scale-[1.15] -rotate-[5deg] animate-bounce' : ''}
          `}>
            <ImagePlus className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16" strokeWidth={1.5} />
          </div>

          <h2 className="
            text-xl sm:text-2xl lg:text-[2rem] font-bold m-0 mb-2 sm:mb-3 lg:mb-4 leading-tight
            bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-400
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
              bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-400
              border-none rounded-xl sm:rounded-2xl cursor-pointer
              transition-all duration-300
              shadow-[0_10px_30px_rgba(217,70,239,0.3)]
              hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(217,70,239,0.4)]
              hover:scale-[1.02]
              active:translate-y-0 active:scale-100
            "
            type="button"
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            사진 추가하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default Uploader
