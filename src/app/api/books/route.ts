import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

// GET /api/books
export async function GET() {
  try {
    const books = await prisma.book.findMany();
    return NextResponse.json(books);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch books"+error }, { status: 500 });
  }
}

// Validation schema
const BookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().regex(/^(?:\d{10}|\d{13})$/),
  quantity: z.number().min(1),
  availableQuantity: z.number().min(1),
  status: z.enum(["available", "borrowed"]),
});

export async function POST(req: Request) {
  console.log('POST /api/books - Start'); // Log start of request

  try {
    const { userId } = await auth();
    console.log('Auth check - userId:', userId);

    if (!userId) {
      console.log('Unauthorized - no userId');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log('Request body:', body);

    const validatedData = BookSchema.parse(body);
    console.log('Validated data:', validatedData);

    const book = await prisma.book.create({
      data: {
        title: validatedData.title,
        author: validatedData.author,
        isbn: validatedData.isbn,
        quantity: validatedData.quantity,
        availableQuantity: validatedData.quantity,
        status: "available",
      },
    });

    console.log('Book created successfully:', book);
    return NextResponse.json(book);
  } catch (error: unknown) {
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof z.ZodError) {
      console.log('Validation error:', error.errors);
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add book" },
      { status: 500 }
    );
  }
}
