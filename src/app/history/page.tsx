"use client";

import { useState, useEffect } from "react";
import { libraryDB } from "@/lib/indexedDB";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { BorrowingRecord } from "@/lib/indexedDB";

export default function HistoryPage() {
  const [records, setRecords] = useState<BorrowingRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<BorrowingRecord[]>([]);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const allRecords = await libraryDB.getAllRecords();
    setRecords(allRecords);
    setFilteredRecords(allRecords);
  };

  useEffect(() => {
    let filtered = records;

    // Apply text filter
    if (filter) {
      const searchTerm = filter.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.studentEmail.toLowerCase().includes(searchTerm) ||
          record.book.title.toLowerCase().includes(searchTerm) ||
          record.book.author.toLowerCase().includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => record.status === statusFilter);
    }

    setFilteredRecords(filtered);
  }, [filter, statusFilter, records]);

  const getActionText = (record: BorrowingRecord) => {
    if (record.status === "borrowed") {
      return "Checked Out";
    }
    if (record.status === "returned") {
      return "Returned";
    }
    return record.status;
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Borrowing History</h1>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search by email, book title, or author..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="borrowed">Borrowed</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Student Email</TableHead>
            <TableHead>Book</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Return Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRecords.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                {format(new Date(record.checkoutDate), "MMM d, yyyy")}
              </TableCell>
              <TableCell>{record.studentEmail}</TableCell>
              <TableCell>{record.book.title}</TableCell>
              <TableCell>{record.book.author}</TableCell>
              <TableCell>{getActionText(record)}</TableCell>
              <TableCell>
                {record.returnDate
                  ? format(new Date(record.returnDate), "MMM d, yyyy")
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
