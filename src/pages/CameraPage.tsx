
import { useRef, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, FlipHorizontal, Image, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { toast } from "sonner";
import { PhotoContext } from "@/App";

const CameraPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoContext = useContext(PhotoContext);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [photosCount, setPhotosCount] = useState(3);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [photosTaken, setPhotosTaken] = useState<string[]>([]);
  const [mirrored, setMirrored] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Initialize camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }
        };
        
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
            toast.success("Camera is ready!");
          };
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        toast.error("Failed to access camera. Please try again or upload photos instead.");
      }
    };
    
    startCamera();
    
    // Cleanup
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoData = canvas.toDataURL('image/jpeg');
    return photoData;
  };
  
  const startPhotoSession = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setPhotosTaken([]);
    
    let currentCount = 3;
    setCountdown(currentCount);
    
    const countdownInterval = setInterval(() => {
      currentCount -= 1;
      setCountdown(currentCount);
      
      if (currentCount === 0) {
        clearInterval(countdownInterval);
        
        setTimeout(() => {
          capturePhotos();
        }, 300);
      }
    }, 1000);
  };
  
  const capturePhotos = () => {
    let photosRemaining = photosCount;
    let capturedPhotos: string[] = [];
    
    const captureNextPhoto = () => {
      const photo = takePhoto();
      if (photo) {
        capturedPhotos.push(photo);
        setPhotosTaken([...capturedPhotos]);
        
        photosRemaining -= 1;
        
        if (photosRemaining > 0) {
          setCountdown(3);
          
          let currentCount = 3;
          const countdownInterval = setInterval(() => {
            currentCount -= 1;
            setCountdown(currentCount);
            
            if (currentCount === 0) {
              clearInterval(countdownInterval);
              setTimeout(() => {
                captureNextPhoto();
              }, 300);
            }
          }, 1000);
        } else {
          // All photos taken
          setCountdown(null);
          setIsCapturing(false);
          
          // Save photos to context
          if (photoContext) {
            photoContext.setPhotoData({
              ...photoContext.photoData,
              photos: capturedPhotos
            });
            
            setTimeout(() => {
              navigate("/edit");
            }, 1000);
          }
        }
      }
    };
    
    captureNextPhoto();
  };
  
  const toggleMirror = () => {
    setMirrored(!mirrored);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-frame-background">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 animate-fade-in">
          <div className="flex-1 relative">
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-xl">
              {!isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin" size={48} />
                    <p>Starting camera...</p>
                  </div>
                </div>
              )}
              
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
              />
              
              {countdown !== null && (
                <div className="countdown-overlay">
                  <span className="animate-count-down">{countdown}</span>
                </div>
              )}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="flex items-center justify-center gap-6 mt-6">
              <button
                onClick={toggleMirror}
                className="p-3 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 transition-colors shadow-md"
                title="Toggle mirror mode"
              >
                <FlipHorizontal />
              </button>
              
              <button
                onClick={startPhotoSession}
                disabled={!isCameraReady || isCapturing}
                className="relative group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="shutter-button">
                  {!isCapturing && <div className="button-ring"></div>}
                </div>
              </button>
              
              <label className="p-3 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 transition-colors shadow-md cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0 || !photoContext) return;
                    
                    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
                    if (imageFiles.length === 0) {
                      toast.error("Please select valid image files");
                      return;
                    }
                    
                    Promise.all(imageFiles.map(file => {
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
                        photos: photos.slice(0, 3) // Limit to 3 photos
                      });
                      navigate("/edit");
                    });
                  }}
                />
                <Image title="Upload photos instead" />
              </label>
            </div>
            
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-3 px-5 rounded-full shadow-sm">
                <span>Photos to take:</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((count) => (
                    <button 
                      key={count}
                      onClick={() => setPhotosCount(count)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        photosCount === count 
                          ? 'bg-frame-primary text-white' 
                          : 'bg-white text-frame-dark hover:bg-frame-secondary'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:w-64 flex flex-row lg:flex-col gap-3 justify-center">
            {Array.from({ length: photosCount }).map((_, index) => (
              <div 
                key={index} 
                className="aspect-[3/4] bg-white/50 backdrop-blur-sm rounded-lg overflow-hidden shadow-md border border-frame-primary/30 flex items-center justify-center"
              >
                {photosTaken[index] ? (
                  <img 
                    src={photosTaken[index]} 
                    alt={`Preview ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground text-sm">Preview {index + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CameraPage;
