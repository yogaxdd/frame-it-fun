
import { useRef, useState, useContext, useEffect } from "react";
import { PhotoContext } from "@/App";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Camera, Eye, Download, ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import { toast } from "sonner";

const filters = [
  { id: "no-filter", name: "No Filter" },
  { id: "grayscale", name: "Black & White" },
  { id: "sepia", name: "Sepia" },
  { id: "warm", name: "Warm" },
  { id: "cold", name: "Cold" },
];

const colors = [
  { id: "black", value: "#000000" },
  { id: "white", value: "#FFFFFF" },
  { id: "cream", value: "#FBF0DD" },
  { id: "orange", value: "#E9A54D" },
  { id: "pink", value: "#FFC0CB" },
];

// Imported from data/stickers or use direct URLs
const stickers = [
  { id: "heart", image: "https://raw.githubusercontent.com/yogaxdd/frame-it-fun/main/stickers/pink-heart_1fa77.png" },
  { id: "star", image: "https://raw.githubusercontent.com/yogaxdd/frame-it-fun/main/stickers/star_2b50.png" },
  { id: "ribbon", image: "https://raw.githubusercontent.com/yogaxdd/frame-it-fun/main/stickers/ribbon_1f380.png" },
  { id: "whale", image: "https://raw.githubusercontent.com/yogaxdd/frame-it-fun/main/stickers/spouting-whale_1f433.png" },
  { id: "lion", image: "https://raw.githubusercontent.com/yogaxdd/frame-it-fun/main/stickers/lion_1f981.png" },
];

const EditPage = () => {
  const photoContext = useContext(PhotoContext);
  const navigate = useNavigate();
  const photoStripRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Check if we have photos, redirect to home if not
  useEffect(() => {
    if (!photoContext?.photoData.photos || photoContext.photoData.photos.length === 0) {
      toast.error("No photos to edit. Please upload or take photos first");
      navigate("/");
    }
  }, [photoContext?.photoData.photos, navigate]);

  if (!photoContext) return null;

  const { photoData, setPhotoData } = photoContext;

  const handleFilterChange = (filterId: string) => {
    setPhotoData({
      ...photoData,
      photoFilter: filterId,
    });
  };

  const handleBgColorChange = (color: string) => {
    setPhotoData({
      ...photoData,
      backgroundColor: color,
    });
  };

  const handleDateToggle = () => {
    setPhotoData({
      ...photoData,
      dateEnabled: !photoData.dateEnabled,
    });
  };

  const handleAddSticker = (stickerImage: string) => {
    // Add sticker to the center of the photostrip
    const stripRect = photoStripRef.current?.getBoundingClientRect();
    if (!stripRect) return;

    const x = stripRect.width / 2 - 30;
    const y = stripRect.height / 2 - 30;

    const newSticker = {
      id: `sticker-${Date.now()}`,
      image: stickerImage,
      x,
      y,
      scale: 1,
    };

    setPhotoData({
      ...photoData,
      stickers: [...photoData.stickers, newSticker],
    });
  };

  const handleStickerDrag = (index: number, x: number, y: number) => {
    const newStickers = [...photoData.stickers];
    newStickers[index] = { ...newStickers[index], x, y };
    setPhotoData({
      ...photoData,
      stickers: newStickers,
    });
  };

  const handleStickerScale = (index: number, scaleDelta: number) => {
    const newStickers = [...photoData.stickers];
    const newScale = Math.max(0.2, newStickers[index].scale + scaleDelta);
    newStickers[index] = { ...newStickers[index], scale: newScale };
    setPhotoData({
      ...photoData,
      stickers: newStickers,
    });
  };

  const handleDeleteSticker = (index: number) => {
    const newStickers = [...photoData.stickers];
    newStickers.splice(index, 1);
    setPhotoData({
      ...photoData,
      stickers: newStickers,
    });
  };

  const showPreview = () => {
    setIsPreviewMode(true);
  };

  const closePreview = () => {
    setIsPreviewMode(false);
  };

  const downloadPhotoStrip = async () => {
    if (!photoStripRef.current) return;
    
    try {
      setIsDownloading(true);
      setIsPreviewMode(true); // Hide controls during download
      
      // Wait a moment for the DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(photoStripRef.current, {
        backgroundColor: photoData.backgroundColor,
        allowTaint: true,
        useCORS: true,
        scale: 2, // Higher quality
        onclone: (clonedDoc) => {
          // Find all control elements in the clone and hide them
          const controls = clonedDoc.querySelectorAll('.sticker-controls');
          controls.forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });
        }
      });
      
      const link = document.createElement('a');
      link.download = 'photostrip.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success("Photo strip downloaded successfully!");
    } catch (err) {
      console.error("Error downloading photo strip:", err);
      toast.error("Failed to download. Please try again.");
    } finally {
      setIsDownloading(false);
      setIsPreviewMode(false); // Restore controls after download
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 flex flex-col md:flex-row p-4 gap-6 max-w-7xl mx-auto w-full">
        {/* Photo Strip */}
        <div className="md:w-1/2 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            <div 
              ref={photoStripRef} 
              className="photo-strip-container relative mx-auto"
              style={{ backgroundColor: photoData.backgroundColor, padding: "12px", maxWidth: "320px" }}
            >
              {photoData.photos.map((photo, index) => (
                <div key={index} className="photo-item mb-3">
                  <img 
                    src={photo} 
                    alt={`Photo ${index + 1}`} 
                    className={`w-full object-cover ${photoData.photoFilter}`} 
                    draggable="false"
                  />
                </div>
              ))}
              
              {photoData.dateEnabled && (
                <div className="text-center font-semibold py-2">
                  {new Date().toLocaleDateString()}
                </div>
              )}
              
              {/* Stickers */}
              {photoData.stickers.map((sticker, index) => (
                <div
                  key={sticker.id}
                  className="draggable-sticker absolute select-none cursor-move"
                  style={{
                    left: `${sticker.x}px`,
                    top: `${sticker.y}px`,
                    transform: `scale(${sticker.scale})`,
                    touchAction: "none"
                  }}
                  onMouseDown={(e) => {
                    if (isPreviewMode || isDownloading) return;
                    
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startLeft = sticker.x;
                    const startTop = sticker.y;
                    
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const dx = moveEvent.clientX - startX;
                      const dy = moveEvent.clientY - startY;
                      handleStickerDrag(index, startLeft + dx, startTop + dy);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                  onTouchStart={(e) => {
                    if (isPreviewMode || isDownloading) return;
                    
                    const touch = e.touches[0];
                    const startX = touch.clientX;
                    const startY = touch.clientY;
                    const startLeft = sticker.x;
                    const startTop = sticker.y;
                    
                    const handleTouchMove = (moveEvent: TouchEvent) => {
                      const touch = moveEvent.touches[0];
                      const dx = touch.clientX - startX;
                      const dy = touch.clientY - startY;
                      handleStickerDrag(index, startLeft + dx, startTop + dy);
                    };
                    
                    const handleTouchEnd = () => {
                      document.removeEventListener('touchmove', handleTouchMove);
                      document.removeEventListener('touchend', handleTouchEnd);
                    };
                    
                    document.addEventListener('touchmove', handleTouchMove);
                    document.addEventListener('touchend', handleTouchEnd);
                  }}
                >
                  <img 
                    src={sticker.image} 
                    alt="Sticker" 
                    className="w-16 h-16 pointer-events-none"
                    draggable="false"
                  />
                  
                  {!isPreviewMode && !isDownloading && (
                    <div className="sticker-controls absolute -top-7 left-0 right-0 flex justify-center gap-1"
                         style={{ pointerEvents: "auto" }}
                         onClick={e => e.stopPropagation()}
                    >
                      <button 
                        className="bg-white p-1 rounded-full shadow-md"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStickerScale(index, 0.1);
                        }}
                      >
                        +
                      </button>
                      <button 
                        className="bg-white p-1 rounded-full shadow-md"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStickerScale(index, -0.1);
                        }}
                      >
                        -
                      </button>
                      <button 
                        className="bg-red-500 text-white p-1 rounded-full shadow-md"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteSticker(index);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={showPreview} variant="outline" className="flex-1">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button 
              onClick={downloadPhotoStrip} 
              className="flex-1"
              disabled={isDownloading}
            >
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
            <Link to="/" className="flex-1">
              <Button variant="outline" className="w-full">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Start Over
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Edit Tools */}
        <div className="md:w-1/2 space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Filters</h2>
            <div className="grid grid-cols-3 gap-2">
              {filters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={photoData.photoFilter === filter.id ? "default" : "outline"}
                  onClick={() => handleFilterChange(filter.id)}
                  className="h-auto py-2"
                >
                  {filter.name}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Background Color */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Background Color</h2>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleBgColorChange(color.value)}
                  className={`w-10 h-10 rounded-full border-2 ${
                    photoData.backgroundColor === color.value ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color.value }}
                  aria-label={`Set background color to ${color.id}`}
                />
              ))}
            </div>
          </div>
          
          {/* Toggle Date */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Show Date</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={photoData.dateEnabled}
                  onChange={handleDateToggle}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          
          {/* Stickers */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Stickers</h2>
            <div className="grid grid-cols-4 gap-2">
              {stickers.map((sticker) => (
                <button
                  key={sticker.id}
                  onClick={() => handleAddSticker(sticker.image)}
                  className="p-2 border rounded-lg hover:bg-gray-50"
                >
                  <img 
                    src={sticker.image} 
                    alt={sticker.id} 
                    className="w-full aspect-square object-contain"
                    draggable="false"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      {/* Preview Modal */}
      {isPreviewMode && !isDownloading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-lg w-full">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Preview</h2>
              <button 
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div 
              ref={previewRef}
              className="mx-auto"
              style={{ backgroundColor: photoData.backgroundColor, padding: "12px", maxWidth: "320px" }}
            >
              {photoData.photos.map((photo, index) => (
                <div key={index} className="photo-item mb-3">
                  <img 
                    src={photo} 
                    alt={`Photo ${index + 1}`} 
                    className={`w-full object-cover ${photoData.photoFilter}`}
                  />
                </div>
              ))}
              
              {photoData.dateEnabled && (
                <div className="text-center font-semibold py-2">
                  {new Date().toLocaleDateString()}
                </div>
              )}
              
              {/* Stickers without controls */}
              {photoData.stickers.map((sticker) => (
                <div
                  key={sticker.id}
                  className="absolute"
                  style={{
                    left: `${sticker.x}px`,
                    top: `${sticker.y}px`,
                    transform: `scale(${sticker.scale})`,
                  }}
                >
                  <img 
                    src={sticker.image} 
                    alt="Sticker" 
                    className="w-16 h-16"
                    draggable="false"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <Button onClick={closePreview}>Close Preview</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditPage;
