export type StoreImage = {
  id: string
  url: string | null
  filename: string | null
  width: number | null
  height: number | null
}

export type StoreProductFile = {
  id: string
  url: string | null
  filename: string | null
  mimeType: string | null
}

export type StoreProduct = {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  images: StoreImage[]
  productFile?: StoreProductFile | null
}
