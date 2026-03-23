# Frontend Service Interfaces

To satisfy the constraint of easily swapping the in-memory mock data to a real database in the future, the frontend will define strict service interfaces. UI Components must ONLY interact with these interfaces.

## Interfaces

```typescript
export interface IChatService {
  getSessions(): Promise<ChatSession[]>;
  getSessionById(id: string): Promise<ChatSession | null>;
  createSession(initialMessage: string): Promise<ChatSession>;
  sendMessage(sessionId: string, message: string): Promise<ChatMessage>;
}

export interface IChartService {
  getAllCharts(): Promise<ChartAsset[]>;
  getChartsByGroup(groupId: string): Promise<ChartAsset[]>;
  getChartById(id: string): Promise<ChartAsset | null>;
  createGroup(name: string): Promise<ChartGroup>;
  assignChartToGroup(chartId: string, groupId: string): Promise<void>;
}
```
Currently, these interfaces will be implemented by `MockChatService` and `MockChartService`. In the future, they will be implemented by `ApiChatService` and `ApiChartService`.
