const { PrismaClient } = require('@prisma/client');
const { scenarios } = require("./scenarios");

const prisma = new PrismaClient();

async function main() {
  for (const scenario of scenarios) {
    await prisma.scenario.upsert({
      where: { slug: scenario.slug },
      update: scenario,
      create: scenario,
    });
  }

  console.log('Seeded scenarios.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
