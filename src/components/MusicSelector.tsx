import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Music, Play, Check } from 'lucide-react';

interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: string;
}

interface MusicSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMusic: (track: MusicTrack | null) => void;
  selectedMusic: MusicTrack | null;
}

const MusicSelector = ({ open, onOpenChange, onSelectMusic, selectedMusic }: MusicSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Sample music tracks (in a real app, this would come from an API)
  const musicTracks: MusicTrack[] = [
    { id: '1', name: 'Summer Vibes', artist: 'DJ Cool', duration: '3:45' },
    { id: '2', name: 'Chill Beats', artist: 'Lo-Fi Master', duration: '4:20' },
    { id: '3', name: 'Dance Party', artist: 'Party Mix', duration: '3:30' },
    { id: '4', name: 'Sunset Dreams', artist: 'Ambient Soul', duration: '5:15' },
    { id: '5', name: 'Urban Flow', artist: 'Hip Hop King', duration: '3:55' },
    { id: '6', name: 'Electronic Pulse', artist: 'EDM Producer', duration: '4:10' },
    { id: '7', name: 'Acoustic Love', artist: 'Guitar Hero', duration: '3:25' },
    { id: '8', name: 'Night Drive', artist: 'Synthwave Star', duration: '4:45' },
  ];

  const filteredTracks = musicTracks.filter(track =>
    track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Add Music
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search songs or artists"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {filteredTracks.map((track) => (
                <div
                  key={track.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedMusic?.id === track.id
                      ? 'bg-primary/10 border border-primary'
                      : 'hover:bg-accent border border-transparent'
                  }`}
                  onClick={() => onSelectMusic(track)}
                >
                  <div className="h-12 w-12 rounded bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                    <Music className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{track.name}</p>
                    <p className="text-sm text-muted-foreground">{track.artist}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{track.duration}</span>
                    {selectedMusic?.id === track.id ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : (
                      <Play className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {selectedMusic && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onSelectMusic(null)}
            >
              Remove Music
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MusicSelector;
