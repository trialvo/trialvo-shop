"use client";

import { RadioGroup } from "@/components/ui/radio-group";
import React from "react";
import PhoneSelectableCard from "./PhoneSelectableCard";
import type { PhoneCardProps } from "./types";

type Props = {
  items: PhoneCardProps[];
  value: string;
  onChange: (id: string) => void;
  onVerify?: (id: string | number, Phone?: string) => void;
  onDelete?: (id: string | number) => void;
  onMakeDefault?: (id: string | number) => void;
};

const PhoneListPanel: React.FC<Props> = ({
  items,
  value,
  onChange,
  onVerify,
  onDelete,
  onMakeDefault,
}) => {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="space-y-4">
      {items.map((item) => {
        const idStr = String(item.id);

        return (
          <PhoneSelectableCard
            key={item.id}
            item={item}
            checked={value === idStr}
            onDelete={onDelete}
            onVerify={onVerify}
            onMakeDefault={onMakeDefault}
          />
        );
      })}
    </RadioGroup>
  );
};

export default PhoneListPanel;
