"use client";

import { useState, useRef, useCallback, useEffect, type FC } from "react";
import { Camera, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { ModalShell } from "@/components/shared/ModalShell";

interface AvatarUploadProps {
  currentAvatar?: string;
  userName?: string;
}

interface AvatarPreviewContentProps {
  preview: string | null;
  onClose: () => void;
  onSave: () => void;
}

interface AvatarPreviewModalProps extends AvatarPreviewContentProps {
  isOpen: boolean;
}

const AvatarPreviewModalContent: FC<AvatarPreviewContentProps> = ({ preview, onClose, onSave }) => {
  if (!preview) return null;

  return (
    <>
      <h3 className="font-display text-lg font-semibold text-foreground mb-4 text-center">Preview Photo</h3>
      <div className="flex justify-center mb-5">
        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-border shadow-lg">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center mb-5">This is how your profile photo will look</p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 border border-border text-xs tracking-[0.15em] uppercase font-medium text-foreground hover:bg-secondary transition-colors rounded"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="flex-1 py-2.5 bg-primary text-primary-foreground text-xs tracking-[0.15em] uppercase font-medium hover:bg-accent hover:text-accent-foreground transition-colors rounded flex items-center justify-center gap-1.5"
        >
          <ImageIcon size={13} /> Save Photo
        </button>
      </div>
    </>
  );
};

const AvatarPreviewModal: FC<AvatarPreviewModalProps> = ({ isOpen, onClose, preview, onSave }) => (
  <ModalShell
    isOpen={isOpen}
    onClose={onClose}
    containerClassName="fixed inset-0 z-[70] flex items-center justify-center p-4"
    panelClassName="relative bg-card border border-border rounded-lg p-6 max-w-sm w-full shadow-xl"
  >
    <AvatarPreviewModalContent preview={preview} onClose={onClose} onSave={onSave} />
  </ModalShell>
);

const AvatarUpload = ({ currentAvatar, userName }: AvatarUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(currentAvatar ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setAvatarPreview(currentAvatar ?? "");
  }, [currentAvatar]);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setShowModal(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleSave = () => {
    if (preview) {
      setAvatarPreview(preview);
      toast.success("Profile photo updated!");
      setShowModal(false);
    }
  };

  const handleRemove = () => {
    setAvatarPreview("");
    toast.success("Profile photo removed");
  };

  return (
    <>
      <div className="flex items-center gap-5">
        {/* Avatar preview */}
        <div className="relative group">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border">
            {avatarPreview ? (
              <img src={avatarPreview} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-display font-semibold">
                {userName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-foreground/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          >
            <Camera size={20} className="text-background" />
          </button>
        </div>

        {/* Upload area */}
        <div className="flex-1">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/40 hover:bg-secondary/30"
            }`}
          >
            <Upload size={18} className={`mx-auto mb-1.5 ${dragOver ? "text-accent" : "text-muted-foreground"}`} />
            <p className="text-xs text-foreground font-medium">
              {dragOver ? "Drop image here" : "Click or drag to upload"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG or WebP · Max 2MB</p>
          </div>
          {avatarPreview && (
            <button
              onClick={handleRemove}
              className="mt-2 text-[10px] tracking-[0.1em] uppercase text-destructive hover:text-destructive/80 transition-colors"
            >
              Remove Photo
            </button>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <AvatarPreviewModal
        isOpen={showModal && Boolean(preview)}
        onClose={() => setShowModal(false)}
        preview={preview}
        onSave={handleSave}
      />
    </>
  );
};

export default AvatarUpload;
