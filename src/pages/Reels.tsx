import { useEffect, useState, useRef } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Heart, MessageCircle, Send, Bookmark, Play, Volume2, VolumeX } from 'lucide-react';
import logo from '@/assets/logo.png';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import CommentDialog from '@/components/CommentDialog';
import SaveDialog from '@/components/SaveDialog';

interface Reel {
  postId: string;
  userId: string;
  username: string;
  profileImageUrl: string;
  caption: string;
  mediaUrl: string;
  likes: string[];
  comments: any[];
}

const Reels = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loadingReels, setLoadingReels] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedReelId, setSelectedReelId] = useState<string | null>(null);
  const [currentComments, setCurrentComments] = useState<any[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const q = query(
          collection(db, 'posts'),
          where('mediaType', '==', 'video')
        );
        const querySnapshot = await getDocs(q);
        const reelsData = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const userDoc = await getDoc(doc(db, 'users', data.userId));
            const userData = userDoc.data();
            
            return {
              postId: docSnap.id,
              ...data,
              username: userData?.username || 'User',
              profileImageUrl: userData?.profileImageUrl || ''
            } as Reel;
          })
        );
        setReels(reelsData);
        
        // Set liked reels and saved reels
        if (user) {
          const liked = new Set<string>();
          reelsData.forEach(reel => {
            if (reel.likes?.includes(user.uid)) {
              liked.add(reel.postId);
            }
          });
          setLikedReels(liked);
          
          // Check saved posts
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const saved = new Set<string>(userData.savedPosts || []);
            setSavedReels(saved);
          }
        }
      } catch (error) {
        console.error('Error fetching reels:', error);
      } finally {
        setLoadingReels(false);
      }
    };

    if (user) {
      fetchReels();
    }
  }, [user]);

  useEffect(() => {
    // Auto-play current video
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.play().catch(() => {});
      currentVideo.muted = muted;
    }

    // Pause other videos
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentIndex) {
        video.pause();
      }
    });
  }, [currentIndex, muted]);

  const handleVideoClick = (postId: string) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300) {
      // Double tap - like
      handleLike(postId);
    } else {
      // Single tap - mute/unmute
      setMuted(!muted);
    }

    lastTapRef.current = now;
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    const postRef = doc(db, 'posts', postId);
    const isLiked = likedReels.has(postId);

    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
        setLikedReels(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
        setLikedReels(prev => new Set(prev).add(postId));
        
        // Show heart animation
        toast({
          title: '❤️ Liked!',
          duration: 1000
        });
      }
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPosition = container.scrollTop;
    const windowHeight = container.clientHeight;
    const index = Math.round(scrollPosition / windowHeight);
    
    if (index !== currentIndex && index >= 0 && index < reels.length) {
      setCurrentIndex(index);
    }
  };

  const handleCommentClick = async (postId: string) => {
    setSelectedReelId(postId);
    const postDoc = await getDoc(doc(db, 'posts', postId));
    if (postDoc.exists()) {
      setCurrentComments(postDoc.data().comments || []);
    }
    setCommentDialogOpen(true);
  };

  const handleSaveClick = (postId: string) => {
    setSelectedReelId(postId);
    if (savedReels.has(postId)) {
      handleUnsave(postId);
    } else {
      setSaveDialogOpen(true);
    }
  };

  const handleSaveToAccount = async () => {
    if (!user || !selectedReelId) return;

    const userRef = doc(db, 'users', user.uid);
    
    try {
      await updateDoc(userRef, {
        savedPosts: arrayUnion(selectedReelId)
      });
      setSavedReels(prev => new Set(prev).add(selectedReelId));
      toast({
        title: 'Reel saved',
        description: 'Added to your saved posts'
      });
      setSaveDialogOpen(false);
    } catch (error) {
      console.error('Error saving reel:', error);
      toast({
        title: 'Error',
        description: 'Failed to save reel',
        variant: 'destructive'
      });
    }
  };

  const handleUnsave = async (postId: string) => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    
    try {
      await updateDoc(userRef, {
        savedPosts: arrayRemove(postId)
      });
      setSavedReels(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      toast({
        title: 'Reel unsaved',
        description: 'Removed from saved posts'
      });
    } catch (error) {
      console.error('Error unsaving reel:', error);
      toast({
        title: 'Error',
        description: 'Failed to unsave reel',
        variant: 'destructive'
      });
    }
  };

  const handleShare = async (reel: Reel) => {
    try {
      const shareUrl = `${window.location.origin}/post/${reel.postId}`;
      if (navigator.share) {
        await navigator.share({
          title: `Reel by ${reel.username}`,
          text: reel.caption || 'Check out this reel on Timepass',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Link copied!',
          description: 'Reel link copied to clipboard'
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading || loadingReels) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (reels.length === 0) {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-2">
            <img src={logo} alt="Timepass" className="h-8 w-8" />
            <h1 className="text-xl font-bold text-foreground">Reels</h1>
          </div>
        </header>
        <Navbar />
        <main className="pt-14 pb-20 min-h-screen bg-background">
          <div className="max-w-md mx-auto text-center py-12 px-4">
            <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground">No reels yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Video posts will appear here as reels
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-2">
          <img src={logo} alt="Timepass" className="h-8 w-8" />
          <h1 className="text-xl font-bold text-foreground">Reels</h1>
        </div>
      </header>
      <Navbar />
      <main
        className="fixed inset-0 top-14 bottom-20 overflow-y-scroll snap-y snap-mandatory bg-black scrollbar-hide"
        onScroll={handleScroll}
      >
        {reels.map((reel, index) => (
          <div 
            key={reel.postId} 
            className="relative h-full w-full snap-start snap-always flex items-center justify-center"
          >
            {/* Video */}
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={reel.mediaUrl}
              loop
              playsInline
              muted={muted}
              className="absolute inset-0 w-full h-full object-contain"
              onClick={() => handleVideoClick(reel.postId)}
            />

            {/* Mute indicator */}
            <div className="absolute top-4 right-4 z-10">
              <Button 
                variant="ghost" 
                size="icon"
                className="bg-black/30 hover:bg-black/50 text-white"
                onClick={() => setMuted(!muted)}
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>

            {/* Right side actions - Instagram style */}
            <div className="absolute right-4 bottom-20 z-10 flex flex-col gap-6">
              {/* Like button */}
              <div className="flex flex-col items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(reel.postId);
                  }}
                  className={`h-12 w-12 rounded-full ${likedReels.has(reel.postId) ? 'text-red-500' : 'text-white'} hover:bg-white/20`}
                >
                  <Heart className={`h-7 w-7 ${likedReels.has(reel.postId) ? 'fill-current' : ''}`} />
                </Button>
                {reel.likes?.length > 0 && (
                  <span className="text-xs text-white font-semibold">{reel.likes.length}</span>
                )}
              </div>

              {/* Comment button */}
              <div className="flex flex-col items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCommentClick(reel.postId);
                  }}
                  className="h-12 w-12 rounded-full text-white hover:bg-white/20"
                >
                  <MessageCircle className="h-7 w-7" />
                </Button>
                {reel.comments?.length > 0 && (
                  <span className="text-xs text-white font-semibold">{reel.comments.length}</span>
                )}
              </div>

              {/* Share button */}
              <div className="flex flex-col items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(reel);
                  }}
                  className="h-12 w-12 rounded-full text-white hover:bg-white/20"
                >
                  <Send className="h-7 w-7" />
                </Button>
              </div>

              {/* Save button */}
              <div className="flex flex-col items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveClick(reel.postId);
                  }}
                  className="h-12 w-12 rounded-full text-white hover:bg-white/20"
                >
                  <Bookmark className={`h-7 w-7 ${savedReels.has(reel.postId) ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Bottom left - User info */}
            <div className="absolute bottom-4 left-4 right-20 z-10">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-10 w-10 ring-2 ring-white/20">
                  <AvatarImage src={reel.profileImageUrl} />
                  <AvatarFallback className="bg-muted text-foreground">
                    {reel.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-white">
                  {reel.username}
                </span>
              </div>

              {/* Caption */}
              {reel.caption && (
                <p className="text-sm text-white line-clamp-2">
                  {reel.caption}
                </p>
              )}
            </div>
          </div>
        ))}
      </main>

      {/* Comment Dialog */}
      {selectedReelId && (
        <CommentDialog
          open={commentDialogOpen}
          onOpenChange={setCommentDialogOpen}
          postId={selectedReelId}
          comments={currentComments}
        />
      )}

      {/* Save Dialog */}
      {selectedReelId && (
        <SaveDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          mediaUrl={reels.find(r => r.postId === selectedReelId)?.mediaUrl || ''}
          postId={selectedReelId}
          onSaveToAccount={handleSaveToAccount}
        />
      )}
    </>
  );
};

export default Reels;
