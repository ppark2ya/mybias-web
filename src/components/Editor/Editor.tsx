import { useState, useEffect, useRef } from 'react'
import {
  fileToDataURL,
  cropImage,
  blurImage,
  resizeImage,
  getImageDimensions,
  type CropArea,
} from '../../utils/imageEditor'

type EditorTab = 'CROP' | 'BLUR' | 'RESIZE'

interface EditorProps {
  files: File[]
  onClose: () => void
}

interface ImageState {
  dataURL: string
  width: number
  height: number
}

export function Editor({ files, onClose }: EditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('CROP')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [imageStates, setImageStates] = useState<Map<number, ImageState>>(new Map())
  const [history, setHistory] = useState<Map<number, string[]>>(new Map())
  const [isProcessing, setIsProcessing] = useState(false)

  // Crop state
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // Blur state
  const [blurRadius, setBlurRadius] = useState(5)

  // Resize state
  const [resizeWidth, setResizeWidth] = useState(800)
  const [resizeHeight, setResizeHeight] = useState(600)
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true)
  const [originalAspectRatio, setOriginalAspectRatio] = useState(1)

  const tabs: { id: EditorTab; label: string }[] = [
    { id: 'CROP', label: 'CROP' },
    { id: 'BLUR', label: 'BLUR' },
    { id: 'RESIZE', label: 'RESIZE' },
  ]

  // Initialize image states from files
  useEffect(() => {
    const initializeImages = async () => {
      const newImageStates = new Map<number, ImageState>()
      const newHistory = new Map<number, string[]>()

      for (let i = 0; i < files.length; i++) {
        const dataURL = await fileToDataURL(files[i])
        const dimensions = await getImageDimensions(dataURL)
        newImageStates.set(i, {
          dataURL,
          width: dimensions.width,
          height: dimensions.height,
        })
        newHistory.set(i, [dataURL])
      }

      setImageStates(newImageStates)
      setHistory(newHistory)
    }

    initializeImages()
  }, [files])

  // Update resize dimensions when selecting a new image
  useEffect(() => {
    const currentState = imageStates.get(selectedIndex)
    if (currentState) {
      setResizeWidth(currentState.width)
      setResizeHeight(currentState.height)
      setOriginalAspectRatio(currentState.width / currentState.height)
      setCropArea({
        x: 0,
        y: 0,
        width: Math.min(200, currentState.width),
        height: Math.min(200, currentState.height),
      })
    }
  }, [selectedIndex, imageStates])

  const currentImageState = imageStates.get(selectedIndex)
  const currentHistory = history.get(selectedIndex) || []
  const canUndo = currentHistory.length > 1

  const updateImageState = async (newDataURL: string) => {
    const dimensions = await getImageDimensions(newDataURL)

    setImageStates((prev) => {
      const newMap = new Map(prev)
      newMap.set(selectedIndex, {
        dataURL: newDataURL,
        width: dimensions.width,
        height: dimensions.height,
      })
      return newMap
    })

    setHistory((prev) => {
      const newMap = new Map(prev)
      const currentHistory = newMap.get(selectedIndex) || []
      newMap.set(selectedIndex, [...currentHistory, newDataURL])
      return newMap
    })
  }

  const handleUndo = () => {
    if (!canUndo) return

    setHistory((prev) => {
      const newMap = new Map(prev)
      const currentHistory = newMap.get(selectedIndex) || []
      const newHistory = currentHistory.slice(0, -1)
      newMap.set(selectedIndex, newHistory)

      // Update image state to previous
      const previousDataURL = newHistory[newHistory.length - 1]
      if (previousDataURL) {
        getImageDimensions(previousDataURL).then((dimensions) => {
          setImageStates((prevStates) => {
            const newStatesMap = new Map(prevStates)
            newStatesMap.set(selectedIndex, {
              dataURL: previousDataURL,
              width: dimensions.width,
              height: dimensions.height,
            })
            return newStatesMap
          })
        })
      }

      return newMap
    })
  }

  // Crop handlers
  const handleCropMouseDown = (e: React.MouseEvent, isResize = false) => {
    e.preventDefault()
    if (isResize) {
      setIsResizing(true)
    } else {
      setIsDragging(true)
    }
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return
    if (!imageContainerRef.current || !currentImageState) return

    const containerRect = imageContainerRef.current.getBoundingClientRect()
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    // Calculate scale factor between displayed image and actual image
    const displayedWidth = containerRect.width
    const displayedHeight = containerRect.height
    const scaleX = currentImageState.width / displayedWidth
    const scaleY = currentImageState.height / displayedHeight

    if (isDragging) {
      setCropArea((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(currentImageState.width - prev.width, prev.x + deltaX * scaleX)),
        y: Math.max(0, Math.min(currentImageState.height - prev.height, prev.y + deltaY * scaleY)),
      }))
    } else if (isResizing) {
      setCropArea((prev) => ({
        ...prev,
        width: Math.max(50, Math.min(currentImageState.width - prev.x, prev.width + deltaX * scaleX)),
        height: Math.max(50, Math.min(currentImageState.height - prev.y, prev.height + deltaY * scaleY)),
      }))
    }

    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleCropMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
  }

  const handleApplyCrop = async () => {
    if (!currentImageState || isProcessing) return

    setIsProcessing(true)
    try {
      const croppedDataURL = await cropImage(currentImageState.dataURL, cropArea)
      await updateImageState(croppedDataURL)
    } catch (error) {
      console.error('Failed to crop image:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Blur handler
  const handleApplyBlur = async () => {
    if (!currentImageState || isProcessing) return

    setIsProcessing(true)
    try {
      const blurredDataURL = await blurImage(currentImageState.dataURL, { radius: blurRadius })
      await updateImageState(blurredDataURL)
    } catch (error) {
      console.error('Failed to blur image:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Resize handlers
  const handleWidthChange = (newWidth: number) => {
    setResizeWidth(newWidth)
    if (maintainAspectRatio) {
      setResizeHeight(Math.round(newWidth / originalAspectRatio))
    }
  }

  const handleHeightChange = (newHeight: number) => {
    setResizeHeight(newHeight)
    if (maintainAspectRatio) {
      setResizeWidth(Math.round(newHeight * originalAspectRatio))
    }
  }

  const handleApplyResize = async () => {
    if (!currentImageState || isProcessing) return

    setIsProcessing(true)
    try {
      const resizedDataURL = await resizeImage(currentImageState.dataURL, {
        width: resizeWidth,
        height: resizeHeight,
        maintainAspectRatio,
      })
      await updateImageState(resizedDataURL)
    } catch (error) {
      console.error('Failed to resize image:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Calculate crop overlay position for display
  const getCropOverlayStyle = () => {
    if (!currentImageState || !imageContainerRef.current) return {}

    const containerRect = imageContainerRef.current.getBoundingClientRect()
    const scaleX = containerRect.width / currentImageState.width
    const scaleY = containerRect.height / currentImageState.height

    return {
      left: cropArea.x * scaleX,
      top: cropArea.y * scaleY,
      width: cropArea.width * scaleX,
      height: cropArea.height * scaleY,
    }
  }

  return (
    <div className="w-full max-w-[1000px] mx-auto p-8 md:p-4">
      <div className="relative bg-white rounded-3xl shadow-[0_10px_60px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* Header with Close and Undo buttons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {canUndo && (
            <button
              onClick={handleUndo}
              disabled={isProcessing}
              className="
                w-10 h-10 flex items-center justify-center
                bg-violet-500 hover:bg-violet-600 disabled:bg-gray-300
                rounded-full cursor-pointer
                transition-all duration-200
                disabled:cursor-not-allowed
              "
              type="button"
              aria-label="Undo"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="
              w-10 h-10 flex items-center justify-center
              bg-black/10 hover:bg-black/20
              rounded-full cursor-pointer
              transition-all duration-200
              hover:rotate-90
            "
            type="button"
            aria-label="Close editor"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-700"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Main Preview Area */}
        <div className="p-8 pb-4 md:p-4 md:pb-2">
          <div
            ref={imageContainerRef}
            className="
              relative w-full aspect-video
              bg-gray-100 rounded-2xl overflow-hidden
              flex items-center justify-center
            "
            onMouseMove={handleCropMouseMove}
            onMouseUp={handleCropMouseUp}
            onMouseLeave={handleCropMouseUp}
          >
            {currentImageState && (
              <>
                <img
                  src={currentImageState.dataURL}
                  alt="Editing"
                  className="max-w-full max-h-full object-contain"
                  draggable={false}
                />

                {/* Crop overlay */}
                {activeTab === 'CROP' && (
                  <div
                    className="absolute border-2 border-violet-500 bg-violet-500/20 cursor-move"
                    style={getCropOverlayStyle()}
                    onMouseDown={(e) => handleCropMouseDown(e, false)}
                  >
                    {/* Resize handle */}
                    <div
                      className="absolute bottom-0 right-0 w-4 h-4 bg-violet-500 cursor-se-resize translate-x-1/2 translate-y-1/2"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleCropMouseDown(e, true)
                      }}
                    />
                  </div>
                )}
              </>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-lg">Processing...</div>
              </div>
            )}
          </div>

          {/* Image dimensions info */}
          {currentImageState && (
            <div className="mt-2 text-center text-sm text-gray-500">
              {currentImageState.width} x {currentImageState.height} px
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {files.length > 1 && (
          <div className="px-8 py-4 md:px-4 md:py-2">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {files.map((file, index) => {
                const state = imageStates.get(index)
                return (
                  <button
                    key={`${file.name}-${index}`}
                    onClick={() => setSelectedIndex(index)}
                    className={`
                      flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden
                      border-2 transition-all duration-200 cursor-pointer
                      ${selectedIndex === index
                        ? 'border-violet-500 shadow-[0_0_0_2px_rgba(139,92,246,0.3)]'
                        : 'border-transparent hover:border-gray-300'
                      }
                    `}
                    type="button"
                  >
                    <img
                      src={state?.dataURL || URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="border-t border-gray-200">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 py-4 px-6 text-sm font-semibold
                  transition-all duration-200 cursor-pointer
                  border-b-2
                  ${activeTab === tab.id
                    ? 'text-violet-600 border-violet-500 bg-violet-50'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tool Panel */}
          <div className="p-6 min-h-[120px] bg-gray-50 md:p-4">
            {activeTab === 'CROP' && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-gray-600 m-0">
                  Drag the selection box to position, drag the corner to resize
                </p>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>X: {Math.round(cropArea.x)}</span>
                  <span>Y: {Math.round(cropArea.y)}</span>
                  <span>W: {Math.round(cropArea.width)}</span>
                  <span>H: {Math.round(cropArea.height)}</span>
                </div>
                <button
                  onClick={handleApplyCrop}
                  disabled={isProcessing}
                  className="
                    px-6 py-2 bg-violet-500 hover:bg-violet-600
                    disabled:bg-gray-300 disabled:cursor-not-allowed
                    text-white font-semibold rounded-lg
                    transition-all duration-200
                  "
                  type="button"
                >
                  Apply Crop
                </button>
              </div>
            )}

            {activeTab === 'BLUR' && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-4 w-full max-w-md">
                  <label className="text-sm text-gray-600 whitespace-nowrap">
                    Blur Radius:
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={blurRadius}
                    onChange={(e) => setBlurRadius(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 w-8">{blurRadius}px</span>
                </div>
                <button
                  onClick={handleApplyBlur}
                  disabled={isProcessing}
                  className="
                    px-6 py-2 bg-violet-500 hover:bg-violet-600
                    disabled:bg-gray-300 disabled:cursor-not-allowed
                    text-white font-semibold rounded-lg
                    transition-all duration-200
                  "
                  type="button"
                >
                  Apply Blur
                </button>
              </div>
            )}

            {activeTab === 'RESIZE' && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Width:</label>
                    <input
                      type="number"
                      value={resizeWidth}
                      onChange={(e) => handleWidthChange(Number(e.target.value))}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                      min="1"
                    />
                    <span className="text-sm text-gray-500">px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Height:</label>
                    <input
                      type="number"
                      value={resizeHeight}
                      onChange={(e) => handleHeightChange(Number(e.target.value))}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                      min="1"
                    />
                    <span className="text-sm text-gray-500">px</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={maintainAspectRatio}
                      onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-600">Lock aspect ratio</span>
                  </label>
                </div>
                <button
                  onClick={handleApplyResize}
                  disabled={isProcessing}
                  className="
                    px-6 py-2 bg-violet-500 hover:bg-violet-600
                    disabled:bg-gray-300 disabled:cursor-not-allowed
                    text-white font-semibold rounded-lg
                    transition-all duration-200
                  "
                  type="button"
                >
                  Apply Resize
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Editor
