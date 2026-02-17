const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const scenarios = [
    {
      slug: 'bugfix',
      title: 'Bugfix: Cart total incorrect',
      description: 'Fix a bug in totalCost so it accounts for quantity.',
      tasks: [
        'Identify bug in totalCost()',
        'Fix to account for item qty',
        'Explain edge cases',
      ],
      rubric: [
        'Repo understanding',
        'Requirement clarification notes',
        'Delivery quality',
        'Architecture tradeoffs',
        'AI usage quality',
      ],
    },
    {
      slug: 'feature-add',
      title: 'Feature: Add /notify endpoint',
      description: 'Extend HTTP server with /notify and a basic test plan.',
      tasks: [
        'Add /notify endpoint',
        'Return 202 with queued: true',
        'Describe testing approach',
      ],
      rubric: [
        'Repo understanding',
        'Requirement clarification notes',
        'Delivery quality',
        'Architecture tradeoffs',
        'AI usage quality',
      ],
    },
    {
      slug: 'refactor',
      title: 'Refactor: Notification adapters',
      description: 'Extract adapters and improve testability.',
      tasks: [
        'Extract adapter functions',
        'Reduce duplication',
        'Explain test strategy',
      ],
      rubric: [
        'Repo understanding',
        'Requirement clarification notes',
        'Delivery quality',
        'Architecture tradeoffs',
        'AI usage quality',
      ],
    },
  ];

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
