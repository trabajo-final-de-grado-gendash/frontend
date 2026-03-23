# Phase 0: Research & Technical Decisions (TFG-12)

## Frontend Framework
- **Decision**: React with Vite
- **Rationale**: User explicitly requested React with Vite. Vite provides extremely fast HMR and optimized builds, ideal for iterating quickly. React's component model fits the Component-Driven constitution principle perfectly.
- **Alternatives considered**: Next.js (rejected because SSR/SSG is not immediately necessary for an authenticated/internal BI dashboard MVP, and Vite is simpler to set up for a pure SPA).

## Styling
- **Decision**: Tailwind CSS
- **Rationale**: User explicitly requested Tailwind CSS. It enables rapid UI development and ensures consistent design tokens without managing separate CSS files.
- **Alternatives considered**: CSS Modules, Styled Components.

## Charting Library
- **Decision**: Plotly.js (`react-plotly.js`)
- **Rationale**: User explicitly requested Plotly.js. It is highly capable for scientific and BI charting, supports declarative JSON configurations (perfect for LLM generation), and has a React wrapper.
- **Alternatives considered**: Recharts, Chart.js.

## Data Storage & State Management
- **Decision**: Zustand for UI state + Repository Pattern for mocked API calls.
- **Rationale**: User requested mock data in memory while keeping the architecture open for a real DB later. The Repository pattern (`IChatService`, `IChartService`) abstracts the data origin. Zustand provides a lightweight global store so that navigation between the chat view and the gallery doesn't trigger redundant data fetching or prop drilling.
- **Alternatives considered**: React Context (rejected for potential re-rendering issues at scale), Redux (overkill for an MVP).

## Routing & Navigation
- **Decision**: React Router DOM (v6+)
- **Rationale**: The application has distinct views (Linear Chat, Gallery Dashboard, Groups). A routing library allows for deep linking and logical separation of the UI components.

## Markdown Rendering
- **Decision**: `react-markdown`
- **Rationale**: AI chat responses typically contain markdown formatting (bold, lists, code blocks). To render them correctly and safely inside the chat bubbles, a dedicated markdown parser is necessary.
