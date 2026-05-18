// ── Request payload — JSON 'data' part of the multipart submission ────────────
export interface KycSubmitData {
  verificationType: 'PAN_BASED' | 'AADHAAR_BASED';
  verifiedName: string;
  verifiedDob: string;        // ISO date "YYYY-MM-DD"
  documentNumber: string;
}

// ── Response DTOs (matches backend KycDocumentResponse) ──────────────────────
export interface KycDocumentResponse {
  id: number;
  verificationType: 'PAN_BASED' | 'AADHAAR_BASED';
  verifiedName: string | null;
  verifiedDob: string | null;
  documentNumber: string;
  fileName: string;
  fileReference: string;
  documentMimeType: string | null;
  documentUrl: string | null;         // e.g. /kyc/document/123
  uploadedAt: string;
  documentType: 'ID_PROOF' | 'ADDRESS_PROOF' | null;  // legacy field
}

export interface KycResponse {
  id: number;
  userId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestType: string;
  reviewRemarks: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  documents: KycDocumentResponse[];
}
