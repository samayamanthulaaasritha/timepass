import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Edit3 } from 'lucide-react';
import logo from '@/assets/timepass-logo.png';

const Messages = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [followers, setFollowers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        const followersData = await Promise.all(
          (userData?.followers || []).map(async (followerId: string) => {
            const followerDoc = await getDoc(doc(db, 'users', followerId));
            return {
              userId: followerId,
              ...followerDoc.data()
            };
          })
        );

        setFollowers(followersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredFollowers = followers.filter(follower =>
    follower.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">{user?.displayName || 'User'}</h1>
          </div>
          <Button variant="ghost" size="icon">
            <Edit3 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="pt-14 pb-20 min-h-screen bg-background">
        <div className="max-w-2xl mx-auto">
          {/* Search Bar */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-accent border-0"
              />
            </div>
          </div>

          {/* Messages Section */}
          <div className="px-4 py-2">
            <h2 className="font-semibold text-foreground mb-3">Messages</h2>
            
            {loadingData ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              </div>
            ) : filteredFollowers.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No results found' : 'No messages yet'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start following people to send them messages
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredFollowers.map((follower) => (
                  <div
                    key={follower.userId}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => navigate(`/chat/${follower.userId}`)}
                  >
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={follower.profileImageUrl} />
                      <AvatarFallback className="bg-muted text-foreground">
                        {follower.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {follower.username}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        Tap to message
                      </p>
                    </div>
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

export default Messages;
