import React, { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { FiFilter, FiX, FiCheck } from 'react-icons/fi'
import { getAllProfileChangeRequests, approveProfileChangeRequest, rejectProfileChangeRequest } from '../api/api'

// Status Badge Component
function StatusBadge({ status }) {
  const statusMap = {
    pending_approval: { bg: '#fffbeb', text: '#d97706', label: '⏳ Pending Approval' },
    completed: { bg: '#f0fdf4', text: '#16a34a', label: '✓ Approved' },
    rejected: { bg: '#fef2f2', text: '#dc2626', label: '✗ Rejected' },
  }
  const s = statusMap[status] || { bg: '#f1f5f9', text: '#475569', label: status }
  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: s.bg,
        color: s.text,
        fontSize: 11,
        fontWeight: 700,
        borderRadius: 5,
        padding: '4px 10px',
      }}
    >
      {s.label}
    </span>
  )
}

export default function ProfileRequests() {
  const [requests, setRequests] = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending_approval')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [reviewModal, setReviewModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch profile change requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getAllProfileChangeRequests()
      const data = Array.isArray(response.data) ? response.data : response.data?.data || []
      setRequests(data)
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to fetch profile change requests'
      toast.error(msg)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter requests based on status
  useEffect(() => {
    if (filter === 'all') {
      setFilteredRequests(requests)
    } else {
      setFilteredRequests(requests.filter(req => req.status === filter))
    }
  }, [requests, filter])

  // Initial fetch
  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // Format date
  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Get changed fields
  const getChangedFields = (oldData, newData) => {
    const changes = []
    if (oldData) {
      Object.keys(newData).forEach(key => {
        if (oldData[key] !== newData[key]) {
          changes.push({
            field: key,
            oldValue: oldData[key],
            newValue: newData[key],
          })
        }
      })
    }
    return changes
  }

  // Handle approve
  const handleApprove = async () => {
    if (!selectedRequest) return
    try {
      setActionLoading(true)
      await approveProfileChangeRequest(selectedRequest.id, {})
      toast.success('Profile change approved successfully')
      setReviewModal(false)
      setSelectedRequest(null)
      setRejectionReason('')
      fetchRequests()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to approve profile change')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle reject
  const handleReject = async () => {
    if (!selectedRequest) return
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    try {
      setActionLoading(true)
      await rejectProfileChangeRequest(selectedRequest.id, { rejection_reason: rejectionReason })
      toast.success('Profile change rejected successfully')
      setReviewModal(false)
      setSelectedRequest(null)
      setRejectionReason('')
      fetchRequests()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to reject profile change')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div style={{ padding: '30px 40px', background: '#f5f7fb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#003b5c', margin: 0 }}>
          Profile Change Requests
        </h1>
        <p style={{ color: '#6b7280', margin: '8px 0 0 0', fontSize: 14 }}>
          Review and approve pending profile changes
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: '25px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <FiFilter size={18} style={{ color: '#6b7280' }} />
        {['pending_approval', 'completed', 'rejected', 'all'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: filter === status ? '#00b1b4' : '#e5e7eb',
              color: filter === status ? 'white' : '#4b5563',
              transition: 'all 0.2s',
            }}
          >
            {status === 'pending_approval' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <span style={{ marginLeft: '6px' }}>
                ({filteredRequests.filter(r => r.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 16, color: '#6b7280' }}>Loading profile change requests...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRequests.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <div style={{ fontSize: 16, color: '#6b7280' }}>No profile change requests found</div>
        </div>
      )}

      {/* Profile Requests List */}
      {!loading && filteredRequests.length > 0 && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredRequests.map(request => (
            <div
              key={request.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              {/* Left: Request Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
                    {request.requestor?.name || 'N/A'}
                  </h3>
                  <StatusBadge status={request.status} />
                </div>
                <div style={{ display: 'grid', gap: '16px', fontSize: 13 }}>
                  <div>
                    <div style={{ color: '#6b7280', fontWeight: 500, marginBottom: '8px' }}>Changes Requested:</div>
                    <div
                      style={{
                        background: '#f9fafb',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      {request.new_data ? (
                        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                          <tbody>
                            {Object.entries(JSON.parse(typeof request.new_data === 'string' ? request.new_data : JSON.stringify(request.new_data))).map(([key, newValue]) => {
                              const oldValue = request.old_data
                                ? JSON.parse(typeof request.old_data === 'string' ? request.old_data : JSON.stringify(request.old_data))[key]
                                : null
                              return (
                                oldValue !== newValue && (
                                  <tr key={key} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '8px', fontWeight: 600, color: '#6b7280', width: '30%' }}>
                                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </td>
                                    <td style={{ padding: '8px', color: '#dc2626', textDecoration: 'line-through' }}>
                                      {String(oldValue || '-')}
                                    </td>
                                    <td style={{ padding: '8px', color: '#16a34a' }}>
                                      {String(newValue || '-')}
                                    </td>
                                  </tr>
                                )
                              )
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ color: '#6b7280' }}>No changes recorded</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    <div>
                      <div style={{ color: '#6b7280', fontWeight: 500 }}>Requested On</div>
                      <div style={{ color: '#111827', marginTop: '4px' }}>
                        {formatDate(request.createdAt)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#6b7280', fontWeight: 500 }}>Status</div>
                      <div style={{ color: '#111827', marginTop: '4px' }}>
                        {request.status === 'pending_approval'
                          ? 'Awaiting Review'
                          : request.status === 'completed'
                          ? 'Approved'
                          : 'Rejected'}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#6b7280', fontWeight: 500 }}>Reviewed On</div>
                      <div style={{ color: '#111827', marginTop: '4px' }}>
                        {formatDate(request.reviewed_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Action Buttons */}
              {request.status === 'pending_approval' && (
                <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                  <button
                    onClick={() => {
                      setSelectedRequest(request)
                      setRejectionReason('')
                      setReviewModal(true)
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <FiX size={16} />
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(request)
                      setRejectionReason('')
                      setReviewModal(true)
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#f0fdf4',
                      color: '#16a34a',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <FiCheck size={16} />
                    Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && selectedRequest && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setReviewModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '14px',
              padding: '30px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 20px 0' }}>
              Review Profile Change
            </h2>

            <div style={{ display: 'grid', gap: '15px', marginBottom: '25px', fontSize: 13 }}>
              <div>
                <div style={{ color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>Employee</div>
                <div style={{ color: '#111827' }}>{selectedRequest.requestor?.name || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>Email</div>
                <div style={{ color: '#111827' }}>{selectedRequest.requestor?.email || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>Requested Changes:</div>
                <div
                  style={{
                    background: '#f9fafb',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    fontSize: 12,
                  }}
                >
                  {selectedRequest.new_data ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {Object.entries(
                          JSON.parse(
                            typeof selectedRequest.new_data === 'string'
                              ? selectedRequest.new_data
                              : JSON.stringify(selectedRequest.new_data)
                          )
                        ).map(([key, newValue]) => {
                          const oldValue = selectedRequest.old_data
                            ? JSON.parse(
                                typeof selectedRequest.old_data === 'string'
                                  ? selectedRequest.old_data
                                  : JSON.stringify(selectedRequest.old_data)
                              )[key]
                            : null
                          return oldValue !== newValue ? (
                            <tr key={key} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td
                                style={{
                                  padding: '8px',
                                  fontWeight: 600,
                                  color: '#6b7280',
                                  width: '40%',
                                }}
                              >
                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </td>
                              <td
                                style={{
                                  padding: '8px',
                                  color: '#dc2626',
                                  textDecoration: 'line-through',
                                  width: '30%',
                                }}
                              >
                                {String(oldValue || '-')}
                              </td>
                              <td
                                style={{
                                  padding: '8px',
                                  color: '#16a34a',
                                  width: '30%',
                                }}
                              >
                                {String(newValue || '-')}
                              </td>
                            </tr>
                          ) : null
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ color: '#6b7280' }}>No changes recorded</div>
                  )}
                </div>
              </div>
            </div>

            {/* Rejection Reason Input */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#6b7280',
                  fontWeight: 600,
                  fontSize: 13,
                  marginBottom: '8px',
                }}
              >
                Rejection Reason (if rejecting)
              </label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Provide reason for rejection..."
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '80px',
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setReviewModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#6b7280',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                {actionLoading ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                {actionLoading ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
