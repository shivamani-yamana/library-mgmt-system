"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { libraryDB } from "@/lib/indexedDB";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BorrowedBook {
  id: string;
  title: string;
  author: string;
}

export default function CheckinPage() {
  const [studentEmail, setStudentEmail] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [loading, setLoading] = useState(false);

  const handleEmailSearch = async () => {
    if (!studentEmail) {
      toast.error("Please enter student email");
      return;
    }

    try {
      const books = await libraryDB.getBorrowedBooksByStudent(studentEmail);
      setBorrowedBooks(books);
      if (books.length === 0) {
        toast.info("No borrowed books found for this student");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to fetch borrowed books"
      );
    }
  };

  const handleCheckin = async () => {
    if (!selectedBook) {
      toast.error("Please select a book to return");
      return;
    }

    setLoading(true);
    try {
      const activeCheckout = await libraryDB.getActiveCheckoutForBook(
        selectedBook
      );
      if (!activeCheckout) {
        throw new Error("No active checkout found for this book");
      }

      await libraryDB.updateCheckout(activeCheckout.id, {
        ...activeCheckout,
        status: "returned",
        returnDate: new Date(),
        synced: false,
      });

      await libraryDB.updateBookStatus(selectedBook, "available");
      toast.success("Book checked in successfully");
      setSelectedBook("");
      setBorrowedBooks((prev) =>
        prev.filter((book) => book.id !== selectedBook)
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to check in book"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Book Check-in</CardTitle>
          <CardDescription>Process a book return</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              type="email"
              placeholder="Student Email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleEmailSearch}>Search</Button>
          </div>

          {borrowedBooks.length > 0 && (
            <div className="space-y-2">
              <label>Select Book to Return</label>
              <Select value={selectedBook} onValueChange={setSelectedBook}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a book" />
                </SelectTrigger>
                <SelectContent>
                  {borrowedBooks.map((book) => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.title} - {book.author}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleCheckin}
                disabled={loading}
                className="w-full mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Check In Book"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
