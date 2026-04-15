import { createBrowserRouter } from 'react-router-dom'
import { DashboardLayout } from '../layouts/dashboard-layout'
import { MarketingLayout } from '../layouts/marketing-layout'
import { BookingConfirmationPage } from '../pages/booking-confirmation-page'
import { DashboardAvailabilityPage } from '../pages/dashboard-availability-page'
import { DashboardBookingsPage } from '../pages/dashboard-bookings-page'
import { DashboardEventTypeDetailPage } from '../pages/dashboard-event-type-detail-page'
import { DashboardEventTypesPage } from '../pages/dashboard-event-types-page'
import { DashboardNewEventTypePage } from '../pages/dashboard-new-event-type-page'
import { HomePage } from '../pages/home-page'
import { NotFoundPage } from '../pages/not-found-page'
import { PublicBookingPage } from '../pages/public-booking-page'
import { PublicProfilePage } from '../pages/public-profile-page'

export const router = createBrowserRouter([
  {
    element: <MarketingLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/booking/:bookingId', element: <BookingConfirmationPage /> },
      { path: '/:username/:slug', element: <PublicBookingPage /> },
      { path: '/:username', element: <PublicProfilePage /> },
    ],
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { path: 'event-types', element: <DashboardEventTypesPage /> },
      { path: 'event-types/new', element: <DashboardNewEventTypePage /> },
      { path: 'event-types/:id', element: <DashboardEventTypeDetailPage /> },
      { path: 'availability', element: <DashboardAvailabilityPage /> },
      { path: 'bookings', element: <DashboardBookingsPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
