import ImageWithFallback from "@/components/common/ImageWithFallback";

export default function NotFoundView() {
    return (
        <div className="relative min-h-dvh overflow-hidden bg-white">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-20 left-1/2 h-[360px] w-[1440px] -translate-x-1/2"
            >
                <ImageWithFallback src="/Shape.svg" fill preload alt="not-found image" className={`h-full w-full object-cover`} />
            </div>

            <div className="relative mx-auto flex min-h-dvh max-w-275 flex-col items-center px-4 pt-20">
                <h1 className="text-center text-4xl font-medium tracking-tight text-black">
                    Page Not Found
                </h1>

                <p className="mt-2 text-center text-sm text-[#999999]">
                    Oops! 😖 The requested URL was not found on this server.
                </p>

                <div className="mt-10 w-full h-[220px] max-w-[860px] relative">
                    <ImageWithFallback src="/not-found.svg" fill preload alt="not-found image" className={`h-auto w-auto object-contain`} />
                </div>
            </div>
        </div>
    );
}
