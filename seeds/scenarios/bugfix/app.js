const { totalCost } = require('./lib/calc');

function main() {
  const cart = [
    { price: 10, qty: 2 },
    { price: 5, qty: 4 },
  ];
  console.log('Total:', totalCost(cart));
}

main();
