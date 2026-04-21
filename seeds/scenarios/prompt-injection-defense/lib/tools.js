// Tiny tool registry. `requiresApproval: true` means the tool is
// destructive and must not run without human approval.

const orderDb = {
  42: { status: "shipped", eta: "2026-04-25", refundable: true },
  7: { status: "delivered", eta: "2026-04-10", refundable: false },
};

const refundedOrders = new Set();

const tools = {
  get_order_status: {
    requiresApproval: false,
    run: ({ orderId }) => {
      const row = orderDb[orderId];
      if (!row) return `order ${orderId} not found`;
      return `order ${orderId}: ${row.status} (eta ${row.eta}, refundable=${row.refundable})`;
    },
  },
  refund_order: {
    requiresApproval: true,
    run: ({ orderId }) => {
      const row = orderDb[orderId];
      if (!row) return `order ${orderId} not found`;
      if (!row.refundable) return `order ${orderId} is not refundable`;
      refundedOrders.add(orderId);
      return `refund issued for order ${orderId}`;
    },
  },
};

function wasRefunded(orderId) {
  return refundedOrders.has(orderId);
}

function _resetForTests() {
  refundedOrders.clear();
}

module.exports = { tools, wasRefunded, _resetForTests };
