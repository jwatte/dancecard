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
├── src/               # All TypeScript files
│   ├── main.ts        # Main TypeScript entry point
│   ├── assets/        # Static assets
│   │   ├── sample.csv       # Sample participant CSV
│   │   └── events-sample.csv # Sample event CSV
│   └── test/          # Test files
├── index.html        # Main HTML entry point
├── dist/             # Compiled output (generated)
├── package.json      # Project configuration
├── tsconfig.json     # TypeScript configuration
└── vite.config.ts    # Vite configuration
```