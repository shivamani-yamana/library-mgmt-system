# Library Management System

A modern, offline-first library management system built for **Room to Read India** to digitize the check-in/check-out process for school libraries. The system is designed to work seamlessly offline, sync data when online, and provide a user-friendly interface for teachers with varying levels of digital literacy.

---

## Features

- **Offline-First Design**: Works without an internet connection and syncs data when online.
- **Role-Based Access Control**:
  - **Teachers**: Can check-in/check-out books.
  - **Admins**: Can manage books, view analytics, and manage students.
- **Book Catalog**: Search and filter books by GROWBY level, genre, and language.
- **Check-In/Check-Out**: Simple and intuitive interface for managing book transactions.
- **Analytics Dashboard**: Admins can view reading trends, popular books, and more.
- **Responsive Design**: Works on desktops, tablets, and mobile devices.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Database**: Neon DB (Serverless Postgres)
- **ORM**: Prisma
- **Authentication**: Clerk
- **Offline Storage**: IndexedDB (via localForage)
- **Analytics**: Chart.js

---


## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (or use Neon DB)
- Clerk account for authentication

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/library-management-system.git
   cd library-management-system
