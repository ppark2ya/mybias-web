import { useState, useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import './Uploader.css'

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

  return (
    <div className="uploader-container">
      <div
        className={`uploader-dropzone ${isDragging ? 'dragging' : ''} ${uploadedFiles.length > 0 ? 'has-files' : ''}`}
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
          style={{ display: 'none' }}
        />

        <div className="uploader-content">
          <div className="uploader-icon">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>

          <h2 className="uploader-title">
            {uploadedFiles.length > 0
              ? `${uploadedFiles.length}장의 사진이 추가되었어요`
              : '소중한 순간을 담아주세요'}
          </h2>

          <p className="uploader-description">
            {isDragging
              ? '여기에 놓아주세요 ✨'
              : '사진을 드래그하거나 클릭해서 추가하세요'}
          </p>

          {uploadedFiles.length === 0 && (
            <button className="uploader-button" type="button">
              <span className="button-icon">📸</span>
              사진 추가하기
            </button>
          )}
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploader-preview">
          <h3 className="preview-title">업로드된 사진</h3>
          <div className="preview-grid">
            {uploadedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="preview-item">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="preview-image"
                />
                <p className="preview-name">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Uploader
