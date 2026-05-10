import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });
  
  const { name, description, color } = await req.json();
  const habit = await prisma.habit.create({
    data: {
      name,
      description,
      color: color || "#3B82F6",
      userId: session.user.id
    }
  });
  return NextResponse.json(habit);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([]);
  const habits = await prisma.habit.findMany({
    where: { userId: session.user.id },
    include: { checkins: true }
  });
  return NextResponse.json(habits);
}