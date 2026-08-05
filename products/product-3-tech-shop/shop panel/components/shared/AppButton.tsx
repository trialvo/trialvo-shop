"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * App-wide button — text color always contrasts with fill.
 * Use variant: primary | accent | destructive | secondary | outline | ghost | link | onDark
 */
export type AppButtonProps = ButtonProps;

export const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ variant = "primary", type = "button", ...props }, ref) => {
    return <Button ref={ref} variant={variant} type={type} {...props} />;
  },
);
AppButton.displayName = "AppButton";

export default AppButton;
