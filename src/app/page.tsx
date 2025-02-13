"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  BookOpen,
  UserCheck,
  RotateCw,
  BookCheck,
  BookPlus,
  History,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { libraryDB } from "@/lib/indexedDB";

const Home = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSync = async () => {
    try {
      toast.promise(libraryDB.syncWithServer(), {
        loading: "Syncing data...",
        success: "Sync completed successfully",
        error: (err) => `Sync failed: ${err.message}`,
      });
    } catch (error) {
      console.error("Sync error:", error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Library Management System</CardTitle>
            <CardDescription>
              Librarian portal - Please sign in to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full border border-black">
              <SignedOut>
                <SignInButton />
              </SignedOut>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          Welcome, Librarian {user?.firstName}!
        </h1>
        <div className="flex gap-4 items-center">
          <span
            className={`text-sm ${
              isOnline ? "text-green-600" : "text-red-600"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
          <Button
            onClick={handleSync}
            disabled={!isOnline}
            variant="outline"
            className="flex gap-2"
          >
            <RotateCw className="h-4 w-4" />
            Sync Now
          </Button>
          <Button
            onClick={async () => {
              if (
                window.confirm(
                  "Are you sure you want to clear all local data? This cannot be undone."
                )
              ) {
                try {
                  toast.promise(libraryDB.clearAllData(), {
                    loading: "Clearing local data...",
                    success: "Local data cleared successfully",
                    error: (err) =>
                      `Failed to clear data: ${err.message || "Unknown error"}`,
                  });
                } catch (error) {
                  console.error("Error clearing data:", error);
                }
              }
            }}
            variant="destructive"
            className="flex gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear Local Data
          </Button>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <BookOpen className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Book Checkout</CardTitle>
            <CardDescription>
              Process book borrowing for students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/checkout">Checkout Books</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <BookCheck className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Book Check-in</CardTitle>
            <CardDescription>Process returned books</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/checkin">Check-in Books</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <UserCheck className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Student Records</CardTitle>
            <CardDescription>View borrowing history by student</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/students">View Records</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <BookPlus className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Add Book</CardTitle>
            <CardDescription>Add new books to catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/books/add">Add New Book</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <History className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Borrowing History</CardTitle>
            <CardDescription>View complete borrowing history</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/history">View History</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <BookOpen className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Book Catalog</CardTitle>
            <CardDescription>View all books in the library</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/books">View Books</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
