import Footer from "@/components/footer/Footer";
import HeaderAddonLinks from "@/components/header/HeaderAddonLinks";
import BottomNav from "@/components/navigation/bottom-nav/BottomNav";
import ScrollToTopButton from "@/components/common/ScrollToTopButton";
import HeaderScrollChrome from "@/layouts/HeaderScrollChrome";
import { Suspense, type ReactNode } from "react";

const DefaultLayout = ({ children }: { children: ReactNode }) => {
    return (
        <Suspense>
            <div suppressHydrationWarning className="flex min-h-dvh w-full min-w-0 flex-col max-[500px]:max-w-full max-[500px]:overflow-x-clip">
                <HeaderScrollChrome />
                <main className="flex-1 max-[500px]:min-w-0 max-[500px]:max-w-full max-[500px]:overflow-x-clip">
                    {children}
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
