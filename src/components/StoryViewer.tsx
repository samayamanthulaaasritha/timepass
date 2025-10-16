import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Story {
  storyId: string;
  userId: string;
  username: string;
  profileImageUrl: string;
  mediaUrl: string;
  expiresAt: any;
}

interface StoryViewerProps {
  stories: Story[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StoryViewer = ({ stories, currentIndex, open, onOpenChange }: StoryViewerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [comment, setComment] = useState('');

  const currentStory = stories[activeIndex];

  useEffect(() => {
    setActiveIndex(currentIndex);
    setProgress(0);
  }, [currentIndex, open]);

  useEffect(() => {
    if (!open) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [open, activeIndex]);

  const handleNext = () => {
    if (activeIndex < stories.length - 1) {
      setActiveIndex(activeIndex + 1);
      setProgress(0);
    } else {
      onOpenChange(false);
    }
  };

  const handlePrevious = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
      setProgress(0);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    const storyRef = doc(db, 'stories', currentStory.storyId);
    
    try {
      if (isLiked) {
        await updateDoc(storyRef, { likes: arrayRemove(user.uid) });
        setIsLiked(false);
      } else {
        await updateDoc(storyRef, { likes: arrayUnion(user.uid) });
        setIsLiked(true);
        toast({ title: '❤️ Liked!', duration: 1000 });
      }
    } catch (error) {
      console.error('Error liking story:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    
    try {
      if (isSaved) {
        await updateDoc(userRef, { savedStories: arrayRemove(currentStory.storyId) });
        setIsSaved(false);
        toast({ title: 'Story unsaved' });
      } else {
        await updateDoc(userRef, { savedStories: arrayUnion(currentStory.storyId) });
        setIsSaved(true);
        toast({ title: 'Story saved!' });
      }
    } catch (error) {
      console.error('Error saving story:', error);
    }
  };

  const handleComment = async () => {
    if (!user || !comment.trim()) return;
    
    const storyRef = doc(db, 'stories', currentStory.storyId);
    try {
      await updateDoc(storyRef, {
        comments: arrayUnion({
          userId: user.uid,
          text: comment,
          createdAt: new Date().toISOString()
        })
      });
      setComment('');
      toast({ title: 'Comment added!' });
    } catch (error) {
      console.error('Error commenting:', error);
    }
  };

  useEffect(() => {
    const checkInteractions = async () => {
      if (!user || !currentStory) return;
      
      const storyDoc = await getDoc(doc(db, 'stories', currentStory.storyId));
      if (storyDoc.exists()) {
        const data = storyDoc.data();
        setIsLiked(data.likes?.includes(user.uid) || false);
      }
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setIsSaved(userData.savedStories?.includes(currentStory.storyId) || false);
      }
    };
    
    checkInteractions();
  }, [activeIndex, user]);

  if (!currentStory) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 bg-black border-none">
        <div className="relative h-[600px] w-full">
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
            {stories.map((_, idx) => (
              <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100"
                  style={{
                    width: idx < activeIndex ? '100%' : idx === activeIndex ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 ring-2 ring-white">
                <AvatarImage src={currentStory.profileImageUrl} />
                <AvatarFallback>{currentStory.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-white font-semibold text-sm">{currentStory.username}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Story content */}
          <img
            src={currentStory.mediaUrl}
            alt={currentStory.username}
            className="w-full h-full object-contain"
          />

          {/* Navigation */}
          {activeIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          {activeIndex < stories.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={handleNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}

          {/* Interaction buttons */}
          <div className="absolute bottom-4 left-0 right-0 z-10 px-4 space-y-3">
            {/* Action buttons */}
            <div className="flex items-center justify-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={handleLike}
              >
                <Heart className={`h-6 w-6 ${isLiked ? 'fill-current text-red-500' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={handleSave}
              >
                <Bookmark className={`h-6 w-6 ${isSaved ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Comment input */}
            <div className="flex gap-2">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Send message..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleComment();
                  }
                }}
              />
              <Button
                onClick={handleComment}
                disabled={!comment.trim()}
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryViewer;
