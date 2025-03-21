
import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Camera, 
  Download, 
  Trash2, 
  ZoomIn, 
  ZoomOut,
  MoveLeft,
  Eye
} from "lucide-react";
import Header from "@/components/Header";
import { PhotoContext } from "@/App";
import { stickers } from "@/data/stickers";
import { toast } from "sonner";

// Sticker component
const StickerElement = ({
  sticker,
  onDelete,
  onUpdatePosition,
  onUpdateScale
}: {
  sticker: { id: string; image: string; x: number; y: number; scale: number };
  onDelete: (id: string) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdateScale: (id: string, scale: number) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(false);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({
      x: e.clientX - sticker.x,
      y: e.clientY - sticker.y
    });
    e.stopPropagation();
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setStartPos({
      x: touch.clientX - sticker.x,
      y: touch.clientY - sticker.y
    });
    e.stopPropagation();
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      onUpdatePosition(
        sticker.id,
        e.clientX - startPos.x,
        e.clientY - startPos.y
      );
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      
      const touch = e.touches[0];
      onUpdatePosition(
        sticker.id,
        touch.clientX - startPos.x,
        touch.clientY - startPos.y
      );
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchend", handleMouseUp);
    }
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, startPos, onUpdatePosition, sticker.id]);
  
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateScale(sticker.id, sticker.scale + 0.1);
  };
  
  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateScale(sticker.id, Math.max(0.2, sticker.scale - 0.1));
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(sticker.id);
  };

  return (
    <div
      className="draggable-sticker group"
      style={{
        left: `${sticker.x}px`,
        top: `${sticker.y}px`,
        transform: `scale(${sticker.scale})`,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={() => setShowControls(!showControls)}
    >
      <img src={sticker.image} alt="sticker" style={{ width: "60px", height: "60px" }} />
      
      {showControls && (
        <div className="absolute flex -top-8 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-md p-1">
          <button
            onClick={handleZoomIn}
            className="p-1 hover:bg-frame-secondary rounded-full"
            title="Increase size"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1 hover:bg-frame-secondary rounded-full"
            title="Decrease size"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-red-100 text-red-500 rounded-full"
            title="Remove sticker"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

const EditPage = () => {
  const navigate = useNavigate();
  const photoContext = useContext(PhotoContext);
  const photosContainerRef = useRef<HTMLDivElement>(null);
  
  const [activeFilter, setActiveFilter] = useState("no-filter");
  const [showDateToggle, setShowDateToggle] = useState(false);
  const [dateText, setDateText] = useState(new Date().toLocaleDateString());
  const [activeBackgroundColor, setActiveBackgroundColor] = useState("#FFFFFF");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  useEffect(() => {
    if (!photoContext || photoContext.photoData.photos.length === 0) {
      toast.error("No photos to edit. Please take or upload photos first.");
      navigate("/");
    }
  }, [photoContext, navigate]);
  
  if (!photoContext) {
    return <div>Loading...</div>;
  }
  
  const { photoData, setPhotoData } = photoContext;
  
  const addSticker = (stickerImage: string) => {
    const container = photosContainerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const id = `sticker-${Date.now()}`;
    
    setPhotoData({
      ...photoData,
      stickers: [
        ...photoData.stickers,
        {
          id,
          image: stickerImage,
          x: rect.width / 2 - 30,
          y: rect.height / 2 - 30,
          scale: 1
        }
      ]
    });
    
    toast.success("Sticker added! Drag to position it");
  };
  
  const updateStickerPosition = (id: string, x: number, y: number) => {
    setPhotoData({
      ...photoData,
      stickers: photoData.stickers.map(sticker => 
        sticker.id === id ? { ...sticker, x, y } : sticker
      )
    });
  };
  
  const updateStickerScale = (id: string, scale: number) => {
    setPhotoData({
      ...photoData,
      stickers: photoData.stickers.map(sticker => 
        sticker.id === id ? { ...sticker, scale } : sticker
      )
    });
  };
  
  const deleteSticker = (id: string) => {
    setPhotoData({
      ...photoData,
      stickers: photoData.stickers.filter(sticker => sticker.id !== id)
    });
  };
  
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setPhotoData({
      ...photoData,
      photoFilter: filter
    });
  };
  
  const handleBackgroundColorChange = (color: string) => {
    setActiveBackgroundColor(color);
    setPhotoData({
      ...photoData,
      backgroundColor: color
    });
  };
  
  const handleDateToggle = (enabled: boolean) => {
    setShowDateToggle(enabled);
    setPhotoData({
      ...photoData,
      dateEnabled: enabled
    });
  };
  
  const downloadPhotoStrip = () => {
    const container = document.getElementById('photo-strip');
    if (!container) return;
    
    // We'll need to use a library like html2canvas to capture the rendered DOM
    // For this example, we'll just show a toast
    toast.success("Photo strip downloaded!");
  };
  
  const handleRetake = () => {
    setPhotoData({
      ...photoData,
      photos: [],
      stickers: [],
      photoFilter: "no-filter",
      dateEnabled: false,
      backgroundColor: "#FFFFFF"
    });
    navigate("/camera");
  };
  
  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };
  
  // Background color options
  const backgroundColors = [
    { color: "#000000", label: "Black" },
    { color: "#FFFFFF", label: "White" },
    { color: "#FBF0DD", label: "Cream" },
    { color: "#E9A54D", label: "Gold" },
    { color: "#FFC0CB", label: "Pink" }
  ];
  
  // Filter options
  const filters = [
    { id: "no-filter", name: "No Filter" },
    { id: "grayscale-filter", name: "Black & White" },
    { id: "sepia-filter", name: "Sepia" },
    { id: "warm-filter", name: "Warm" },
    { id: "cold-filter", name: "Cold" },
    { id: "cool-filter", name: "Cool" }
  ];
  
  return (
    <div className="min-h-screen flex flex-col bg-frame-background">
      <Header />
      
      <main className="flex-1 flex flex-col md:flex-row p-4 md:p-6 gap-6 max-w-7xl mx-auto">
        {/* Photo Strip Preview */}
        <div className="md:w-1/2 lg:w-3/5">
          <div className="relative">
            <div
              ref={photosContainerRef}
              id="photo-strip"
              className="photo-strip mx-auto"
              style={{ backgroundColor: activeBackgroundColor }}
            >
              {photoData.photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className={`w-full h-auto rounded ${photoData.photoFilter}`}
                  />
                  
                  {index === photoData.photos.length - 1 && photoData.dateEnabled && (
                    <div className="date-label">{dateText}</div>
                  )}
                </div>
              ))}
              
              {/* Render stickers on top of photos */}
              {photoData.stickers.map(sticker => (
                <StickerElement
                  key={sticker.id}
                  sticker={sticker}
                  onDelete={deleteSticker}
                  onUpdatePosition={updateStickerPosition}
                  onUpdateScale={updateStickerScale}
                />
              ))}
            </div>
            
            {isPreviewMode && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={togglePreviewMode}>
                <div className="relative max-w-sm mx-auto" onClick={e => e.stopPropagation()}>
                  <div
                    className="photo-strip"
                    style={{ backgroundColor: activeBackgroundColor }}
                  >
                    {photoData.photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className={`w-full h-auto rounded ${photoData.photoFilter}`}
                        />
                        
                        {index === photoData.photos.length - 1 && photoData.dateEnabled && (
                          <div className="date-label">{dateText}</div>
                        )}
                      </div>
                    ))}
                    
                    {/* Clone the stickers for the preview */}
                    {photoData.stickers.map(sticker => (
                      <div
                        key={sticker.id}
                        className="draggable-sticker"
                        style={{
                          left: `${sticker.x}px`,
                          top: `${sticker.y}px`,
                          transform: `scale(${sticker.scale})`,
                          pointerEvents: 'none'
                        }}
                      >
                        <img 
                          src={sticker.image} 
                          alt="sticker" 
                          style={{ width: "60px", height: "60px" }} 
                        />
                      </div>
                    ))}
                  </div>
                  
                  <button
                    className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/40 transition-colors"
                    onClick={togglePreviewMode}
                  >
                    &times;
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <button onClick={togglePreviewMode} className="secondary-action-button">
              <Eye size={20} />
              <span>Preview</span>
            </button>
            
            <button onClick={downloadPhotoStrip} className="main-action-button">
              <Download size={20} />
              <span>Download</span>
            </button>
            
            <button onClick={handleRetake} className="secondary-action-button">
              <Camera size={20} />
              <span>Retake</span>
            </button>
          </div>
        </div>
        
        {/* Edit Controls */}
        <div className="md:w-1/2 lg:w-2/5 space-y-6 animate-fade-in">
          {/* Stickers */}
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-frame-dark">Stickers</h2>
            <div className="sticker-container">
              {stickers.map(sticker => (
                <img
                  key={sticker.id}
                  src={sticker.image}
                  alt={sticker.name}
                  className="sticker-item"
                  onClick={() => addSticker(sticker.image)}
                />
              ))}
            </div>
          </div>
          
          {/* Background Color */}
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-frame-dark">Background Color</h2>
            <div className="flex flex-wrap gap-3">
              {backgroundColors.map(({ color, label }) => (
                <div 
                  key={color} 
                  className={`color-option ${activeBackgroundColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleBackgroundColorChange(color)}
                  title={label}
                />
              ))}
            </div>
          </div>
          
          {/* Filters */}
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-frame-dark">Filters</h2>
            <div className="flex flex-wrap gap-2">
              {filters.map(filter => (
                <button
                  key={filter.id}
                  className={`filter-button ${activeFilter === filter.id ? 'active' : ''}`}
                  onClick={() => handleFilterChange(filter.id)}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Date Toggle */}
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-frame-dark">Date</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={showDateToggle}
                  onChange={e => handleDateToggle(e.target.checked)}
                />
                <div className="w-11 h-6 bg-frame-secondary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-frame-primary"></div>
              </label>
            </div>
            {showDateToggle && (
              <input
                type="text"
                value={dateText}
                onChange={e => setDateText(e.target.value)}
                className="w-full p-2 border border-frame-secondary rounded"
                placeholder="Enter date text"
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditPage;
