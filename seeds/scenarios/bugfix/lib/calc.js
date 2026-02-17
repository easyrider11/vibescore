function totalCost(items) {
  return items.reduce((sum, item) => sum + item.price, 0); // BUG: ignores qty
}

module.exports = { totalCost };
