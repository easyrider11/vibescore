// Tiny tool registry. Each tool: (args) => string result.

const orderDb = {
  42: { status: "shipped", carrier: "UPS", eta: "2026-04-18" },
  7: { status: "processing", eta: "2026-04-20" },
};

const docs = [
  { id: "refunds", text: "Refunds are processed within 5 business days." },
  { id: "shipping", text: "Standard shipping takes 3-5 business days." },
];

const tools = {
  search_docs: ({ query }) => {
    const hit = docs.find((d) => d.text.toLowerCase().includes(String(query || "").toLowerCase()));
    return hit ? hit.text : "no docs matched";
  },
  get_order_status: ({ orderId }) => {
    const row = orderDb[orderId];
    if (!row) return `order ${orderId} not found`;
    return `order ${orderId}: ${row.status} (eta ${row.eta})`;
  },
};

module.exports = { tools };
