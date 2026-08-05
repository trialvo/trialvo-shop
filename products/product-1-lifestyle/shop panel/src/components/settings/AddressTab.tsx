"use client";

import { useState } from "react";
import { MapPin, Plus, Star, Trash2 } from "lucide-react";
import { AddressModal } from "@/components/settings/AddressModal";
import type { Address } from "@/types";

interface AddressTabProps {
  addresses: Address[];
  onAdd: (address: Omit<Address, "id">) => void | Promise<void>;
  onEdit: (address: Address) => void | Promise<void>;
  onDelete: (id: string) => void;
  saving?: boolean;
}

export function AddressTab({ addresses, onAdd, onEdit, onDelete, saving = false }: AddressTabProps) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const openAdd = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const openEdit = (addr: Address) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium tracking-[0.1em] uppercase text-foreground">
          Saved Addresses
        </h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 text-xs tracking-[0.1em] uppercase text-accent hover:text-accent/80 transition-colors cursor-pointer"
        >
          <Plus size={14} /> Add New
        </button>
      </div>

      {/* Empty state */}
      {addresses.length === 0 && (
        <div className="text-center py-12">
          <MapPin size={36} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No saved addresses yet</p>
        </div>
      )}

      {/* Address list */}
      <div className="space-y-3">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="border border-border p-4 flex items-start justify-between gap-4 hover:border-accent/30 transition-colors rounded"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium tracking-[0.1em] uppercase text-foreground">
                  {addr.label}
                </span>
                {addr.isDefault && (
                  <span className="flex items-center gap-0.5 text-[10px] text-accent">
                    <Star size={10} /> Default
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground">{addr.fullName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {addr.street}, {addr.city}, {addr.state} {addr.zip}
              </p>
              <p className="text-xs text-muted-foreground">{addr.country}</p>
              {addr.phone && (
                <p className="text-xs text-muted-foreground mt-1">{addr.phone}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openEdit(addr)}
                className="text-xs text-accent hover:text-accent/80 transition-colors tracking-wide uppercase cursor-pointer"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(addr.id)}
                className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                aria-label="Delete address"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AddressModal
        isOpen={isModalOpen}
        address={editingAddress}
        saving={saving}
        onClose={closeModal}
        onAdd={onAdd}
        onEdit={onEdit}
      />
    </div>
  );
}
