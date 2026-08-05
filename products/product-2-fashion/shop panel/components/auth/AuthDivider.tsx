import { Separator } from "@/components/ui/separator";
import React from "react";

type AuthDividerProps = {
  text?: string;
};

const AuthDivider: React.FC<AuthDividerProps> = ({
  text = "Or continue with",
}) => {
  return (
    <div className="my-6 flex items-center gap-4">
      <Separator className="flex-1 bg-gray-300" />
      <span className="text-sm text-gray-500">{text}</span>
      <Separator className="flex-1 bg-gray-300" />
    </div>
  );
};

export default AuthDivider;
