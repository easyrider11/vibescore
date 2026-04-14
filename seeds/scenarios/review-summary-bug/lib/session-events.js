const { events } = require("./mock-data");

function appendEvent(event) {
  events.push(event);
  return event;
}

function listEventsForSession(sessionId) {
  return events
    .filter((event) => event.sessionId === sessionId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

module.exports = { appendEvent, listEventsForSession };
