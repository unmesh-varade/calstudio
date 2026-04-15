export function QueryState({ isLoading, error, empty, children }) {
  if (isLoading) {
    return <div className="empty-state">Loading data...</div>
  }

  if (error) {
    return <div className="empty-state empty-state--error">{error.message}</div>
  }

  if (empty) {
    return <div className="empty-state">{empty}</div>
  }

  return children
}
