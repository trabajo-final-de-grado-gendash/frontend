# Data Model: BI Chat Frontend

## Entities

### `ChatSession`
Represents a continuous conversation thread.
- `id: string` (UUID)
- `title: string` (Auto-generated or user-defined)
- `createdAt: Date`
- `updatedAt: Date`
- `messages: ChatMessage[]`

### `ChatMessage`
A single message in a chat session.
- `id: string`
- `role: 'user' | 'assistant' | 'system'`
- `content: string` (The natural language text)
- `timestamp: Date`
- `chartAssetId?: string` (Optional reference if the message contains a chart)
- `status: 'loading' | 'success' | 'error'`

### `ChartAsset`
Represents a generated BI chart.
- `id: string`
- `title: string`
- `type: string` (e.g., 'bar', 'line', 'pie')
- `config: any` (The Plotly.js figure configuration object: `{ data: [], layout: {} }`)
- `prompt: string` (The natural language query that generated it)
- `createdAt: Date`
- `groupId?: string` (Optional reference to a classification group)

### `ChartGroup`
A user-defined collection of charts.
- `id: string`
- `name: string`
- `description?: string`
