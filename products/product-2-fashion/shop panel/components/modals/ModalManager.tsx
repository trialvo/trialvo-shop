"use client";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import React from "react";
import { MODAL_REGISTRY } from "./ModalRegistry";

const ModalManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const stack = useAppSelector((s) => s.modalManager.stack);

  if (!stack.length) return null;

  return (
    <>
      {stack.map((item, idx) => {
        const Entry = MODAL_REGISTRY[item.key];
        const isTop = idx === stack.length - 1;
        const zIndex = 100 + idx * 10;

        return (
          <Entry
            key={item.id}
            modalId={item.id}
            isTop={isTop}
            zIndex={zIndex}
            payload={item.payload}
          />
        );
      })}
    </>
  );
};

export default ModalManager;
