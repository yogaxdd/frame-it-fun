
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, createContext } from "react";
import Index from "./pages/Index";
import CameraPage from "./pages/CameraPage";
import EditPage from "./pages/EditPage";
import NotFound from "./pages/NotFound";

// Create a context for the photo data
export type PhotoData = {
  photos: string[];
  photoFilter: string;
  dateEnabled: boolean;
  stickers: {id: string, image: string, x: number, y: number, scale: number}[];
  backgroundColor: string;
  studioNameEnabled?: boolean;
};

type PhotoContextType = {
  photoData: PhotoData;
  setPhotoData: React.Dispatch<React.SetStateAction<PhotoData>>;
};

export const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

const queryClient = new QueryClient();

const App = () => {
  const [photoData, setPhotoData] = useState<PhotoData>({
    photos: [],
    photoFilter: "no-filter",
    dateEnabled: false,
    stickers: [],
    backgroundColor: "#FFFFFF"
  });

  return (
    <QueryClientProvider client={queryClient}>
      <PhotoContext.Provider value={{ photoData, setPhotoData }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/camera" element={<CameraPage />} />
              <Route path="/edit" element={<EditPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PhotoContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
