import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { books, checkouts } = await req.json();
    console.log('Received data for sync:', { books, checkouts });

    // Sync books
    for (const book of books) {
      await prisma.book.upsert({
        where: { id: book.id },
        update: {
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          quantity: book.quantity,
          availableQuantity: book.availableQuantity,
          status: book.status,
          updatedAt: new Date(),
        },
        create: {
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          quantity: book.quantity,
          availableQuantity: book.availableQuantity,
          status: book.status,
        },
      });
    }

    // Sync checkouts
    for (const checkout of checkouts) {
      console.log('Processing checkout:', checkout);
      try {
        await prisma.checkout.upsert({
          where: { id: checkout.id },
          update: {
            studentEmail: checkout.studentEmail,
            status: checkout.status,
            returnDate: checkout.returnDate ? new Date(checkout.returnDate) : null,
            checkoutDate: new Date(checkout.checkoutDate),
            bookId: checkout.bookId,
            updatedAt: new Date(),
            synced: true,
          },
          create: {
            id: checkout.id,
            studentEmail: checkout.studentEmail,
            status: checkout.status,
            returnDate: checkout.returnDate ? new Date(checkout.returnDate) : null,
            checkoutDate: new Date(checkout.checkoutDate),
            bookId: checkout.bookId,
            synced: true,
          },
        });
        console.log(`Successfully synced checkout ${checkout.id}`);
      } catch (error) {
        console.error(`Failed to sync checkout ${checkout.id}:`, error);
        throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
} 