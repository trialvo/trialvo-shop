"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProductFilterSidebar } from "./ProductFilterSidebar";
import type { FilterState } from "./ProductFilterSidebar";

interface MobileFilterDrawerProps extends FilterState {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileFilterDrawer({ isOpen, onClose, ...filterProps }: MobileFilterDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 lg:hidden"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background z-50 overflow-y-auto p-6 shadow-xl lg:hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button onClick={onClose} aria-label="Close filters">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ProductFilterSidebar {...filterProps} showHeader={false} />
            <Button className="w-full mt-6" onClick={onClose}>
              Apply Filters
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
