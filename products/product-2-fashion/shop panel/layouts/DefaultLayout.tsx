import Footer from "@/components/footer/Footer";
import Header from "@/components/header/Header";
import HeaderAddonLinks from "@/components/header/HeaderAddonLinks";
import MobileHeader from "@/components/header/MobileHeader";
import BottomNav from "@/components/navigation/bottom-nav/BottomNav";
import { Suspense } from "react";

const DefaultLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <Suspense>
            <div suppressHydrationWarning>
                <div className="hidden min-[500px]:block min-[500px]:sticky min-[500px]:top-0 min-[500px]:z-50">
                    <Header />
                </div>

                <div className="block min-[500px]:hidden">
                    <MobileHeader />
                </div>
                <main
                >{children}
                </main>
                <HeaderAddonLinks />
                <Footer />
                <div className="block min-[500px]:hidden">
                    <BottomNav />
                </div>
            </div>
        </Suspense >
    );
};

export default DefaultLayout;