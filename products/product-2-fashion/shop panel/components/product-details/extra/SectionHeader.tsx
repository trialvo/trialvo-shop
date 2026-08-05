import * as React from "react";

type Props = {
  title: string;
};

const SectionHeader: React.FC<Props> = ({ title }) => {
  return (
    <div className="py-2.5 border-b border-[#CACACA]">
      <h3 className="text-base font-medium text-black">{title}</h3>
    </div>
  );
};

export default SectionHeader;
