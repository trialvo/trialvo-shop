"use client";

import type { ReactElement } from "react";
import { Menu } from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";
import HeaderSearch from "@/components/layout/header/HeaderSearch";
import HeaderActions from "@/components/layout/header/HeaderActions";
import { HeaderBrand } from "@/components/layout/header/HeaderBrand";
import { cn } from "@/lib/utils";

type HeaderMainBarProps = Readonly<{
  onOpenMobileMenu: () => void;
}>;

type MenuButtonProps = Readonly<{
  onOpenMobileMenu: () => void;
  className?: string;
}>;

function HeaderMenuButton({
  onOpenMobileMenu,
  className,
}: MenuButtonProps): ReactElement {
  return (
    <AppButton
      type="button"
      variant="ghost"
      size="icon"
      className={cn("shrink-0", className)}
      aria-label="Open categories menu"
      onClick={onOpenMobileMenu}
    >
      <Menu className="h-5 w-5" aria-hidden />
    </AppButton>
  );
}

/**
 * Phone (`< 768px`): menu + centered brand + actions (right); search full-width below.
 */
function HeaderMainBarPhone({
  onOpenMobileMenu,
}: HeaderMainBarProps): ReactElement {
  return (
    <div className="md:hidden">
      <div className="relative flex min-h-11 w-full items-center">
        <HeaderMenuButton
          onOpenMobileMenu={onOpenMobileMenu}
          className="relative z-10"
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto">
            <HeaderBrand placement="center" />
          </div>
        </div>

        <HeaderActions
          density="phone"
          className="relative z-10 ml-auto shrink-0"
        />
      </div>

      <div className="mt-2">
        <HeaderSearch
          placeholder="Search gadgets…"
          inputClassName="w-full pl-10 pr-10 py-2.5 rounded-sm border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>
    </div>
  );
}

/**
 * Shared 3-column shell: left cluster | centered search | right actions.
 * Equal side tracks keep the search optically centered in the header.
 */
type HeaderBarShellProps = Readonly<{
  left: ReactElement;
  actions: ReactElement;
  className?: string;
  searchMaxClassName?: string;
}>;

function HeaderBarShell({
  left,
  actions,
  className,
  searchMaxClassName = "max-w-xl",
}: HeaderBarShellProps): ReactElement {
  return (
    <div
      className={cn(
        "w-full grid-cols-[minmax(0,1fr)_minmax(0,36rem)_minmax(0,1fr)] items-center gap-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-center justify-self-start gap-2 md:gap-3">
        {left}
      </div>

      <div
        className={cn(
          "w-full min-w-0 justify-self-center",
          searchMaxClassName,
        )}
      >
        <HeaderSearch />
      </div>

      <div className="flex items-center justify-self-end">{actions}</div>
    </div>
  );
}

/**
 * Tablet (`768–1023px`): menu + brand left, search center, actions right.
 */
function HeaderMainBarTablet({
  onOpenMobileMenu,
}: HeaderMainBarProps): ReactElement {
  return (
    <HeaderBarShell
      className="hidden md:grid lg:hidden"
      searchMaxClassName="max-w-md"
      left={
        <>
          <HeaderMenuButton onOpenMobileMenu={onOpenMobileMenu} />
          <HeaderBrand placement="start" className="shrink-0" />
        </>
      }
      actions={<HeaderActions density="tablet" className="shrink-0" />}
    />
  );
}

/**
 * Laptop (`≥ 1024px`): brand left, search center, actions right.
 */
function HeaderMainBarLaptop(): ReactElement {
  return (
    <HeaderBarShell
      className="hidden lg:grid xl:gap-4"
      searchMaxClassName="max-w-xl"
      left={<HeaderBrand placement="start" className="shrink-0" />}
      actions={<HeaderActions density="laptop" className="shrink-0" />}
    />
  );
}

/**
 * Sticky header primary row — search is centered on tablet/laptop.
 */
export function HeaderMainBar({
  onOpenMobileMenu,
}: HeaderMainBarProps): ReactElement {
  return (
    <div className="container py-2.5 md:py-2.5 lg:py-3">
      <HeaderMainBarPhone onOpenMobileMenu={onOpenMobileMenu} />
      <HeaderMainBarTablet onOpenMobileMenu={onOpenMobileMenu} />
      <HeaderMainBarLaptop />
    </div>
  );
}

export default HeaderMainBar;
