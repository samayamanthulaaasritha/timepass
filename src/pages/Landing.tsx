import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Users, Sparkles, Zap } from 'lucide-react';
import logo from '@/assets/timepass-logo.png';
import { useAuth } from '@/contexts/AuthContext';

const Landing = () => {
  const { user, loading } = useAuth();

  // Redirect to home if already logged in
  if (loading) {
    return null; // or a loading spinner
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }
  const features = [
    {
      icon: Heart,
      title: 'Share Moments',
      description: 'Capture and share your favorite moments with stunning photos and videos'
    },
    {
      icon: MessageCircle,
      title: 'Connect',
      description: 'Stay connected with friends through messages, comments, and stories'
    },
    {
      icon: Share2,
      title: 'Discover',
      description: 'Explore trending content and discover new creators every day'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Build your community and engage with like-minded people'
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 gradient-radial pointer-events-none" />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-7xl mx-auto w-full">
          {/* Logo and nav */}
          <div className="absolute top-8 left-8 flex items-center gap-2 animate-fade-in">
            <img src={logo} alt="Timepass" className="h-10 w-10" />
            <span className="text-2xl font-bold text-gradient">Timepass</span>
          </div>

          {/* Hero content */}
          <div className="text-center space-y-8 animate-slide-up max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border border-primary/20 backdrop-blur-sm mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-accent-foreground">Welcome to the future of social media</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-tight">
              <span className="text-gradient">Timepass</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Connect with friends and share your story
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link to="/signup">
                <Button size="lg" className="text-lg px-8 h-14 gradient-primary hover:shadow-glow transition-all group">
                  Create Account
                  <Zap className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 hover-lift border-2">
                  Sign In
                </Button>
              </Link>
            </div>
            </div>
          </div>
        </section>
      </div>
    );
  };
  
  export default Landing;
