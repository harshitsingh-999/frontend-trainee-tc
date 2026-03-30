import React, { useState, useEffect } from 'react'
import { getAllDocuments, reviewDocument } from '../../api/api'
import toast from 'react-hot-toast'

function DocumentApproval() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('pending')
  const [reviewingId, setReviewingId] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [approvalAction, setApprovalAction] = useState(null)

  const fetchDocuments = async (status = filter) => {
    setLoading(true)
    try {
      const res = await getAllDocuments(status)
      const data = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []
      setDocuments(data)
    } catch (err) {
      toast.error('Failed to load documents')
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const handleReview = async (id, status) => {
    setReviewingId(id)
    setApprovalAction(status)
  }

  const submitReview = async () => {
    if (!reviewingId || !approvalAction) return

    try {
      await reviewDocument(reviewingId, {
        status: approvalAction,
        admin_note: reviewNote,
      })

      toast.success(`Document ${approvalAction}`)
      setDocuments(prev => prev.filter(d => d.id !== reviewingId))
      setReviewingId(null)
      setReviewNote('')
      setApprovalAction(null)
      fetchDocuments()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to review document')
    }
  }

  const cancelReview = () => {
    setReviewingId(null)
    setReviewNote('')
    setApprovalAction(null)
  }

  const getDocTypeLabel = (docType) => {
    const labels = {
      '10th_marksheet': '10th Marksheet',
      '12th_marksheet': '12th Marksheet',
      aadhar: 'Aadhar Card',
      pan_card: 'PAN Card',
      other: 'Other',
    }
    return labels[docType] || docType
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2>Document Approval</h2>
        <p style={{ color: '#6b7280' }}>Review and approve/decline documents submitted by interns</p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
        {['pending', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '8px 16px',
              background: filter === status ? '#3b82f6' : '#f3f4f6',
              color: filter === status ? '#fff' : '#374151',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Documents List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading...</div>
      ) : documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, background: '#f9fafb', borderRadius: 8, color: '#6b7280' }}>
          <p>No {filter} documents</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {documents.map(doc => (
            <div key={doc.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
              {reviewingId === doc.id ? (
                // Review Modal
                <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                  <h4 style={{ margin: '0 0 12px 0' }}>
                    {approvalAction === 'approved' ? 'Approve' : 'Decline'} Document
                  </h4>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
                      Admin Notes (Optional)
                    </label>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Add any notes about this decision..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: 8,
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontFamily: 'inherit',
                        fontSize: 14,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={submitReview}
                      style={{
                        padding: '8px 16px',
                        background: approvalAction === 'approved' ? '#10b981' : '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Confirm {approvalAction === 'approved' ? 'Approval' : 'Decline'}
                    </button>
                    <button
                      onClick={cancelReview}
                      style={{
                        padding: '8px 16px',
                        background: '#e5e7eb',
                        color: '#374151',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Document View
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: '#1f2937' }}>
                        {doc.intern?.name || 'Unknown Intern'}
                      </h4>
                      <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                        {doc.intern?.email}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: '4px 12px',
                        background: '#f3f4f6',
                        color: '#374151',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {doc.status || 'pending'}
                    </span>
                  </div>

                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 12 }}>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, color: '#374151' }}>Document Type:</span>
                      <span style={{ marginLeft: 8, color: '#6b7280' }}>{getDocTypeLabel(doc.doc_type)}</span>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, color: '#374151' }}>File Name:</span>
                      <span style={{ marginLeft: 8, color: '#6b7280' }}>{doc.original_name}</span>
                    </div>
                    {doc.admin_note && (
                      <div>
                        <span style={{ fontWeight: 600, color: '#374151' }}>Admin Note:</span>
                        <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>{doc.admin_note}</p>
                      </div>
                    )}
                  </div>

                  {doc.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={() => handleReview(doc.id, 'approved')}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          background: '#10b981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleReview(doc.id, 'rejected')}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        ✕ Decline
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DocumentApproval
