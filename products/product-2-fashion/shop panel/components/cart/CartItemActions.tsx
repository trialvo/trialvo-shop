import { cn } from "@/lib/utils"
import React from "react"
import { FiEdit, FiTrash2 } from "react-icons/fi"

type Props = {
  onEdit?: () => void
  onRemove?: () => void
  isActive?: boolean
}

const CartItemActions: React.FC<Props> = ({
  onEdit,
  onRemove,
  isActive = false
}) => {
  return (
    <div className="flex items-center gap-1">
      {
        !isActive && (
          <button onClick={onEdit} className={
            cn
              (
                "grid h-8 w-8 place-items-center cursor-pointer transition-colors",
                "text-black hover:bg-black/5"
              )
          }>
            <FiEdit className="h-4 w-4 text-muted-foreground" />
          </button>
        )
      }
      <button onClick={onRemove} className={
        cn(
          "grid h-8 w-8 place-items-center cursor-pointer transition-colors",
          "text-black hover:bg-black/5"
        )
      }>
        <FiTrash2 className="h-4 w-4 text-[#FF383C]" />
      </button>
    </div>
  )
}

export default CartItemActions
