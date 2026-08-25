import { Button } from "@/components/ui/button"
import React from "react"
import { FiPlus } from "react-icons/fi"

type Props = {
  onAddNew?: () => void
}

const AddressHeader: React.FC<Props> = ({ onAddNew }) => {
  return (
    <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
      <h2 className="text-sm font-semibold tracking-tight text-black">Delivery Address</h2>

      <Button
        type="button"
        variant="link"
        className="h-auto p-0 text-sm font-medium text-black hover:underline"
        onClick={onAddNew}
      >
        <FiPlus className="h-4 w-4" />
        Add New Address
      </Button>
    </div>
  )
}

export default AddressHeader
