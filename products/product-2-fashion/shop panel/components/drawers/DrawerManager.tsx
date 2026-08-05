"use client";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { closeDrawerById } from "@/redux/slices/drawerManagerSlice";
import React from "react";
import { DRAWER_REGISTRY } from "./DrawerRegistry";

const DRAWER_EXIT_MS = 260;

const DrawerManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const stack = useAppSelector((s) => s.drawerManager.stack);

  const [closingIds, setClosingIds] = React.useState<Set<number>>(() => new Set());

  const timersRef = React.useRef<Map<number, number>>(new Map());

  const requestClose = React.useCallback(
    (id: number) => {
      setClosingIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      const timers = timersRef.current;
      if (timers.has(id)) return;

      const t = window.setTimeout(() => {
        dispatch(closeDrawerById(id));
        timers.delete(id);

        setClosingIds((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, DRAWER_EXIT_MS);

      timers.set(id, t);
    },
    [dispatch],
  );

  React.useEffect(() => {
    const timers = timersRef.current;

    for (const [id, t] of timers.entries()) {
      const stillExists = stack.some((d) => d.id === id);
      if (!stillExists) {
        window.clearTimeout(t);
        timers.delete(id);
        setClosingIds((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }
  }, [stack]);

  React.useEffect(() => {
    return () => {
      const timers = timersRef.current;
      for (const t of timers.values()) window.clearTimeout(t);
      timers.clear();
    };
  }, []);

  if (!stack.length) return null;

  return (
    <>
      {stack.map((item, idx) => {
        const Entry = DRAWER_REGISTRY[item.key];
        const isTop = idx === stack.length - 1;
        // const zIndex = 60 + idx * 10;
        const zIndex = 50;


        const isClosing = closingIds.has(item.id);

        return (
          <Entry
            key={item.id}
            drawerId={item.id}
            isTop={isTop}
            zIndex={zIndex}
            payload={item.payload}
            open={!isClosing}
            onOpenChange={(v) => {
              if (!v) requestClose(item.id);
            }}
          />
        );
      })}
    </>
  );
};

export default DrawerManager;
