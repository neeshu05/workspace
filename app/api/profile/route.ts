import { NextResponse } from "next/server";
import { getAuthUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { getProfileData } from "../../../lib/profile";

const MAX_AVATAR_LENGTH = 700_000; // ~500KB decoded

export async function GET(request: Request) {
  const authUser = getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const profile = await getProfileData(authUser.sub);
  if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const authUser = getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : undefined;
  const department = typeof body.department === "string" ? body.department.trim().slice(0, 120) : undefined;
  const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 280) : undefined;
  const avatarImage = body.avatarImage === null ? null : typeof body.avatarImage === "string" ? body.avatarImage : undefined;

  if (typeof avatarImage === "string") {
    if (!/^data:image\/(png|jpe?g|webp|gif);base64,/.test(avatarImage)) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }
    if (avatarImage.length > MAX_AVATAR_LENGTH) {
      return NextResponse.json({ error: "Image is too large (max ~500KB)" }, { status: 400 });
    }
  }

  if (name !== undefined) {
    await prisma.user.update({ where: { id: authUser.sub }, data: { name } });
  }
  if (department !== undefined || bio !== undefined || avatarImage !== undefined) {
    await prisma.profile.upsert({
      where: { userId: authUser.sub },
      update: {
        ...(department !== undefined ? { department } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(avatarImage !== undefined ? { avatarImage } : {}),
      },
      create: {
        userId: authUser.sub,
        department: department ?? null,
        bio: bio ?? null,
        avatarImage: avatarImage ?? null,
      },
    });
  }

  const profile = await getProfileData(authUser.sub);
  return NextResponse.json(profile);
}
