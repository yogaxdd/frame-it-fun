
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { MoveLeft } from "lucide-react";
import Header from "@/components/Header";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-frame-background">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6 animate-fade-in">
          <div className="text-9xl font-bold text-frame-primary">404</div>
          <h1 className="text-3xl font-bold text-frame-dark">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link 
            to="/" 
            className="main-action-button inline-flex"
          >
            <MoveLeft size={20} />
            <span>Back to Home</span>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
