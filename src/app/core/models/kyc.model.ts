// ── Request DTOs (matches backend KycDocumentRequest exactly) ──────────────
export interface KycDocumentRequest {
  documentType: 'ID_PROOF' | 'ADDRESS_PROOF';
  documentNumber: string;
  fileName: string;       // @NotBlank in backend
  fileReference: string;  // @NotBlank in backend
}

export interface KycSubmitRequest {
  documents: KycDocumentRequest[];
}

// ── Response DTOs (matches backend KycResponse / KycDocumentResponse) ───────
export interface KycDocumentResponse {
  id: number;
  documentType: 'ID_PROOF' | 'ADDRESS_PROOF';
  fileName: string;
  fileReference: string;
  uploadedAt: string;
}

export interface KycResponse {
  id: number;
  userId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestType: string;
  reviewRemarks: string | null;   // backend field name is reviewRemarks (not remarks)
  submittedAt: string;
  reviewedAt: string | null;
  documents: KycDocumentResponse[];
}
