import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

interface Comment {
  userId: string;
  username: string;
  profileImageUrl: string;
  text: string;
  createdAt: string;
}

interface CommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  comments: Comment[];
}

const CommentDialog = ({ open, onOpenChange, postId, comments }: CommentDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      }
    };
    fetchUserProfile();
  }, [user]);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !user || !userProfile) return;

    setLoading(true);
    try {
      const postRef = doc(db, 'posts', postId);
      const newComment = {
        userId: user.uid,
        username: userProfile.username,
        profileImageUrl: userProfile.profileImageUrl || '',
        text: commentText.trim(),
        createdAt: new Date().toISOString()
      };

      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });

      setCommentText('');
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted'
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment, index) => (
              <div key={index} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.profileImageUrl} alt={comment.username} />
                  <AvatarFallback>{comment.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold mr-2">{comment.username}</span>
                    {comment.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Input
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
            disabled={loading}
          />
          <Button 
            onClick={handleSubmitComment} 
            disabled={!commentText.trim() || loading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentDialog;
