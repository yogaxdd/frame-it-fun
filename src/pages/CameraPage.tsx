
import { useContext, useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Repeat, Upload, Check } from "lucide-react";
import Header from "@/components/Header";
import { PhotoContext } from "@/App";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const CameraPage = () => {
  const navigate = useNavigate();
  const photoContext = useContext(PhotoContext);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [countDown, setCountDown] = useState(0);
  const [photosTaken, setPhotosTaken] = useState<string[]>([]);
  const [photoCount, setPhotoCount] = useState(3);
  const [isMirrored, setIsMirrored] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  const initCamera = useCallback(async () => {
    try {
      setCameraError(null);
      
      // Stop any existing stream to prevent memory leaks and flickering
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Set appropriate constraints based on device
      const constraints = {
        video: {
          width: { ideal: isMobile ? 720 : 1280 },
          height: { ideal: isMobile ? 1280 : 720 },
          facingMode: "user"
        },
        audio: false
      };
      
      console.log("Requesting camera with constraints:", constraints);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Camera access granted:", mediaStream.getVideoTracks().length > 0);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Make sure we're actually getting video data
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (!videoTrack) {
          throw new Error("No video track found in media stream");
        }
        
        console.log("Video track settings:", videoTrack.getSettings());
        
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                console.log("Video playback started successfully");
                setIsCameraReady(true);
              })
              .catch(err => {
                console.error("Error playing video:", err);
                setCameraError("Error starting camera. Please refresh and try again.");
              });
          }
        };
        
        setStream(mediaStream);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please allow camera access in your browser settings.");
      } else if (error instanceof DOMException && error.name === "NotFoundError") {
        setCameraError("No camera found. Please ensure your device has a working camera.");
      } else {
        setCameraError("Unable to access camera. Please ensure you have given permission.");
      }
      toast.error("Unable to access camera. Please ensure you have given permission.");
    }
  }, [stream, isMobile]);
  
  useEffect(() => {
    // Initialize camera on component mount
    const setupCamera = async () => {
      // Add a small delay to make sure the component is fully mounted
      setTimeout(() => {
        initCamera();
      }, 500);
    };
    
    setupCamera();
    
    // Clean up when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [initCamera]);
  
  const takePhoto = useCallback(() => {
    if (!isCameraReady || !canvasRef.current || !videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if (isMirrored) {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    
    context.drawImage(video, 0, 0);
    
    const photoDataUrl = canvas.toDataURL('image/jpeg');
    
    return photoDataUrl;
  }, [isCameraReady, isMirrored]);
  
  const startPhotoSession = useCallback(() => {
    if (!isCameraReady) return;
    
    setPhotosTaken([]);
    setIsTakingPhoto(true);
    setCountDown(3);
    
    const countdownInterval = setInterval(() => {
      setCountDown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          const photoDataUrl = takePhoto();
          if (photoDataUrl) {
            setPhotosTaken(prev => [...prev, photoDataUrl]);
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isCameraReady, takePhoto]);
  
  useEffect(() => {
    if (photosTaken.length > 0 && photosTaken.length < photoCount && isTakingPhoto) {
      const delay = setTimeout(() => {
        setCountDown(3);
        
        const countdownInterval = setInterval(() => {
          setCountDown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              const photoDataUrl = takePhoto();
              if (photoDataUrl) {
                setPhotosTaken(prev => [...prev, photoDataUrl]);
              }
              
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, 1000);
      
      return () => {
        clearTimeout(delay);
      };
    } else if (photosTaken.length === photoCount && isTakingPhoto) {
      setIsTakingPhoto(false);
      
      toast("Photo session complete!", {
        description: "Your photos are ready for editing.",
        action: {
          label: "Edit Now",
          onClick: () => proceedToEdit()
        }
      });
    }
  }, [photosTaken, photoCount, isTakingPhoto, takePhoto]);
  
  const uploadPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !photoContext) return;
    
    const photosArray = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .slice(0, photoCount);
    
    if (photosArray.length === 0) {
      toast.error("Please select valid image files");
      return;
    }
    
    Promise.all(photosArray.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
    })).then(uploadedPhotos => {
      photoContext.setPhotoData({
        ...photoContext.photoData,
        photos: uploadedPhotos
      });
      
      toast.success("Photos uploaded successfully!");
      navigate("/edit");
    });
  };
  
  const proceedToEdit = () => {
    if (photoContext && photosTaken.length > 0) {
      photoContext.setPhotoData({
        ...photoContext.photoData,
        photos: photosTaken
      });
      
      navigate("/edit");
    } else {
      toast.error("No photos taken. Please capture some photos first.");
    }
  };
  
  const toggleMirror = () => {
    setIsMirrored(prev => !prev);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-frame-background">
      <Header />
      
      <main className="flex-1 flex flex-col md:flex-row p-4 md:p-6 gap-6 max-w-7xl mx-auto">
        <div className="md:w-3/5 flex flex-col gap-6">
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-lg">
            {/* Show loading state before camera is initialized */}
            {!isCameraReady && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Initializing camera...</p>
                </div>
              </div>
            )}
            
            {/* Video element for camera feed */}
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
              style={{ display: isCameraReady ? 'block' : 'none' }}
            />
            
            {/* Show error message if camera initialization fails */}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center text-white p-4">
                  <p className="mb-4">{cameraError}</p>
                  <button 
                    onClick={initCamera}
                    className="bg-frame-primary text-white px-4 py-2 rounded-md"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            
            {/* Countdown overlay */}
            {countDown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-8xl font-bold text-white bg-black/30 w-32 h-32 rounded-full flex items-center justify-center animate-pulse">
                  {countDown}
                </div>
              </div>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={toggleMirror}
                className="secondary-action-button"
                aria-label="Toggle mirror"
              >
                <Repeat size={20} />
                <span>Mirror</span>
              </button>
              
              <button
                onClick={startPhotoSession}
                disabled={isTakingPhoto || !isCameraReady}
                className={`main-action-button ${isTakingPhoto || !isCameraReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Take photos"
              >
                <Camera size={20} />
                <span>Take Photos</span>
              </button>
              
              <label className="secondary-action-button cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={uploadPhotos}
                  disabled={isTakingPhoto}
                />
                <Upload size={20} />
                <span>Upload</span>
              </label>
            </div>
            
            <div className="flex justify-center gap-2 mt-4">
              <span className="text-frame-dark">Number of photos:</span>
              {[1, 2, 3, 4].map(count => (
                <button
                  key={count}
                  onClick={() => setPhotoCount(count)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    photoCount === count 
                      ? 'bg-frame-primary text-white' 
                      : 'bg-white text-frame-dark'
                  }`}
                  aria-label={`${count} photos`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="md:w-2/5">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-md p-4 h-full">
            <h2 className="text-lg font-semibold mb-4 text-frame-dark">Preview</h2>
            
            <div className="photo-preview-container">
              {photosTaken.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {photosTaken.map((photo, index) => (
                    <div key={index} className="photo-preview-item">
                      <img 
                        src={photo}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-auto rounded"
                      />
                    </div>
                  ))}
                  
                  {photosTaken.length === photoCount && (
                    <button 
                      onClick={proceedToEdit}
                      className="mt-4 main-action-button"
                    >
                      <Check size={20} />
                      <span>Continue to Edit</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Camera size={48} className="mb-2 opacity-30" />
                  <p>Photos you take will appear here</p>
                  <p className="text-sm">Take {photoCount} photos for your strip</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CameraPage;
