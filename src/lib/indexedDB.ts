declare global {
  interface Window {
    libraryDB: LibraryDB;
  }
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  quantity: number;
  availableQuantity: number;
  status: 'available' | 'borrowed';
  createdAt?: Date;
}

export interface Checkout {
  id: string;
  bookId: string;
  studentEmail: string;
  checkoutDate: Date;
  returnDate?: Date | null;
  status: 'borrowed' | 'returned';
  synced: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Add this new interface for history records
export interface BorrowingRecord {
  id: string;
  studentEmail: string;
  status: string;
  checkoutDate: Date;
  returnDate?: Date;
  book: {
    title: string;
    author: string;
  };
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  createdAt?: Date;
}

export interface OfflineSync {
  id: string;
  userId: string;
  bookId: string;
  action: string;
  synced: boolean;
  createdAt?: Date;
}

const DB_NAME = 'LibraryDB';
const DB_VERSION = 1;

export class LibraryDB {
  private db: IDBDatabase | null = null;

  async init() {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Books store
        if (!db.objectStoreNames.contains('books')) {
          const bookStore = db.createObjectStore('books', { keyPath: 'id' });
          bookStore.createIndex('title', 'title', { unique: false });
          bookStore.createIndex('isbn', 'isbn', { unique: true });
          bookStore.createIndex('status', 'status', { unique: false });
        }

        // Checkouts store
        if (!db.objectStoreNames.contains('checkouts')) {
          const checkoutStore = db.createObjectStore('checkouts', { keyPath: 'id' });
          checkoutStore.createIndex('studentEmail', 'studentEmail', { unique: false });
          checkoutStore.createIndex('syncedAt', 'syncedAt', { unique: false });
        }

        // Users store
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }

        // OfflineSync store
        if (!db.objectStoreNames.contains('offlineSyncs')) {
          db.createObjectStore('offlineSyncs', { keyPath: 'id' });
        }
      };
    });
  }

  async addBook(book: Book): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['books'], 'readwrite');
      const store = transaction.objectStore('books');
      const request = store.add({
        ...book,
        createdAt: new Date()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async addCheckout(checkout: Checkout) {
    await this.init();
    console.log('Adding checkout:', checkout);
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['checkouts'], 'readwrite');
      const store = transaction.objectStore('checkouts');
      const request = store.add({
        ...checkout,
        createdAt: new Date(),
        updatedAt: new Date(),
        synced: false
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedCheckouts(): Promise<Checkout[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['checkouts'], 'readonly');
      const store = transaction.objectStore('checkouts');
      const index = store.index('syncedAt');
      const request = index.getAll(IDBKeyRange.only(undefined));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAvailableBooks(): Promise<Book[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['books'], 'readonly');
      const store = transaction.objectStore('books');
      const index = store.index('status');
      const request = index.getAll('available');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateBookStatus(bookId: string, status: 'available' | 'borrowed') {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['books'], 'readwrite');
      const store = transaction.objectStore('books');
      const request = store.get(bookId);

      request.onsuccess = () => {
        const book = request.result;
        book.status = status;
        store.put(book);
        resolve(book);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getBorrowedBooksByStudent(studentEmail: string): Promise<Book[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['checkouts', 'books'], 'readonly');
      const checkoutStore = transaction.objectStore('checkouts');
      const bookStore = transaction.objectStore('books');
      const index = checkoutStore.index('studentEmail');
      const request = index.getAll(studentEmail);

      request.onsuccess = async () => {
        const checkouts = request.result;
        const borrowedBooks = await Promise.all(
          checkouts
            .filter(c => c.status === 'borrowed')
            .map(c => new Promise<Book>((resolve) => {
              const bookRequest = bookStore.get(c.bookId);
              bookRequest.onsuccess = () => resolve(bookRequest.result);
            }))
        );
        resolve(borrowedBooks);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getStudentRecords(studentEmail: string) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['checkouts', 'books'], 'readonly');
      const checkoutStore = transaction.objectStore('checkouts');
      const bookStore = transaction.objectStore('books');
      const index = checkoutStore.index('studentEmail');
      const request = index.getAll(studentEmail);

      request.onsuccess = async () => {
        const checkouts = request.result;
        const records = await Promise.all(
          checkouts.map(async checkout => ({
            ...checkout,
            book: await new Promise(resolve => {
              const bookRequest = bookStore.get(checkout.bookId);
              bookRequest.onsuccess = () => resolve(bookRequest.result);
            })
          }))
        );
        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getBookByISBN(isbn: string): Promise<Book | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['books'], 'readonly');
      const store = transaction.objectStore('books');
      const index = store.index('isbn');
      const request = index.get(isbn);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async canBorrowBook(studentEmail: string, bookId: string): Promise<boolean> {
    const checkouts = await this.getStudentActiveCheckouts(studentEmail);
    return !checkouts.some(checkout => checkout.bookId === bookId);
  }

  async getStudentActiveCheckouts(studentEmail: string): Promise<Checkout[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['checkouts'], 'readonly');
      const store = transaction.objectStore('checkouts');
      const index = store.index('studentEmail');
      const request = index.getAll(studentEmail);

      request.onsuccess = () => {
        const checkouts = request.result;
        resolve(checkouts.filter(c => c.status === 'borrowed'));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllRecords(): Promise<BorrowingRecord[]> {
    await this.init();
    return new Promise<BorrowingRecord[]>((resolve, reject) => {
      const transaction = this.db!.transaction(['checkouts', 'books'], 'readonly');
      const checkoutStore = transaction.objectStore('checkouts');
      const bookStore = transaction.objectStore('books');
      const request = checkoutStore.getAll();

      request.onsuccess = async () => {
        const checkouts = request.result;
        const records = await Promise.all(
          checkouts.map(async checkout => ({
            id: checkout.id,
            studentEmail: checkout.studentEmail,
            status: checkout.status,
            checkoutDate: checkout.checkoutDate,
            returnDate: checkout.returnDate,
            book: await new Promise<{ title: string; author: string }>(resolve => {
              const bookRequest = bookStore.get(checkout.bookId);
              bookRequest.onsuccess = () => resolve({
                title: bookRequest.result.title,
                author: bookRequest.result.author,
              });
            })
          }))
        );
        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async syncWithServer() {
    try {
      console.log('Starting sync process...');
      
      // Get all unsynced checkouts
      const checkouts = await this.getAllCheckouts();
      const unsyncedCheckouts = checkouts.filter(c => !c.synced);
      console.log('Unsynced checkouts:', unsyncedCheckouts);

      const books = await this.getAllBooks();
      console.log('Books to sync:', books);

      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          books, 
          checkouts: unsyncedCheckouts // Only send unsynced checkouts
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Sync response:', result);

      // Mark synced checkouts
      await Promise.all(
        unsyncedCheckouts.map(async (checkout) => {
          await this.updateCheckout(checkout.id, {
            ...checkout,
            synced: true,
          });
        })
      );

      return result;
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  }

  async getAllBooks(): Promise<Book[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['books'], 'readonly');
      const store = transaction.objectStore('books');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCheckouts(): Promise<Checkout[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['checkouts'], 'readonly');
      const store = transaction.objectStore('checkouts');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markCheckoutSynced(checkoutId: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['checkouts'], 'readwrite');
      const store = transaction.objectStore('checkouts');
      const request = store.get(checkoutId);

      request.onsuccess = () => {
        const checkout = request.result;
        checkout.syncedAt = new Date();
        store.put(checkout);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getActiveCheckoutForBook(bookId: string): Promise<Checkout | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['checkouts'], 'readonly');
      const store = transaction.objectStore('checkouts');
      const request = store.getAll();

      request.onsuccess = () => {
        const checkouts = request.result;
        const activeCheckout = checkouts.find(
          c => c.bookId === bookId && c.status === 'borrowed'
        );
        resolve(activeCheckout || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateCheckout(id: string, checkout: Checkout): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['checkouts'], 'readwrite');
      const store = transaction.objectStore('checkouts');
      const request = store.put({
        ...checkout,
        updatedAt: new Date(),
        syncedAt: undefined
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllUsers(): Promise<User[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllOfflineSyncs(): Promise<OfflineSync[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineSyncs'], 'readonly');
      const store = transaction.objectStore('offlineSyncs');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markOfflineSyncSynced(id: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineSyncs'], 'readwrite');
      const store = transaction.objectStore('offlineSyncs');
      const request = store.get(id);

      request.onsuccess = () => {
        const sync = request.result;
        sync.synced = true;
        store.put(sync);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData(): Promise<void> {
    try {
      await this.init();
      console.log('Starting to clear data...');

      return new Promise((resolve, reject) => {
        // Only get existing store names
        const existingStores = Array.from(this.db!.objectStoreNames);
        console.log('Existing stores:', existingStores);

        if (existingStores.length === 0) {
          console.log('No stores to clear');
          resolve();
          return;
        }

        const transaction = this.db!.transaction(existingStores, 'readwrite');

        let completed = 0;
        let hasError = false;

        existingStores.forEach(storeName => {
          console.log(`Clearing ${storeName} store...`);
          const request = transaction.objectStore(storeName).clear();

          request.onsuccess = () => {
            console.log(`Successfully cleared ${storeName} store`);
            completed++;
            if (completed === existingStores.length && !hasError) {
              console.log('All stores cleared successfully');
              resolve();
            }
          };

          request.onerror = () => {
            console.error(`Error clearing ${storeName} store:`, request.error);
            hasError = true;
            reject(request.error);
          };
        });

        transaction.oncomplete = () => {
          console.log('Clear data transaction completed');
          if (!hasError) resolve();
        };

        transaction.onerror = () => {
          console.error('Transaction error:', transaction.error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('Error in clearAllData:', error);
      throw error;
    }
  }

  // Add more methods as needed
}

let libraryDB: LibraryDB;

if (typeof window !== 'undefined') {
  if (!window.libraryDB) {
    window.libraryDB = new LibraryDB();
  }
  libraryDB = window.libraryDB;
} else {
  libraryDB = new LibraryDB();
}

export { libraryDB }; 