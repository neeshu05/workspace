import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "operator@apex.io";
  const password = "warehouse2026";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: passwordHash,
      name: "Maya Chen",
      role: "Operations Lead",
    },
  });

  console.log(`Seeded demo user: ${email}`);

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      department: "Apex Fulfillment Center",
      avatarInitials: "MC",
    },
  });

  const activityCount = await prisma.activityLog.count({ where: { userId: user.id } });
  if (activityCount === 0) {
    await prisma.activityLog.create({
      data: { userId: user.id, action: "Viewed cold chain alert AL-104" },
    });
    console.log("Seeded initial activity log");
  }

  const alertCount = await prisma.alert.count();
  if (alertCount === 0) {
    const seededAlerts = [
      { level: "warning", title: "Cold storage temperature rising", location: "Zone C · Cold Bay 02" },
      { level: "info", title: "Inbound dock nearing capacity", location: "Dock 04" },
      { level: "resolved", title: "Conveyor 3 jam cleared", location: "Sortation line" },
    ];
    await prisma.alert.createMany({ data: seededAlerts });
    await prisma.alertStats.upsert({
      where: { id: 1 },
      update: { total: { increment: seededAlerts.length }, active: { increment: seededAlerts.length } },
      create: { id: 1, total: seededAlerts.length, active: seededAlerts.length, closed: 0 },
    });
    console.log("Seeded initial alerts");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
