import { Button } from "@/components/ui/button"
import React from "react"
import { FiPlus } from "react-icons/fi"

type Props = {
  onAddNew?: () => void
}

const AddressHeader: React.FC<Props> = ({ onAddNew }) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">Delivery Address</h2>

      <Button
        variant="link"
        className="flex items-center gap-1 text-[#0088FF]"
        onClick={onAddNew}
      >
        <FiPlus className="h-4 w-4" />
        Add New Address
      </Button>
    </div>
  )
}

export default AddressHeader
