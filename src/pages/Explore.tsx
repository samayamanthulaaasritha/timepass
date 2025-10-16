import { useEffect, useState } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import logo from '@/assets/logo.png';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Explore = () => {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          userId: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
        setFilteredUsers(usersData);

        // Fetch posts
        const postsQuery = query(collection(db, 'posts'));
        const postsSnapshot = await getDocs(postsQuery);
        const postsData = postsSnapshot.docs.map(doc => ({
          postId: doc.id,
          ...doc.data()
        }));
        setPosts(postsData);
        setFilteredPosts(postsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
      setFilteredPosts(posts);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter(u => 
          u.username?.toLowerCase().includes(term) || 
          u.email?.toLowerCase().includes(term)
        )
      );
      setFilteredPosts(
        posts.filter(p => 
          p.caption?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, users, posts]);

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
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-2">
          <img src={logo} alt="Timepass" className="h-8 w-8" />
          <h1 className="text-xl font-bold text-foreground">Explore</h1>
        </div>
      </header>
      <Navbar />
      <main className="pt-14 pb-20 min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 pt-4">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search users or posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="mt-6">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((userItem) => (
                    <Link 
                      key={userItem.userId} 
                      to={`/profile/${userItem.userId}`}
                      className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={userItem.profileImageUrl} />
                        <AvatarFallback className="bg-muted text-foreground">
                          {userItem.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{userItem.username}</p>
                        {userItem.bio && (
                          <p className="text-sm text-muted-foreground truncate">{userItem.bio}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Posts Tab */}
            <TabsContent value="posts" className="mt-6">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No posts found</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 md:gap-4">
                  {filteredPosts.map((post) => (
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
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default Explore;
