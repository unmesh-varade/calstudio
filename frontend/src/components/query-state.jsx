export function SkeletonLoader({ rows = 3, variant = 'card' }) {
  return (
    <div className={`skeleton-loader skeleton-loader--${variant}`} aria-label="Loading content">
      {Array.from({ length: rows }).map((_, index) => (
        <article className="skeleton-card" key={index}>
          <div className="skeleton-line skeleton-line--title" />
          <div className="skeleton-line skeleton-line--body" />
          <div className="skeleton-meta-row">
            <span className="skeleton-pill" />
            <span className="skeleton-pill skeleton-pill--short" />
            <span className="skeleton-pill skeleton-pill--wide" />
          </div>
        </article>
      ))}
    </div>
  )
}

export function QueryState({ isLoading, error, empty, loadingFallback, children }) {
  if (isLoading) {
    return loadingFallback || <SkeletonLoader />
  }

  if (error) {
    return <div className="empty-state empty-state--error">{error.message}</div>
  }

  if (empty) {
    return <div className="empty-state">{empty}</div>
  }

  return children
}
