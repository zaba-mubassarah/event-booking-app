import { useEffect, useMemo, useState } from 'react'
import './App.css'

type EventItem = {
  id: number
  name: string
  date: string
  totalSeats: number
  pricePerSeat: number
  remainingSeats: number
}

type BookingItem = {
  id: number
  bookingReference: string
  customerName: string
  customerEmail: string
  seats: number
  status: 'PENDING' | 'CONFIRMED' | 'FAILED'
  failureReason?: string
  event: { name: string }
}

type BookingResponse = {
  items: BookingItem[]
  total: number
  page: number
  limit: number
}

const API_URL = 'http://localhost:3000'

function App() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [bookings, setBookings] = useState<BookingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [eventId, setEventId] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({
    eventId: '',
    customerName: '',
    customerEmail: '',
    seats: '1',
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [eventsRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/events`),
        fetch(`${API_URL}/bookings?page=${page}&limit=8${eventId ? `&eventId=${eventId}` : ''}${status ? `&status=${status}` : ''}`),
      ])
      if (!eventsRes.ok || !bookingsRes.ok) {
        throw new Error('Unable to load dashboard data')
      }
      const eventsData = await eventsRes.json()
      const bookingsData = await bookingsRes.json()
      setEvents(eventsData)
      setBookings(bookingsData)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [eventId, status, page])

  const totalPages = useMemo(() => {
    if (!bookings) return 1
    return Math.max(1, Math.ceil(bookings.total / bookings.limit))
  }, [bookings])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          eventId: Number(form.eventId),
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          seats: Number(form.seats),
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.message || 'Booking failed')
      }
      setForm({ eventId: '', customerName: '', customerEmail: '', seats: '1' })
      setPage(1)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="dashboard">
      <header>
        <div>
          <p className="eyebrow">Wenexus take-home assignment</p>
          <h1>Event Booking Dashboard</h1>
          <p className="muted">Create bookings and review their queued or confirmed status in real time.</p>
        </div>
      </header>

      <section className="panel form-panel">
        <h2>Create booking</h2>
        <form onSubmit={handleSubmit} className="booking-form">
          <select value={form.eventId} onChange={(event) => setForm({ ...form, eventId: event.target.value })} required>
            <option value="">Select an event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} · {event.remainingSeats} left
              </option>
            ))}
          </select>
          <input placeholder="Customer name" value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} required />
          <input type="email" placeholder="Customer email" value={form.customerEmail} onChange={(event) => setForm({ ...form, customerEmail: event.target.value })} required />
          <input type="number" min="1" value={form.seats} onChange={(event) => setForm({ ...form, seats: event.target.value })} required />
          <button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Create booking'}</button>
        </form>
      </section>

      <section className="panel">
        <div className="toolbar">
          <h2>Bookings</h2>
          <div className="filters">
            <select value={eventId} onChange={(event) => { setEventId(event.target.value); setPage(1) }}>
              <option value="">All events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
              <option value="">All statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Loading bookings…</p> : null}

        {!loading && bookings ? (
          <>
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Event</th>
                  <th>Customer</th>
                  <th>Seats</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.items.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.bookingReference}</td>
                    <td>{booking.event?.name}</td>
                    <td>{booking.customerName}</td>
                    <td>{booking.seats}</td>
                    <td>
                      <span className={`pill ${booking.status.toLowerCase()}`}>{booking.status}</span>
                      {booking.failureReason ? <div className="reason">{booking.failureReason}</div> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>
                Next
              </button>
            </div>
          </>
        ) : null}
      </section>
    </div>
  )
}

export default App
