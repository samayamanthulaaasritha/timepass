import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, Video, Music, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import MusicSelector from '@/components/MusicSelector';
import logo from '@/assets/logo.png';

const CreatePost = () => {
  const { user, loading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [selectedMusic, setSelectedMusic] = useState<any>(null);
  const [musicSelectorOpen, setMusicSelectorOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedAudio = e.target.files?.[0];
    if (selectedAudio) {
      setAudioFile(selectedAudio);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAudioPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedAudio);
      toast({
        title: 'Audio added',
        description: selectedAudio.name
      });
    }
  };

  const filters = [
    'none', 'grayscale', 'sepia', 'brightness', 'contrast', 'vintage', 'cool'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !user) {
      toast({
        title: 'Missing file',
        description: 'Please select an image or video',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      // Upload to Cloudinary
      const mediaUrl = await uploadToCloudinary(file);
      let audioUrl = '';
      
      if (audioFile) {
        audioUrl = await uploadToCloudinary(audioFile);
      }
      
      // Create post in Firestore
      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        caption,
        mediaUrl,
        audioUrl,
        filter: selectedFilter,
        mediaType: file.type.startsWith('video') ? 'video' : 'image',
        likes: [],
        comments: [],
        createdAt: new Date().toISOString()
      });

      toast({
        title: 'Post created!',
        description: 'Your post has been shared'
      });
      
      navigate('/home');
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not create post. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

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
          <h1 className="text-xl font-bold text-foreground">Create Post</h1>
        </div>
      </header>
      <Navbar />
      <main className="pt-14 pb-8 min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-card border border-border rounded-lg p-8 card-shadow animate-scale-in">
            <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <Label>Media</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {preview ? (
                      <div className="relative">
                        {file?.type.startsWith('video') ? (
                          <video src={preview} className="max-h-96 mx-auto rounded-lg" controls />
                        ) : (
                          <img src={preview} alt="Preview" className="max-h-96 mx-auto rounded-lg" />
                        )}
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => {
                            setFile(null);
                            setPreview('');
                          }}
                        >
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-center gap-4">
                          <Image className="h-12 w-12 text-muted-foreground" />
                          <Video className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold">Upload Photo or Video</p>
                          <p className="text-sm text-muted-foreground">Click to browse</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  rows={4}
                />
              </div>

              {/* Music Selection */}
              {file && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Add Music
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setMusicSelectorOpen(true)}
                  >
                    <Music className="h-4 w-4 mr-2" />
                    {selectedMusic ? (
                      <span className="flex-1 text-left">
                        <span className="font-semibold">{selectedMusic.name}</span>
                        <span className="text-muted-foreground ml-2">• {selectedMusic.artist}</span>
                      </span>
                    ) : (
                      'Choose a song'
                    )}
                  </Button>
                </div>
              )}

              {/* Effects/Filters */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Effects & Filters
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setSelectedFilter(filter)}
                      className={`p-3 border rounded-lg text-sm capitalize transition-colors ${
                        selectedFilter === filter
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={!file || uploading}
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Uploading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Share Post
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>

      <MusicSelector
        open={musicSelectorOpen}
        onOpenChange={setMusicSelectorOpen}
        onSelectMusic={setSelectedMusic}
        selectedMusic={selectedMusic}
      />
    </>
  );
};

export default CreatePost;
