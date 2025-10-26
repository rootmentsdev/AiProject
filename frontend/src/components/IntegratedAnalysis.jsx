import React, { useState } from 'react';
import { Card, Table, Row, Col, Button, Alert, Spinner, Badge, Collapse } from 'react-bootstrap';

const IntegratedAnalysis = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  const performAnalysis = async () => {
    console.log('🚀 Frontend: Starting analysis request...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('📤 Frontend: Sending POST to http://localhost:5000/api/integrated-analysis');
      const response = await fetch('http://localhost:5000/api/integrated-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📥 Frontend: Response received, status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Frontend: Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Frontend: Data received successfully:', data);
      setAnalysisData(data);
      
    } catch (err) {
      console.error('❌ Frontend: Analysis failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      console.log('🏁 Frontend: Analysis request completed');
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'CRITICAL': return 'danger';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      default: return 'secondary';
    }
  };

  const toggleRow = (index) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Filter stores to only show those with actual DSR issues
  // TEMPORARY: Show only 1 worst performing store due to API token limits
  const getFilteredStores = () => {
    if (!analysisData?.allStores) return [];

    // First, filter stores with actual DSR issues
    const storesWithIssues = analysisData.allStores.filter((store) => {
      // Parse DSR values for comparison
      const convRate = parseFloat(store.dsrMetrics?.conversionRate || '0');
      const abs = parseFloat(store.dsrMetrics?.absValue || '0');
      const abv = parseFloat(store.dsrMetrics?.abvValue || '0');

      // Check if store fails ANY criterion (has actual issues)
      const hasConversionIssue = !isNaN(convRate) && convRate < 80;
      const hasAbsIssue = !isNaN(abs) && abs < 1.8;
      const hasAbvIssue = !isNaN(abv) && abv < 4500;

      // Return true if store fails at least ONE criterion
      return hasConversionIssue || hasAbsIssue || hasAbvIssue;
    });

    // Calculate "badness score" for each store (higher score = worse performance)
    const storesWithScores = storesWithIssues.map(store => {
      const convRate = parseFloat(store.dsrMetrics?.conversionRate || '100');
      const abs = parseFloat(store.dsrMetrics?.absValue || '2');
      const abv = parseFloat(store.dsrMetrics?.abvValue || '5000');
      
      // Calculate how far BELOW each threshold (higher = worse)
      // Conversion: Target is 80%, if store has 25%, badness = 80-25 = 55
      const convBadness = Math.max(0, 80 - convRate);
      
      // ABS: Target is 1.8, if store has 1.27, badness = (1.8-1.27)*50 = 26.5
      const absBadness = Math.max(0, (1.8 - abs) * 50);
      
      // ABV: Target is 4500, if store has 3000, badness = (4500-3000)/100 = 15
      const abvBadness = Math.max(0, (4500 - abv) / 100);
      
      // Total badness score (higher = worse performance)
      // Weight: Conversion (70%), ABS (15%), ABV (15%)
      const badnessScore = (convBadness * 0.7) + (absBadness * 0.15) + (abvBadness * 0.15);
      
      return { ...store, badnessScore, convBadness, absBadness, abvBadness };
    });

    // Sort by WORST performance (highest badness score first)
    storesWithScores.sort((a, b) => b.badnessScore - a.badnessScore);

    // TEMPORARY: Return only the 4 WORST performing stores (due to API token limits)
    // TODO: Remove this limit once API capacity increases
    return storesWithScores.slice(0, 4);
  };

  const filteredStores = getFilteredStores();
  const totalBadStores = analysisData?.allStores?.filter((store) => {
    const convRate = parseFloat(store.dsrMetrics?.conversionRate || '0');
    const abs = parseFloat(store.dsrMetrics?.absValue || '0');
    const abv = parseFloat(store.dsrMetrics?.abvValue || '0');
    return (!isNaN(convRate) && convRate < 80) || (!isNaN(abs) && abs < 1.8) || (!isNaN(abv) && abv < 4500);
  }).length || 0;

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <Card.Body className="py-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-2">
                    <i className="fas fa-brain me-3"></i>
                    Integrated Analysis & Action Plan
                  </h2>
                  <p className="mb-0 opacity-75">
                    Compare DSR performance with cancellation data and get CEO-level action plans
                  </p>
                </div>
                <Button
                  variant="light"
                  size="lg"
                  onClick={performAnalysis}
                  disabled={loading}
                  className="px-4"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-play me-2"></i>
                      Run Analysis
                    </>
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Error Display */}
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              <Alert.Heading>
                <i className="fas fa-exclamation-triangle me-2"></i>
                Analysis Error
              </Alert.Heading>
              <p>{error}</p>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Loading */}
      {loading && (
        <Row className="mb-4">
          <Col className="text-center">
            <Spinner animation="border" style={{ width: '3rem', height: '3rem' }} />
            <p className="mt-3 text-muted">Analyzing DSR data and finding top 4 worst performing stores...</p>
            <small className="text-warning">⚠️ Temporary mode: Showing only TOP 4 worst stores to avoid API limits</small>
          </Col>
        </Row>
      )}

      {/* Analysis Results */}
      {analysisData && !loading && (
        <>
          {/* API Limit Warning */}
          <Row className="mb-4">
            <Col>
              <Alert variant="warning" className="border-0 shadow-sm">
                <div className="d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle fa-2x me-3"></i>
                  <div>
                    <h6 className="mb-1">
                      <strong>⚠️ Temporary Limitation: Showing TOP 4 of {totalBadStores} Stores</strong>
                    </h6>
                    <small>
                      Due to API token limits, we're showing only the <strong>TOP 4 WORST performing stores</strong> with detailed action plans. 
                      Once API capacity increases, all {totalBadStores} underperforming stores will be displayed with full analysis.
                    </small>
                  </div>
                </div>
              </Alert>
            </Col>
          </Row>

          {/* Executive Summary */}
          <Row className="mb-4">
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <Card.Body className="text-center">
                  <h4>{analysisData.summary?.criticalStores || 0}</h4>
                  <small>Critical Stores</small>
                  <p className="small mb-0 mt-2 opacity-75">Both poor DSR & high cancellations</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Card.Body className="text-center">
                  <h4>{analysisData.summary?.totalCancellations || 0}</h4>
                  <small>Total Cancellations</small>
                  <p className="small mb-0 mt-2 opacity-75">On DSR date</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', color: 'white' }}>
                <Card.Body className="text-center">
                  <h4>₹{analysisData.summary?.estimatedRecovery?.toLocaleString() || 0}</h4>
                  <small>Est. Recovery Potential</small>
                  <p className="small mb-0 mt-2 opacity-75">If issues resolved</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* All Stores with Issues - Table Format */}
          {filteredStores && filteredStores.length > 0 && (
            <Row className="mb-4" style={{ animation: 'fadeIn 0.5s ease-in' }}>
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-primary text-white py-3">
                    <h5 className="mb-0">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      TOP 4 WORST Performing Stores - Detailed Action Plans
                      <Badge bg="danger" className="ms-3 pulse-animation">
                        Showing 4 of {totalBadStores} Bad Stores
                      </Badge>
                    </h5>
                    <small className="d-block mt-2 opacity-75">
                      ⚠️ <strong>Temporary Limit:</strong> Showing only the TOP 4 WORST performing stores due to API token limits. Full analysis will show all {totalBadStores} stores once API capacity increases.
                    </small>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <Table responsive hover className="mb-0">
                      <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          <th style={{ width: '40px' }}>#</th>
                          <th style={{ width: '130px' }}>Store Name</th>
                          <th style={{ width: '80px' }} className="text-center">Conv%</th>
                          <th style={{ width: '70px' }} className="text-center">ABS</th>
                          <th style={{ width: '90px' }} className="text-center">ABV</th>
                          <th style={{ width: '100px' }} className="text-center">Staff</th>
                          <th style={{ width: '70px' }} className="text-center">Cancels</th>
                          <th style={{ width: '200px' }}>Top Cancel Reason</th>
                          <th style={{ width: '90px' }} className="text-center">Severity</th>
                          <th style={{ width: '100px' }} className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStores.map((store, index) => (
                          <React.Fragment key={index}>
                            <tr 
                              style={{ 
                                transition: 'all 0.3s ease',
                                backgroundColor: expandedRows[index] ? '#f0f8ff' : 'white',
                                animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                              }}
                              className={expandedRows[index] ? 'table-active' : ''}
                            >
                              <td style={{ verticalAlign: 'middle' }}>
                                <strong>{index + 1}</strong>
                              </td>
                              <td style={{ verticalAlign: 'middle' }}>
                                <strong style={{ fontSize: '0.9rem' }}>{store.storeName}</strong>
                                {store.cancellationStoreName !== store.storeName && (
                                  <><br/><small className="text-muted">({store.cancellationStoreName})</small></>
                                )}
                              </td>
                              <td style={{ verticalAlign: 'middle' }} className="text-center">
                                <Badge 
                                  bg={
                                    parseFloat(store.dsrMetrics?.conversionRate) < 50 ? 'danger' : 
                                    parseFloat(store.dsrMetrics?.conversionRate) < 80 ? 'warning' : 
                                    'success'
                                  }
                                  className="px-2 py-1"
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  {store.dsrMetrics?.conversionRate || 'N/A'}
                                </Badge>
                              </td>
                              <td style={{ verticalAlign: 'middle' }} className="text-center">
                                <Badge 
                                  bg={parseFloat(store.dsrMetrics?.absValue) < 1.8 ? 'danger' : 'secondary'}
                                  className="px-2 py-1"
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  {store.dsrMetrics?.absValue || 'N/A'}
                                </Badge>
                              </td>
                              <td style={{ verticalAlign: 'middle' }} className="text-center">
                                <Badge 
                                  bg={parseFloat(store.dsrMetrics?.abvValue) < 4500 ? 'danger' : 'secondary'}
                                  className="px-2 py-1"
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  ₹{store.dsrMetrics?.abvValue || 'N/A'}
                                </Badge>
                              </td>
                              <td style={{ verticalAlign: 'middle' }} className="text-center">
                                {store.staffPerformance ? (
                                  <>
                                    <Badge 
                                      bg={
                                        store.staffPerformance.performanceStatus === 'CRITICAL' ? 'danger' :
                                        store.staffPerformance.performanceStatus === 'POOR' ? 'warning' :
                                        store.staffPerformance.performanceStatus === 'AVERAGE' ? 'info' : 'success'
                                      }
                                      className="px-2 py-1"
                                      style={{ fontSize: '0.75rem' }}
                                    >
                                      {store.staffPerformance.performanceStatus}
                                  </Badge>
                                    <br/>
                                    <small className="text-muted mt-1 d-block" style={{ fontSize: '0.7rem' }}>
                                      {store.staffPerformance.conversionRate}%
                                    </small>
                                  </>
                                ) : (
                                  <small className="text-muted">N/A</small>
                                )}
                              </td>
                              <td style={{ verticalAlign: 'middle' }} className="text-center">
                                <Badge 
                                  bg={store.totalCancellations === 0 ? 'success' : 'warning'} 
                                  text={store.totalCancellations === 0 ? 'white' : 'dark'} 
                                  className="px-2 py-1" 
                                  style={{ fontSize: '0.85rem' }}
                                >
                                  {store.totalCancellations}
                                </Badge>
                              </td>
                              <td style={{ verticalAlign: 'middle' }}>
                                <small style={{ lineHeight: '1.4' }}>
                                  {store.totalCancellations === 0 ? (
                                    <span className="text-success">✓ No cancellations</span>
                                  ) : (
                                    <>
                                  {store.cancellationReasons[0]?.reason.substring(0, 50) || 'N/A'}
                                  {store.cancellationReasons[0]?.reason.length > 50 && '...'}
                                    </>
                                  )}
                                </small>
                              </td>
                              <td style={{ verticalAlign: 'middle' }} className="text-center">
                                <Badge 
                                  bg={getSeverityColor(store.severity)} 
                                  className="px-3 py-2"
                                  style={{ fontSize: '0.85rem', minWidth: '90px' }}
                                >
                                  {store.severity}
                                </Badge>
                              </td>
                              <td style={{ verticalAlign: 'middle' }} className="text-center">
                                <Button 
                                  size="sm" 
                                  variant={expandedRows[index] ? 'primary' : 'outline-primary'}
                                  onClick={() => toggleRow(index)}
                                  style={{ 
                                    transition: 'all 0.3s ease',
                                    minWidth: '100px'
                                  }}
                                >
                                  <i className={`fas fa-${expandedRows[index] ? 'chevron-up' : 'eye'} me-1`}></i>
                                  {expandedRows[index] ? 'Hide' : 'View Plan'}
                                </Button>
                              </td>
                            </tr>
                            
                            {/* Expandable Action Plan Row */}
                            <tr style={{ border: 'none' }}>
                              <td colSpan="8" className="p-0" style={{ border: 'none' }}>
                                <Collapse in={expandedRows[index]}>
                                  <div>
                                    <Card 
                                      className="m-3 border-primary shadow-sm"
                                      style={{ 
                                        animation: expandedRows[index] ? 'expandIn 0.4s ease-out' : 'none',
                                        borderLeft: '4px solid #0d6efd'
                                      }}
                                    >
                                      <Card.Header className="bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                                        <strong>
                                          <i className="fas fa-clipboard-list me-2"></i>
                                          {store.storeName} - Detailed Action Plan
                                        </strong>
                                      </Card.Header>
                                      <Card.Body>
                                        {/* 🎯 ROOT CAUSE - MOST PROMINENT SECTION */}
                                        {store.actionPlan?.rootCause && (
                                          <div className="mb-4 p-4 text-center" style={{ 
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            borderRadius: '15px',
                                            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
                                          }}>
                                            <h3 className="text-white mb-3">
                                              <i className="fas fa-bullseye me-2"></i>
                                              ROOT CAUSE IDENTIFIED
                                            </h3>
                                            <div className="bg-white rounded p-3 mb-3">
                                              <h5 className="text-dark mb-0" style={{ fontSize: '1.3rem', lineHeight: '1.6' }}>
                                                {store.actionPlan.rootCause}
                                              </h5>
                                            </div>
                                            {store.actionPlan?.rootCauseCategory && (
                                              <Badge 
                                                bg="light"
                                                text="dark"
                                                className="px-4 py-2"
                                                style={{ fontSize: '1.1rem', fontWeight: '600' }}
                                              >
                                                Category: {store.actionPlan.rootCauseCategory.replace(/_/g, ' ')}
                                              </Badge>
                                            )}
                                          </div>
                                        )}

                                        {/* 📊 QUICK METRICS OVERVIEW */}
                                        <Row className="mb-4">
                                          <Col md={4}>
                                            <Card className="text-center border-0" style={{ background: '#f8f9fa' }}>
                                              <Card.Body className="py-3">
                                                <h6 className="text-muted mb-2">DSR Conversion</h6>
                                                <h2 className={`mb-0 ${
                                                  parseFloat(store.dsrMetrics?.conversionRate) < 50 ? 'text-danger' :
                                                  parseFloat(store.dsrMetrics?.conversionRate) < 80 ? 'text-warning' : 'text-success'
                                                }`}>
                                                  {store.dsrMetrics?.conversionRate}%
                                                </h2>
                                                <small className="text-muted">Target: 80%</small>
                                              </Card.Body>
                                            </Card>
                                          </Col>
                                          <Col md={4}>
                                            <Card className="text-center border-0" style={{ background: '#f8f9fa' }}>
                                              <Card.Body className="py-3">
                                                <h6 className="text-muted mb-2">Staff Conversion</h6>
                                                <h2 className={`mb-0 ${
                                                  store.staffPerformance ? (
                                                    parseFloat(store.staffPerformance.conversionRate) < 50 ? 'text-danger' :
                                                    parseFloat(store.staffPerformance.conversionRate) < 70 ? 'text-warning' : 'text-success'
                                                  ) : 'text-muted'
                                                }`}>
                                                  {store.staffPerformance?.conversionRate || 'N/A'}%
                                                </h2>
                                                <small className="text-muted">Target: 70%</small>
                                              </Card.Body>
                                            </Card>
                                          </Col>
                                          <Col md={4}>
                                            <Card className="text-center border-0" style={{ background: '#f8f9fa' }}>
                                              <Card.Body className="py-3">
                                                <h6 className="text-muted mb-2">Cancellations</h6>
                                                <h2 className={`mb-0 ${store.totalCancellations > 5 ? 'text-danger' : store.totalCancellations > 0 ? 'text-warning' : 'text-success'}`}>
                                                  {store.totalCancellations}
                                                </h2>
                                                <small className="text-muted">Target: 0</small>
                                              </Card.Body>
                                            </Card>
                                          </Col>
                                        </Row>

                                        <hr className="my-4"/>

                                        {/* 📋 DETAILED DATA IN TABS */}
                                        <Row>
                          <Col md={4}>
                                            {/* DSR Issues */}
                                            <div className="mb-3">
                                              <h6 className="text-primary">
                                                <i className="fas fa-chart-line me-2"></i>
                                DSR Performance Issues:
                                              </h6>
                                              <ul className="list-unstyled ms-3">
                                <li className="mb-2 small">
                                  <i className="fas fa-percentage me-2 text-primary"></i>
                                  <strong>Conversion:</strong> {store.dsrMetrics?.conversionRate}%
                                  {parseFloat(store.dsrMetrics?.conversionRate) < 80 && (
                                    <Badge bg="danger" className="ms-2">Below 80%</Badge>
                                  )}
                                </li>
                                <li className="mb-2 small">
                                  <i className="fas fa-shopping-cart me-2 text-primary"></i>
                                  <strong>ABS:</strong> {store.dsrMetrics?.absValue}
                                  {parseFloat(store.dsrMetrics?.absValue) < 1.8 && (
                                    <Badge bg="danger" className="ms-2">Below 1.8</Badge>
                                  )}
                                </li>
                                <li className="mb-2 small">
                                  <i className="fas fa-rupee-sign me-2 text-primary"></i>
                                  <strong>ABV:</strong> ₹{store.dsrMetrics?.abvValue}
                                  {parseFloat(store.dsrMetrics?.abvValue) < 4500 && (
                                    <Badge bg="danger" className="ms-2">Below ₹4500</Badge>
                                  )}
                                </li>
                                <li className="mb-2 small">
                                  <i className="fas fa-times-circle me-2 text-danger"></i>
                                  <strong>Loss of Sale:</strong> {store.dsrMetrics?.lossOfSale}
                                                  </li>
                                              </ul>
                                            </div>
                                          </Col>
                          <Col md={4}>
                                            {/* Cancellation Reasons */}
                                            <div className="mb-3">
                              <h6 className={store.totalCancellations === 0 ? 'text-success' : 'text-warning'}>
                                <i className={`fas fa-${store.totalCancellations === 0 ? 'check-circle' : 'times-circle'} me-2`}></i>
                                {store.totalCancellations === 0 ? 'Cancellation Status:' : 'Cancellation Problems:'}
                                              </h6>
                              {store.totalCancellations === 0 ? (
                                <div className="alert alert-success py-2 px-3 small mb-0">
                                  <i className="fas fa-check-circle me-2"></i>
                                  <strong>Excellent!</strong> No cancellations recorded.
                                  <br/>
                                  Customer retention is good. Focus on improving sales performance.
                                </div>
                              ) : (
                                              <ul className="list-unstyled ms-3">
                                                {store.cancellationReasons?.map((reason, i) => (
                                    <li key={i} className="mb-2 small">
                                                    <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
                                                    {reason.reason} 
                                      <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.7rem' }}>
                                                      {reason.count}x ({reason.percentage}%)
                                                    </Badge>
                                                  </li>
                                                ))}
                                              </ul>
                              )}
                            </div>
                          </Col>
                          <Col md={4}>
                            {/* Staff Performance */}
                            <div className="mb-3">
                              <h6 className="text-info">
                                <i className="fas fa-users me-2"></i>
                                Staff Performance:
                              </h6>
                              {store.staffPerformance ? (
                                <div className="ms-3">
                                  <div className="mb-2">
                                    <Badge 
                                      bg={
                                        store.staffPerformance.performanceStatus === 'CRITICAL' ? 'danger' :
                                        store.staffPerformance.performanceStatus === 'POOR' ? 'warning' :
                                        store.staffPerformance.performanceStatus === 'AVERAGE' ? 'info' : 'success'
                                      }
                                      className="px-3 py-2"
                                      style={{ fontSize: '0.85rem' }}
                                    >
                                      {store.staffPerformance.performanceStatus}
                                    </Badge>
                                  </div>
                                  <ul className="list-unstyled small mb-2">
                                    <li className="mb-1">
                                      <strong>Conversion Rate:</strong>{' '}
                                      <span className={
                                        parseFloat(store.staffPerformance.conversionRate) < 50 ? 'text-danger fw-bold' :
                                        parseFloat(store.staffPerformance.conversionRate) < 70 ? 'text-warning fw-bold' : 
                                        'text-success fw-bold'
                                      }>
                                        {store.staffPerformance.conversionRate}%
                                      </span>
                                      {' '}
                                      <small className="text-muted">
                                        ({store.staffPerformance.bills} bills ÷ {store.staffPerformance.walkIns || 'N/A'} walk-ins)
                                      </small>
                                    </li>
                                    <li className="mb-1"><strong>Walk-ins (DSR):</strong> {store.staffPerformance.walkIns || 'N/A'}</li>
                                    <li className="mb-1"><strong>Bills:</strong> {store.staffPerformance.bills}</li>
                                    <li className="mb-1"><strong>Quantity:</strong> {store.staffPerformance.quantity || 'N/A'}</li>
                                    <li className="mb-1">
                                      <strong>Loss of Sale:</strong>{' '}
                                      <Badge bg={store.staffPerformance.lossOfSale > 10 ? 'danger' : 'secondary'} className="px-2">
                                        {store.staffPerformance.lossOfSale}
                                      </Badge>
                                    </li>
                                    <li className="mb-1"><strong>Staff Count:</strong> {store.staffPerformance.staffCount}</li>
                                  </ul>
                                  
                                  {/* Staff Issues Alert */}
                                  {store.staffPerformance.staffIssues && store.staffPerformance.staffIssues.length > 0 && (
                                    <div className="alert alert-warning py-2 px-2 small mb-0">
                                      <strong>
                                        <i className="fas fa-exclamation-triangle me-1"></i>
                                        {store.staffPerformance.staffIssues.length} Staff Issue(s):
                                      </strong>
                                      <ul className="mb-0 mt-1 ps-3">
                                        {store.staffPerformance.staffIssues.slice(0, 3).map((issue, idx) => (
                                          <li key={idx} className="text-danger small">{issue}</li>
                                        ))}
                                        {store.staffPerformance.staffIssues.length > 3 && (
                                          <li className="text-muted">+{store.staffPerformance.staffIssues.length - 3} more...</li>
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="alert alert-secondary py-2 px-2 small mb-0">
                                  <i className="fas fa-info-circle me-1"></i>
                                  <strong>No staff performance data available</strong>
                                  <br />
                                  <small>Check if API is working or try Staff Performance page</small>
                                </div>
                              )}
                                            </div>
                                          </Col>
                                        </Row>

                                        <hr className="my-4"/>

                                        {/* 🎯 IMMEDIATE ACTION PLAN (3 Actions) */}
                                        <div className="mb-4">
                                          <Card className="border-0 shadow-sm" style={{ borderLeft: '5px solid #dc3545' }}>
                                            <Card.Body className="p-4">
                                              <h5 className="mb-3 text-danger">
                                                <i className="fas fa-bolt me-2"></i>
                                                <strong>IMMEDIATE ACTIONS (24-48 hours)</strong>
                                              </h5>
                                              <ol className="mb-0" style={{ fontSize: '1rem', lineHeight: '2' }}>
                                                {store.actionPlan?.immediate?.slice(0, 3).map((action, i) => (
                                                  <li key={i} className="mb-3">
                                                    <strong>{action}</strong>
                                                  </li>
                                                  ))}
                                                </ol>
                                            </Card.Body>
                                          </Card>
                                              </div>

                                        {/* Individual Staff Details (if available) */}
                                        {store.staffPerformance && store.staffPerformance.staffDetails && store.staffPerformance.staffDetails.length > 0 && (
                                          <>
                                            <hr className="my-3"/>
                                            <div className="bg-light p-3 rounded">
                                              <h6 className="text-info mb-3">
                                                <i className="fas fa-user-friends me-2"></i>
                                                Individual Staff Performance Details
                                              </h6>
                                              <div className="table-responsive">
                                                <table className="table table-sm table-hover mb-0">
                                                  <thead className="table-light">
                                                    <tr>
                                                      <th>Staff Name</th>
                                                      <th className="text-center">Bills</th>
                                                      <th className="text-center">Quantity</th>
                                                      <th className="text-center">Conversion</th>
                                                      <th className="text-center">Loss of Sale</th>
                                                      <th className="text-center">Status</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {store.staffPerformance.staffDetails.map((staff, idx) => {
                                                      // Parse conversion rate (handle both string and number)
                                                      const convRate = staff.conversionRate === 'N/A' ? null : parseFloat(staff.conversionRate);
                                                      
                                                      return (
                                                        <tr key={idx}>
                                                          <td><strong>{staff.name}</strong></td>
                                                          <td className="text-center">{staff.bills}</td>
                                                          <td className="text-center">{staff.quantity || 0}</td>
                                                          <td className="text-center">
                                                            {convRate !== null ? (
                                                              <Badge 
                                                                bg={
                                                                  convRate < 50 ? 'danger' :
                                                                  convRate < 70 ? 'warning' : 'success'
                                                                }
                                                                className="px-2"
                                                              >
                                                                {convRate.toFixed(1)}%
                                                              </Badge>
                                                            ) : (
                                                              <small className="text-muted">N/A</small>
                                                            )}
                                                          </td>
                                                          <td className="text-center">
                                                            <Badge bg={staff.lossOfSale > 5 ? 'danger' : 'secondary'}>
                                                              {staff.lossOfSale}
                                                            </Badge>
                                                          </td>
                                                          <td className="text-center">
                                                            {convRate !== null && convRate < 50 ? (
                                                              <span className="badge bg-danger">
                                                                <i className="fas fa-exclamation-circle me-1"></i>
                                                                Needs Training
                                                              </span>
                                                            ) : convRate !== null && convRate < 70 ? (
                                                              <span className="badge bg-warning text-dark">
                                                                <i className="fas fa-chart-line me-1"></i>
                                                                Monitor
                                                              </span>
                                                            ) : convRate !== null ? (
                                                              <span className="badge bg-success">
                                                                <i className="fas fa-check-circle me-1"></i>
                                                                Good
                                                              </span>
                                                            ) : (
                                                              <small className="text-muted">-</small>
                                                            )}
                                                          </td>
                                                        </tr>
                                                      );
                                                    })}
                                                  </tbody>
                                                </table>
                                              </div>
                                              
                                              {/* Staff Performance Summary */}
                                              <div className="mt-3 p-2 bg-white rounded border">
                                                <small className="text-muted">
                                                  <strong>💡 Staff Analysis:</strong>
                                                  {(() => {
                                                    const poorStaff = store.staffPerformance.staffDetails.filter(s => s.conversionRate < 50).length;
                                                    const avgStaff = store.staffPerformance.staffDetails.filter(s => s.conversionRate >= 50 && s.conversionRate < 70).length;
                                                    const goodStaff = store.staffPerformance.staffDetails.filter(s => s.conversionRate >= 70).length;
                                                    
                                                    if (poorStaff > 0) {
                                                      return ` ${poorStaff} staff member(s) need immediate training. Focus on improving their conversion techniques.`;
                                                    } else if (avgStaff > 0) {
                                                      return ` ${avgStaff} staff member(s) performing average. Provide coaching to reach 70%+ conversion.`;
                                                    } else {
                                                      return ` All ${goodStaff} staff members performing well! Maintain this level.`;
                                                    }
                                                  })()}
                                                </small>
                                              </div>
                                          </div>
                                          </>
                                        )}
                                      </Card.Body>
                                    </Card>
                                  </div>
                                </Collapse>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          <style jsx="true">{`
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateX(-20px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
            
            @keyframes expandIn {
              from {
                opacity: 0;
                transform: scaleY(0.8);
              }
              to {
                opacity: 1;
                transform: scaleY(1);
              }
            }
            
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            
            tr:hover {
              box-shadow: 0 2px 8px rgba(0,0,0,0.08);
              transform: translateY(-1px);
            }
          `}</style>

          {/* Old card-based view - REMOVED */}
          {analysisData.criticalStores_OLD && analysisData.criticalStores_OLD.length > 0 && (
            <Row className="mb-4">
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-danger text-white py-3">
                    <h5 className="mb-0">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Critical Stores (Poor DSR Performance + High Cancellations)
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    {analysisData.criticalStores_OLD.map((store, index) => (
                      <Card key={index} className="mb-3 border-start border-danger border-4">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h5 className="mb-1">
                                <i className="fas fa-store me-2 text-danger"></i>
                                {store.storeName}
                              </h5>
                              <small className="text-muted">
                                Matched with: <strong>{store.cancellationStoreName}</strong>
                              </small>
                            </div>
                            <Badge bg={getSeverityColor(store.severity)} className="px-3">
                              {store.severity}
                            </Badge>
                          </div>

                          {/* DSR Issues */}
                          <div className="mb-3">
                            <h6 className="text-primary">
                              <i className="fas fa-chart-line me-2"></i>
                              DSR Performance Issues:
                            </h6>
                            <ul className="mb-0">
                              {store.dsrIssues?.map((issue, i) => (
                                <li key={i}>{issue}</li>
                              ))}
                            </ul>
                            <div className="mt-2">
                              <small className="text-muted">
                                Revenue Loss: <strong className="text-danger">₹{store.dsrLoss?.toLocaleString()}</strong>
                              </small>
                            </div>
                          </div>

                          {/* Cancellation Issues */}
                          <div className="mb-3">
                            <h6 className="text-warning">
                              <i className="fas fa-times-circle me-2"></i>
                              Cancellation Problems:
                            </h6>
                            <ul className="mb-0">
                              {store.cancellationReasons?.map((reason, i) => (
                                <li key={i}>
                                  {reason.reason} ({reason.count} times - {reason.percentage}%)
                                </li>
                              ))}
                            </ul>
                            <div className="mt-2">
                              <small className="text-muted">
                                Total Cancellations: <strong className="text-warning">{store.totalCancellations}</strong>
                              </small>
                            </div>
                          </div>

                          {/* Combined Action Plan */}
                          <div className="bg-light p-3 rounded">
                            <h6 className="text-success mb-3">
                              <i className="fas fa-bullseye me-2"></i>
                              CEO Action Plan:
                            </h6>
                            
                            {/* Immediate Actions */}
                            <div className="mb-3">
                              <strong className="text-danger">Immediate (24-48 hours):</strong>
                              <ol className="mb-0 mt-2">
                                {store.actionPlan?.immediate?.map((action, i) => (
                                  <li key={i}>{action}</li>
                                ))}
                              </ol>
                            </div>

                            {/* Short-term Actions */}
                            <div className="mb-3">
                              <strong className="text-warning">Short-term (1-2 weeks):</strong>
                              <ol className="mb-0 mt-2">
                                {store.actionPlan?.shortTerm?.map((action, i) => (
                                  <li key={i}>{action}</li>
                                ))}
                              </ol>
                            </div>

                            {/* Long-term Actions */}
                            <div>
                              <strong className="text-info">Long-term (1-3 months):</strong>
                              <ol className="mb-0 mt-2">
                                {store.actionPlan?.longTerm?.map((action, i) => (
                                  <li key={i}>{action}</li>
                                ))}
                              </ol>
                            </div>

                            {/* Expected Impact */}
                            <div className="mt-3 p-2 bg-success bg-opacity-10 rounded">
                              <strong className="text-success">Expected Impact:</strong>
                              <p className="mb-0 mt-1 small">{store.actionPlan?.expectedImpact}</p>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Stores with Only DSR Issues */}
          {analysisData.dsrOnlyStores && analysisData.dsrOnlyStores.length > 0 && (
            <Row className="mb-4">
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-primary text-white py-3">
                    <h6 className="mb-0">
                      <i className="fas fa-chart-line me-2"></i>
                      Stores with DSR Issues Only (No Cancellations)
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <Table hover responsive>
                      <thead>
                        <tr>
                          <th>Store</th>
                          <th>Issues</th>
                          <th>Loss</th>
                          <th>Quick Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisData.dsrOnlyStores.map((store, index) => (
                          <tr key={index}>
                            <td><strong>{store.storeName}</strong></td>
                            <td>{store.issues?.join(', ')}</td>
                            <td className="text-danger">₹{store.loss?.toLocaleString()}</td>
                            <td><small>{store.quickAction}</small></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Stores with Only Cancellations */}
          {analysisData.cancellationOnlyStores && analysisData.cancellationOnlyStores.length > 0 && (
            <Row className="mb-4">
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-warning text-dark py-3">
                    <h6 className="mb-0">
                      <i className="fas fa-times-circle me-2"></i>
                      Stores with Cancellations Only (Good DSR Performance)
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <Table hover responsive>
                      <thead>
                        <tr>
                          <th>Store</th>
                          <th>Cancellations</th>
                          <th>Top Reason</th>
                          <th>Quick Fix</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisData.cancellationOnlyStores.map((store, index) => (
                          <tr key={index}>
                            <td><strong>{store.storeName}</strong></td>
                            <td className="text-warning">{store.totalCancellations}</td>
                            <td>{store.topReason}</td>
                            <td><small>{store.quickFix}</small></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}
    </div>
  );
};

export default IntegratedAnalysis;

