import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/section/Eyebrow";

export type SectionIntroProps = {
  /** id referenced by the parent Section's aria-labelledby */
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  tone?: "default" | "inverted";
  /** Heading level; sections nested under another heading may need h3 */
  level?: 2 | 3;
  action?: ReactNode;
  className?: string;
};

/**
 * The single heading treatment used by every section. Centralising the type
 * scale here is what makes the pages feel like one product rather than a
 * stack of separately-built blocks.
 */
export function SectionIntro({
  id,
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "default",
  level = 2,
  action,
  className,
}: Readonly<SectionIntroProps>) {
  const centered = align === "center";
  const inverted = tone === "inverted";
  const Heading = level === 2 ? "h2" : "h3";

  return (
    <div
      className={cn(
        "mb-10 md:mb-14",
        centered
          ? "flex flex-col items-center text-center"
          : "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn(centered ? "max-w-2xl" : "max-w-2xl")}>
        {eyebrow ? (
          <Eyebrow tone={tone} className="mb-4">
            {eyebrow}
          </Eyebrow>
        ) : null}

        <Heading
          id={id}
          className={cn(
            "font-display text-[1.75rem] font-bold leading-[1.16] tracking-tight sm:text-[2rem] md:text-[2.375rem]",
            inverted ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {title}
        </Heading>

        {lead ? (
          <p
            className={cn(
              "mt-4 text-[15px] leading-7 md:text-base md:leading-[1.75]",
              inverted ? "text-primary-foreground/75" : "text-muted-foreground",
            )}
          >
            {lead}
          </p>
        ) : null}
      </div>

      {action ? (
        <div className={cn("shrink-0", centered && "mt-8")}>{action}</div>
      ) : null}
    </div>
  );
}

export default SectionIntro;
