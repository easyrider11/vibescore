function sendEmail(user, message) {
  // TODO: replace with adapter
  return `Email to ${user}: ${message}`;
}

function sendSMS(user, message) {
  // TODO: replace with adapter
  return `SMS to ${user}: ${message}`;
}

function notify(user, message, type) {
  if (type === 'email') return sendEmail(user, message);
  if (type === 'sms') return sendSMS(user, message);
  return 'Unknown';
}

module.exports = { notify };
