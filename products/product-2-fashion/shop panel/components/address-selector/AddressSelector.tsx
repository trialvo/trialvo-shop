"use client"

import React from "react"
import AddressCard from "./AddressCard"
import AddressHeader from "./AddressHeader"
import { Address } from "./types"

type Props = {
  addresses: Address[]
  selectedId: string
  onChange: (id: string) => void
  onAddNew?: () => void
  onEdit?: (id: string) => void
}

const AddressSelector: React.FC<Props> = ({
  addresses,
  selectedId,
  onChange,
  onAddNew,
  onEdit,
}) => {
  return (
    <div className="space-y-4">
      <AddressHeader onAddNew={onAddNew} />

      <div className="space-y-4">
        {addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            selected={address.id === selectedId}
            onSelect={() => onChange(address.id)}
            onEdit={() => onEdit?.(address.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default AddressSelector
