"use client";

import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";

type PasswordInputProps = {
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  error?: string;
  disabled?: boolean;
};

const PasswordInput: React.FC<PasswordInputProps> = ({
  id = "password",
  name = "password",
  placeholder = "Enter password",
  value,
  onChange,
  onBlur,
  error,
  disabled,
}) => {
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={!!error}
          className={`h-11 rounded-[4px] pr-12 text-[14px] shadow-none ${
            error
              ? "border-destructive focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive/25"
              : "border-border focus-visible:border-foreground focus-visible:ring-1 focus-visible:ring-foreground/20"
          }`}
        />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          disabled={disabled}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
    </div>
  );
};

export default PasswordInput;
