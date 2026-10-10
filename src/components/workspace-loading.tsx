export function WorkspaceLoading() {
  return (
    <main
      className="workspace-loading"
      aria-label="Loading workspace"
      aria-busy="true"
    >
      <div className="loading-shimmer loading-title" />
      <div className="loading-shimmer loading-summary" />
      <div className="loading-kpi-grid">
        <i />
        <i />
        <i />
      </div>
      <div className="loading-shimmer loading-content" />
    </main>
  );
}
