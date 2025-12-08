import { useState } from 'react'

type EditorTab = 'CROP' | 'BLUR' | 'RESIZE'

interface EditorProps {
  files: File[]
  onClose: () => void
}

export function Editor({ files, onClose }: EditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('CROP')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const tabs: { id: EditorTab; label: string }[] = [
    { id: 'CROP', label: 'CROP' },
    { id: 'BLUR', label: 'BLUR' },
    { id: 'RESIZE', label: 'RESIZE' },
  ]

  const selectedFile = files[selectedIndex]

  return (
    <div className="w-full max-w-[1000px] mx-auto p-8 md:p-4">
      <div className="relative bg-white rounded-3xl shadow-[0_10px_60px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="
            absolute top-4 right-4 z-10
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

        {/* Main Preview Area */}
        <div className="p-8 pb-4 md:p-4 md:pb-2">
          <div className="
            relative w-full aspect-video
            bg-gray-100 rounded-2xl overflow-hidden
            flex items-center justify-center
          ">
            {selectedFile && (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt={selectedFile.name}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {files.length > 1 && (
          <div className="px-8 py-4 md:px-4 md:py-2">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {files.map((file, index) => (
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
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
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
              <div className="text-center text-gray-500">
                <p className="m-0">Crop tool coming soon</p>
              </div>
            )}
            {activeTab === 'BLUR' && (
              <div className="text-center text-gray-500">
                <p className="m-0">Blur tool coming soon</p>
              </div>
            )}
            {activeTab === 'RESIZE' && (
              <div className="text-center text-gray-500">
                <p className="m-0">Resize tool coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Editor
