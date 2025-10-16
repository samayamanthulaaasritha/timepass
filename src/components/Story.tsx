import { TrashIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { deleteStory } from '../services/firebase';
import { DeleteMenu } from './DeleteMenu';

interface StoryProps {
  story: {
    id: string;
    userId: string;
    // ...other props
  };
}

const Story = ({ story }: StoryProps) => {
  const { currentUser } = useAuth();
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      try {
        await deleteStory(story.id);
      } catch (error) {
        console.error('Error deleting story:', error);
      }
    }
  };

  return (
    <div className="relative group">
      {/* ...existing story content... */}
      {currentUser?.uid === story.userId && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DeleteMenu onDelete={handleDelete} />
        </div>
      )}
    </div>
  );
};

export default Story;