import React from "react";

type PlayButtonProps = {
  className?: string;
};

const PlayButton: React.FC<PlayButtonProps> = ({ className = "" }) => {
  return (
    <div
      className={[
        "grid place-items-center",
        "h-10 w-10 sm:h-16 sm:w-16 rounded-full",
        "bg-black",
        "ring-1 ring-white/70 hover:ring-white transition-colors duration-200",
        className,
      ].join(" ")}
    >
      <div className="ml-1 h-0 w-0 border-y-[9px] border-y-transparent border-l-14 border-l-white" />
    </div>
  );
};

export default PlayButton;
