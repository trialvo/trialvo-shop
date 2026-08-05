"use client";

import { Skeleton } from "@/components/ui/skeleton";
import ReusableVideoPlayer from "@/components/video/ReusableVideoPlayer";
import { useVideo } from "@/hooks/useVideo";
import React from "react";

const VideoSection = () => {
    const { videos, videosLoading } = useVideo({ limit: 5, offset: 0 });
    const [videoUrl, setVideoUrl] = React.useState("");
    const [posterUrl, setPosterUrl] = React.useState("/video-banner.png");
    const [isPlaying, setIsPlaying] = React.useState(false);
    const wasPlayingRef = React.useRef(false);
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        setIsPlaying(false);
    }, [videoUrl]);

    React.useEffect(() => {
        if (!videos.length) return;
        const idx = Math.floor(Math.random() * videos.length);
        const selectedVideo = videos[idx];
        setVideoUrl(selectedVideo?.video_url ?? "");
        // Set poster to thumb if available, otherwise use default
        setPosterUrl(selectedVideo?.thumb ?? "/video-banner.png");
    }, [videos]);

    React.useEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        if (typeof IntersectionObserver === "undefined") return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    wasPlayingRef.current = isPlaying;
                    setIsPlaying(false);
                    return;
                }
                if (wasPlayingRef.current) setIsPlaying(true);
            },
            { threshold: 0.4 },
        );

        observer.observe(node);

        return () => {
            observer.disconnect();
        };
    }, [isPlaying]);

    if (videosLoading) {
        return (
            <section className="container mx-auto mb-3 md:mb-10">
                <div className="relative w-full">
                    <Skeleton className="h-50 w-full rounded-none border border-[#d9d9d9] sm:h-auto aspect-16/8" />
                </div>
            </section>
        );
    }

    if (!videoUrl) return null;

    return (
        <section ref={containerRef} className="container mx-auto mb-3 md:mb-10">
            <ReusableVideoPlayer
                url={videoUrl}
                poster={posterUrl}
                controls
                className="h-50 sm:h-auto"
                playing={isPlaying}
                onClickPreview={() => setIsPlaying(true)}
                onPlay={() => setIsPlaying(true)}
            />
        </section>
    )
}

export default VideoSection
