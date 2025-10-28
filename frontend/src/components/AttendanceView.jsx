import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spinner, Table, Badge } from 'react-bootstrap';

const AttendanceView = () => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Auto-fetch on component mount
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/attendance');
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        // If error response has detailed instructions, pass them through
        if (data.error) {
          setError(data); // Pass entire error object with instructions
        } else {
          setError(data.error || `HTTP error! status: ${response.status}`);
        }
        return;
      }
      
      setAttendanceData(data);
      console.log('✅ Attendance data loaded:', data);
      
    } catch (err) {
      console.error('❌ Attendance fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!attendanceData) return;
    
    const dataStr = JSON.stringify(attendanceData.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter employees based on search term
  const getFilteredEmployees = () => {
    if (!attendanceData?.data?.employees) return [];
    
    if (!searchTerm.trim()) {
      return attendanceData.data.employees;
    }
    
    const term = searchTerm.toLowerCase();
    return attendanceData.data.employees.filter(emp => {
      return Object.values(emp).some(val => 
        String(val).toLowerCase().includes(term)
      );
    });
  };

  const filteredEmployees = getFilteredEmployees();

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
          👥 Individual Employee Attendance
        </h2>
        <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
          {attendanceData?.month && attendanceData?.year && attendanceData?.currentDay ? (
            <>
              <strong>{attendanceData.month} {attendanceData.year}</strong> (Days 1-{attendanceData.currentDay})
              {attendanceData.dsrDate && <> • Based on DSR Date: {attendanceData.dsrDate}</>}
              {' • '}<strong>{attendanceData.summary?.totalEmployees || 0} Employees</strong> across all branches
            </>
          ) : (
            attendanceData?.data?.dateRange || 'Latest Data'
          )}
          {' • '}Last Updated: {
            attendanceData?.fetchedAt 
              ? new Date(attendanceData.fetchedAt).toLocaleString()
              : 'N/A'
          }
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <Button 
          onClick={fetchAttendance} 
          disabled={loading}
          style={{ 
            backgroundColor: '#2563eb',
            border: 'none',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '6px'
          }}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" style={{ marginRight: '8px' }} />
              Loading...
            </>
          ) : (
            <>🔄 Refresh Data</>
          )}
        </Button>

        {attendanceData && (
          <Button 
            onClick={exportData}
            variant="outline-primary"
            style={{ 
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '6px'
            }}
          >
            📥 Export JSON
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" style={{ marginBottom: '20px', borderRadius: '6px' }}>
          <Alert.Heading>🔒 Error Fetching Attendance Data</Alert.Heading>
          <p><strong>{typeof error === 'string' ? error : error.error || 'Unknown error'}</strong></p>
          
          {error.instructions && (
            <>
              <hr />
              <p className="mb-2"><strong>How to fix:</strong></p>
              <ol style={{ marginBottom: '1rem' }}>
                {error.instructions.map((instruction, idx) => (
                  <li key={idx}>{instruction}</li>
                ))}
              </ol>
              {error.sheetUrl && (
                <Button 
                  variant="light" 
                  size="sm"
                  onClick={() => window.open(error.sheetUrl, '_blank')}
                >
                  📋 Open Google Sheet
                </Button>
              )}
            </>
          )}
          
          {error.hint && (
            <>
              <hr />
              <small>💡 Hint: {error.hint}</small>
            </>
          )}
        </Alert>
      )}

      {/* Summary Cards */}
      {attendanceData?.summary && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '16px', 
          marginBottom: '30px' 
        }}>
          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#2563eb' }}>
              {attendanceData.summary.totalEmployees}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Total Employees
            </div>
          </Card>

          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#6c757d' }}>
              {attendanceData.currentDay || attendanceData.summary.daysTracked}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Days Tracked
            </div>
          </Card>

          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
              {attendanceData.summary.totalPresentDays || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Total Present Days
            </div>
          </Card>

          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>
              {attendanceData.summary.totalAbsentDays || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Total Absent Days
            </div>
          </Card>

          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>
              {attendanceData.summary.totalLeaveDays || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Total Leave Days
            </div>
          </Card>

          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#06b6d4' }}>
              {attendanceData.summary.totalWeeklyOffDays || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Weekly Off Days
            </div>
          </Card>

          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626' }}>
              {attendanceData.summary.totalLOPDays || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              LOP Days
            </div>
          </Card>

          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#8b5cf6' }}>
              {attendanceData.summary.attendanceRate}%
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Attendance Rate
            </div>
          </Card>
        </div>
      )}

      {/* Search Bar */}
      {attendanceData?.data?.employees && attendanceData.data.employees.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="🔍 Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '14px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              outline: 'none'
            }}
          />
          {searchTerm && (
            <p style={{ fontSize: '13px', color: '#6c757d', marginTop: '8px' }}>
              Found {filteredEmployees.length} of {attendanceData.data.employees.length} employees
            </p>
          )}
        </div>
      )}

      {/* Attendance Table */}
      {attendanceData?.data?.employees && filteredEmployees.length > 0 ? (
        <>
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px 16px', 
            backgroundColor: '#f0f9ff', 
            border: '1px solid #bae6fd',
            borderRadius: '6px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#0369a1' }}>
              ℹ️ <strong>Individual Employee Records:</strong> Each row below shows one employee's daily attendance. 
              The table displays <strong>{filteredEmployees.length} employees</strong> with their attendance codes 
              for each day (P=Present, W/O=Weekly Off, L=Leave, LOP=Loss of Pay, etc.)
            </p>
          </div>
          
          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <Table striped hover responsive style={{ margin: 0 }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px', fontWeight: '600', fontSize: '13px', color: '#6c757d', position: 'sticky', left: 0, backgroundColor: '#f9fafb', zIndex: 1 }}>#</th>
                  {attendanceData.data.headers.map((header, idx) => {
                    const isNameColumn = header.toLowerCase().includes('name');
                    const isDesignationColumn = header.toLowerCase().includes('designation');
                    const isBranchColumn = header.toLowerCase().includes('branch');
                    const isEmployeeInfoColumn = isNameColumn || isDesignationColumn || isBranchColumn;
                    
                    return (
                      <th 
                        key={idx}
                        style={{ 
                          padding: '12px', 
                          fontWeight: '600', 
                          fontSize: isEmployeeInfoColumn ? '14px' : '13px', 
                          color: isEmployeeInfoColumn ? '#1a1a1a' : '#6c757d',
                          whiteSpace: 'nowrap',
                          backgroundColor: isEmployeeInfoColumn ? '#e0e7ff' : '#f9fafb',
                          borderBottom: '2px solid #d1d5db'
                        }}
                      >
                        {isNameColumn && '👤 '}
                        {isDesignationColumn && '💼 '}
                        {isBranchColumn && '🏢 '}
                        {header}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                      {idx + 1}
                    </td>
                    {attendanceData.data.headers.map((header, colIdx) => {
                      const key = header
                        .replace(/[^a-zA-Z0-9\s]/g, '')
                        .trim()
                        .replace(/\s+/g, '_')
                        .toLowerCase();
                      
                      const value = employee[key] || '-';
                      
                      // Check if this is Employee Name or Designation column - make them prominent
                      const isNameColumn = header.toLowerCase().includes('name') || key.includes('employee_name');
                      const isDesignationColumn = header.toLowerCase().includes('designation');
                      const isBranchColumn = header.toLowerCase().includes('branch');
                      
                      // Check if this is a day column (numeric header) - show badges for attendance codes
                      const isDayColumn = !isNaN(parseInt(header));
                      
                      if (isDayColumn && value && value !== '-') {
                        const lowerValue = String(value).toLowerCase().trim();
                        let variant = 'secondary';
                        let displayValue = value.toUpperCase();
                        
                        // Color code based on attendance status
                        if (lowerValue === 'p') {
                          variant = 'success'; // Green for Present
                        } else if (lowerValue === 'a') {
                          variant = 'danger'; // Red for Absent
                        } else if (lowerValue === 'l' || lowerValue === 'al') {
                          variant = 'warning'; // Orange for Leave
                        } else if (lowerValue === 'w/o') {
                          variant = 'info'; // Blue for Weekly Off
                        } else if (lowerValue === 'lop') {
                          variant = 'danger'; // Red for Loss of Pay
                        } else if (lowerValue === 'h/d' || lowerValue === 'm' || lowerValue === 'ckd') {
                          variant = 'primary'; // Blue for Half Day/Morning/Checked
                        }
                        
                        return (
                          <td key={colIdx} style={{ padding: '12px', fontSize: '14px', textAlign: 'center' }}>
                            <Badge bg={variant} style={{ minWidth: '45px' }}>{displayValue}</Badge>
                          </td>
                        );
                      }
                      
                      // Style employee info columns differently
                      if (isNameColumn) {
                        return (
                          <td key={colIdx} style={{ 
                            padding: '12px', 
                            fontSize: '14px', 
                            fontWeight: '600',
                            color: '#1a1a1a',
                            whiteSpace: 'nowrap',
                            backgroundColor: '#f9fafb'
                          }}>
                            {value}
                          </td>
                        );
                      }
                      
                      if (isDesignationColumn) {
                        return (
                          <td key={colIdx} style={{ 
                            padding: '12px', 
                            fontSize: '13px', 
                            fontWeight: '500',
                            color: '#2563eb',
                            whiteSpace: 'nowrap'
                          }}>
                            <Badge bg="primary" style={{ fontSize: '11px' }}>{value}</Badge>
                          </td>
                        );
                      }
                      
                      if (isBranchColumn) {
                        return (
                          <td key={colIdx} style={{ 
                            padding: '12px', 
                            fontSize: '13px', 
                            fontWeight: '500',
                            color: '#059669',
                            whiteSpace: 'nowrap'
                          }}>
                            <Badge bg="success" style={{ fontSize: '11px' }}>{value}</Badge>
                          </td>
                        );
                      }
                      
                      return (
                        <td key={colIdx} style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
        </>
      ) : attendanceData?.data?.employees && filteredEmployees.length === 0 ? (
        <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: '#6c757d', margin: 0 }}>
            No employees found matching "{searchTerm}"
          </p>
        </Card>
      ) : !loading && !error && (
        <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: '#6c757d', margin: 0 }}>
            No attendance data available. Click "Refresh Data" to load.
          </p>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spinner animation="border" style={{ width: '3rem', height: '3rem', color: '#2563eb' }} />
          <p style={{ marginTop: '16px', fontSize: '16px', color: '#6c757d' }}>
            Loading attendance data...
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceView;

