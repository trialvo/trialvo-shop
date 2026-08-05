import { cn } from "@/lib/utils"
import React from "react"
import { FiEdit } from "react-icons/fi"
import { Address } from "./types"

type Props = {
  address: Address
  selected: boolean
  onSelect: () => void
  onEdit?: () => void
}

const AddressCard: React.FC<Props> = ({
  address,
  selected,
  onSelect,
  onEdit,
}) => {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex cursor-pointer gap-4 border p-3 transition duration-300",
        selected ? "border-black" : "border-[#CBCBCB]"
      )}
    >
      <div className="mt-1">
        <div
          className={cn(
            "h-4.5 w-4.5 rounded-full border flex items-center justify-center",
            selected ? "border-black" : "border-gray-400"
          )}
        >
          {selected && (
            <div className="h-3.5 w-3.5 rounded-full bg-black" />
          )}
        </div>
      </div>

      <div className="flex flex-1 justify-between">
        <div className="space-y-0.5">
          {address?.label && (
            <span className="bg-[#D9EFFF] px-1.5 py-0.5 text-xs text-black">
              {address?.label}
            </span>
          )}
          {address.type && (
            <span className="inline-block bg-blue-100 px-2 py-0.5 text-sm">
              {address.type}
            </span>
          )}

          <p className="font-normal text-black text-sm">{address.name}</p>
          <p className="font-normal text-black text-sm">{address?.phone}</p>
          <p className="font-normal text-black text-xs">
            {address.address}
          </p>
        </div>

        <div className="flex flex-col h-full items-end justify-between gap-2">
          {address.isDefault && (
            <span className="items-start bg-[#636363] px-2 py-0.5 text-xs text-white">
              Default
            </span>
          )}
          <button onClick={onEdit} className="bg-transparent! p-0!">
            <FiEdit className="h-5 w-5 text-[#343434]" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddressCard
