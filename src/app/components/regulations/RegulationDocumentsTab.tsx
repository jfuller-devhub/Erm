import React, { useState, useEffect } from 'react';
import { Plus, FileText, Download, Trash2, Upload } from 'lucide-react';
import type { Regulation } from '../../data/regulationData';
import {
  loadRegulationDocuments,
  saveRegulationDocuments,
  getDocumentsForRegulation,
  deleteDocument,
  createDocument,
  formatFileSize,
  type RegulationDocument,
  type DocumentType,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_STYLES,
} from '../../data/regulationDocumentData';
import { DocumentUploadModal } from './DocumentUploadModal';

interface RegulationDocumentsTabProps {
  regulation: Regulation;
}

export function RegulationDocumentsTab({ regulation }: RegulationDocumentsTabProps) {
  const [documents, setDocuments] = useState<RegulationDocument[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const allDocs = loadRegulationDocuments();
    const regulationDocs = getDocumentsForRegulation(allDocs, regulation.id);
    setDocuments(regulationDocs);
  }, [regulation.id]);

  function handleUpload(data: Omit<RegulationDocument, 'id' | 'uploadedDate' | 'uploadedBy' | 'updatedAt' | 'updatedBy'>) {
    const allDocs = loadRegulationDocuments();
    const newDoc = createDocument(allDocs, data);
    const updated = [...allDocs, newDoc];
    saveRegulationDocuments(updated);
    setDocuments(getDocumentsForRegulation(updated, regulation.id));
    setUploadModalOpen(false);
  }

  function handleDelete(id: string) {
    const allDocs = loadRegulationDocuments();
    const updated = deleteDocument(allDocs, id);
    saveRegulationDocuments(updated);
    setDocuments(getDocumentsForRegulation(updated, regulation.id));
    setDeleteConfirmId(null);
  }

  const groupedByType = documents.reduce((acc, doc) => {
    if (!acc[doc.documentType]) acc[doc.documentType] = [];
    acc[doc.documentType].push(doc);
    return acc;
  }, {} as Record<DocumentType, RegulationDocument[]>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '18px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            Documents ({documents.length})
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: '4px 0 0 0',
            }}
          >
            Regulation text, guidance, legal opinions, and supporting materials
          </p>
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
          }}
        >
          <Upload size={16} />
          Upload Document
        </button>
      </div>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: '48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <FileText size={48} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: 0,
            }}
          >
            No documents uploaded yet
          </p>
          <button
            onClick={() => setUploadModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              borderRadius: 'var(--radius-button)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              marginTop: '8px',
            }}
          >
            <Upload size={16} />
            Upload First Document
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {Object.entries(groupedByType).map(([type, docs]) => {
            const typeStyle = DOCUMENT_TYPE_STYLES[type as DocumentType];
            return (
              <div key={type}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '100px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-semibold)',
                      background: typeStyle.background,
                      color: typeStyle.color,
                    }}
                  >
                    {DOCUMENT_TYPE_LABELS[type as DocumentType]}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    {docs.length} {docs.length === 1 ? 'document' : 'documents'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                  {docs.map(doc => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onDelete={() => setDeleteConfirmId(doc.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <DocumentUploadModal
          regulationId={regulation.id}
          onClose={() => setUploadModalOpen(false)}
          onSubmit={handleUpload}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px',
          }}
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--radius-card)',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '18px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: '0 0 12px 0',
              }}
            >
              Delete Document?
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted-foreground)',
                margin: '0 0 24px 0',
              }}
            >
              Are you sure you want to delete this document? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--secondary)',
                  color: 'var(--secondary-foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-button)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--destructive)',
                  color: 'var(--destructive-foreground)',
                  border: 'none',
                  borderRadius: 'var(--radius-button)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Document Card ────────────────────────────────────────────────────────────

function DocumentCard({
  document,
  onDelete,
}: {
  document: RegulationDocument;
  onDelete: () => void;
}) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--elevation-sm)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
          <FileText size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                marginBottom: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={document.fileName}
            >
              {document.fileName}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                color: 'var(--muted-foreground)',
              }}
            >
              {formatFileSize(document.fileSize)} • v{document.version}
              {document.isOfficial && (
                <span
                  style={{
                    marginLeft: '8px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: '#E3F2FD',
                    color: '#1565C0',
                    fontSize: '10px',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  OFFICIAL
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onDelete}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--muted-foreground)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
          title="Delete document"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {document.description && (
        <p
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            color: 'var(--muted-foreground)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {document.description}
        </p>
      )}

      {document.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {document.tags.map(tag => (
            <span
              key={tag}
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '100px',
                fontSize: '11px',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-semibold)',
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '11px',
          color: 'var(--muted-foreground)',
          paddingTop: '8px',
          borderTop: '1px solid var(--border)',
        }}
      >
        Uploaded by {document.uploadedBy} on {new Date(document.uploadedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
    </div>
  );
}
