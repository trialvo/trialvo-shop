import ImageWithFallback from "@/components/common/ImageWithFallback";
import Link from "next/link";
import React from "react";

type HeaderLogoProps = {
  href?: string;
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  preload?: boolean;
  className?: string;
};

const HeaderLogo: React.FC<HeaderLogoProps> = ({
  href = "/",
  src,
  alt = "Logo",
  width = 120,
  height = 40,
  preload = true,
  className,
}) => {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 focus:outline-none"
      aria-label="Go to homepage"
    >
      <ImageWithFallback
        src={src}
        alt={alt}
        width={width}
        height={height}
        preload={preload}
        className={`h-auto w-auto object-contain ${className}`}
      />
    </Link>
  );
};

export default HeaderLogo;
