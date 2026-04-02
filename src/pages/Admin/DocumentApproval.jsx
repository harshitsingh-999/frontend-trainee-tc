import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAllDocuments, reviewDocument, getAllProfileChangeRequests, approveProfileChangeRequest, rejectProfileChangeRequest } from '../../api/api'
import { FiFilter, FiX, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '')
  : import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
    : 'http://localhost:7357'

function StatusBadge({ status }) {
  const map = {
    pending:          { bg: '#fffbeb', color: '#d97706', label: '⏳ Pending' },
    pending_approval: { bg: '#fffbeb', color: '#d97706', label: '⏳ Pending' },
    approved:         { bg: '#f0fdf4', color: '#16a34a', label: '✓ Approved' },
    completed:        { bg: '#f0fdf4', color: '#16a34a', label: '✓ Approved' },
    rejected:         { bg: '#fef2f2', color: '#dc2626', label: '✗ Rejected' },
  }
  const s = map[status] || { bg: '#f1f5f9', color: '#475569', label: status }
  return (
    <span style={{ display: 'inline-block', background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, borderRadius: 5, padding: '4px 10px' }}>
      {s.label}
    </span>
  )
}

/* ── Documents Tab ─────────────────────────────────────────────────────────── */
function DocumentsTab() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading]     = useState(false)
  const [filter, setFilter]       = useState('pending')
  const [reviewingId, setReviewingId]       = useState(null)
  const [reviewNote, setReviewNote]         = useState('')
  const [approvalAction, setApprovalAction] = useState(null)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await getAllDocuments(filter)
      const data = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []
      setDocuments(data)
    } catch { toast.error('Failed to load documents'); setDocuments([]) }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  const submitReview = async () => {
    try {
      await reviewDocument(reviewingId, { status: approvalAction, admin_note: reviewNote })
      toast.success(`Document ${approvalAction}`)
      setReviewingId(null); setReviewNote(''); setApprovalAction(null)
      fetchDocuments()
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to review document') }
  }

  const docTypeLabel = (t) => ({ '10th_marksheet':'10th Marksheet','12th_marksheet':'12th Marksheet',aadhar:'Aadhar Card',pan_card:'PAN Card',other:'Other' }[t] || t)

  const docUrl = (doc) => {
    const d = doc?.file_url || doc?.document_url || doc?.url || doc?.document?.file_url || doc?.document?.url
    if (d) return /^https?:\/\//i.test(d) ? d : `${API_BASE}${d}`
    const r = doc?.file_path || doc?.document_path || doc?.path || doc?.storage_path
    return r ? `${API_BASE}${r}` : null
  }

  return (
    <div>
      <div style={{ display:'flex', gap:12, marginBottom:24, borderBottom:'1px solid #e5e7eb', paddingBottom:12 }}>
        {['pending','approved','rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding:'8px 16px', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600, textTransform:'capitalize', background: filter===s?'#3b82f6':'#f3f4f6', color: filter===s?'#fff':'#374151' }}>{s}</button>
        ))}
      </div>
      {loading ? <div style={{ textAlign:'center', padding:40, color:'#6b7280' }}>Loading...</div>
        : documents.length === 0 ? <div style={{ textAlign:'center', padding:40, background:'#f9fafb', borderRadius:8, color:'#6b7280' }}>No {filter} documents</div>
        : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {documents.map(doc => (
              <div key={doc.id} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:16 }}>
                {reviewingId === doc.id ? (
                  <div style={{ background:'#f9fafb', padding:16, borderRadius:8 }}>
                    <h4 style={{ margin:'0 0 12px 0' }}>{approvalAction==='approved'?'Approve':'Decline'} Document</h4>
                    <textarea value={reviewNote} onChange={e=>setReviewNote(e.target.value)} placeholder="Add any notes..." rows={4}
                      style={{ width:'100%', padding:8, border:'1px solid #d1d5db', borderRadius:6, fontFamily:'inherit', fontSize:14 }} />
                    <div style={{ display:'flex', gap:12, marginTop:12 }}>
                      <button onClick={submitReview} style={{ padding:'8px 16px', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600, color:'#fff', background: approvalAction==='approved'?'#10b981':'#ef4444' }}>
                        Confirm {approvalAction==='approved'?'Approval':'Decline'}
                      </button>
                      <button onClick={() => { setReviewingId(null); setReviewNote(''); setApprovalAction(null) }}
                        style={{ padding:'8px 16px', background:'#e5e7eb', color:'#374151', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600 }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                      <div>
                        <h4 style={{ margin:'0 0 4px 0', color:'#1f2937' }}>{doc.intern?.name || 'Unknown Intern'}</h4>
                        <p style={{ margin:0, fontSize:13, color:'#6b7280' }}>{doc.intern?.email}</p>
                      </div>
                      <StatusBadge status={doc.status || 'pending'} />
                    </div>
                    <div style={{ background:'#f9fafb', padding:12, borderRadius:6, marginBottom:12 }}>
                      <div style={{ marginBottom:8 }}><span style={{ fontWeight:600, color:'#374151' }}>Document Type:</span><span style={{ marginLeft:8, color:'#6b7280' }}>{docTypeLabel(doc.doc_type)}</span></div>
                      <div style={{ marginBottom:8 }}><span style={{ fontWeight:600, color:'#374151' }}>File Name:</span><span style={{ marginLeft:8, color:'#6b7280' }}>{doc.original_name}</span></div>
                      {doc.admin_note && <div><span style={{ fontWeight:600, color:'#374151' }}>Admin Note:</span><p style={{ margin:'4px 0 0 0', color:'#6b7280' }}>{doc.admin_note}</p></div>}
                    </div>
                    {docUrl(doc) && <div style={{ marginBottom:12 }}><a href={docUrl(doc)} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 14px', background:'#eff6ff', color:'#1d4ed8', borderRadius:8, textDecoration:'none', fontSize:13, fontWeight:600 }}>Open Document</a></div>}
                    {doc.status === 'pending' && (
                      <div style={{ display:'flex', gap:12 }}>
                        <button onClick={() => { setReviewingId(doc.id); setApprovalAction('approved') }}
                          style={{ flex:1, padding:'10px 16px', background:'#10b981', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600 }}>✓ Approve</button>
                        <button onClick={() => { setReviewingId(doc.id); setApprovalAction('rejected') }}
                          style={{ flex:1, padding:'10px 16px', background:'#ef4444', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600 }}>✕ Decline</button>
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

/* ── Profile Changes Tab ───────────────────────────────────────────────────── */
function ProfileChangesTab() {
  const [requests, setRequests]               = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])
  const [loading, setLoading]                 = useState(true)
  const [filter, setFilter]                   = useState('pending_approval')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [reviewModal, setReviewModal]         = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading]     = useState(false)

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const res  = await getAllProfileChangeRequests()
      const data = Array.isArray(res.data) ? res.data : res.data?.data || []
      setRequests(data)
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to fetch profile change requests'); setRequests([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])
  useEffect(() => { setFilteredRequests(filter === 'all' ? requests : requests.filter(r => r.status === filter)) }, [requests, filter])

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '-'

  const parseVals = (raw) => {
    if (!raw) return {}
    if (typeof raw === 'object') return raw
    try { return JSON.parse(raw) } catch { return {} }
  }

  const ChangesTable = ({ request }) => {
    const newV = parseVals(request.new_values)
    const oldV = parseVals(request.old_values)
    const rows = Object.entries(newV).filter(([k, v]) => String(oldV[k] ?? '') !== String(v ?? ''))
    if (!rows.length) return <div style={{ color:'#6b7280' }}>No changes recorded</div>
    return (
      <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse' }}>
        <tbody>
          {rows.map(([key, newVal]) => (
            <tr key={key} style={{ borderBottom:'1px solid #e5e7eb' }}>
              <td style={{ padding:8, fontWeight:600, color:'#6b7280', width:'30%' }}>{key.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</td>
              <td style={{ padding:8, color:'#dc2626', textDecoration:'line-through' }}>{String(oldV[key] ?? '-')}</td>
              <td style={{ padding:8, color:'#16a34a' }}>{String(newVal ?? '-')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  const handleApprove = async () => {
    try {
      setActionLoading(true)
      await approveProfileChangeRequest(selectedRequest.id, {})
      toast.success('Profile change approved')
      setReviewModal(false); setSelectedRequest(null); setRejectionReason(''); fetchRequests()
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to approve') }
    finally { setActionLoading(false) }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) { toast.error('Please provide a rejection reason'); return }
    try {
      setActionLoading(true)
      await rejectProfileChangeRequest(selectedRequest.id, { rejection_reason: rejectionReason })
      toast.success('Profile change rejected')
      setReviewModal(false); setSelectedRequest(null); setRejectionReason(''); fetchRequests()
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to reject') }
    finally { setActionLoading(false) }
  }

  return (
    <div>
      <div style={{ marginBottom:25, display:'flex', gap:12, alignItems:'center' }}>
        <FiFilter size={18} style={{ color:'#6b7280' }} />
        {['pending_approval','completed','rejected','all'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding:'8px 16px', borderRadius:6, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', backgroundColor: filter===s?'#00b1b4':'#e5e7eb', color: filter===s?'white':'#4b5563' }}>
            {s === 'pending_approval' ? 'Pending' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign:'center', padding:'60px 20px', color:'#6b7280' }}>Loading...</div>}

      {!loading && filteredRequests.length === 0 && (
        <div style={{ textAlign:'center', padding:'60px 20px', background:'white', borderRadius:12, border:'1px solid #e5e7eb', color:'#6b7280' }}>No profile change requests found</div>
      )}

      {!loading && filteredRequests.length > 0 && (
        <div style={{ display:'grid', gap:16 }}>
          {filteredRequests.map(req => (
            <div key={req.id} style={{ background:'white', borderRadius:12, border:'1px solid #e5e7eb', padding:20, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <h3 style={{ fontSize:16, fontWeight:600, color:'#111827', margin:0 }}>{req.requestor?.name || 'N/A'}</h3>
                  <StatusBadge status={req.status} />
                </div>
                <div style={{ fontSize:13, marginBottom:12 }}>
                  <div style={{ color:'#6b7280', fontWeight:500, marginBottom:8 }}>Changes Requested:</div>
                  <div style={{ background:'#f9fafb', borderRadius:8, padding:12, border:'1px solid #e5e7eb' }}><ChangesTable request={req} /></div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, fontSize:13 }}>
                  <div><div style={{ color:'#6b7280', fontWeight:500 }}>Requested On</div><div style={{ color:'#111827', marginTop:4 }}>{fmtDate(req.createdAt)}</div></div>
                  <div><div style={{ color:'#6b7280', fontWeight:500 }}>Status</div><div style={{ color:'#111827', marginTop:4 }}>{req.status==='pending_approval'?'Awaiting Review':req.status==='completed'?'Approved':'Rejected'}</div></div>
                  <div><div style={{ color:'#6b7280', fontWeight:500 }}>Reviewed On</div><div style={{ color:'#111827', marginTop:4 }}>{fmtDate(req.reviewed_at)}</div></div>
                </div>
              </div>
              {req.status === 'pending_approval' && (
                <div style={{ display:'flex', gap:10, marginLeft:20 }}>
                  <button onClick={() => { setSelectedRequest(req); setRejectionReason(''); setReviewModal(true) }}
                    style={{ padding:'8px 16px', borderRadius:6, border:'none', background:'#fef2f2', color:'#dc2626', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
                    <FiX size={16} /> Reject
                  </button>
                  <button onClick={() => { setSelectedRequest(req); setRejectionReason(''); setReviewModal(true) }}
                    style={{ padding:'8px 16px', borderRadius:6, border:'none', background:'#f0fdf4', color:'#16a34a', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
                    <FiCheck size={16} /> Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {reviewModal && selectedRequest && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
          onClick={() => setReviewModal(false)}>
          <div style={{ background:'white', borderRadius:14, padding:30, width:'100%', maxWidth:500, boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight:'80vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', margin:'0 0 20px 0' }}>Review Profile Change</h2>
            <div style={{ display:'grid', gap:15, marginBottom:25, fontSize:13 }}>
              <div><div style={{ color:'#6b7280', fontWeight:600, marginBottom:4 }}>Employee</div><div style={{ color:'#111827' }}>{selectedRequest.requestor?.name || 'N/A'}</div></div>
              <div><div style={{ color:'#6b7280', fontWeight:600, marginBottom:4 }}>Email</div><div style={{ color:'#111827' }}>{selectedRequest.requestor?.email || 'N/A'}</div></div>
              <div>
                <div style={{ color:'#6b7280', fontWeight:600, marginBottom:4 }}>Requested Changes:</div>
                <div style={{ background:'#f9fafb', borderRadius:8, padding:12, border:'1px solid #e5e7eb', fontSize:12 }}><ChangesTable request={selectedRequest} /></div>
              </div>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', color:'#6b7280', fontWeight:600, fontSize:13, marginBottom:8 }}>Rejection Reason (required if rejecting)</label>
              <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Provide reason for rejection..."
                style={{ width:'100%', border:'1px solid #d1d5db', borderRadius:6, padding:'10px 12px', fontSize:13, fontFamily:'inherit', resize:'vertical', minHeight:80 }} />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setReviewModal(false)} style={{ padding:'10px 20px', borderRadius:6, border:'1px solid #d1d5db', background:'white', color:'#6b7280', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button onClick={handleReject} disabled={actionLoading} style={{ padding:'10px 20px', borderRadius:6, border:'none', background:'#dc2626', color:'white', fontSize:13, fontWeight:600, cursor: actionLoading?'not-allowed':'pointer', opacity: actionLoading?0.7:1 }}>
                {actionLoading ? 'Processing...' : 'Reject'}
              </button>
              <button onClick={handleApprove} disabled={actionLoading} style={{ padding:'10px 20px', borderRadius:6, border:'none', background:'#16a34a', color:'white', fontSize:13, fontWeight:600, cursor: actionLoading?'not-allowed':'pointer', opacity: actionLoading?0.7:1 }}>
                {actionLoading ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Shell ─────────────────────────────────────────────────────────────────── */
function DocumentApproval() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'profiles' ? 'profiles' : 'documents'
  )

  useEffect(() => {
    if (searchParams.get('tab') === 'profiles') setActiveTab('profiles')
  }, [searchParams])

  const switchTab = (tab) => {
    setActiveTab(tab)
    setSearchParams(tab === 'profiles' ? { tab: 'profiles' } : {})
  }

  return (
    <div style={{ maxWidth:1000, margin:'0 auto', padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ margin:'0 0 4px 0' }}>Approvals</h2>
        <p style={{ color:'#6b7280', margin:0 }}>Review documents and profile change requests from interns</p>
      </div>

      <div style={{ display:'flex', gap:0, marginBottom:28, borderBottom:'2px solid #e5e7eb' }}>
        {[{ key:'documents', label:'📄 Document Approvals' }, { key:'profiles', label:'👤 Profile Changes' }].map(({ key, label }) => (
          <button key={key} onClick={() => switchTab(key)} style={{
            padding:'10px 22px', border:'none', background:'none', cursor:'pointer', fontWeight:700, fontSize:14,
            color: activeTab===key ? '#3b82f6' : '#6b7280',
            borderBottom: activeTab===key ? '2px solid #3b82f6' : '2px solid transparent',
            marginBottom: -2, transition:'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {activeTab === 'documents' ? <DocumentsTab /> : <ProfileChangesTab />}
    </div>
  )
}

export default DocumentApproval