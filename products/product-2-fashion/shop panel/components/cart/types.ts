export type CartItemData = {
  id: string
  title: string
  image: string
  price: number
  originalPrice?: number
  size: string
  color: string
  quantity: number
  stock?: number
  freeDelivery?: boolean
}
