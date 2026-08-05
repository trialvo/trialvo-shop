"use client";

import React from "react";
import dynamic from "next/dynamic";
import PlayButton from "./PlayButton";

const ReactPlayer = dynamic(() => import("react-player"), {
    ssr: false,
    loading: () => (
        <div className="absolute inset-0 grid place-items-center bg-black">
            <PlayButton />
        </div>
    ),
});

export type ReusableVideoPlayerProps = {
    /** Any react-player supported URL (YouTube, Vimeo, Facebook, mp4, etc.) */
    url: string;

    /** Optional poster/thumbnail image (works best for mp4; for YouTube it will still show as overlay) */
    poster?: string;

    /** Keep your screenshot look */
    className?: string;

    /** Show full control bar */
    controls?: boolean;

    /** Start muted */
    muted?: boolean;

    /** Autoplay after user interaction (react-player respects browser rules) */
    playing?: boolean;

    /** Loop */
    loop?: boolean;

    /** Called when user clicks play overlay */
    onPlay?: () => void;

    /** Called when user clicks the preview overlay */
    onClickPreview?: () => void;
};

const ReusableVideoPlayer: React.FC<ReusableVideoPlayerProps> = ({
    url,
    poster,
    className = "",
    controls = true,
    muted = false,
    playing = false,
    loop = false,
    onPlay,
    onClickPreview,
}) => {
    return (
        <section className={["w-full", className].join(" ")}>
            <div
                className="
          relative h-full w-full overflow-hidden
          border border-[#d9d9d9]
          bg-black
        "
            >
                <div className="relative aspect-16/8 w-full h-full">
                    <ReactPlayer
                        src={url}
                        width="100%"
                        height="100%"
                        controls={controls}
                        muted={muted}
                        playing={playing}
                        loop={loop}
                        onPlay={onPlay}
                        onClickPreview={onClickPreview}
                        light={poster ?? true}
                        playIcon={
                            <div className="absolute inset-0 grid place-items-center">
                                <PlayButton />
                            </div>
                        }
                    />
                </div>
            </div>
        </section>
    );
};

export default ReusableVideoPlayer;
