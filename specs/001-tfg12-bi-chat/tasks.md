# Tasks: BI Chat Frontend (TFG-12)

**Input**: Design documents from `/specs/001-tfg12-bi-chat/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize React project with Vite (TypeScript template) in `/Users/naranjax/up/tfg/frontend`
- [ ] T002 Install dependencies: `tailwindcss`, `plotly.js`, `react-plotly.js`, `react-router-dom`, `zustand`, `react-markdown`, `uuid`
- [ ] T003 Configure TailwindCSS and basic generic styling (`src/index.css`, `tailwind.config.js`)
- [ ] T004 Create base project folder structure (`src/components`, `src/services`, `src/models`, `src/hooks`, `src/layouts`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [P] Define data models (`ChatSession`, `ChatMessage`, `ChartAsset`, `ChartGroup`) in `src/models/types.ts`
- [ ] T006 [P] Define service interfaces (`IChatService`, `IChartService`) in `src/services/interfaces.ts`
- [ ] T007 Implement `MockChatService` in `src/services/repositories/MockChatService.ts`
- [ ] T008 Implement `MockChartService` in `src/services/repositories/MockChartService.ts`
- [ ] T009 Create Zustand stores (`useChatStore.ts`, `useChartStore.ts`) in `src/hooks/`
- [ ] T010 Implement routing setup (`react-router-dom`) in `src/App.tsx` and `src/routes.tsx`
- [ ] T011 Create base `MainLayout` component (Sidebar + Content area) in `src/layouts/MainLayout.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Conversational Chart Generation (Priority: P1) 🎯 MVP

**Goal**: As a user, I want to ask questions in natural language and receive BI charts directly in the chat interface.

**Independent Test**: User can type a query, see a loading indicator, and a chart appears in the chat message bubble.

### Implementation for User Story 1

- [ ] T012 [P] [US1] Create `ChatInput` component with text area and submit button in `src/components/chat/ChatInput.tsx`
- [ ] T013 [P] [US1] Create `ChatMessage` component integrating `react-markdown` in `src/components/chat/ChatMessage.tsx`
- [ ] T014 [P] [US1] Create `ChartContainer` component (loads chart by ID and renders Plotly) in `src/components/charts/ChartContainer.tsx`
- [ ] T015 [US1] Assemble `ChatView` page combining input and message list in `src/components/chat/ChatView.tsx`
- [ ] T016 [US1] Wire `ChatInput` to `useChatStore` to trigger mock AI responses (with simulated delays and loading states)
- [ ] T017 [US1] Implement resilient error handling in `ChartContainer` if chart config is invalid

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Chart Gallery and Navigation (Priority: P1)

**Goal**: As a user, I want to intuitively view and navigate through all charts across sessions.

**Independent Test**: User can navigate to `/gallery` and see all previously generated charts outside of the chat flow.

### Implementation for User Story 2

- [ ] T018 [P] [US2] Create `ChartThumbnail` component in `src/components/gallery/ChartThumbnail.tsx`
- [ ] T019 [US2] Create `GalleryView` page component in `src/components/gallery/GalleryView.tsx`
- [ ] T020 [US2] Wire `GalleryView` to `useChartStore` to fetch and display multiple `ChartAsset`s
- [ ] T021 [US2] Add navigation linking gallery item to a full-screen or expanded chart view

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 4 - Chat History Management (Priority: P2)

**Goal**: View past chat sessions and resume them.

**Independent Test**: User can select a previous session from a sidebar and see the restored chat log.

### Implementation for User Story 4

- [ ] T022 [P] [US4] Create `SidebarHistory` component in `src/components/common/SidebarHistory.tsx`
- [ ] T023 [US4] Implement "New Chat" action clearing active session state
- [ ] T024 [US4] Wire `SidebarHistory` to fetch sessions and update the Router to `/chat/:sessionId`
- [ ] T025 [US4] Update `ChatView` to load session data based on URL parameter

**Checkpoint**: Main chat workflows and history are functional.

---

## Phase 6: User Story 3 - Chart Classification and Grouping (Priority: P2)

**Goal**: Classify and group generated charts.

**Independent Test**: User can create a group, assign a chart to it, and filter the gallery by that group.

### Implementation for User Story 3

- [ ] T026 [P] [US3] Create `GroupManager` UI in `src/components/gallery/GroupManager.tsx`
- [ ] T027 [US3] Add group assignment controls to `ChartThumbnail` or gallery items
- [ ] T028 [US3] Implement gallery filtering logic by `groupId` in `GalleryView.tsx`
- [ ] T029 [US3] Wire UI actions to `MockChartService.createGroup` and `assignChartToGroup`

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T030 Add comprehensive loading spinners across components
- [ ] T031 Add global Error Boundary to gracefully catch rendering crashes
- [ ] T032 Verify responsive styling with Tailwind for mobile/desktop layouts
