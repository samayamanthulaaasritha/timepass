import { useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid, Bookmark, Video, Repeat2 } from 'lucide-react';
import EditProfileDialog from '@/components/EditProfileDialog';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

const Profile = () => {
  const { userId } = useParams();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchProfileData = async () => {
    if (!userId) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        setProfile(profileData);
        
        // Check if current user is following this profile
        if (user?.uid && user.uid !== userId) {
          setIsFollowing(profileData.followers?.includes(user.uid) || false);
        }
        
        // Fetch saved posts if viewing own profile
        if (user?.uid === userId) {
          const userData = userDoc.data();
          const savedPostIds = userData.savedPosts || [];
          if (savedPostIds.length > 0) {
            const savedPostsData = await Promise.all(
              savedPostIds.map(async (postId: string) => {
                const postDoc = await getDoc(doc(db, 'posts', postId));
                if (postDoc.exists()) {
                  return { postId: postDoc.id, ...postDoc.data() };
                }
                return null;
              })
            );
            setSavedPosts(savedPostsData.filter(p => p !== null));
          }
        }
      }

      const q = query(collection(db, 'posts'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const userPosts = querySnapshot.docs.map(doc => ({
        postId: doc.id,
        ...doc.data()
      })) as any[];
      setPosts(userPosts);
      
      // Filter reels (video posts)
      const videoReels = userPosts.filter((post: any) => post.mediaType === 'video');
      setReels(videoReels);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleRemix = (post: any) => {
    // For now, navigate to create post page with a toast indicating remix feature
    toast({
      title: 'Remix feature',
      description: 'Creating a remix of this post. This feature will be fully available soon!',
      duration: 2000
    });
    // Navigate to create post page where user can create their remix
    setTimeout(() => {
      navigate('/create');
    }, 500);
  };

  const handleFollowToggle = async () => {
    if (!user || !userId) return;
    
    setFollowLoading(true);
    try {
      const currentUserRef = doc(db, 'users', user.uid);
      const targetUserRef = doc(db, 'users', userId);

      if (isFollowing) {
        // Unfollow
        await updateDoc(currentUserRef, {
          following: arrayRemove(userId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(user.uid)
        });
        setIsFollowing(false);
        toast({
          title: 'Unfollowed',
          description: `You unfollowed ${profile.username}`
        });
      } else {
        // Follow
        await updateDoc(currentUserRef, {
          following: arrayUnion(userId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(user.uid)
        });
        setIsFollowing(true);
        toast({
          title: 'Following',
          description: `You are now following ${profile.username}`
        });
      }
      
      fetchProfileData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive'
      });
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [userId, user]);

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!profile) {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-2">
            <img src={logo} alt="Timepass" className="h-8 w-8" />
            <h1 className="text-xl font-bold text-foreground">Profile</h1>
          </div>
        </header>
        <Navbar />
        <main className="pt-14 text-center py-12">
          <p className="text-xl text-muted-foreground">User not found</p>
        </main>
      </>
    );
  }

  const isOwnProfile = user.uid === userId;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-2">
          <img src={logo} alt="Timepass" className="h-8 w-8" />
          <h1 className="text-xl font-bold text-foreground">{profile.username}</h1>
        </div>
      </header>
      <Navbar />
      <main className="pt-14 pb-20 min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 pt-4">
          {/* Profile Header */}
          <div className="py-8 space-y-8 animate-fade-in">
            <div className="flex items-center gap-8">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.profileImageUrl} alt={profile.username} />
                <AvatarFallback className="text-2xl bg-muted text-foreground">
                  {profile.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-semibold text-foreground">{profile.username}</h1>
                  {isOwnProfile && (
                    <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                      Edit Profile
                    </Button>
                  )}
                  {!isOwnProfile && (
                    <Button 
                      size="sm" 
                      variant={isFollowing ? "outline" : "default"}
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                    >
                      {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  )}
                </div>

                <div className="flex gap-8 text-sm">
                  <span className="text-foreground"><strong>{posts.length}</strong> posts</span>
                  <span className="text-foreground"><strong>{profile.followers?.length || 0}</strong> followers</span>
                  <span className="text-foreground"><strong>{profile.following?.length || 0}</strong> following</span>
                </div>

                {profile.bio && (
                  <p className="text-sm text-foreground">{profile.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts" className="gap-2">
                <Grid className="h-4 w-4" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="reels" className="gap-2">
                <Video className="h-4 w-4" />
                Reels
              </TabsTrigger>
              {isOwnProfile && (
                <TabsTrigger value="saved" className="gap-2">
                  <Bookmark className="h-4 w-4" />
                  Saved
                </TabsTrigger>
              )}
            </TabsList>

            {/* Posts Tab */}
            <TabsContent value="posts" className="mt-6">
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No posts yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 md:gap-4">
                  {posts.map((post) => (
                    <div 
                      key={post.postId} 
                      className="aspect-square bg-muted rounded overflow-hidden hover-lift cursor-pointer relative group"
                    >
                      {post.mediaType === 'video' ? (
                        <video 
                          src={post.mediaUrl} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img 
                          src={post.mediaUrl} 
                          alt={post.caption} 
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-white hover:bg-white/20 bg-black/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemix(post);
                          }}
                          title="Remix this post"
                        >
                          <Repeat2 className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Reels Tab */}
            <TabsContent value="reels" className="mt-6">
              {reels.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No reels yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 md:gap-4">
                  {reels.map((reel) => (
                    <div 
                      key={reel.postId} 
                      className="aspect-square bg-muted rounded overflow-hidden hover-lift cursor-pointer relative group"
                    >
                      <video 
                        src={reel.mediaUrl} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="h-8 w-8 text-white drop-shadow-lg" />
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-white hover:bg-white/20 bg-black/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemix(reel);
                          }}
                          title="Remix this reel"
                        >
                          <Repeat2 className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Saved Posts Tab */}
            {isOwnProfile && (
              <TabsContent value="saved" className="mt-6">
                {savedPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No saved posts yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1 md:gap-4">
                    {savedPosts.map((post) => (
                      <div 
                        key={post.postId} 
                        className="aspect-square bg-muted rounded overflow-hidden hover-lift cursor-pointer"
                      >
                        {post.mediaType === 'video' ? (
                          <video 
                            src={post.mediaUrl} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img 
                            src={post.mediaUrl} 
                            alt={post.caption} 
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      {isOwnProfile && (
        <EditProfileDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          profile={profile}
          onProfileUpdate={fetchProfileData}
        />
      )}
    </>
  );
};

export default Profile;
