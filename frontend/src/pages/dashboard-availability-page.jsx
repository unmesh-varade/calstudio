import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QueryState } from '../components/query-state'
import { AvailabilityForm } from '../features/availability/availability-form'
import { api } from '../lib/api'

const weekdayLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function DashboardAvailabilityPage() {
  const queryClient = useQueryClient()
  const availabilityQuery = useQuery({
    queryKey: ['availability'],
    queryFn: api.getAvailability,
  })

  const updateMutation = useMutation({
    mutationFn: api.updateAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] })
      queryClient.invalidateQueries({ queryKey: ['event-types'] })
    },
  })

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Weekly rules</p>
          <h2>Availability</h2>
          <p>Update the default timezone and the working hours used for slot generation.</p>
        </div>
      </div>

      <QueryState
        isLoading={availabilityQuery.isLoading}
        error={availabilityQuery.error}
        empty={!availabilityQuery.data && 'No availability configured.'}
      >
        <div className="detail-card">
          <div className="detail-row">
            <span>Schedule</span>
            <strong>{availabilityQuery.data?.name}</strong>
          </div>
          <div className="detail-row">
            <span>Timezone</span>
            <strong>{availabilityQuery.data?.timezone}</strong>
          </div>
          <div className="detail-row">
            <span>Enabled days</span>
            <strong>{availabilityQuery.data?.rules.length}</strong>
          </div>
        </div>

        <div className="list-grid">
          {availabilityQuery.data?.rules.map((rule) => (
            <article className="list-card" key={rule.id}>
              <h3>{weekdayLabel[rule.weekday]}</h3>
              <p>
                {rule.startTime} to {rule.endTime}
              </p>
            </article>
          ))}
        </div>

        <AvailabilityForm
          error={updateMutation.error?.message}
          initialValues={availabilityQuery.data}
          isSubmitting={updateMutation.isPending}
          onSubmit={(values) => updateMutation.mutate(values)}
        />
      </QueryState>
    </section>
  )
}
