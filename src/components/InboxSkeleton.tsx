export function InboxSkeleton() {
  return <main id="main" className="shell" aria-busy="true" aria-label="Loading inbox"><div className="loading-inbox"><span className="skeleton-line short"/>{[0, 1, 2].map(item => <div className="skeleton" key={item} aria-hidden="true"><span className="skeleton-line short"/><span className="skeleton-line long"/><span className="skeleton-line"/><span className="skeleton-line long"/></div>)}</div></main>;
}
