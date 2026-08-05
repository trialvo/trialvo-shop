"use client";

import { X, Zap } from 'lucide-react';
import { useState } from 'react';

const AnnouncementBar = () => {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="gradient-accent text-accent-foreground py-1.5 px-4 text-center text-xs font-medium relative">
      <div className="container flex items-center justify-center gap-2">
        <Zap className="h-4 w-4" />
        <span>🔥 Flash Sale! Up to 40% OFF on all gadgets — Limited Time Only!</span>
        <Zap className="h-4 w-4" />
      </div>
      <button onClick={() => setVisible(false)} className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default AnnouncementBar;
