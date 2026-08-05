"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import { FaWhatsapp } from "react-icons/fa";

type WhatsAppFloatingButtonProps = {
    className?: string;
};

const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({
    className,
}) => {
    const href = `https://wa.me/+8801970680283`;

    return (
        <div className="fixed bottom-18 right-2 sm:bottom-10 sm:right-5 z-10 group">
            <div
                className={cn(
                    "pointer-events-none absolute right-11.5 sm:right-16 top-1/2 -translate-y-1/2",
                    "opacity-0 translate-x-2 scale-95",
                    "transition-all duration-300 ease-out",
                    "group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100",
                )}
            >
                <div className="relative rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black shadow-lg whitespace-nowrap">
                    Start chatting
                    <span className="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-white" />
                </div>
            </div>

            <Link
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                className={cn(
                    "flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg",
                    "transition-transform hover:scale-105 active:scale-95",
                    "animate-float",
                    className,
                )}
            >
                <FaWhatsapp className="h-6 w-6 sm:h-7 sm:w-7" />

                <div className="absolute inset-0 rounded-full border-3 border-[#25D366] animate-ping-slow opacity-60" />
            </Link>
        </div>
    );
};

export default WhatsAppFloatingButton;
