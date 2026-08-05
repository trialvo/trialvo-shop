import React from "react"

type Props = {
  title: string
  price: number
  originalPrice?: number
  size: string
  color: string
  freeDelivery?: boolean
}

const CartItemDetails: React.FC<Props> = ({
  title,
  price,
  originalPrice,
  size,
  color,
  freeDelivery,
}) => {
  return (
    <div className="flex flex-col min-w-55 justify-between">
      <div>
        <h3 className="text-sm font-medium line-clamp-1">{title}</h3>

        <div className="flex items-center gap-3">
          <span className="text-base font-semibold">
            BDT {price.toLocaleString()}
          </span>
          {typeof originalPrice === "number" && originalPrice > 0 && (
            <span className="text-xs font-normal text-[#888888] line-through">
              {originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Size: <span className="text-black">{size}</span>{" "}
        &nbsp; Color: <span className="text-black">{color}</span>
      </div>
      {freeDelivery && (
        <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-green-600">
          🚚 Free Delivery
        </span>
      )}
    </div>
  )
}

export default CartItemDetails
