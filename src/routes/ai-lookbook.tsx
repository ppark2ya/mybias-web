
import { useState, useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Upload, X, Shirt, User, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { virtualTryOn, getStatus } from '@/api';
import { useAuth } from '@/hooks/useAuth';
import { getImageDimensions, resizeImage, blobUrlToBase64, downloadImage } from '@/utils/imageEditor';

export const Route = createFileRoute('/ai-lookbook')({
  component: AiLookbook,
});

function AiLookbook() {
  const { t } = useTranslation();
  const [userImage, setUserImage] = useState<File | null>(null);
  const [clothingImage, setClothingImage] = useState<File | null>(null);
  const [userImagePreview, setUserImagePreview] = useState<string | null>(null);
  const [clothingImagePreview, setClothingImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  // Body specs state
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');

  const userFileInputRef = useRef<HTMLInputElement>(null);
  const clothingFileInputRef = useRef<HTMLInputElement>(null);

  const handleUserImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUserImage(file);
      setUserImagePreview(URL.createObjectURL(file));
    }
  };

  const handleClothingImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setClothingImage(file);
      setClothingImagePreview(URL.createObjectURL(file));
    }
  };
  
  const clearUserImage = () => {
    setUserImage(null);
    setUserImagePreview(null);
    if (userFileInputRef.current) userFileInputRef.current.value = '';
  };
  
  const clearClothingImage = () => {
    setClothingImage(null);
    setClothingImagePreview(null);
    if (clothingFileInputRef.current) clothingFileInputRef.current.value = '';
  };

  const { isAuthenticated } = useAuth(); // Assume useAuth is available
  

  
  const handleDownload = async () => {
    if (resultImage && userImage && clothingImage) {
        // Construct filename: model_clothes_result.png
        // Strip extensions from input names for cleaner output
        const modelName = userImage.name.replace(/\.[^/.]+$/, "");
        const clothName = clothingImage.name.replace(/\.[^/.]+$/, "");
        const filename = `${modelName}_${clothName}_result.png`;
        
        try {
            // If resultImage is a remote URL, we might need to fetch it first or use downloadImage helper
            // simpler to use the helper which handles blob conversion if needed
            await downloadImage(resultImage, filename);
            toast.success("Image downloaded");
        } catch (e) {
            console.error("Download failed", e);
            toast.error("Failed to download image");
        }
    }
  };

  const processImage = async (file: File): Promise<string> => {
    // 1. Load file
    const blobUrl = URL.createObjectURL(file);
    
    try {
        // 2. Get dimensions
        const dims = await getImageDimensions(blobUrl);
        
        // 3. Resize if too large (max 1500px) - this involves drawing to canvas which fixes EXIF rotation
        const maxDim = 1500;
        let processedBlobUrl = blobUrl;
        
        if (dims.width > maxDim || dims.height > maxDim) {
             const scale = maxDim / Math.max(dims.width, dims.height);
             processedBlobUrl = await resizeImage(blobUrl, {
                width: Math.round(dims.width * scale),
                height: Math.round(dims.height * scale)
             });
        } else {
            // Even if not resizing, we force a draw to canvas to bake in EXIF orientation
            // We can use resizeImage with original dims
             processedBlobUrl = await resizeImage(blobUrl, {
                width: dims.width,
                height: dims.height
             });
        }
        
        // 4. Convert to base64
        const base64 = await blobUrlToBase64(processedBlobUrl);
        
        // Cleanup intermediate blob URLs if they were created by resizeImage
        if (processedBlobUrl !== blobUrl) {
           // revoke processedBlobUrl? (resizeImage returns a fresh blob url)
        }
        
        return base64;
    } finally {
        // Cleanup original blob url
        URL.revokeObjectURL(blobUrl);
    }
  };

  const handleGenerate = async () => {
    if (!isAuthenticated) {
        toast.error(t("editor.ai.loginRequired", "Please login first"));
        return;
    }
    if (!userImage || !clothingImage) {
      toast.error('Please upload both images');
      return;
    }
    
    setIsGenerating(true);
    setResultImage(null);

    try {
        // Process images (Resize + Fix Rotation)
        const [humanImgBase64, garmImgBase64] = await Promise.all([
            processImage(userImage),
            processImage(clothingImage)
        ]);

        // Call API
        const response = await virtualTryOn({
            human_image: humanImgBase64,
            garm_image: garmImgBase64,
            garment_des: "A cool outfit" // TODO: Add input for description later
        });

        if (!response.id) {
            throw new Error("No prediction ID received");
        }

        // Poll for status
        const pollInterval = setInterval(async () => {
            try {
                const statusData = await getStatus(response.id);
                if (statusData.status === 'succeeded' && statusData.output) {
                    clearInterval(pollInterval);
                    
                    // Handle output: IDM-VTON might return a list or string
                    const outputUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
                    setResultImage(outputUrl);
                    setIsGenerating(false);
                    toast.success('Look generated successfully!');
                } else if (statusData.status === 'failed' || statusData.status === 'canceled') {
                    clearInterval(pollInterval);
                    setIsGenerating(false);
                    toast.error(`Generation failed: ${statusData.error || 'Unknown error'}`);
                }
            } catch (err) {
                console.error("Polling error", err);
                // Don't stop polling immediately on transient errors, but maybe limit retries in prod
            }
        }, 3000); // Poll every 3 seconds

    } catch (error: any) {
        console.error("Generation error:", error);
        setIsGenerating(false);
        toast.error(error.message || "Failed to generate look");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1400px]">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-fuchsia-600 to-cyan-600 bg-clip-text text-transparent mb-4">
          AI Lookbook
        </h1>
        <p className="text-gray-500 text-lg">
          Virtually try on any outfit with our AI stylist
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Input A: User Model */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[500px] flex flex-col">
             <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold">
                <div className="p-2 bg-fuchsia-100 rounded-lg text-fuchsia-600">
                    <User size={20} />
                </div>
                <h3>Input A: Your Model</h3>
             </div>
             
             <div 
                className={`
                    flex-1 border-2 border-dashed rounded-xl relative overflow-hidden transition-all
                    ${userImagePreview ? 'border-transparent' : 'border-gray-200 hover:border-fuchsia-400 bg-gray-50 hover:bg-fuchsia-50/10'}
                `}
             >
                {userImagePreview ? (
                    <div className="relative h-full w-full group">
                        <img src={userImagePreview} alt="User model" className="h-full w-full object-cover" />
                        <button 
                            onClick={clearUserImage}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div 
                        onClick={() => userFileInputRef.current?.click()}
                        className="h-full w-full flex flex-col items-center justify-center cursor-pointer p-6 text-center"
                    >
                        <Upload className="w-10 h-10 text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm font-medium">Click to upload full-body photo</p>
                        <p className="text-gray-400 text-xs mt-1">Supports JPG, PNG</p>
                    </div>
                )}
                <input 
                    ref={userFileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleUserImageChange}
                />
             </div>

             <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">Height (cm)</label>
                    <input 
                        type="text" 
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="e.g. 175"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">Weight (kg)</label>
                    <input 
                        type="text" 
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="e.g. 65"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500"
                    />
                </div>
             </div>
          </div>
        </div>

        {/* Action & Input B: The Look */}
        <div className="flex flex-col gap-4">
           {/* Center Panel for Input B */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[500px] flex flex-col">
                <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold">
                    <div className="p-2 bg-cyan-100 rounded-lg text-cyan-600">
                        <Shirt size={20} />
                    </div>
                    <h3>Input B: The Look</h3>
                </div>

                <div 
                    className={`
                        flex-1 border-2 border-dashed rounded-xl relative overflow-hidden transition-all
                        ${clothingImagePreview ? 'border-transparent' : 'border-gray-200 hover:border-cyan-400 bg-gray-50 hover:bg-cyan-50/10'}
                    `}
                >
                    {clothingImagePreview ? (
                        <div className="relative h-full w-full group">
                            <img src={clothingImagePreview} alt="Clothing item" className="h-full w-full object-cover" />
                            <button 
                                onClick={clearClothingImage}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div 
                            onClick={() => clothingFileInputRef.current?.click()}
                            className="h-full w-full flex flex-col items-center justify-center cursor-pointer p-6 text-center"
                        >
                             <Upload className="w-10 h-10 text-gray-300 mb-3" />
                            <p className="text-gray-500 text-sm font-medium">Upload clothing image</p>
                            <p className="text-gray-400 text-xs mt-1">Front view recommended</p>
                        </div>
                    )}
                    <input 
                        ref={clothingFileInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleClothingImageChange}
                    />
                </div>
                
                <div className="mt-6">
                    <Button 
                        onClick={handleGenerate}
                        disabled={!userImage || !clothingImage || isGenerating}
                        className="w-full h-12 bg-gradient-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-700 hover:to-cyan-700 text-white rounded-xl font-bold shadow-lg shadow-fuchsia-500/20 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isGenerating ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generating...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Wand2 size={18} />
                                Generate Look
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </div>

        {/* Result */}
        <div className="flex flex-col gap-4">
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[500px] flex flex-col relative overflow-hidden">
                {/* Result Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
                
                <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold relative z-10">
                    <div className="p-2 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-lg text-white">
                        <SparklesIcon />
                    </div>
                    <h3>Result: AI Lookbook</h3>
                </div>

                <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center relative overflow-hidden group">
                    {resultImage ? (
                        <>
                             <img src={resultImage} alt="Generated look" className="h-full w-full object-cover" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                 <Button 
                                    variant="secondary" 
                                    className="bg-white/90 hover:bg-white"
                                    onClick={handleDownload}
                                 >
                                    Download
                                 </Button>
                                 <Button variant="secondary" className="bg-white/90 hover:bg-white">Share</Button>
                             </div>
                        </>
                    ) : (
                        <div className="text-center p-6 text-gray-400">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                <Wand2 className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="font-medium mb-1">Ready to create magic?</p>
                            <p className="text-sm opacity-60">Upload photos to generate your look</p>
                        </div>
                    )}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
}

function SparklesIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 5h4"/><path d="M3 9h4"/></svg>
    )
}
