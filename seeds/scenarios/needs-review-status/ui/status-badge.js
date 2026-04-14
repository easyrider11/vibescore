function renderStatusBadge(status) {
  const labels = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    needs_review: "Needs Review",
  };

  return `<span class="status status-${status}">${labels[status] || status}</span>`;
}

module.exports = { renderStatusBadge };
