import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Table, Badge } from 'react-bootstrap';

const LossOfSaleView = () => {
  const [lossData, setLossData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStore, setSelectedStore] = useState('all');

  useEffect(() => {
    fetchLossOfSaleData();
  }, []);

  const fetchLossOfSaleData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/loss-of-sale/dsr-date');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      setLossData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getReasonBadgeColor = (reason) => {
    const r = reason.toLowerCase();
    if (r.includes('size')) return 'warning';
    if (r.includes('colour') || r.includes('color')) return 'info';
    if (r.includes('high rate') || r.includes('price')) return 'danger';
    if (r.includes('booked')) return 'success';
    if (r.includes('busy') || r.includes('visit later')) return 'secondary';
    return 'primary';
  };

  const filteredData = lossData?.data?.filter(entry => 
    selectedStore === 'all' || entry.storeName.toUpperCase() === selectedStore
  ) || [];

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
          📉 Loss of Sale Report
        </h2>
        <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
          {lossData?.date ? `Data for ${lossData.date}` : 'Loading...'}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spinner animation="border" style={{ color: '#2563eb' }} />
          <p style={{ marginTop: '12px', color: '#6c757d' }}>Loading loss of sale data...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="danger" style={{ borderRadius: '8px' }}>
          <strong>Error:</strong> {error}
          <div style={{ marginTop: '12px' }}>
            <Button onClick={fetchLossOfSaleData} size="sm" variant="outline-danger">
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Summary Cards */}
      {lossData && !loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '30px' }}>
            {/* Total Loss */}
            <Card style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '8px', fontWeight: '600' }}>
                Total Loss of Sale
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626' }}>
                {lossData.stats.totalEntries}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                Across {lossData.stats.storesWithLoss} stores
              </div>
            </Card>

            {/* Top Reason */}
            {lossData.stats.topReasons.length > 0 && (
              <Card style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '8px', fontWeight: '600' }}>
                  Top Reason
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                  {lossData.stats.topReasons[0].reason}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                  {lossData.stats.topReasons[0].count} cases
                </div>
              </Card>
            )}

            {/* Worst Performing Store */}
            {lossData.stats.storeBreakdown.length > 0 && (
              <Card style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '8px', fontWeight: '600' }}>
                  Highest Loss Store
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                  {lossData.stats.storeBreakdown[0].store}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                  {lossData.stats.storeBreakdown[0].count} cases
                </div>
              </Card>
            )}
          </div>

          {/* Store Filter */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '12px' }}>
              Filter by Store:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                onClick={() => setSelectedStore('all')}
                size="sm"
                style={{
                  backgroundColor: selectedStore === 'all' ? '#2563eb' : 'white',
                  color: selectedStore === 'all' ? 'white' : '#475569',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '6px 16px'
                }}
              >
                All Stores ({lossData.stats.totalEntries})
              </Button>
              {lossData.stats.storeBreakdown.map((store, idx) => (
                <Button
                  key={idx}
                  onClick={() => setSelectedStore(store.store)}
                  size="sm"
                  style={{
                    backgroundColor: selectedStore === store.store ? '#2563eb' : 'white',
                    color: selectedStore === store.store ? 'white' : '#475569',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '6px 16px'
                  }}
                >
                  {store.store} ({store.count})
                </Button>
              ))}
            </div>
          </div>

          {/* Top Reasons Chart */}
          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '20px' }}>
              📊 Top Reasons for Loss of Sale
            </h4>
            {lossData.stats.topReasons.slice(0, 5).map((reason, idx) => (
              <div key={idx} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#475569', textTransform: 'capitalize' }}>
                    {reason.reason}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                    {reason.count} cases
                  </span>
                </div>
                <div style={{ 
                  height: '8px', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(reason.count / lossData.stats.totalEntries) * 100}%`,
                    backgroundColor: idx === 0 ? '#dc2626' : idx === 1 ? '#f59e0b' : idx === 2 ? '#3b82f6' : '#6b7280',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            ))}
          </Card>

          {/* Detailed Loss of Sale Table */}
          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                📋 Detailed Loss of Sale Entries ({filteredData.length})
              </h4>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <Table hover style={{ margin: 0 }}>
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #e5e7eb' }}>
                      STORE
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #e5e7eb' }}>
                      CUSTOMER
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #e5e7eb' }}>
                      CONTACT
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #e5e7eb' }}>
                      FUNCTION DATE
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #e5e7eb' }}>
                      STAFF
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #e5e7eb' }}>
                      REASON
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#0f172a', borderBottom: '2px solid #e5e7eb', backgroundColor: '#fef3c7' }}>
                      🎯 WHAT CUSTOMER WANTED
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#0f172a', borderBottom: '2px solid #e5e7eb', backgroundColor: '#fee2e2' }}>
                      ❌ PRODUCT UNAVAILABLE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                        No loss of sale entries found for this date/store
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((entry, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                          {entry.storeName}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                          {entry.customerName}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                          {entry.number}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                          {entry.functionDate}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                          {entry.staffName}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge 
                            bg={getReasonBadgeColor(entry.reason)}
                            style={{ fontSize: '11px', padding: '4px 8px', textTransform: 'capitalize' }}
                          >
                            {entry.reason}
                          </Badge>
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          fontSize: '13px', 
                          fontWeight: '600',
                          color: '#92400e',
                          backgroundColor: '#fef3c7',
                          maxWidth: '250px',
                          lineHeight: '1.6'
                        }}>
                          {entry.otherComments || '-'}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          fontSize: '13px', 
                          fontWeight: '600',
                          color: '#991b1b',
                          backgroundColor: '#fee2e2',
                          maxWidth: '250px',
                          lineHeight: '1.6'
                        }}>
                          {entry.productUnavailability || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card>

          {/* Refresh Button */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Button 
              onClick={fetchLossOfSaleData}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                color: '#475569',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: '500'
              }}
            >
              🔄 Refresh Data
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default LossOfSaleView;

