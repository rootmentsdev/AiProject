import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col, Form, Badge, Button } from 'react-bootstrap';

const DSRAnalysisDashboard = ({ data }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Get current date and format it
  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Get date range based on selection
  const getDateRange = (period) => {
    const now = new Date();
    switch (period) {
      case 'today':
        return getCurrentDate();
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
      case 'month':
        return now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      default:
        return getCurrentDate();
    }
  };

  if (!data) {
    return (
      <Card className="shadow-sm border-0" style={{ 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        animation: 'fadeIn 0.6s ease-in-out'
      }}>
        <Card.Body className="text-center py-5">
          <div className="text-muted">
            <i className="fas fa-chart-line fa-3x mb-3 opacity-50"></i>
            <p className="mb-0">No DSR data available</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Create issues table data from bad performing stores
  const getIssuesData = () => {
    if (!data.badPerformingStores || data.badPerformingStores.length === 0) {
      return [];
    }

    return data.badPerformingStores.map((store, index) => ({
      id: index + 1,
      storeName: store.storeName,
      conversionRate: store.conversionRate,
      issue: `Low Performance (${store.conversionRate})`,
      rootCause: store.whyBadPerforming || 'Performance issues identified',
      actions: store.suggestedActions || 'Implement improvement strategies'
    }));
  };

  const issuesData = getIssuesData();

  // CSV Export Function
  const exportToCSV = () => {
    if (issuesData.length === 0) {
      alert('No data to export');
      return;
    }

    // Create CSV headers
    const headers = ['#', 'Store Name', 'Conversion Rate', 'Root Cause', 'Recommended Actions'];
    
    // Create CSV rows
    const csvRows = issuesData.map(item => [
      item.id,
      `"${item.storeName}"`,
      `"${item.conversionRate}"`,
      `"${item.rootCause.replace(/"/g, '""')}"`,
      `"${item.actions.replace(/"/g, '""')}"`
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...csvRows]
      .map(row => row.join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `store-performance-issues-${currentDate}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    alert(`CSV exported successfully! File: store-performance-issues-${currentDate}.csv`);
  };

  return (
    <div className={`fade-in ${isLoaded ? 'loaded' : ''}`}>
      {/* Data Selection */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="shadow-sm border-0 h-100" style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            transition: 'all 0.3s ease',
            animation: 'slideInLeft 0.6s ease-out'
          }}>
            <Card.Header className="bg-white border-0 py-3">
              <h6 className="mb-0 text-dark">
                <i className="fas fa-calendar-alt me-2 text-primary"></i>
                Data Period
              </h6>
            </Card.Header>
            <Card.Body className="py-3">
              <Form.Select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                size="sm"
                className="border-0 shadow-sm mb-3"
                style={{ 
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  transition: 'all 0.3s ease'
                }}
              >
                <option value="today">📅 Today's Data</option>
                <option value="yesterday">📅 Yesterday</option>
                <option value="week">📅 This Week</option>
                <option value="month">📅 This Month</option>
              </Form.Select>
              <div className="text-center">
                <Badge bg="info" className="px-3 py-2">
                  <i className="fas fa-clock me-1"></i>
                  {getDateRange(selectedPeriod)}
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          <Card className="shadow-sm border-0" style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            animation: 'slideInRight 0.6s ease-out'
          }}>
            <Card.Header className="bg-white border-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 text-dark">
                  <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
                  Store Performance Issues
                </h6>
                <div className="d-flex gap-2">
                  <Badge bg="danger" className="pulse-animation">
                    {issuesData.length} Issues Found
                  </Badge>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="rounded-pill"
                    onClick={exportToCSV}
                    disabled={issuesData.length === 0}
                  >
                    <i className="fas fa-download me-1"></i>Export CSV
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th width="8%" className="border-0 py-3 text-muted fw-bold text-center">#</th>
                      <th width="20%" className="border-0 py-3 text-muted fw-bold">
                        <i className="fas fa-store me-2"></i>Store Name
                      </th>
                      <th width="15%" className="border-0 py-3 text-muted fw-bold text-center">
                        <i className="fas fa-percentage me-2"></i>Conversion
                      </th>
                      <th width="25%" className="border-0 py-3 text-muted fw-bold">
                        <i className="fas fa-search me-2"></i>Root Cause
                      </th>
                      <th width="32%" className="border-0 py-3 text-muted fw-bold">
                        <i className="fas fa-tools me-2"></i>Recommended Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {issuesData.map((item, index) => (
                      <tr 
                        key={item.id} 
                        className="table-row-hover"
                        style={{ 
                          animationDelay: `${index * 0.1}s`,
                          animation: 'fadeInUp 0.6s ease-out forwards',
                          opacity: 0
                        }}
                      >
                        <td className="py-3 text-center">
                          <Badge bg="secondary" className="rounded-circle">
                            {item.id}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="d-flex align-items-center">
                            <i className="fas fa-store text-primary me-2"></i>
                            <strong className="text-dark">{item.storeName}</strong>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <Badge 
                            bg={parseFloat(item.conversionRate) < 50 ? 'danger' : parseFloat(item.conversionRate) < 70 ? 'warning' : 'success'}
                            className="px-3 py-2"
                          >
                            {item.conversionRate}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted">
                          <div className="small">
                            {item.rootCause}
                          </div>
                        </td>
                        <td className="py-3 text-muted">
                          <div className="small">
                            {item.actions}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center shadow-sm border-0" style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            animation: 'fadeInUp 0.8s ease-out'
          }}>
            <Card.Body className="py-4">
              <i className="fas fa-store fa-2x text-primary mb-3"></i>
              <h3 className="text-primary mb-1">{data.analysisSummary?.totalStores || 0}</h3>
              <p className="mb-0 text-muted">Total Stores</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-0" style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            animation: 'fadeInUp 0.8s ease-out',
            animationDelay: '0.1s'
          }}>
            <Card.Body className="py-4">
              <i className="fas fa-exclamation-triangle fa-2x text-danger mb-3"></i>
              <h3 className="text-danger mb-1">{issuesData.length}</h3>
              <p className="mb-0 text-muted">Issues Found</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-0" style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            animation: 'fadeInUp 0.8s ease-out',
            animationDelay: '0.2s'
          }}>
            <Card.Body className="py-4">
              <i className="fas fa-calendar fa-2x text-info mb-3"></i>
              <h3 className="text-info mb-1">{getDateRange(selectedPeriod).split(' ')[0]}</h3>
              <p className="mb-0 text-muted">Current Period</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-0" style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            animation: 'fadeInUp 0.8s ease-out',
            animationDelay: '0.3s'
          }}>
            <Card.Body className="py-4">
              <i className="fas fa-chart-line fa-2x text-success mb-3"></i>
              <h3 className="text-success mb-1">
                {data.analysisSummary?.totalStores ? 
                  Math.round((issuesData.length / data.analysisSummary.totalStores) * 100) : 0}%
              </h3>
              <p className="mb-0 text-muted">Issue Rate</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DSRAnalysisDashboard;