'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

interface GiftTransactionRecord {
  id: number;
  giftId: number;
  giftName: string;
  giftValue: number;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  sessionId: string | null;
  sessionType: string | null;
  status: string;
  createdAt: string;
}

export default function GiftHistoryPage() {
  const [transactions, setTransactions] = useState<GiftTransactionRecord[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<GiftTransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    fetchGiftTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, startDate, endDate]);

  const fetchGiftTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/gift-history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const transactionsData = response.data?.transactions || [];
      setTransactions(transactionsData);
    } catch (error: any) {
      console.error('Error fetching gift transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Search filter (sender, receiver, gift name, session ID)
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.fromUserId.toLowerCase().includes(search) ||
        t.fromUsername.toLowerCase().includes(search) ||
        t.toUserId.toLowerCase().includes(search) ||
        t.toUsername.toLowerCase().includes(search) ||
        t.giftName.toLowerCase().includes(search) ||
        (t.sessionId && t.sessionId.toLowerCase().includes(search))
      );
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate >= new Date(startDate);
      });
    }

    if (endDate) {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.createdAt);
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        return transactionDate <= endDateTime;
      });
    }

    setFilteredTransactions(filtered);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    }) + ' IST';
  };

  const exportToExcel = () => {
    setExporting(true);
    
    try {
      // Prepare data for export
      const exportData = filteredTransactions.map(t => ({
        'Gift ID': t.giftId,
        'Gift Name': t.giftName,
        'Gift Value (Coins)': t.giftValue,
        'Sent By User ID': t.fromUserId,
        'Sent By Username': t.fromUsername,
        'Sent To User ID': t.toUserId,
        'Sent To Username': t.toUsername,
        'Session Type': t.sessionType || 'N/A',
        'Live Session ID': t.sessionId || 'N/A',
        'Status': t.status,
        'Gift Date': formatDateTime(t.createdAt)
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 10 }, // Gift ID
        { wch: 25 }, // Gift Name
        { wch: 18 }, // Gift Value
        { wch: 18 }, // Sent By User ID
        { wch: 20 }, // Sent By Username
        { wch: 18 }, // Sent To User ID
        { wch: 20 }, // Sent To Username
        { wch: 15 }, // Session Type
        { wch: 25 }, // Live Session ID
        { wch: 12 }, // Status
        { wch: 30 }  // Gift Date
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Gift History');

      // Generate filename with current date
      const filename = `Gift_History_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  // Calculate statistics
  const stats = {
    total: filteredTransactions.length,
    totalValue: filteredTransactions.reduce((sum, t) => sum + (t.giftValue || 0), 0),
    videoGifts: filteredTransactions.filter(t => t.sessionType === 'VIDEO').length,
    audioGifts: filteredTransactions.filter(t => t.sessionType === 'AUDIO').length,
    uniqueSenders: new Set(filteredTransactions.map(t => t.fromUserId)).size,
    uniqueReceivers: new Set(filteredTransactions.map(t => t.toUserId)).size
  };

  if (loading) {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:400}}>
        <div style={{textAlign:'center'}}>
          <div style={{width:48,height:48,border:'4px solid #e2e8f0',borderTop:'4px solid #4299e1',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 16px'}}></div>
          <p style={{color:'#718096',fontSize:16}}>Loading gift history...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{marginBottom:32}}>
        <h1 style={{margin:0,fontSize:28,fontWeight:700,color:'#1a202c',marginBottom:8}}>
          Gift History
        </h1>
        <p style={{margin:0,color:'#718096',fontSize:16}}>
          View all gift transactions sent during live sessions
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:20,marginBottom:24}}>
        <div style={{background:'white',padding:20,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:14,color:'#718096',marginBottom:8}}>Total Gifts</div>
          <div style={{fontSize:32,fontWeight:700,color:'#1a202c'}}>{stats.total}</div>
        </div>
        <div style={{background:'white',padding:20,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:14,color:'#718096',marginBottom:8}}>Total Value</div>
          <div style={{fontSize:32,fontWeight:700,color:'#805ad5'}}>{stats.totalValue.toLocaleString()} 💎</div>
        </div>
        <div style={{background:'white',padding:20,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:14,color:'#718096',marginBottom:8}}>Video Live Gifts</div>
          <div style={{fontSize:32,fontWeight:700,color:'#3182ce'}}>{stats.videoGifts}</div>
        </div>
        <div style={{background:'white',padding:20,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:14,color:'#718096',marginBottom:8}}>Audio Live Gifts</div>
          <div style={{fontSize:32,fontWeight:700,color:'#805ad5'}}>{stats.audioGifts}</div>
        </div>
        <div style={{background:'white',padding:20,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:14,color:'#718096',marginBottom:8}}>Unique Senders</div>
          <div style={{fontSize:32,fontWeight:700,color:'#38a169'}}>{stats.uniqueSenders}</div>
        </div>
        <div style={{background:'white',padding:20,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:14,color:'#718096',marginBottom:8}}>Unique Receivers</div>
          <div style={{fontSize:32,fontWeight:700,color:'#d69e2e'}}>{stats.uniqueReceivers}</div>
        </div>
      </div>

      {/* Filters Section */}
      <div style={{background:'white',padding:24,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',marginBottom:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{margin:0,fontSize:18,fontWeight:600,color:'#2d3748'}}>Filters</h2>
          <button
            onClick={clearFilters}
            style={{
              padding:'8px 16px',
              border:'1px solid #e2e8f0',
              borderRadius:6,
              cursor:'pointer',
              fontSize:14,
              fontWeight:600,
              background:'white',
              color:'#4a5568',
              transition:'all 0.2s'
            }}
          >
            Clear Filters
          </button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',gap:16}}>
          {/* Search */}
          <div>
            <label style={{display:'block',fontSize:14,fontWeight:600,color:'#4a5568',marginBottom:8}}>
              Search (User / Gift / Session)
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username, gift name, or session ID..."
              style={{
                width:'100%',
                padding:'10px 14px',
                borderRadius:8,
                border:'1px solid #cbd5e0',
                fontSize:14,
                outline:'none',
                transition:'border 0.2s'
              }}
            />
          </div>

          {/* Start Date */}
          <div>
            <label style={{display:'block',fontSize:14,fontWeight:600,color:'#4a5568',marginBottom:8}}>
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width:'100%',
                padding:'10px 14px',
                borderRadius:8,
                border:'1px solid #cbd5e0',
                fontSize:14,
                outline:'none'
              }}
            />
          </div>

          {/* End Date */}
          <div>
            <label style={{display:'block',fontSize:14,fontWeight:600,color:'#4a5568',marginBottom:8}}>
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width:'100%',
                padding:'10px 14px',
                borderRadius:8,
                border:'1px solid #cbd5e0',
                fontSize:14,
                outline:'none'
              }}
            />
          </div>
        </div>

        <div style={{marginTop:16,fontSize:14,color:'#718096'}}>
          Showing {filteredTransactions.length} of {transactions.length} gift transactions
        </div>
      </div>

      {/* Export Button */}
      <div style={{marginBottom:16,display:'flex',justifyContent:'flex-end'}}>
        <button
          onClick={exportToExcel}
          disabled={exporting || filteredTransactions.length === 0}
          style={{
            padding:'12px 24px',
            border:'none',
            borderRadius:8,
            cursor: filteredTransactions.length === 0 ? 'not-allowed' : 'pointer',
            fontSize:14,
            fontWeight:600,
            background: filteredTransactions.length === 0 ? '#cbd5e0' : '#38a169',
            color:'white',
            display:'flex',
            alignItems:'center',
            gap:8,
            transition:'all 0.2s',
            opacity: exporting ? 0.7 : 1
          }}
        >
          <span style={{fontSize:18}}>📊</span>
          {exporting ? 'Exporting...' : 'Export to Excel'}
        </button>
      </div>

      {/* Gifts Table */}
      <div style={{background:'white',borderRadius:12,overflow:'hidden',border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#f7fafc',borderBottom:'2px solid #e2e8f0'}}>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Gift ID</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Gift Name</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Sent By</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Sent To</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Value</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Session Type</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Session ID</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Status</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((transaction, index) => (
                <tr key={transaction.id} style={{borderBottom:index < currentItems.length - 1 ? '1px solid #e2e8f0' : 'none'}}>
                  <td style={{padding:'20px'}}>
                    <div style={{fontSize:14,color:'#4a5568',fontWeight:600}}>
                      #{transaction.giftId}
                    </div>
                  </td>
                  <td style={{padding:'20px'}}>
                    <div style={{fontWeight:600,color:'#1a202c',fontSize:15}}>
                      {transaction.giftName}
                    </div>
                  </td>
                  <td style={{padding:'20px'}}>
                    <div style={{fontSize:14,color:'#4a5568'}}>
                      <div style={{fontWeight:600,color:'#1a202c'}}>{transaction.fromUsername}</div>
                      <div style={{fontSize:12,color:'#718096',fontFamily:'monospace'}}>{transaction.fromUserId}</div>
                    </div>
                  </td>
                  <td style={{padding:'20px'}}>
                    <div style={{fontSize:14,color:'#4a5568'}}>
                      <div style={{fontWeight:600,color:'#1a202c'}}>{transaction.toUsername}</div>
                      <div style={{fontSize:12,color:'#718096',fontFamily:'monospace'}}>{transaction.toUserId}</div>
                    </div>
                  </td>
                  <td style={{padding:'20px'}}>
                    <div style={{fontSize:16,fontWeight:700,color:'#805ad5'}}>
                      {transaction.giftValue} 💎
                    </div>
                  </td>
                  <td style={{padding:'20px'}}>
                    {transaction.sessionType ? (
                      <span style={{
                        padding:'6px 12px',
                        borderRadius:16,
                        fontSize:12,
                        fontWeight:600,
                        textTransform:'uppercase',
                        background: transaction.sessionType === 'VIDEO' ? '#ebf8ff' : '#f3e8ff',
                        color: transaction.sessionType === 'VIDEO' ? '#3182ce' : '#805ad5',
                        border: `1px solid ${transaction.sessionType === 'VIDEO' ? '#bee3f8' : '#d6bcfa'}`
                      }}>
                        {transaction.sessionType}
                      </span>
                    ) : (
                      <span style={{color:'#a0aec0',fontSize:14}}>-</span>
                    )}
                  </td>
                  <td style={{padding:'20px'}}>
                    {transaction.sessionId ? (
                      <div style={{fontSize:12,color:'#718096',fontFamily:'monospace',background:'#f7fafc',padding:'6px 10px',borderRadius:6,display:'inline-block',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {transaction.sessionId}
                      </div>
                    ) : (
                      <span style={{color:'#a0aec0',fontSize:14}}>-</span>
                    )}
                  </td>
                  <td style={{padding:'20px'}}>
                    <span style={{
                      padding:'6px 12px',
                      borderRadius:16,
                      fontSize:12,
                      fontWeight:600,
                      textTransform:'uppercase',
                      background: '#f0fff4',
                      color: '#38a169',
                      border: '1px solid #9ae6b4'
                    }}>
                      {transaction.status}
                    </span>
                  </td>
                  <td style={{padding:'20px'}}>
                    <div style={{fontSize:14,color:'#4a5568'}}>
                      {formatDateTime(transaction.createdAt)}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={9} style={{padding:64,textAlign:'center'}}>
                    <div style={{fontSize:48,marginBottom:16,opacity:0.5}}>🎁</div>
                    <h3 style={{margin:0,color:'#4a5568',fontSize:18,marginBottom:8}}>No gift transactions found</h3>
                    <p style={{margin:0,color:'#718096'}}>
                      {searchTerm || startDate || endDate
                        ? 'Try adjusting your filters'
                        : 'No gifts have been sent yet'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div style={{background:'#f7fafc',padding:'16px 24px',borderTop:'1px solid #e2e8f0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontSize:14,color:'#4a5568'}}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length} gifts
            </div>
            <div style={{display:'flex',gap:8}}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding:'8px 16px',
                  fontSize:14,
                  fontWeight:600,
                  border:'1px solid #cbd5e0',
                  borderRadius:6,
                  background:'white',
                  color:'#4a5568',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                Previous
              </button>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                    return false;
                  })
                  .map((page, index, array) => (
                    <div key={page} style={{display:'flex',alignItems:'center',gap:8}}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span style={{padding:'0 8px',color:'#a0aec0'}}>...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        style={{
                          padding:'8px 14px',
                          fontSize:14,
                          fontWeight:600,
                          border: currentPage === page ? 'none' : '1px solid #cbd5e0',
                          borderRadius:6,
                          background: currentPage === page ? '#3182ce' : 'white',
                          color: currentPage === page ? 'white' : '#4a5568',
                          cursor:'pointer'
                        }}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding:'8px 16px',
                  fontSize:14,
                  fontWeight:600,
                  border:'1px solid #cbd5e0',
                  borderRadius:6,
                  background:'white',
                  color:'#4a5568',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
