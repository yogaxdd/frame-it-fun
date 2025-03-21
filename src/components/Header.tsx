
import { Link } from "react-router-dom";
import { Camera } from "lucide-react";

const Header = () => {
  return (
    <header className="py-4 px-6 flex justify-between items-center animate-fade-in">
      <Link 
        to="/" 
        className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-frame-dark transition-transform hover:scale-105"
      >
        <Camera size={32} className="text-frame-primary" />
        <span>Frame<span className="text-frame-primary">It</span>Now</span>
      </Link>
      
      <nav>
        <Link 
          to="/" 
          className="px-4 py-2 text-frame-dark hover:text-frame-primary transition-colors"
        >
          Home
        </Link>
      </nav>
    </header>
  );
};

export default Header;
