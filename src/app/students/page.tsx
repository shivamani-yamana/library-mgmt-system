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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { libraryDB } from "@/lib/indexedDB";

interface Record {
  id: string;
  book: {
    id: string;
    title: string;
    author: string;
  };
  status: string;
  checkoutDate: string;
  returnDate?: string;
}

export default function StudentsPage() {
  const [studentEmail, setStudentEmail] = useState("");
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!studentEmail) {
      toast.error("Please enter student email");
      return;
    }

    setLoading(true);
    try {
      const studentRecords = (await libraryDB.getStudentRecords(
        studentEmail
      )) as unknown as Record[];
      setRecords(studentRecords);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to fetch student records"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (bookId: string) => {
    try {
      await returnBook(bookId);
      toast.success("Book returned successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to return book"
      );
    }
  };

  const returnBook = async (bookId: string) => {
    // Check if book is already returned
    const activeCheckout = await libraryDB.getActiveCheckoutForBook(bookId);
    if (!activeCheckout) {
      throw new Error("No active checkout found for this book");
    }

    // Update book status
    await libraryDB.updateBookStatus(bookId, "available");

    // Update the checkout record with return date
    await libraryDB.updateCheckout(activeCheckout.id, {
      ...activeCheckout,
      status: "returned",
      returnDate: new Date(),
    });

    // Refresh records
    const updatedRecords = (await libraryDB.getStudentRecords(
      studentEmail
    )) as unknown as Record[];
    setRecords(updatedRecords);
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Student Records</CardTitle>
          <CardDescription>View student borrowing history</CardDescription>
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
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          {records.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Checkout Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.book.title}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          record.status === "borrowed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {record.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(record.checkoutDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {record.returnDate
                        ? new Date(record.returnDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {record.status === "borrowed" && (
                        <Button
                          size="sm"
                          onClick={() => handleReturn(record.book.id)}
                          disabled={loading}
                        >
                          Return
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
