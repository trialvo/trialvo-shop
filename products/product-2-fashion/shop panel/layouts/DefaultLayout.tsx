import Footer from "@/components/footer/Footer";
import HeaderAddonLinks from "@/components/header/HeaderAddonLinks";
import BottomNav from "@/components/navigation/bottom-nav/BottomNav";
import ScrollToTopButton from "@/components/common/ScrollToTopButton";
import HeaderScrollChrome from "@/layouts/HeaderScrollChrome";
import { Suspense, type ReactNode } from "react";

const DefaultLayout = ({ children }: { children: ReactNode }) => {
    return (
        <Suspense>
            <div suppressHydrationWarning className="w-full min-w-0">
                <HeaderScrollChrome />
                <main
                >{children}
                </main>
                <HeaderAddonLinks />
                <Footer />
                <div className="block min-[768px]:hidden">
                    <BottomNav />
                </div>
                <ScrollToTopButton />
            </div>
        </Suspense >
    );
};

export default DefaultLayout;
