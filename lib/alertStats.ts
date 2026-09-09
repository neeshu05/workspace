import { prisma } from "./prisma";

const STATS_ID = 1;

export function getAlertStats() {
  return prisma.alertStats.upsert({
    where: { id: STATS_ID },
    update: {},
    create: { id: STATS_ID },
  });
}

export function recordAlertCreated() {
  return prisma.alertStats.upsert({
    where: { id: STATS_ID },
    update: { total: { increment: 1 }, active: { increment: 1 } },
    create: { id: STATS_ID, total: 1, active: 1, closed: 0 },
  });
}

export function recordAlertClosed() {
  return prisma.alertStats.upsert({
    where: { id: STATS_ID },
    update: { active: { decrement: 1 }, closed: { increment: 1 } },
    create: { id: STATS_ID, total: 1, active: 0, closed: 1 },
  });
}
