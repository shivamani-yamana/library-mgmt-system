import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"; // Clerk authentication check
import { v4 as uuidv4 } from "uuid";

// POST /api/checkout
export async function POST(req: Request) {
  const { userId } = await auth();  // Remove the req parameter
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { bookId, action } = await req.json();

  if (!bookId || !action || !["borrow", "return"].includes(action)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  try {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const newCheckout = await prisma.checkout.create({
      data: {
        id: uuidv4(),
        studentEmail: userId,
        bookId: bookId,
        status: action === "borrow" ? "borrowed" : "returned",
        checkoutDate: new Date(),
        synced: false,
      },
    });

    return NextResponse.json(newCheckout);
  } catch (err) {
    return NextResponse.json({ error: "Failed to process checkout"+err }, { status: 500 });
  }
}
