# Dance Card

A single-page self-contained web application with no backend.

## Features

- Two separate CSV file uploaders:
  - Participant data (ID, Name)
  - Event data (Time, Topic, Room)
- CSV data validation
- Sample CSV file downloads
- Responsive two-column layout that adapts to smaller screens
- Display of uploaded data in formatted tables

## Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run a specific test
npm run test:single "test name or pattern"

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type checking
npm run typecheck
```

## Project Structure

```
/
├── src/                     # Source files
│   ├── main.ts              # Main TypeScript entry point
│   ├── dancecard.ts         # Main application logic
│   ├── help.ts              # Help text and documentation
│   ├── parsecsv.ts          # CSV parsing functionality
│   ├── tables.ts            # Table generation and display
│   ├── types.ts             # TypeScript type definitions
│   ├── utils.ts             # Utility functions
│   ├── styles.css           # CSS styles
│   ├── assets/              # Static assets
│   │   ├── sample.csv             # Sample participant CSV
│   │   ├── events-sample.csv      # Sample event CSV
│   │   └── room-capacity-sample.csv # Sample room capacity CSV
│   └── test/                # Test files
│       └── main.test.ts
├── index.html              # Main HTML entry point
├── dist/                   # Compiled output (generated)
├── package.json            # Project configuration
├── tsconfig.json           # TypeScript configuration
├── eslint.config.js        # ESLint configuration
└── vite.config.ts          # Vite configuration
```