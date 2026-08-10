import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShopConfigProvider } from "@/context/ShopConfigContext";
import { OrderProvider } from "@/context/OrderContext";

export default function MainLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
  <ShopConfigProvider>
   <OrderProvider>
    {/* Announcement Bar */}
    <div className="announcement-bar">
     <span className="mr-1.5">🎉</span>
     <span>
      Free Delivery on All Orders —{" "}
      <span className="font-semibold text-pink-400">Shop Now!</span>
     </span>
    </div>
    <Navbar />
    <main className="min-h-[60vh]">{children}</main>
    <Footer />
   </OrderProvider>
  </ShopConfigProvider>
 );
}
