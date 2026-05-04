/**
 * ApiResultService.ts — Llamadas REST para edición y regeneración de resultados.
 *
 * TFG-56: patchChartMetadata  → PATCH /api/v1/charts/{chart_id}/metadata
 * TFG-57: postRegenerateChart → POST  /api/v1/charts/{chart_id}/regenerate
 */
import { apiRequest } from './apiClient';

// ── PATCH /metadata ──────────────────────────────────────────────────────────

export interface UpdateMetadataPayload {
  title?: string;
  xaxis_title?: string;
  yaxis_title?: string;
}

export interface UpdateMetadataResponse {
  chart_id: string;
  updated_fields: string[];
  plotly_json: Record<string, unknown>;
}

export async function patchChartMetadata(
  chartId: string,
  payload: UpdateMetadataPayload,
): Promise<UpdateMetadataResponse> {
  return apiRequest<UpdateMetadataResponse>(
    `/api/v1/charts/${chartId}/metadata`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  );
}

// ── POST /regenerate ─────────────────────────────────────────────────────────

export interface RegeneratePayload {
  prompt: string;
  session_id?: string;
}

export interface RegenerateResponse {
  chart_id: string;
  plotly_json: Record<string, unknown>;
  plotly_code: string;
  chart_type: string;
}

export async function postRegenerateChart(
  chartId: string,
  payload: RegeneratePayload,
): Promise<RegenerateResponse> {
  return apiRequest<RegenerateResponse>(
    `/api/v1/charts/${chartId}/regenerate`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
}
