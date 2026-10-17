# SettleUp — Group Expense Splitter

SettleUp is a full-stack MERN application that helps people manage shared expenses, track group balances, and minimize the number of transactions required to settle debts.

## Features

- Create groups and add members.
- Add expenses and split them among group members.
- Calculate each member's net balance.
- Find the minimum number of transactions required to settle outstanding balances.
- Record completed payments.
- Store group, expense, and settlement data in MongoDB.

## Tech Stack

**Frontend**
- React
- Vite
- JavaScript
- Tailwind CSS

**Backend**
- Node.js
- Express.js
- REST APIs

**Database**
- MongoDB
- Mongoose

## Project Structure

```text
SettleUp/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB Atlas account or a MongoDB instance
- Git (optional)

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd SettleUp
```

### 2. Start the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder and configure your MongoDB connection string and any environment variables required by `server.js`.

Start the backend:

```bash
node server.js
```

The backend runs on port 5000, provided that port is available.

### 3. Start the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your browser.

## How It Works

1. Create a group and add its members.
2. Record expenses and select who paid and who shares the expense.
3. SettleUp calculates each member's net balance.
4. The Settle Up feature calculates a set of payments that minimizes the number of transactions.
5. Record payments as completed to update outstanding balances.

A positive balance means a member should receive money. A negative balance means a member owes money.

## Future Improvements

- User registration and login
- JWT-based authentication
- Improved expense editing and reporting
- Deployment to a public URL
- Automated testing

## Author

Developed as a full-stack web development project using the MERN stack.
