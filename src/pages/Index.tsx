
import { Link, useNavigate } from "react-router-dom";
import { Camera, Upload, Image as ImageIcon, Edit, Plus } from "lucide-react";
import Header from "@/components/Header";
import { useContext, useState, useRef } from "react";
import { PhotoContext } from "@/App";
import { toast } from "sonner";

const Index = () => {
  const photoContext = useContext(PhotoContext);
  const navigate = useNavigate();
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !photoContext) return;
    
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.error("Please select valid image files");
      return;
    }
    
    // No limit on photos to process
    const photosToProcess = imageFiles;
    
    Promise.all(photosToProcess.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
    })).then(photos => {
      const newPhotos = [...uploadedPhotos, ...photos];
      setUploadedPhotos(newPhotos);
      
      // Update the context with the new photos
      photoContext.setPhotoData({
        ...photoContext.photoData,
        photos: newPhotos
      });
      
      toast.success(`${photos.length} photo${photos.length > 1 ? 's' : ''} uploaded successfully!`);

      // Reset file input to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };
  
  const handleClearPhotos = () => {
    setUploadedPhotos([]);
    if (photoContext) {
      photoContext.setPhotoData({
        ...photoContext.photoData,
        photos: []
      });
    }
    toast.info("Photos cleared");
  };
  
  const handleProceedToEdit = () => {
    if (uploadedPhotos.length === 0) {
      toast.error("Please upload at least one photo before proceeding");
      return;
    }
    navigate("/edit");
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-frame-background">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-12">
        <div className="max-w-3xl text-center space-y-4 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-frame-dark">
            Create beautiful photo memories
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Capture moments, add fun effects, and share your creations instantly
          </p>
        </div>
        
        {uploadedPhotos.length > 0 ? (
          <div className="w-full max-w-3xl animate-fade-in">
            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl shadow-md mb-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-frame-dark">Uploaded Photos ({uploadedPhotos.length})</h2>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={triggerFileUpload}
                    className="secondary-action-button"
                  >
                    <Plus size={18} />
                    <span>Upload More</span>
                  </button>
                  <button 
                    type="button"
                    onClick={handleClearPhotos}
                    className="secondary-action-button"
                  >
                    <span>Clear All</span>
                  </button>
                  <button 
                    type="button"
                    onClick={handleProceedToEdit}
                    className="main-action-button"
                  >
                    <Edit size={18} />
                    <span>Edit Photos</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {uploadedPhotos.map((photo, index) => (
                  <div key={index} className="aspect-square relative rounded-lg overflow-hidden border border-frame-secondary">
                    <img 
                      src={photo} 
                      alt={`Uploaded photo ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <Link
              to="/camera"
              className="aspect-square flex flex-col items-center justify-center p-8 bg-white bg-opacity-50 backdrop-blur-sm rounded-xl border border-frame-primary/30 shadow-lg transition-transform hover:scale-[1.02] group"
            >
              <div className="w-24 h-24 mb-6 relative">
                <div className="shutter-button">
                  <div className="button-ring"></div>
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-frame-dark mb-2 group-hover:text-frame-primary transition-colors">
                Use Camera
              </h2>
              <p className="text-muted-foreground text-center">
                Capture photos using your device camera
              </p>
            </Link>
            
            <label
              className="aspect-square flex flex-col items-center justify-center p-8 bg-white bg-opacity-50 backdrop-blur-sm rounded-xl border border-frame-primary/30 shadow-lg cursor-pointer transition-transform hover:scale-[1.02] group"
            >
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                ref={fileInputRef}
              />
              <div className="w-24 h-24 mb-6 flex items-center justify-center rounded-full bg-frame-secondary text-frame-primary group-hover:bg-frame-primary group-hover:text-white transition-colors">
                <Upload size={48} />
              </div>
              <h2 className="text-2xl font-semibold text-frame-dark mb-2 group-hover:text-frame-primary transition-colors">
                Upload Photos
              </h2>
              <p className="text-muted-foreground text-center">
                Select from your photo library
              </p>
            </label>
          </div>
        )}
        
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="relative w-60 h-72 rotate-[-6deg] photo-frame">
            <img
              src="/lovable-uploads/8c0ef93c-a6ad-4cf2-9d59-5d8eae9a9834.png"
              alt="Example photo"
              className="absolute inset-6 object-cover"
            />
          </div>
          <div className="relative w-60 h-72 rotate-[4deg] photo-frame">
            <img
              src="/lovable-uploads/b5861b0a-4503-4c19-99d3-ccf51c8eb9ff.png"
              alt="Example photo"
              className="absolute inset-6 object-cover"
            />
          </div>
          <div className="relative w-60 h-72 rotate-[-2deg] photo-frame hidden md:block">
            <img
              src="/lovable-uploads/aaea95f2-8977-4c26-87dc-082edd144f94.png"
              alt="Example photo"
              className="absolute inset-6 object-cover"
            />
          </div>
        </div>
      </main>
      
      <footer className="py-6 text-center text-muted-foreground">
        <p>© 2023 FrameItNow. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
