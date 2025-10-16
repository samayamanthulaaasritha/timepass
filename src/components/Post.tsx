import { TrashIcon } from '@heroicons/react/24/solid';
import { getAuth } from 'firebase/auth';
import { deletePost } from '../services/firebase';
import { DeleteMenu } from './DeleteMenu';

interface PostProps {
  post: {
    id: string;
    userId: string;
    // ...other props
  };
}

const Post = ({ post }: PostProps) => {
  const currentUser = getAuth().currentUser;
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(post.id);
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  return (
    <div className="relative group bg-white rounded-lg shadow p-4">
      {/* ...existing post content... */}
      {currentUser?.uid === post.userId && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DeleteMenu onDelete={handleDelete} />
        </div>
      )}
    </div>
  );
};

export default Post;