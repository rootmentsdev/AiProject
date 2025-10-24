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
            <p className="mt-3 text-muted">Analyzing DSR data and cancellations...</p>
          </Col>
        </Row>
      )}

      {/* Analysis Results */}
      {analysisData && !loading && (
        <>
          {/* Executive Summary */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <Card.Body className="text-center">
                  <h4>{analysisData.summary?.criticalStores || 0}</h4>
                  <small>Critical Stores</small>
                  <p className="small mb-0 mt-2 opacity-75">Both poor DSR & high cancellations</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                <Card.Body className="text-center">
                  <h4>₹{analysisData.summary?.totalLoss?.toLocaleString() || 0}</h4>
                  <small>Total Estimated Loss</small>
                  <p className="small mb-0 mt-2 opacity-75">Revenue + Opportunity Loss</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Card.Body className="text-center">
                  <h4>{analysisData.summary?.totalCancellations || 0}</h4>
                  <small>Total Cancellations</small>
                  <p className="small mb-0 mt-2 opacity-75">On DSR date</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
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
          {analysisData.allStores && analysisData.allStores.length > 0 && (
            <Row className="mb-4" style={{ animation: 'fadeIn 0.5s ease-in' }}>
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-primary text-white py-3">
                    <h5 className="mb-0">
                      <i className="fas fa-table me-2"></i>
                      All Stores with Cancellations - Action Plans
                      <Badge bg="light" text="dark" className="ms-3">
                        {analysisData.allStores.length} Stores
                      </Badge>
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <Table responsive hover className="mb-0">
                      <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          <th style={{ width: '50px' }}>#</th>
                          <th style={{ width: '180px' }}>Store Name</th>
                          <th style={{ width: '140px' }}>DSR Status</th>
                          <th style={{ width: '100px' }} className="text-center">Cancellations</th>
                          <th style={{ width: '250px' }}>Top Cancel Reason</th>
                          <th style={{ width: '120px' }} className="text-center">Severity</th>
                          <th style={{ width: '120px' }} className="text-center">Action Plan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisData.allStores.map((store, index) => (
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
                                <strong style={{ fontSize: '0.95rem' }}>{store.storeName}</strong>
                                {store.cancellationStoreName !== store.storeName && (
                                  <><br/><small className="text-muted">({store.cancellationStoreName})</small></>
                                )}
                              </td>
                              <td style={{ verticalAlign: 'middle' }}>
                                {store.dsrStatus === 'GOOD' ? (
                                  <Badge bg="success" className="px-3 py-2">
                                    <i className="fas fa-check-circle me-1"></i>
                                    Good DSR
                                  </Badge>
                                ) : (
                                  <Badge bg="danger" className="px-3 py-2">
                                    <i className="fas fa-exclamation-circle me-1"></i>
                                    Poor DSR
                                  </Badge>
                                )}
                                <br/>
                                <small className="text-muted mt-1 d-block">
                                  {store.dsrLoss > 0 ? `Loss: ₹${store.dsrLoss.toLocaleString()}` : 'No loss'}
                                </small>
                              </td>
                              <td style={{ verticalAlign: 'middle' }} className="text-center">
                                <Badge bg="warning" text="dark" className="px-3 py-2" style={{ fontSize: '1rem' }}>
                                  {store.totalCancellations}
                                </Badge>
                              </td>
                              <td style={{ verticalAlign: 'middle' }}>
                                <small style={{ lineHeight: '1.4' }}>
                                  {store.cancellationReasons[0]?.reason.substring(0, 50) || 'N/A'}
                                  {store.cancellationReasons[0]?.reason.length > 50 && '...'}
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
                              <td colSpan="7" className="p-0" style={{ border: 'none' }}>
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
                                        <Row>
                                          <Col md={6}>
                                            {/* DSR Issues */}
                                            <div className="mb-3">
                                              <h6 className="text-primary">
                                                <i className="fas fa-chart-line me-2"></i>
                                                DSR Status:
                                              </h6>
                                              <ul className="list-unstyled ms-3">
                                                {store.dsrIssues?.map((issue, i) => (
                                                  <li key={i} className={`mb-2 ${store.dsrStatus === 'GOOD' ? 'text-success' : 'text-dark'}`}>
                                                    <i className={`fas fa-${store.dsrStatus === 'GOOD' ? 'check' : 'arrow-right'} me-2`}></i>
                                                    {issue}
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          </Col>
                                          <Col md={6}>
                                            {/* Cancellation Reasons */}
                                            <div className="mb-3">
                                              <h6 className="text-warning">
                                                <i className="fas fa-times-circle me-2"></i>
                                                Cancellation Problems:
                                              </h6>
                                              <ul className="list-unstyled ms-3">
                                                {store.cancellationReasons?.map((reason, i) => (
                                                  <li key={i} className="mb-2">
                                                    <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
                                                    {reason.reason} 
                                                    <Badge bg="secondary" className="ms-2">
                                                      {reason.count}x ({reason.percentage}%)
                                                    </Badge>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          </Col>
                                        </Row>

                                        <hr/>

                                        {/* Action Plan */}
                                        <div className="bg-light p-3 rounded">
                                          <h6 className="text-success mb-3">
                                            <i className="fas fa-bullseye me-2"></i>
                                            CEO Action Plan:
                                          </h6>
                                          
                                          <Row>
                                            <Col md={4}>
                                              <div className="mb-3">
                                                <div className="d-flex align-items-center mb-2">
                                                  <Badge bg="danger" className="me-2">1</Badge>
                                                  <strong className="text-danger">Immediate (24-48h)</strong>
                                                </div>
                                                <ol className="mb-0 ms-2">
                                                  {store.actionPlan?.immediate?.map((action, i) => (
                                                    <li key={i} className="mb-2 small">{action}</li>
                                                  ))}
                                                </ol>
                                              </div>
                                            </Col>
                                            <Col md={4}>
                                              <div className="mb-3">
                                                <div className="d-flex align-items-center mb-2">
                                                  <Badge bg="warning" text="dark" className="me-2">2</Badge>
                                                  <strong className="text-warning">Short-term (1-2 weeks)</strong>
                                                </div>
                                                <ol className="mb-0 ms-2">
                                                  {store.actionPlan?.shortTerm?.map((action, i) => (
                                                    <li key={i} className="mb-2 small">{action}</li>
                                                  ))}
                                                </ol>
                                              </div>
                                            </Col>
                                            <Col md={4}>
                                              <div className="mb-3">
                                                <div className="d-flex align-items-center mb-2">
                                                  <Badge bg="info" className="me-2">3</Badge>
                                                  <strong className="text-info">Long-term (1-3 months)</strong>
                                                </div>
                                                <ol className="mb-0 ms-2">
                                                  {store.actionPlan?.longTerm?.map((action, i) => (
                                                    <li key={i} className="mb-2 small">{action}</li>
                                                  ))}
                                                </ol>
                                              </div>
                                            </Col>
                                          </Row>

                                          <div className="mt-3 p-3 bg-success bg-opacity-10 rounded border border-success">
                                            <strong className="text-success">
                                              <i className="fas fa-chart-line me-2"></i>
                                              Expected Impact:
                                            </strong>
                                            <p className="mb-0 mt-2">{store.actionPlan?.expectedImpact}</p>
                                          </div>
                                        </div>
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

