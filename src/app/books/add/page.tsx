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
import { toast } from "sonner";
import { libraryDB } from "@/lib/indexedDB";
import { v4 as uuidv4 } from "uuid";
import { Loader2 } from "lucide-react";

const isValidISBN = (isbn: string) => {
  // Basic ISBN validation (can be enhanced)
  return /^(?:\d{10}|\d{13})$/.test(isbn.replace(/-/g, ""));
};

export default function AddBookPage() {
  const [loading, setLoading] = useState(false);
  const [bookData, setBookData] = useState({
    title: "",
    author: "",
    isbn: "",
    quantity: 1,
  });

  const handleSubmit = async () => {
    // Enhanced validation
    if (!bookData.title.trim()) {
      toast.error("Book title is required");
      return;
    }

    if (!bookData.author.trim()) {
      toast.error("Author name is required");
      return;
    }

    if (!isValidISBN(bookData.isbn)) {
      toast.error("Please enter a valid ISBN (10 or 13 digits)");
      return;
    }

    if (bookData.quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    setLoading(true);
    try {
      const bookPayload = {
        title: bookData.title.trim(),
        author: bookData.author.trim(),
        isbn: bookData.isbn.replace(/-/g, ""),
        quantity: bookData.quantity,
        availableQuantity: bookData.quantity,
        status: "available" as const,
      };

      // Always try server first when online
      if (navigator.onLine) {
        console.log("Sending book data to server:", bookPayload);

        const response = await fetch("/api/books", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(bookPayload),
        });

        console.log("Server response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Server error response:", errorData);
          throw new Error(
            typeof errorData.error === "string"
              ? errorData.error
              : "Failed to add book"
          );
        }

        const serverBook = await response.json();
        console.log("Server response data:", serverBook);

        // Add to IndexedDB after successful server save
        await libraryDB.addBook(serverBook);
      } else {
        // Offline mode
        await libraryDB.addBook({
          ...bookPayload,
          id: uuidv4(),
        });
      }

      toast.success("Book added successfully");

      // Reset form
      setBookData({
        title: "",
        author: "",
        isbn: "",
        quantity: 1,
      });
    } catch (error) {
      console.error("Error adding book:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add book"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Book</CardTitle>
          <CardDescription>
            Add a new book to the library catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="title">Title</label>
              <Input
                id="title"
                value={bookData.title}
                onChange={(e) =>
                  setBookData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter book title"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="author">Author</label>
              <Input
                id="author"
                value={bookData.author}
                onChange={(e) =>
                  setBookData((prev) => ({ ...prev, author: e.target.value }))
                }
                placeholder="Enter author name"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="isbn">ISBN</label>
              <Input
                id="isbn"
                value={bookData.isbn}
                onChange={(e) =>
                  setBookData((prev) => ({ ...prev, isbn: e.target.value }))
                }
                placeholder="Enter ISBN"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="quantity">Quantity</label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={bookData.quantity}
                onChange={(e) =>
                  setBookData((prev) => ({
                    ...prev,
                    quantity: parseInt(e.target.value) || 1,
                  }))
                }
                disabled={loading}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Book...
                </>
              ) : (
                "Add Book"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
