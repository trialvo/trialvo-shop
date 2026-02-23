import React from 'react';
import { Heart } from 'lucide-react';

const WishlistPage: React.FC = () => {
 return (
  <div className="space-y-5">
   <div>
    <h1 className="text-xl font-bold text-foreground">Wishlist</h1>
    <p className="text-sm text-muted-foreground mt-0.5">Your saved products</p>
   </div>
   <div className="text-center py-16 rounded-2xl border border-border bg-card">
    <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
    <p className="text-muted-foreground font-medium">Your wishlist is empty</p>
    <p className="text-xs text-muted-foreground mt-1">Save products you love for later</p>
   </div>
  </div>
 );
};

export default WishlistPage;
