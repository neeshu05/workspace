import { prisma } from "./prisma";

const SETTINGS_ID = 1;

export function getSettings() {
  return prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
}

export function updateSettings(data: { liveTrackingPaused?: boolean }) {
  return prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: data,
    create: { id: SETTINGS_ID, ...data },
  });
}
