const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
).replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null
        ? payload.message || payload.error || 'Request failed.'
        : 'Request failed.'

    throw new Error(message)
  }

  return payload.data
}

export const api = {
  listEventTypes: () => request('/event-types'),
  createEventType: (payload) =>
    request('/event-types', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateEventType: (id, payload) =>
    request(`/event-types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteEventType: (id) =>
    request(`/event-types/${id}`, {
      method: 'DELETE',
    }),
  getAvailability: () => request('/availability'),
  updateAvailability: (payload) =>
    request('/availability', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  listBookings: (view = 'upcoming') => request(`/bookings?view=${view}`),
  getBooking: (id) => request(`/bookings/${id}`),
  getBookingRescheduleSlots: (id, date, timeZone) =>
    request(
      `/bookings/${id}/reschedule/slots?date=${encodeURIComponent(date)}${
        timeZone ? `&timezone=${encodeURIComponent(timeZone)}` : ''
      }`,
    ),
  rescheduleBooking: (id, payload) =>
    request(`/bookings/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  requestRescheduleBooking: (id, payload = {}) =>
    request(`/bookings/${id}/request-reschedule`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  cancelBooking: (id) =>
    request(`/bookings/${id}/cancel`, {
      method: 'PATCH',
    }),
  getPublicProfile: (username) => request(`/public/profiles/${username}`),
  getPublicEventType: (username, slug) =>
    request(`/public/profiles/${username}/event-types/${slug}`),
  getPublicSlots: (username, slug, date, timeZone) =>
    request(
      `/public/profiles/${username}/event-types/${slug}/slots?date=${encodeURIComponent(date)}${
        timeZone ? `&timezone=${encodeURIComponent(timeZone)}` : ''
      }`,
    ),
  createPublicBooking: (payload) =>
    request('/public/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getPublicManageBooking: (bookingId, token) =>
    request(`/public/bookings/${bookingId}/manage?token=${encodeURIComponent(token)}`),
  getPublicRescheduleSlots: (bookingId, token, date, timeZone) =>
    request(
      `/public/bookings/${bookingId}/reschedule/slots?token=${encodeURIComponent(token)}&date=${encodeURIComponent(date)}${
        timeZone ? `&timezone=${encodeURIComponent(timeZone)}` : ''
      }`,
    ),
  reschedulePublicBooking: (bookingId, token, payload) =>
    request(`/public/bookings/${bookingId}/reschedule?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  cancelPublicBooking: (bookingId, token, payload = {}) =>
    request(`/public/bookings/${bookingId}/cancel?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getPublicBookingConfirmation: (bookingId, email) =>
    request(`/public/bookings/${bookingId}?email=${encodeURIComponent(email)}`),
}
