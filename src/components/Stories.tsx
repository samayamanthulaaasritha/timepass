import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StoryViewer from './StoryViewer';

interface Story {
  storyId: string;
  userId: string;
  username: string;
  profileImageUrl: string;
  mediaUrl: string;
  expiresAt: any;
}

const Stories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const now = new Date();
      const q = query(
        collection(db, 'stories'),
        where('expiresAt', '>', Timestamp.fromDate(now))
      );
      const querySnapshot = await getDocs(q);
      const storiesData = querySnapshot.docs.map(doc => ({
        storyId: doc.id,
        ...doc.data()
      })) as Story[];
      
      // Group stories by userId
      const groupedStories = storiesData.reduce((acc, story) => {
        if (!acc[story.userId]) {
          acc[story.userId] = [];
        }
        acc[story.userId].push(story);
        return acc;
      }, {} as Record<string, Story[]>);
      
      // Flatten back to array but keep stories from same user together
      const orderedStories = Object.values(groupedStories).flat();
      setStories(orderedStories);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const handleAddStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    setUploading(true);
    try {
      const file = e.target.files[0];
      const mediaUrl = await uploadToCloudinary(file);

      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
      const userData = userDoc.docs[0]?.data();

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Use the actual profile image from user data
      const profileImage = userData?.profileImageUrl || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`;

      await addDoc(collection(db, 'stories'), {
        userId: user.uid,
        username: userData?.username || 'User',
        profileImageUrl: profileImage,
        mediaUrl,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: new Date().toISOString()
      });

      toast({
        title: 'Story added!',
        description: 'Your story will be visible for 24 hours'
      });

      fetchStories();
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Could not upload story',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-4 py-4 bg-card border-b border-border scrollbar-hide">
      {/* Add Story Button */}
      <div className="flex flex-col items-center gap-1 min-w-[72px]">
        <label htmlFor="story-upload" className="cursor-pointer">
          <div className="relative">
            <Avatar className="h-16 w-16 ring-2 ring-primary">
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback className="bg-muted text-foreground">
                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'Y'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1">
              <Plus className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <p className="text-xs text-center mt-1 font-medium text-foreground">Your Story</p>
        </label>
        <input
          id="story-upload"
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleAddStory}
          disabled={uploading}
        />
      </div>

      {/* Stories - Group by user */}
      {(() => {
        const uniqueUsers = new Map();
        stories.forEach((story, index) => {
          if (!uniqueUsers.has(story.userId)) {
            uniqueUsers.set(story.userId, { story, index });
          }
        });
        
        return Array.from(uniqueUsers.values()).map(({ story, index }) => (
          <div 
            key={story.userId} 
            className="flex flex-col items-center gap-1 min-w-[72px] cursor-pointer"
            onClick={() => {
              setSelectedStoryIndex(index);
              setViewerOpen(true);
            }}
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-full p-0.5 gradient-instagram">
                <Avatar className="h-full w-full ring-2 ring-card">
                  <AvatarImage src={story.profileImageUrl} />
                  <AvatarFallback className="bg-muted text-foreground">{story.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <p className="text-xs text-center mt-1 truncate w-full text-foreground">{story.username}</p>
          </div>
        ));
      })()}

      <StoryViewer
        stories={stories}
        currentIndex={selectedStoryIndex}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </div>
  );
};

export default Stories;
