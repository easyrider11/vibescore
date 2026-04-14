const { renderStatusBadge } = require("./status-badge");

function renderSessionsTable(rows) {
  return rows
    .map((row) => {
      return `<tr>
  <td>${row.candidateName}</td>
  <td>${renderStatusBadge(row.displayStatus)}</td>
</tr>`;
    })
    .join("\n");
}

module.exports = { renderSessionsTable };
