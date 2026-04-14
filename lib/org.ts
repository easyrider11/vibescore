import { prisma } from "./prisma";

/**
 * Ensure the user belongs to an organization.
 * If they don't have one, create a personal org and assign them as owner.
 */
export async function ensureOrg(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { org: true },
  });

  if (!user) throw new Error("User not found");

  if (user.org) return user.org;

  // Create a personal org
  const org = await prisma.organization.create({
    data: {
      name: `${user.email.split("@")[0]}'s Team`,
      members: { connect: { id: userId } },
    },
  });

  // Set user as owner
  await prisma.user.update({
    where: { id: userId },
    data: { role: "owner" },
  });

  return org;
}

/**
 * Get org members list.
 */
export async function getOrgMembers(orgId: string) {
  return prisma.user.findMany({
    where: { orgId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}
