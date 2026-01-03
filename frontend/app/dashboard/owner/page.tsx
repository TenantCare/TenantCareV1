import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import OwnerDashboardClient from "./OwnerDashboardClient";

export default async function OwnerDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <p>You are not logged in.</p>;
  }

  const { prisma } = await import("@/lib/prisma");
  const owner = await prisma.owner.findFirst({
    where: { userId: session.user.id },
    include: {
      buildings: {
        include: {
          apartments: {
            include: {
              tenants: {
                include: { user: true },
              },
            },
          },
        },
      },
    },
  });

  return <OwnerDashboardClient owner={owner} />;
}
