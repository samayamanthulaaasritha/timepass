import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, UserPlus, ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo.png';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow';
  userId: string;
  username: string;
  profileImageUrl: string;
  postId?: string;
  commentText?: string;
  createdAt: string;
}

const Notifications = () => {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      try {
        // Fetch likes on user's posts
        const postsQuery = query(collection(db, 'posts'), where('userId', '==', user.uid));
        const postsSnapshot = await getDocs(postsQuery);
        
        const notifs: Notification[] = [];

        for (const postDoc of postsSnapshot.docs) {
          const postData = postDoc.data();
          
          // Get likes
          for (const likerId of postData.likes || []) {
            if (likerId !== user.uid) {
              const userDoc = await getDoc(doc(db, 'users', likerId));
              const userData = userDoc.data();
              notifs.push({
                id: `like_${likerId}_${postDoc.id}`,
                type: 'like',
                userId: likerId,
                username: userData?.username || 'User',
                profileImageUrl: userData?.profileImageUrl || '',
                postId: postDoc.id,
                createdAt: postData.createdAt
              });
            }
          }

          // Get comments
          for (const comment of postData.comments || []) {
            if (comment.userId !== user.uid) {
              const userDoc = await getDoc(doc(db, 'users', comment.userId));
              const userData = userDoc.data();
              notifs.push({
                id: `comment_${comment.userId}_${postDoc.id}`,
                type: 'comment',
                userId: comment.userId,
                username: userData?.username || 'User',
                profileImageUrl: userData?.profileImageUrl || '',
                postId: postDoc.id,
                commentText: comment.text,
                createdAt: comment.createdAt
              });
            }
          }
        }

        // Get followers
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        for (const followerId of userData?.followers || []) {
          const followerDoc = await getDoc(doc(db, 'users', followerId));
          const followerData = followerDoc.data();
          notifs.push({
            id: `follow_${followerId}`,
            type: 'follow',
            userId: followerId,
            username: followerData?.username || 'User',
            profileImageUrl: followerData?.profileImageUrl || '',
            createdAt: followerData?.createdAt || new Date().toISOString()
          });
        }

        setNotifications(notifs.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));

        // Fetch suggestions (users not following)
        const allUsersSnapshot = await getDocs(collection(db, 'users'));
        const allUsers = allUsersSnapshot.docs
          .map(doc => ({ userId: doc.id, ...doc.data() }))
          .filter(u => u.userId !== user.uid && !userData?.following?.includes(u.userId))
          .slice(0, 10);
        
        setSuggestions(allUsers);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchNotifications();
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link to="/home">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <img src={logo} alt="Timepass" className="h-8 w-8" />
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
        </div>
      </header>

      <main className="pt-14 pb-20 min-h-screen bg-background">
        <div className="max-w-2xl mx-auto">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {loadingData ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notif) => (
                    <Link
                      key={notif.id}
                      to={notif.postId ? `/home` : `/profile/${notif.userId}`}
                      className="flex items-center gap-3 p-4 hover:bg-accent transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notif.profileImageUrl} />
                        <AvatarFallback className="bg-muted text-foreground">
                          {notif.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-semibold">{notif.username}</span>
                          {notif.type === 'like' && ' liked your post'}
                          {notif.type === 'comment' && ` commented: ${notif.commentText}`}
                          {notif.type === 'follow' && ' started following you'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {notif.type === 'like' && <Heart className="h-5 w-5 text-red-500 fill-current" />}
                      {notif.type === 'comment' && <MessageCircle className="h-5 w-5 text-primary" />}
                      {notif.type === 'follow' && <UserPlus className="h-5 w-5 text-primary" />}
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="suggestions" className="mt-0">
              {loadingData ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-muted-foreground">No suggestions available</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {suggestions.map((suggestion) => (
                    <Link
                      key={suggestion.userId}
                      to={`/profile/${suggestion.userId}`}
                      className="flex items-center gap-3 p-4 hover:bg-accent transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={suggestion.profileImageUrl} />
                        <AvatarFallback className="bg-muted text-foreground">
                          {suggestion.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{suggestion.username}</p>
                        {suggestion.bio && (
                          <p className="text-sm text-muted-foreground truncate">{suggestion.bio}</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline">Follow</Button>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Navbar />
    </>
  );
};

export default Notifications;
