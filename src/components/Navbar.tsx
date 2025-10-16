import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, PlusSquare, User, Search, Video } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) return null;

  const navItems = [
    { icon: Home, path: '/home', label: 'Home' },
    { icon: Search, path: '/explore', label: 'Explore' },
    { icon: PlusSquare, path: '/create', label: 'Create' },
    { icon: Video, path: '/reels', label: 'Reels' },
    { icon: User, path: `/profile/${user.uid}`, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-t border-border shadow-large">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link key={item.path} to={item.path}>
              <Button 
                variant="ghost" 
                size="icon"
                className={cn(
                  "relative h-12 w-12 rounded-xl transition-all",
                  isActive && "bg-gradient-primary shadow-glow"
                )}
              >
                <Icon 
                  className={cn(
                    "h-6 w-6 transition-colors",
                    isActive ? "text-white" : "text-foreground"
                  )} 
                />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-gradient-primary" />
                )}
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
