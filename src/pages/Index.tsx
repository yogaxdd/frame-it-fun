import { Link, useNavigate } from "react-router-dom";
import { Camera, Upload } from "lucide-react";
import Header from "@/components/Header";
import { useContext } from "react";
import { PhotoContext } from "@/App";
import { toast } from "sonner";

const Index = () => {
  const photoContext = useContext(PhotoContext);
  const navigate = useNavigate();
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !photoContext) return;
    
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.error("Please select valid image files");
      return;
    }
    
    const photosToProcess = imageFiles.slice(0, 3); // Limit to 3 photos
    
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
      photoContext.setPhotoData({
        ...photoContext.photoData,
        photos: photos
      });
      toast.success("Photos uploaded successfully!");
      navigate("/edit");
    });
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
        
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="relative w-60 h-72 rotate-[-6deg] photo-frame">
            <img
              src="/lovable-uploads/1db4ac3a-d356-4a64-8b35-46b1fc6c9a02.png"
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
