# Smart Expense Tracker

A full-stack web application for tracking income and expenses, organizing transactions, and reviewing spending patterns.

## Features

- Add, edit, and delete transactions
- Track income and expenses separately
- Categorize expenses automatically or manually
- View transaction history across different months
- Filter transactions by month
- Import transactions from CSV files
- Export transaction data to CSV and PDF
- Store transactions using a backend and SQLite database
- Responsive dashboard for different screen sizes

## Tech Stack

**Frontend:** React, Vite, JavaScript, CSS  
**Backend:** Node.js, Express.js  
**Database:** SQLite

## Getting Started

### Prerequisites

- Node.js and npm
- Visual Studio Code (optional)

### Run the Backend

Open a terminal in the project root:

```bash
cd server
npm install
node server.js
```

### Run the Frontend

Open a second terminal in the project root:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## Production Build

From the `client` folder, run:

```bash
npm run build
```

The production files are generated in the `client/dist` directory.

## Future Improvements

- Add user authentication
- Improve spending insights and reports
- Deploy the application online

## Author

Developed as a personal full-stack web development project.
