export type MenuNode = {
  label: string;
  href?: string;
  children?: MenuNode[];
};

export type MenuLevel = {
  title: string;
  nodes: MenuNode[];
};
