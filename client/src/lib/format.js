export function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatPrice(price) {
  return price === 0 ? 'Free' : `$${price}`
}
