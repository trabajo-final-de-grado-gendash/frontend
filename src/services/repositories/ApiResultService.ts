/**
 * ApiResultService.ts — Llamadas REST para edición y regeneración de resultados.
 *
 * TFG-56: patchChartMetadata  → PATCH /api/v1/results/{result_id}/metadata
 * TFG-57: postRegenerateChart → POST  /api/v1/results/{result_id}/regenerate
 */
import { apiRequest } from './apiClient';

// ── PATCH /metadata ──────────────────────────────────────────────────────────

export interface UpdateMetadataPayload {
  title?: string;
  xaxis_title?: string;
  yaxis_title?: string;
}

export interface UpdateMetadataResponse {
  result_id: string;
  updated_fields: string[];
  plotly_json: Record<string, unknown>;
}

export async function patchChartMetadata(
  resultId: string,
  payload: UpdateMetadataPayload,
): Promise<UpdateMetadataResponse> {
  return apiRequest<UpdateMetadataResponse>(
    `/api/v1/results/${resultId}/metadata`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  );
}

// ── POST /regenerate ─────────────────────────────────────────────────────────

export interface RegeneratePayload {
  prompt: string;
}

export interface RegenerateResponse {
  result_id: string;
  plotly_json: Record<string, unknown>;
  plotly_code: string;
  chart_type: string;
}

export async function postRegenerateChart(
  resultId: string,
  payload: RegeneratePayload,
): Promise<RegenerateResponse> {
  return apiRequest<RegenerateResponse>(
    `/api/v1/results/${resultId}/regenerate`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
}
