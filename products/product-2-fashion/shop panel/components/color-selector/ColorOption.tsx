import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import React from "react"

type Props = {
  value: string
  isSelected: boolean
  isUnavailable?: boolean
  onClick: () => void
}

const ColorOption: React.FC<Props> = ({
  value,
  isSelected,
  isUnavailable = false,
  onClick,
}) => {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      title={isUnavailable ? "Not available for selected size" : undefined}
      className={cn(
        "relative px-2.75 py-2 rounded-none border text-sm font-medium transition-all duration-300",
        isSelected
          ? "bg-black text-white border-black hover:bg-black hover:text-white"
          : "bg-white text-black border-[#999999] hover:border-black",
        isUnavailable && !isSelected && "opacity-40",
      )}
    >
      {value}
      {isUnavailable && !isSelected && (
        <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="block h-[1px] w-[130%] -rotate-45 bg-[#999999]/70" />
          </span>
        </span>
      )}
    </Button>
  )
}

export default ColorOption
