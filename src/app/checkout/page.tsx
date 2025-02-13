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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkout, Book, libraryDB } from "@/lib/indexedDB";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

export default function CheckoutPage() {
  const [selectedBook, setSelectedBook] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  // Load available books on component mount
  useState(() => {
    libraryDB.getAvailableBooks().then(setBooks);
  });

  const handleCheckout = async () => {
    if (!selectedBook || !studentEmail) {
      toast.error("Please select a book and enter student email");
      return;
    }

    setLoading(true);
    try {
      const checkout: Checkout = {
        id: uuidv4(),
        bookId: selectedBook,
        studentEmail,
        checkoutDate: new Date(),
        status: "borrowed" as const,
        synced: false,
      };

      await libraryDB.addCheckout(checkout);
      await libraryDB.updateBookStatus(selectedBook, "borrowed");

      toast.success("Book checked out successfully. Will sync when online.");

      // Reset form
      setSelectedBook("");
      setStudentEmail("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to checkout book"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Book Checkout</CardTitle>
          <CardDescription>Process a new book checkout</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label>Book</label>
            <Select value={selectedBook} onValueChange={setSelectedBook}>
              <SelectTrigger>
                <SelectValue placeholder="Select a book" />
              </SelectTrigger>
              <SelectContent>
                {books.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.title} - {book.author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label>Student Email</label>
            <Input
              type="email"
              placeholder="student@example.com"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
            />
          </div>

          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Processing..." : "Checkout Book"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
