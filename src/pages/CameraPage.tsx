
import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Camera, RotateCcw, CheckCheck, Upload } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { PhotoContext } from "@/App";
import { toast } from "sonner";

const photoCountOptions = [1, 2, 3, 4];

const CameraPage = () => {
  const navigate = useNavigate();
  const photoContext = useContext(PhotoContext);
  const [isMirrored, setIsMirrored] = useState(true);
  const [isTakingPhotos, setIsTakingPhotos] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [photoCount, setPhotoCount] = useState(3);
  const [photosTaken, setPhotosTaken] = useState<string[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    initCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const initCamera = async () => {
    try {
      setCameraError(null);
      
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError("Unable to access camera. Please ensure you've given permission or try a different browser.");
    }
  };
  
  const takePhoto = () => {
    if (!isCameraReady || !videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Apply mirroring if enabled
    if (isMirrored) {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0);
    
    // Convert to data URL
    return canvas.toDataURL('image/jpeg');
  };
  
  const startPhotoSession = () => {
    if (isTakingPhotos || !isCameraReady) return;
    
    setIsTakingPhotos(true);
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          
          // Take photo
          const photoDataUrl = takePhoto();
          if (photoDataUrl) {
            setPhotosTaken(prev => [...prev, photoDataUrl]);
            
            // Check if we need to take more photos
            if (photosTaken.length + 1 < photoCount) {
              // Wait a moment before starting the next countdown
              setTimeout(() => startNextPhoto(), 1000);
            } else {
              setIsTakingPhotos(false);
            }
          } else {
            setIsTakingPhotos(false);
            toast.error("Failed to take photo. Please try again.");
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const startNextPhoto = () => {
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          
          // Take photo
          const photoDataUrl = takePhoto();
          if (photoDataUrl) {
            setPhotosTaken(prev => [...prev, photoDataUrl]);
            
            // Check if we need to take more photos
            if (photosTaken.length + 1 < photoCount) {
              // Wait a moment before starting the next countdown
              setTimeout(() => startNextPhoto(), 1000);
            } else {
              setIsTakingPhotos(false);
            }
          } else {
            setIsTakingPhotos(false);
            toast.error("Failed to take photo. Please try again.");
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const handleContinueToEdit = () => {
    if (photosTaken.length === 0) {
      toast.error("Please take at least one photo before proceeding");
      return;
    }
    
    if (photoContext) {
      photoContext.setPhotoData({
        ...photoContext.photoData,
        photos: photosTaken
      });
    }
    
    navigate("/edit");
  };
  
  const handleMirrorToggle = () => {
    setIsMirrored(prev => !prev);
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
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
      // Merge new photos with existing ones
      setPhotosTaken(prev => [...prev, ...photos]);
      
      toast.success(`${photos.length} photo${photos.length > 1 ? 's' : ''} uploaded successfully!`);
      
      // Reset file input to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };
  
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleRetake = () => {
    setPhotosTaken([]);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-frame-background">
      <Header />
      
      <main className="flex-1 flex flex-col md:flex-row p-4 gap-6 max-w-7xl mx-auto w-full">
        {/* Camera section */}
        <div className="md:w-2/3">
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl shadow-md mb-4">
            <h2 className="text-xl font-semibold text-frame-dark mb-4">Camera</h2>
            
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                  <p className="text-center mb-4">{cameraError}</p>
                  <Button onClick={initCamera}>Retry</Button>
                </div>
              ) : !isCameraReady ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : null}
              
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
              ></video>
              
              {countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl font-bold text-white bg-black/50 rounded-full w-24 h-24 flex items-center justify-center">
                    {countdown}
                  </div>
                </div>
              )}
              
              <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Button onClick={handleMirrorToggle} variant="outline" disabled={isTakingPhotos}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Mirror
              </Button>
              <Button onClick={startPhotoSession} disabled={isTakingPhotos || !isCameraReady}>
                <Camera className="mr-2 h-4 w-4" />
                {isTakingPhotos ? 'Taking Photos...' : 'Take Photos'}
              </Button>
              <Button onClick={triggerFileUpload} variant="outline" disabled={isTakingPhotos}>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                ref={fileInputRef}
              />
            </div>
            
            <div className="mb-4">
              <p className="mb-2 font-medium">Number of photos: {photoCount}</p>
              <div className="flex gap-2 flex-wrap">
                {photoCountOptions.map(count => (
                  <Button
                    key={count}
                    variant={photoCount === count ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPhotoCount(count)}
                    disabled={isTakingPhotos}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Preview section */}
        <div className="md:w-1/3">
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl shadow-md mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-frame-dark">Preview</h2>
              {photosTaken.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleRetake}>
                  Retake All
                </Button>
              )}
            </div>
            
            {photosTaken.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {photosTaken.map((photo, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden border border-frame-secondary">
                    <img 
                      src={photo} 
                      alt={`Photo ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center p-6 bg-gray-100 rounded-lg text-gray-500 mb-4">
                <Camera size={48} className="mb-4 opacity-50" />
                <p>Photos you take will appear here</p>
                <p className="text-sm">Take or upload {photoCount} photo{photoCount > 1 ? 's' : ''}</p>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <Button onClick={handleContinueToEdit} disabled={photosTaken.length === 0}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Continue to Edit
              </Button>
              <Link to="/" className="w-full">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CameraPage;
