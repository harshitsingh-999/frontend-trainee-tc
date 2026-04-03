import React, { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { FiFilter, FiX, FiCheck } from 'react-icons/fi'
import { getPendingLeaveRequests, approveLeave, rejectLeave, getAllLeaveRequests } from '../api/api'
import { useAuth } from '../context/authcontext.jsx'

// Status Badge Component
function StatusBadge({ status }) {
  const statusMap = {
    pending: { bg: '#fffbeb', text: '#d97706', label: '⏳ Pending' },
    approved: { bg: '#f0fdf4', text: '#16a34a', label: '✓ Approved' },
    rejected: { bg: '#fef2f2', text: '#dc2626', label: '✗ Rejected' },
    cancelled: { bg: '#f3f4f6', text: '#6b7280', label: '⊗ Cancelled' },
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

// Leave Type Badge
function LeaveTypeBadge({ type }) {
  const typeMap = {
    casual: { bg: '#e0f2fe', text: '#0369a1', label: 'Casual' },
    sick: { bg: '#fee2e2', text: '#dc2626', label: 'Sick' },
    emergency: { bg: '#f5e6ff', text: '#7c3aed', label: 'Emergency' },
    personal: { bg: '#fef3c7', text: '#b45309', label: 'Personal' },
    unpaid: { bg: '#f3f4f6', text: '#6b7280', label: 'Unpaid' },
  }
  const t = typeMap[type] || { bg: '#f1f5f9', text: '#475569', label: type }
  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: t.bg,
        color: t.text,
        fontSize: 10,
        fontWeight: 600,
        borderRadius: 4,
        padding: '3px 8px',
      }}
    >
      {t.label}
    </span>
  )
}

export default function LeaveApproval() {
  const { user } = useAuth()
  const [leaves, setLeaves] = useState([])
  const [filteredLeaves, setFilteredLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [reviewModal, setReviewModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Determine user role
  useEffect(() => {
    const roleName = String(user?.role || '').toLowerCase()
    setIsAdmin(Number(user?.role_id) === 1 || roleName === 'admin')
  }, [user])

  // Fetch pending leave requests
  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true)
      let response
      if (isAdmin) {
        // Admins see all leave requests
        response = await getAllLeaveRequests()
      } else {
        // Managers see only pending requests from their team
        response = await getPendingLeaveRequests()
      }
      const data = Array.isArray(response.data) ? response.data : response.data?.data || []
      setLeaves(data)
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to fetch leave requests'
      toast.error(msg)
      setLeaves([])
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  // Filter leaves based on status
  useEffect(() => {
    if (filter === 'all') {
      setFilteredLeaves(leaves)
    } else {
      setFilteredLeaves(leaves.filter(leave => leave.status === filter))
    }
  }, [leaves, filter])

  // Initial fetch
  useEffect(() => {
    fetchLeaves()
  }, [fetchLeaves])

  // Format date
  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getLeaveId = (leave) => (
    leave?.request_id ||
    leave?.leave_request_id ||
    leave?.leaveRequestId ||
    leave?.request?.id ||
    leave?.leave_request?.id ||
    leave?.leaveRequest?.id ||
    leave?.leave_id ||
    leave?.id ||
    leave?.attendance_id
  )

  // Handle approve
  const handleApprove = async () => {
    if (!selectedLeave) return
    try {
      setActionLoading(true)
      await approveLeave(getLeaveId(selectedLeave), {})
      toast.success('Leave approved successfully')
      setReviewModal(false)
      setSelectedLeave(null)
      setRejectionReason('')
      fetchLeaves()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to approve leave')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle reject
  const handleReject = async () => {
    if (!selectedLeave) return
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    try {
      setActionLoading(true)
      await rejectLeave(getLeaveId(selectedLeave), { rejection_reason: rejectionReason })
      toast.success('Leave rejected successfully')
      setReviewModal(false)
      setSelectedLeave(null)
      setRejectionReason('')
      fetchLeaves()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to reject leave')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div style={{ padding: '30px 40px', background: '#f5f7fb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#003b5c', margin: 0 }}>
          Leave Management
        </h1>
        <p style={{ color: '#6b7280', margin: '8px 0 0 0', fontSize: 14 }}>
          Review and manage leave requests
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: '25px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <FiFilter size={18} style={{ color: '#6b7280' }} />
        {['pending', 'approved', 'rejected', 'cancelled', 'all'].map(status => (
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
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <span style={{ marginLeft: '6px' }}>
                ({filteredLeaves.filter(l => l.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 16, color: '#6b7280' }}>Loading leave requests...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredLeaves.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <div style={{ fontSize: 16, color: '#6b7280' }}>No leave requests found</div>
        </div>
      )}

      {/* Leave Requests List */}
      {!loading && filteredLeaves.length > 0 && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredLeaves.map(leave => (
            <div
              key={leave.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                hover: '#f9fafb',
              }}
            >
              {/* Left: Leave Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
                    {leave.trainee?.user?.name || 'N/A'}
                  </h3>
                  <LeaveTypeBadge type={leave.leave_type} />
                  <StatusBadge status={leave.status} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', fontSize: 13 }}>
                  <div>
                    <div style={{ color: '#6b7280', fontWeight: 500 }}>Leave Date</div>
                    <div style={{ color: '#111827', marginTop: '4px' }}>
                      {formatDate(leave.leave_date)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontWeight: 500 }}>Reason</div>
                    <div style={{ color: '#111827', marginTop: '4px' }}>
                      {leave.leave_reason || '-'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontWeight: 500 }}>Applied On</div>
                    <div style={{ color: '#111827', marginTop: '4px' }}>
                      {formatDate(leave.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Action Buttons */}
              {leave.status === 'pending' && (
                <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                  <button
                    onClick={() => {
                      setSelectedLeave(leave)
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
                    }}
                  >
                    <FiX size={16} />
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLeave(leave)
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
      {reviewModal && selectedLeave && (
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
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 20px 0' }}>
              Review Leave Request
            </h2>

            <div style={{ display: 'grid', gap: '15px', marginBottom: '25px', fontSize: 13 }}>
              <div>
                <div style={{ color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>Employee</div>
                <div style={{ color: '#111827' }}>{selectedLeave.trainee?.user?.name || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>Leave Type</div>
                <LeaveTypeBadge type={selectedLeave.leave_type} />
              </div>
              <div>
                <div style={{ color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>Leave Date</div>
                <div style={{ color: '#111827' }}>{formatDate(selectedLeave.leave_date)}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>Reason</div>
                <div style={{ color: '#111827' }}>{selectedLeave.leave_reason || '-'}</div>
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
