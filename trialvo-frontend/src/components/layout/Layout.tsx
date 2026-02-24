import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import SocialProofPopup from '@/components/SocialProofPopup';
import ScrollToTopButton from '@/components/ScrollToTopButton';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-16 md:pt-20">{children}</main>
      <Footer />

      {/* Global Widgets */}
      <WhatsAppWidget />
      <SocialProofPopup />
      <ScrollToTopButton />
    </div>
  );
};

export default Layout;
