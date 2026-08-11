export function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatPrice(price) {
  return price === 0 ? 'Free' : `$${price}`
}

// Converts an ISO date string to the `YYYY-MM-DDTHH:mm` shape a native
// <input type="datetime-local"> expects, in the browser's local time.
export function toDatetimeLocalValue(iso) {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
