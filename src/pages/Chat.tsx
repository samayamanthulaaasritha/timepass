import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Heart, Image as ImageIcon, Smile } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: any;
  read: boolean;
}

interface ChatUser {
  userId: string;
  username: string;
  profileImageUrl?: string;
}

const Chat = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch chat user details
  useEffect(() => {
    const fetchChatUser = async () => {
      if (!userId) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setChatUser({
            userId: userDoc.id,
            ...userDoc.data()
          } as ChatUser);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchChatUser();
  }, [userId]);

  // Subscribe to messages
  useEffect(() => {
    if (!user || !userId) return;

    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.uid),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message))
        .filter(msg => 
          (msg.senderId === user.uid && msg.receiverId === userId) ||
          (msg.senderId === userId && msg.receiverId === user.uid)
        );
      
      setMessages(messagesData);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [user, userId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !userId) return;

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        receiverId: userId,
        text: newMessage,
        createdAt: serverTimestamp(),
        read: false,
        participants: [user.uid, userId]
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/90 border-b border-border shadow-soft">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/messages')}
            className="rounded-xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {chatUser && (
            <div 
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() => navigate(`/profile/${chatUser.userId}`)}
            >
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage src={chatUser.profileImageUrl} />
                <AvatarFallback className="bg-gradient-primary text-white">
                  {chatUser.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">{chatUser.username}</p>
                <p className="text-xs text-muted-foreground">Active now</p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 pt-16 pb-20 overflow-y-auto scrollbar-custom">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {loadingMessages ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="h-20 w-20 mx-auto rounded-full gradient-primary flex items-center justify-center shadow-glow">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold">Start a conversation</p>
                <p className="text-muted-foreground">
                  Send a message to start chatting with {chatUser?.username}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isOwn = message.senderId === user.uid;
                const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;

                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 animate-fade-in ${
                      isOwn ? 'flex-row-reverse' : 'flex-row'
                    }`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {showAvatar && !isOwn && (
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={chatUser?.profileImageUrl} />
                        <AvatarFallback className="bg-muted text-xs">
                          {chatUser?.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {!showAvatar && !isOwn && <div className="w-7" />}

                    <div
                      className={`max-w-[70%] rounded-3xl px-4 py-2 ${
                        isOwn
                          ? 'gradient-primary text-white shadow-glow'
                          : 'bg-accent text-foreground'
                      }`}
                    >
                      <p className="text-sm break-words">{message.text}</p>
                    </div>

                    {isOwn && <div className="w-7" />}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Message Input */}
      <footer className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-background/90 border-t border-border shadow-large">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl shrink-0">
              <ImageIcon className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${chatUser?.username || ''}...`}
                className="rounded-full border-2 border-border pr-12 focus:border-primary transition-colors"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="icon"
              className={`rounded-full shrink-0 transition-all ${
                newMessage.trim()
                  ? 'gradient-primary shadow-glow'
                  : 'bg-muted'
              }`}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Chat;
