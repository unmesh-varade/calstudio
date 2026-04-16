import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { BackButton } from '../components/back-button'
import { EventTypeForm } from '../features/event-types/event-type-form'
import { api } from '../lib/api'

export function DashboardNewEventTypePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: api.createEventType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-types'] })
      navigate('/dashboard/event-types')
    },
  })

  return (
    <section className="page-stack">
      <BackButton fallbackTo="/dashboard/event-types" />

      <div className="page-heading">
        <div>
          <p className="eyebrow">Admin setup</p>
          <h2>Create event type</h2>
          <p>Define the public link, meeting length, and any custom booking questions guests should answer.</p>
        </div>
      </div>

      <EventTypeForm
        error={createMutation.error?.message}
        isSubmitting={createMutation.isPending}
        onSubmit={(values) => createMutation.mutate(values)}
        submitLabel="Create event type"
      />
    </section>
  )
}
