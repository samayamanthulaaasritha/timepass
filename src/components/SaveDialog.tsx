import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, Bookmark } from 'lucide-react';

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaUrl: string;
  postId: string;
  onSaveToAccount: () => void;
}

const SaveDialog = ({ open, onOpenChange, mediaUrl, postId, onSaveToAccount }: SaveDialogProps) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timepass-${postId}.${blob.type.split('/')[1]}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      onOpenChange(false);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save Post</AlertDialogTitle>
          <AlertDialogDescription>
            Where would you like to save this post?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Direct Download
          </AlertDialogAction>
          <AlertDialogAction 
            onClick={() => {
              onSaveToAccount();
              onOpenChange(false);
            }}
            className="flex items-center gap-2"
          >
            <Bookmark className="h-4 w-4" />
            Timepass Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SaveDialog;
