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
- **Decision**: In-memory mocked data via a Repository Pattern abstraction.
- **Rationale**: User explicitly requested mock data in memory for now, but with the constraint that it must be easily swappable to a database later. The Repository pattern ensures that UI components call `ChatRepository.getHistory()` instead of accessing local arrays directly. By defining an interface, the implementation can be swapped to a real API later.
- **Alternatives considered**: LocalStorage/IndexedDB (initially considered, but user opted for simple in-memory mocks first, keeping the abstraction open).
