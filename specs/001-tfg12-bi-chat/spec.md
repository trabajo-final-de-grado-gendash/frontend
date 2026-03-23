# Feature Specification: BI Chat Frontend (TFG-12)

**Feature Branch**: `001-tfg12-bi-chat`  
**Created**: 2026-03-23  
**Status**: Draft  
**Input**: User description: "Vamos crear el front de gendash, estamos cumpliendo con la tarea de jira TFG-12, el front debe ser amigable, algo similar a las herramientas de chat existentes hoy en dia (chatgpt, gemini, etc) pero en lo que tiene que diferenciarse, es en que su fuerte seran los graficos que permitira hacer, debes tener un historial de chats, pero a la vez debes poder ver todos los graficos creados de manera intuitiva y la vez poder navegar entre ellos, tambien debe ser posible clasificarlos, osea agruparlos. Debes manejar los errores y mostrar que esta cargando cuando esta tardando"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Conversational Chart Generation (Priority: P1)

As a user, I want to ask questions in natural language and receive business intelligence charts directly in the chat interface, so I can analyze data conversationally.

**Why this priority**: This is the core differentiator and primary interaction mode of the application.

**Independent Test**: Can be fully tested by submitting a text prompt and verifying that a chart renders in the response window with appropriate loading states beforehand.

**Acceptance Scenarios**:

1. **Given** an empty chat input, **When** the user types a query like "Show me sales by region" and submits, **Then** a loading indicator appears in the chat stream.
2. **Given** a loading state, **When** the backend successfully returns chart data, **Then** an interactive chart is rendered directly in the chat message bubble.
3. **Given** a user submitting a query, **When** the backend fails or returns an error, **Then** a user-friendly error message is displayed in the chat without breaking the application.

---

### User Story 2 - Chart Gallery and Navigation (Priority: P1)

As a user, I want to intuitively view and navigate through all the charts I have created across my sessions, so I can quickly find previous insights without scrolling through long chat histories.

**Why this priority**: The user explicitly requested an intuitive way to view all created charts as a key differentiator.

**Independent Test**: Can be tested by verifying that generated charts appear in a dedicated gallery/view outside of the linear chat flow.

**Acceptance Scenarios**:

1. **Given** multiple charts generated in chat, **When** the user opens the "Charts Gallery", **Then** all generated charts are visible as thumbnails or interactive cards.
2. **Given** the chart gallery, **When** the user clicks on a particular chart, **Then** it maximizes or focuses, allowing detailed viewing.

---

### User Story 3 - Chart Classification and Grouping (Priority: P2)

As a user, I want to classify and group my generated charts, so I can organize insights by topic, project, or department constraint.

**Why this priority**: Organization becomes necessary once the user has generated many charts, but the core generation must exist first.

**Independent Test**: Can be tested by creating a group/folder and assigning a chart to it.

**Acceptance Scenarios**:

1. **Given** a generated chart, **When** the user selects "Group", **Then** they can assign it to an existing group or create a new one.
2. **Given** a populated group, **When** the user filters by that group, **Then** only charts assigned to that group are displayed in the gallery.

---

### User Story 4 - Chat History Management (Priority: P2)

As a user, I want to view my past chat sessions, so I can resume previous conversations and context.

**Why this priority**: Standard feature for modern AI chat tools, necessary for continuity.

**Independent Test**: Can be tested by creating a new chat, navigating away, and reopening it from a sidebar/list.

**Acceptance Scenarios**:

1. **Given** an ongoing session, **When** the user starts a "New Chat", **Then** the current session is saved to a history list.
2. **Given** a history list, **When** the user selects a past chat, **Then** the chat stream is restored with all its previous messages and charts.

### Edge Cases

- What happens when the AI returns a valid response but it cannot be rendered as a chart (e.g., just text)?
- How does the system handle extremely large datasets for charting that might slow down the browser?
- What happens if the connection drops while waiting for a chart generation?
- How are grouping names validated to avoid duplicates or invalid characters?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a text input interface for natural language queries.
- **FR-002**: System MUST display a clear "loading" visual indicator while waiting for the AI/backend response.
- **FR-003**: System MUST render BI charts (e.g., bar, line, pie) dynamically within the chat stream.
- **FR-004**: System MUST handle request failures or malformed responses gracefully with a clear, non-technical error message in the chat.
- **FR-005**: System MUST provide a persistent or accessible view/gallery of all historically generated charts.
- **FR-006**: System MUST allow users to navigate between previously generated charts in the gallery.
- **FR-007**: System MUST provide functionality to group (classify/tag/folder) charts into user-defined collections.
- **FR-008**: System MUST maintain and display a history of distinct chat sessions.
- **FR-009**: System MUST allow users to resume previous chat sessions.
- **FR-010**: System MUST persist the state of charts and groupings locally (e.g., Local Storage / IndexedDB), but implemented through an abstraction layer so it can be easily replaced by a backend database in the future.

### Key Entities *(include if feature involves data)*

- **ChatSession**: Represents a continuous conversation thread. Contains messages (text and charts).
- **ChartAsset**: Represents a generated BI chart. Contains the configuration data required to render it, a reference to the prompt that generated it, and its grouping metadata.
- **ChartGroup**: Represents a user-defined collection/classification of ChartAssets.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully generate a chart from a natural language prompt.
- **SC-002**: Users receive visual feedback (loading state) within 1 second of submitting a prompt.
- **SC-003**: In case of a failure, users see an error message within the chat rather than a system crash 100% of the time.
- **SC-004**: Users can organize at least 1 chart into a user-defined group.
- **SC-005**: Users can navigate to a previously generated chart outside of the main chat flow in fewer than 3 clicks.
