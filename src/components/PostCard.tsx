import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Bookmark, Send, Repeat2, Volume2, VolumeX } from 'lucide-react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import CommentDialog from './CommentDialog';
import SaveDialog from './SaveDialog';

interface Post {
  postId: string;
  userId: string;
  caption: string;
  mediaUrl: string;
  mediaType: string;
  likes: string[];
  comments: any[];
  createdAt: string;
}

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [currentComments, setCurrentComments] = useState(post.comments || []);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const lastTapRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const userDoc = await getDoc(doc(db, 'users', post.userId));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    };
    fetchUserProfile();
  }, [post.userId]);

  useEffect(() => {
    if (user && post.likes) {
      setIsLiked(post.likes.includes(user.uid));
    }
  }, [user, post.likes]);

  useEffect(() => {
    const checkIfSaved = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsSaved(userData.savedPosts?.includes(post.postId) || false);
        }
      }
    };
    checkIfSaved();
  }, [user, post.postId]);

  useEffect(() => {
    const fetchComments = async () => {
      const postDoc = await getDoc(doc(db, 'posts', post.postId));
      if (postDoc.exists()) {
        setCurrentComments(postDoc.data().comments || []);
      }
    };
    if (commentDialogOpen) {
      fetchComments();
    }
  }, [commentDialogOpen, post.postId]);

  const handleLike = async () => {
    if (!user) return;

    const postRef = doc(db, 'posts', post.postId);
    
    if (isLiked) {
      await updateDoc(postRef, {
        likes: arrayRemove(user.uid)
      });
      setLikesCount(prev => prev - 1);
      setIsLiked(false);
    } else {
      await updateDoc(postRef, {
        likes: arrayUnion(user.uid)
      });
      setLikesCount(prev => prev + 1);
      setIsLiked(true);
    }
  };

  const handleSaveClick = () => {
    if (isSaved) {
      handleUnsave();
    } else {
      setSaveDialogOpen(true);
    }
  };

  const handleSaveToAccount = async () => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    
    try {
      await updateDoc(userRef, {
        savedPosts: arrayUnion(post.postId)
      });
      setIsSaved(true);
      toast({
        title: 'Post saved',
        description: 'Added to your Timepass account'
      });
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: 'Error',
        description: 'Failed to save post',
        variant: 'destructive'
      });
    }
  };

  const handleUnsave = async () => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    
    try {
      await updateDoc(userRef, {
        savedPosts: arrayRemove(post.postId)
      });
      setIsSaved(false);
      toast({
        title: 'Post unsaved',
        description: 'Removed from saved posts'
      });
    } catch (error) {
      console.error('Error unsaving post:', error);
      toast({
        title: 'Error',
        description: 'Failed to unsave post',
        variant: 'destructive'
      });
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/post/${post.postId}`;
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${userProfile?.username}`,
          text: post.caption || 'Check out this post on Timepass',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Link copied!',
          description: 'Post link copied to clipboard'
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleRemix = () => {
    toast({
      title: 'Remix feature',
      description: 'Remix functionality coming soon!'
    });
  };

  const handleMediaClick = () => {
    if (post.mediaType !== 'video') return;
    
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300) {
      // Double tap - like
      handleLike();
    } else {
      // Single tap - mute/unmute
      setIsMuted(!isMuted);
    }

    lastTapRef.current = now;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!userProfile) return null;

  return (
    <article className="bg-card border border-border rounded-lg overflow-hidden card-shadow-hover animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <Avatar>
          <AvatarImage src={userProfile.profileImageUrl} alt={userProfile.username} />
          <AvatarFallback>{userProfile.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">{userProfile.username}</p>
          <p className="text-xs text-muted-foreground">{getTimeAgo(post.createdAt)}</p>
        </div>
      </div>

      {/* Media */}
      <div className="relative aspect-square bg-muted" onClick={handleMediaClick}>
        {post.mediaType === 'video' ? (
          <>
            <video 
              ref={videoRef}
              src={post.mediaUrl} 
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 z-10">
              <Button 
                variant="ghost" 
                size="icon"
                className="bg-black/30 hover:bg-black/50 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>
          </>
        ) : (
          <img 
            src={post.mediaUrl} 
            alt={post.caption} 
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleLike}
            className={isLiked ? 'text-destructive' : ''}
          >
            <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCommentDialogOpen(true)}>
            <MessageCircle className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Send className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRemix}>
            <Repeat2 className="h-6 w-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto"
            onClick={handleSaveClick}
          >
            <Bookmark className={`h-6 w-6 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
        </div>

        <div>
          <p className="font-semibold text-sm">{likesCount} likes</p>
          {post.caption && (
            <p className="text-sm mt-2">
              <span className="font-semibold mr-2">{userProfile.username}</span>
              {post.caption}
            </p>
          )}
          {currentComments.length > 0 && (
            <button 
              className="text-sm text-muted-foreground mt-2 hover:text-foreground"
              onClick={() => setCommentDialogOpen(true)}
            >
              View all {currentComments.length} comments
            </button>
          )}
        </div>
      </div>

      <CommentDialog
        open={commentDialogOpen}
        onOpenChange={setCommentDialogOpen}
        postId={post.postId}
        comments={currentComments}
      />

      <SaveDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        mediaUrl={post.mediaUrl}
        postId={post.postId}
        onSaveToAccount={handleSaveToAccount}
      />
    </article>
  );
};

export default PostCard;
