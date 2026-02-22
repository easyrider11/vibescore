const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const scenarios = [
    {
      slug: 'bugfix',
      title: 'Bugfix: Cart total incorrect',
      description: 'Fix a bug in totalCost so it accounts for quantity.',
      background: 'A checkout service is returning incorrect totals for multi-quantity items.',
      tasks: [
        'Identify bug in totalCost()',
        'Fix to account for item qty',
        'Explain edge cases and add a quick test plan',
      ],
      hints: [
        'Start from app.js and trace into lib/calc.js',
        'Check how totals are computed for multiple quantities',
      ],
      evaluationPoints: [
        'Locates root cause quickly',
        'Fix includes qty and handles empty cart',
        'Explains test cases and edge conditions',
      ],
      rubric: [
        'Repo understanding',
        'Requirement clarification notes',
        'Delivery quality',
        'Architecture tradeoffs',
        'AI usage quality',
      ],
      aiPolicy: { allowedModes: ['summary', 'explain', 'tests', 'review'] },
      timeLimitMin: 45,
    },
    {
      slug: 'feature-add',
      title: 'Feature: Add /notify endpoint',
      description: 'Extend HTTP server with /notify and a basic test plan.',
      background: 'A notification service needs a new endpoint to enqueue notifications.',
      tasks: [
        'Add /notify endpoint',
        'Return 202 with queued: true',
        'Describe testing approach',
      ],
      hints: [
        'Look at server.js handler routing',
        'Keep payload validation lightweight for MVP',
      ],
      evaluationPoints: [
        'API behavior matches requirements',
        'Handles invalid payloads gracefully',
        'Documents testing approach',
      ],
      rubric: [
        'Repo understanding',
        'Requirement clarification notes',
        'Delivery quality',
        'Architecture tradeoffs',
        'AI usage quality',
      ],
      aiPolicy: { allowedModes: ['summary', 'explain', 'tests', 'review'] },
      timeLimitMin: 60,
    },
    {
      slug: 'refactor',
      title: 'Refactor: Notification adapters',
      description: 'Extract adapters and improve testability.',
      background: 'The notification module has duplicated logic that is hard to test.',
      tasks: [
        'Extract adapter functions',
        'Reduce duplication',
        'Explain test strategy',
      ],
      hints: [
        'service.js has repeated logic for email/sms',
        'Consider dependency injection for testing',
      ],
      evaluationPoints: [
        'Cleaner module boundaries',
        'Testability improves via injected adapters',
        'Tradeoffs explained',
      ],
      rubric: [
        'Repo understanding',
        'Requirement clarification notes',
        'Delivery quality',
        'Architecture tradeoffs',
        'AI usage quality',
      ],
      aiPolicy: { allowedModes: ['summary', 'explain', 'tests', 'review'] },
      timeLimitMin: 50,
    },
  ];

  for (const scenario of scenarios) {
    const dbScenario = {
      ...scenario,
      tasks: JSON.stringify(scenario.tasks),
      hints: JSON.stringify(scenario.hints),
      evaluationPoints: JSON.stringify(scenario.evaluationPoints),
      rubric: JSON.stringify(scenario.rubric),
      aiPolicy: JSON.stringify(scenario.aiPolicy),
    };

    await prisma.scenario.upsert({
      where: { slug: scenario.slug },
      update: dbScenario,
      create: dbScenario,
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
