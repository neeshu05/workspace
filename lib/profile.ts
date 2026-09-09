import { prisma } from "./prisma";

const ACTIVITY_LIMIT = 10;

export async function getProfileData(userId: string) {
  const [user, profile, activity] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.activityLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: ACTIVITY_LIMIT }),
  ]);
  if (!user) return null;

  return {
    name: user.name,
    email: user.email,
    role: user.role,
    department: profile?.department ?? null,
    avatarInitials: profile?.avatarInitials ?? initialsFromName(user.name),
    avatarImage: profile?.avatarImage ?? null,
    bio: profile?.bio ?? null,
    activity: activity.map((a) => ({ id: a.id, action: a.action, detail: a.detail, createdAt: a.createdAt })),
  };
}

export function logActivity(userId: string, action: string, detail?: string) {
  return prisma.activityLog.create({ data: { userId, action, detail } });
}

export function describeDevice(userAgent: string | null | undefined) {
  if (!userAgent) return undefined;
  const browser = /edg/i.test(userAgent)
    ? "Edge"
    : /chrome/i.test(userAgent)
      ? "Chrome"
      : /firefox/i.test(userAgent)
        ? "Firefox"
        : /safari/i.test(userAgent)
          ? "Safari"
          : "a browser";
  const os = /windows/i.test(userAgent)
    ? "Windows"
    : /mac os/i.test(userAgent)
      ? "macOS"
      : /android/i.test(userAgent)
        ? "Android"
        : /iphone|ipad/i.test(userAgent)
          ? "iOS"
          : /linux/i.test(userAgent)
            ? "Linux"
            : "an unknown device";
  return `${browser} on ${os}`;
}

function initialsFromName(name: string | null) {
  if (!name) return null;
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
