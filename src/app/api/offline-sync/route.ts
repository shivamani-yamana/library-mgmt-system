import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

interface SyncCheckout {
  id: string;
  bookId: string;
  status: string;
  studentEmail: string;
}

// POST /api/offline-sync
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if request has a body
    const contentLength = req.headers.get("content-length");
    if (!contentLength || contentLength === "0") {
      return NextResponse.json(
        { error: "No data to sync" },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    if (!body.checkouts || !Array.isArray(body.checkouts)) {
      return NextResponse.json(
        { error: "Invalid sync data format" },
        { status: 400 }
      );
    }

    const { checkouts } = body;

    // Process each checkout
    const results = await Promise.all(
      checkouts.map(async (checkout: SyncCheckout) => {
        try {
          await prisma.checkout.create({
            data: {
              id: checkout.id,
              bookId: checkout.bookId,
              studentEmail: checkout.studentEmail,
              status: checkout.status,
              checkoutDate: new Date(),
              synced: true,
            },
          });
          return { id: checkout.id, success: true };
        } catch (error) {
          console.error(`Failed to sync checkout ${checkout.id}:`, error);
          return { id: checkout.id, success: false };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error: unknown) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
