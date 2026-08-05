"use client";

import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import {
  useEffect,
  useState,
  type ComponentType,
  type FC,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export interface ModalLifecycleProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ModalShellProps extends ModalLifecycleProps {
  children: ReactNode;
  containerClassName?: string;
  backdropClassName?: string;
  panelClassName?: string;
  panelOpenClassName?: string;
  panelClosedClassName?: string;
  closeButtonClassName?: string;
  closeButtonAriaLabel?: string;
  closeButtonSize?: number;
  closeOnBackdrop?: boolean;
  closeDurationMs?: number;
  showCloseButton?: boolean;
  lockBodyScroll?: boolean;
  ariaLabel?: string;
}

type ModalShellOptions = Omit<ModalShellProps, "children" | "isOpen" | "onClose">;

const DEFAULT_CLOSE_DURATION = 240;

export const ModalShell: FC<ModalShellProps> = ({
  isOpen,
  onClose,
  children,
  containerClassName = "fixed inset-0 z-[60] flex items-center justify-center p-4",
  backdropClassName = "absolute inset-0 bg-foreground/50 backdrop-blur-sm",
  panelClassName = "relative bg-card border border-border rounded-lg shadow-xl",
  panelOpenClassName = "opacity-100 translate-y-0 scale-100",
  panelClosedClassName = "opacity-0 translate-y-4 scale-95",
  closeButtonClassName = "absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 hover:rotate-90 active:scale-90",
  closeButtonAriaLabel = "Close modal",
  closeButtonSize = 16,
  closeOnBackdrop = true,
  closeDurationMs = DEFAULT_CLOSE_DURATION,
  showCloseButton = true,
  lockBodyScroll = true,
  ariaLabel,
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  useBodyScrollLock(shouldRender && lockBodyScroll);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return;
    }

    setIsVisible(false);
    const timeout = window.setTimeout(() => setShouldRender(false), closeDurationMs);
    return () => window.clearTimeout(timeout);
  }, [isOpen, closeDurationMs]);

  useEffect(() => {
    if (!isOpen || !shouldRender) return;

    setIsVisible(false);
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setIsVisible(true));
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (!shouldRender) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, shouldRender]);

  if (!shouldRender || !mounted) return null;

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdrop || event.target !== event.currentTarget) return;
    onClose();
  };

  return createPortal(
    <div
      className={containerClassName}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      inert={!isOpen}
    >
      <div
        className={cn(
          backdropClassName,
          "transition-opacity duration-200 ease-out",
          isVisible ? "opacity-100" : "opacity-0",
        )}
        onClick={handleBackdropClick}
      />
      <div
        className={cn(
          panelClassName,
          "transition-all ease-out",
          isVisible ? panelOpenClassName : panelClosedClassName,
        )}
        style={{ transitionDuration: `${closeDurationMs}ms` }}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeButtonAriaLabel}
            className={closeButtonClassName}
          >
            <X size={closeButtonSize} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};

export function withModalShell<P extends ModalLifecycleProps>(
  WrappedComponent: ComponentType<P>,
  options: ModalShellOptions = {},
): FC<P> {
  const WrappedModalShell: FC<P> = (props) => (
    <ModalShell isOpen={props.isOpen} onClose={props.onClose} {...options}>
      <WrappedComponent {...props} />
    </ModalShell>
  );

  WrappedModalShell.displayName = `withModalShell(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
  return WrappedModalShell;
}
