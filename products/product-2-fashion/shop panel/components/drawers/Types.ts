export type DrawerEntryProps = {
  drawerId: number;
  isTop: boolean;
  zIndex?: number;
  payload?: unknown;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
