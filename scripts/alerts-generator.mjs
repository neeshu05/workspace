import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MIN_INTERVAL_MS = 5000;
const MAX_INTERVAL_MS = 20000;
const MAX_ALERTS = 30;

const pool = [
  { level: "warning", title: "Cold storage temperature rising", location: "Zone C · Cold Bay 02" },
  { level: "info", title: "Inbound dock nearing capacity", location: "Dock 04" },
  { level: "resolved", title: "Conveyor 3 jam cleared", location: "Sortation line" },
  { level: "warning", title: "Forklift battery below 20%", location: "Zone A · Charging Bay" },
  { level: "info", title: "Outbound truck arrived early", location: "Dock 07" },
  { level: "resolved", title: "Barcode scanner reconnected", location: "Receiving A" },
  { level: "warning", title: "Pick rate below target for Zone B", location: "Zone B · High-bay" },
  { level: "info", title: "New inbound shipment scanned", location: "Receiving C" },
  { level: "resolved", title: "Dock 04 congestion cleared", location: "Dock 04" },
  { level: "warning", title: "Humidity spike detected", location: "Zone C · Cold Bay 01" },
];

function randomInterval() {
  return MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
}

async function pushAlert() {
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const alert = await prisma.alert.create({ data: pick });
  await prisma.alertStats.upsert({
    where: { id: 1 },
    update: { total: { increment: 1 }, active: { increment: 1 } },
    create: { id: 1, total: 1, active: 1, closed: 0 },
  });
  console.log(`[${new Date().toLocaleTimeString()}] pushed alert: ${alert.level} · ${alert.title}`);

  const count = await prisma.alert.count();
  if (count > MAX_ALERTS) {
    const stale = await prisma.alert.findMany({
      orderBy: { createdAt: "asc" },
      take: count - MAX_ALERTS,
      select: { id: true },
    });
    await prisma.alert.deleteMany({ where: { id: { in: stale.map((a) => a.id) } } });
  }
}

async function loop() {
  await pushAlert();
  setTimeout(loop, randomInterval());
}

console.log("Alert generator started — pushing a random alert every 5-20s. Ctrl+C to stop.");
loop();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
