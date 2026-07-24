import React, { useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useUploadMedia, type MediaKind } from '@/hooks/useMedia';

interface ImageUploadButtonProps {
  onUploaded: (url: string) => void;
  kind?: MediaKind;
  label?: string;
  className?: string;
  ownerType?: 'product' | 'category';
  ownerId?: string;
}

// Small reusable control: pick an image → upload → return the hosted URL.
// Lets admins upload files instead of hunting for external image URLs.
const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  onUploaded,
  kind = 'product_image',
  label = 'Upload',
  className,
  ownerType,
  ownerId,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const upload = useUploadMedia();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so selecting the same file again still fires onChange.
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Only image files are allowed', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Image must be under 10 MB', variant: 'destructive' });
      return;
    }
    try {
      const res = await upload.mutateAsync({ file, kind, ownerType, ownerId });
      onUploaded(res.url);
      toast({ title: 'Image uploaded' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className || 'h-9 border-border text-foreground hover:bg-muted'}
        onClick={() => inputRef.current?.click()}
        disabled={upload.isPending}
      >
        {upload.isPending ? (
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5 mr-1.5" />
        )}
        {label}
      </Button>
    </>
  );
};

export default ImageUploadButton;
