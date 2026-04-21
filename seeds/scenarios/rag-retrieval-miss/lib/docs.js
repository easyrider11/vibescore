// Small corpus of product docs. Each doc has an id, a title, and body.

const DOCS = [
  {
    id: "refunds",
    title: "Refund policy",
    body: "Refunds are processed within 5 business days. Contact support to request a refund for an order.",
  },
  {
    id: "shipping",
    title: "Shipping",
    body: "Standard shipping takes 3-5 business days. We ship on weekdays only.",
  },
  {
    id: "sdk",
    title: "Download the SDK",
    body: "You can download the SDK from our developer portal. The SDK supports Node and Python.",
  },
  {
    id: "password",
    title: "Reset your password",
    body: "To reset your password, click the link in your welcome email or use the reset flow in settings.",
  },
  {
    id: "billing",
    title: "Billing and invoices",
    body: "We bill monthly. You can download a paid invoice from the billing page.",
  },
  {
    id: "status",
    title: "Check order status",
    body: "Your order status is visible on your account page. Use the order number to look it up.",
  },
];

module.exports = { DOCS };
