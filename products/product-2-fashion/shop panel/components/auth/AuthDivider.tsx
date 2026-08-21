import { Separator } from "@/components/ui/separator";
import React from "react";

type AuthDividerProps = {
  text?: string;
};

const AuthDivider: React.FC<AuthDividerProps> = ({
  text = "or",
}) => {
  return (
    <div className="my-5 flex items-center gap-3">
      <Separator className="flex-1 bg-border" />
      <span className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground">{text}</span>
      <Separator className="flex-1 bg-border" />
    </div>
  );
};

export default AuthDivider;
