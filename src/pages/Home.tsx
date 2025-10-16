import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { LogOut, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import PostCard from '@/components/PostCard';
import Stories from '@/components/Stories';
import ThemeToggle from '@/components/ThemeToggle';
import logo from '@/assets/logo.png';

const Home = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const postsData = querySnapshot.docs.map(doc => ({
          postId: doc.id,
          ...doc.data()
        }));
        setPosts(postsData);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoadingPosts(false);
      }
    };

    if (user) {
      fetchPosts();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border shadow-soft">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-3 hover-lift">
            <img src={logo} alt="Timepass" className="h-9 w-9" />
            <span className="text-2xl font-bold text-gradient">Timepass</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/notifications">
              <Button variant="ghost" size="icon" className="hover:bg-accent rounded-xl relative">
                <Heart className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full animate-pulse" />
              </Button>
            </Link>
            <Link to="/messages">
              <Button variant="ghost" size="icon" className="hover:bg-accent rounded-xl">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </Link>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} className="hover:bg-accent rounded-xl">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-16 pb-20 min-h-screen bg-background">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-16 z-40 backdrop-blur-xl bg-background/80">
            <Stories />
          </div>

          <div className="px-4 pt-4">
            {loadingPosts ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="h-16 w-16 rounded-full gradient-primary animate-pulse" />
                <p className="text-muted-foreground">Loading amazing content...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="card-glass p-12 text-center space-y-6 animate-fade-in">
                <div className="h-20 w-20 mx-auto rounded-full gradient-primary flex items-center justify-center shadow-glow">
                  <Heart className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-semibold">Welcome to Timepass!</p>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Start following people to see their posts or create your first post to share with the world
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Link to="/explore">
                    <Button className="gradient-primary">
                      Explore
                    </Button>
                  </Link>
                  <Link to="/create">
                    <Button variant="outline">
                      Create Post
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post, index) => (
                  <div 
                    key={post.postId}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Navbar />
    </>
  );
};

export default Home;
