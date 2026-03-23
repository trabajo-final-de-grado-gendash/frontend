# Quickstart: BI Chat Frontend

This guide outlines how the frontend project will be set up and run.

## Setup

```bash
# Initialize Vite React Project
npm create vite@latest . -- --template react-ts

# Install Dependencies
npm install

# Install TailwindCSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install Utilities, State Management & Routing
npm install react-router-dom zustand react-markdown uuid
npm install -D @types/uuid

# Install Plotly
npm install plotly.js react-plotly.js
npm install -D @types/react-plotly.js
```

## Running the Application

```bash
# Start the development server
npm run dev
```

## Architecture Notes
- Run the mock services by default.
- UI Components are located in `src/components/`.
- Repositories/Services are located in `src/services/`.
