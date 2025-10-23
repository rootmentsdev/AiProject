import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col, Form, Badge, Button, Alert, Spinner, Modal } from 'react-bootstrap';

const IntegratedAnalysisDashboard = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [actionPlanData, setActionPlanData] = useState(null);
  const [dateRange, setDateRange] = useState({
    DateFrom: "2025-1-1",
    DateTo: "2025-10-23",
    LocationID: "0",
    UserID: "7777"
  });

  // Perform integrated analysis
  const performIntegratedAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/integrated-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dateRange)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalysisData(data);
      
      // Auto-generate action plan
      if (data.actionPlan) {
        setActionPlanData(data.actionPlan);
        setShowActionPlan(true);
      }
      
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate action plan only
  const generateActionPlan = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/action-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dateRange)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setActionPlanData(data.actionPlan);
      setShowActionPlan(true);
      
    } catch (err) {
      console.error('Action plan generation failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get cancellation data only
  const getCancellationData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams(dateRange);
      const response = await fetch(`http://localhost:5000/api/cancellation-data?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Cancellation data:', data);
      
    } catch (err) {
      console.error('Cancellation data fetch failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick analysis
  const performQuickAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/quick-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dateRange)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Quick analysis:', data);
      
    } catch (err) {
      console.error('Quick analysis failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Export action plan to CSV
  const exportActionPlan = () => {
    if (!actionPlanData) return;

    const csvData = [];
    
    // Add immediate actions
    if (actionPlanData.immediateActions) {
      actionPlanData.immediateActions.forEach(action => {
        csvData.push([
          action.actionId,
          action.title,
          action.description,
          action.priority,
          action.timeline,
          action.responsible,
          action.expectedImpact,
          action.cost || 'N/A'
        ]);
      });
    }

    // Add strategic actions
    if (actionPlanData.strategicActions) {
      actionPlanData.strategicActions.forEach(action => {
        csvData.push([
          action.actionId,
          action.title,
          action.description,
          action.category,
          action.timeline,
          action.responsible,
          action.expectedImpact,
          action.cost || 'N/A'
        ]);
      });
    }

    const headers = ['ID', 'Title', 'Description', 'Priority/Category', 'Timeline', 'Responsible', 'Expected Impact', 'Cost'];
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `action-plan-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                    AI-Powered Integrated Analysis
                  </h2>
                  <p className="mb-0 opacity-75">
                    Comprehensive DSR analysis with cancellation data correlation and AI-generated action plans
                  </p>
                </div>
                <div className="text-end">
                  <Badge bg="light" text="dark" className="fs-6 px-3 py-2">
                    <i className="fas fa-robot me-2"></i>
                    AI Enhanced
                  </Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Date Range Configuration */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0 py-3">
              <h6 className="mb-0">
                <i className="fas fa-cog me-2 text-primary"></i>
                Analysis Configuration
              </h6>
            </Card.Header>
            <Card.Body>
              <Alert variant="info" className="mb-3">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Auto-Date Detection:</strong> The system will automatically use the date from your DSR sheet (12/8/2025) to fetch corresponding cancellation data. The date fields below are optional and will override the auto-detected date if provided.
              </Alert>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date From (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      value={dateRange.DateFrom}
                      onChange={(e) => setDateRange({...dateRange, DateFrom: e.target.value})}
                      placeholder="Auto-detected from DSR"
                    />
                    <Form.Text className="text-muted">
                      Leave empty to use DSR sheet date
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date To (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      value={dateRange.DateTo}
                      onChange={(e) => setDateRange({...dateRange, DateTo: e.target.value})}
                      placeholder="Auto-detected from DSR"
                    />
                    <Form.Text className="text-muted">
                      Leave empty to use DSR sheet date
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Location ID</Form.Label>
                    <Form.Control
                      type="text"
                      value={dateRange.LocationID}
                      onChange={(e) => setDateRange({...dateRange, LocationID: e.target.value})}
                      placeholder="0"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>User ID</Form.Label>
                    <Form.Control
                      type="text"
                      value={dateRange.UserID}
                      onChange={(e) => setDateRange({...dateRange, UserID: e.target.value})}
                      placeholder="7777"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Action Buttons */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body className="py-3">
              <div className="d-flex gap-3 flex-wrap">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={performIntegratedAnalysis}
                  disabled={loading}
                  className="px-4 py-2"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-play me-2"></i>
                      Run Integrated Analysis
                    </>
                  )}
                </Button>
                
                <Button
                  variant="success"
                  size="lg"
                  onClick={generateActionPlan}
                  disabled={loading}
                  className="px-4 py-2"
                >
                  <i className="fas fa-tasks me-2"></i>
                  Generate Action Plan
                </Button>
                
                <Button
                  variant="info"
                  size="lg"
                  onClick={getCancellationData}
                  disabled={loading}
                  className="px-4 py-2"
                >
                  <i className="fas fa-download me-2"></i>
                  Get Cancellation Data
                </Button>
                
                <Button
                  variant="warning"
                  size="lg"
                  onClick={performQuickAnalysis}
                  disabled={loading}
                  className="px-4 py-2"
                >
                  <i className="fas fa-bolt me-2"></i>
                  Quick Analysis
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

      {/* Analysis Results */}
      {analysisData && (
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white border-0 py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <i className="fas fa-chart-line me-2 text-success"></i>
                    Analysis Results
                  </h6>
                  <Badge bg="success" className="px-3 py-2">
                    <i className="fas fa-check me-1"></i>
                    Analysis Complete
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body>
                {/* Quick Insights */}
                {analysisData.quickInsights && (
                  <Row className="mb-4">
                    <Col>
                      <h6 className="mb-3">
                        <i className="fas fa-lightbulb me-2 text-warning"></i>
                        Quick Insights
                      </h6>
                      <div className="d-flex flex-wrap gap-2">
                        {analysisData.quickInsights.map((insight, index) => (
                          <Badge
                            key={index}
                            bg={insight.severity === 'HIGH' ? 'danger' : insight.severity === 'MEDIUM' ? 'warning' : 'info'}
                            className="px-3 py-2"
                          >
                            <i className="fas fa-info-circle me-1"></i>
                            {insight.message}
                          </Badge>
                        ))}
                      </div>
                    </Col>
                  </Row>
                )}

                {/* DSR Analysis Summary */}
                {analysisData.dsrAnalysis && (
                  <Row className="mb-4">
                    <Col md={6}>
                      <Card className="h-100 border-0" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                        <Card.Body>
                          <h6 className="mb-3">
                            <i className="fas fa-store me-2 text-primary"></i>
                            DSR Analysis
                          </h6>
                          <div className="mb-2">
                            <strong>Problem Stores:</strong> {analysisData.dsrAnalysis.problemStores?.length || 0}
                          </div>
                          <div className="mb-2">
                            <strong>Total Loss:</strong> ₹{analysisData.dsrAnalysis.lossAnalysis?.totalLoss || 0}
                          </div>
                          <div className="mb-2">
                            <strong>Revenue Loss:</strong> ₹{analysisData.dsrAnalysis.lossAnalysis?.totalRevenueLoss || 0}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="h-100 border-0" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                        <Card.Body>
                          <h6 className="mb-3">
                            <i className="fas fa-times-circle me-2 text-danger"></i>
                            Cancellation Analysis
                          </h6>
                          <div className="mb-2">
                            <strong>Total Cancellations:</strong> {analysisData.cancellationAnalysis?.analysis?.totalCancellations || 0}
                          </div>
                          <div className="mb-2">
                            <strong>Top Reason:</strong> {analysisData.cancellationAnalysis?.analysis?.topCancellationReasons?.[0]?.reason || 'N/A'}
                          </div>
                          <div className="mb-2">
                            <strong>Primary Reason %:</strong> {analysisData.cancellationAnalysis?.analysis?.topCancellationReasons?.[0]?.percentage || 0}%
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                )}

                {/* Cancellation Impact Analysis */}
                {analysisData.comparisonAnalysis?.comparison?.cancellationImpactAnalysis && (
                  <Row className="mb-4">
                    <Col>
                      <Card className="border-0" style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)', color: 'white' }}>
                        <Card.Header className="bg-transparent border-0 py-3">
                          <h6 className="mb-0">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            Cancellation Impact on DSR Performance
                          </h6>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <div className="mb-3">
                                <strong>Overall Impact:</strong>
                                <div className="mt-1">
                                  {analysisData.comparisonAnalysis.comparison.cancellationImpactAnalysis.overallImpact}
                                </div>
                              </div>
                              <div className="mb-3">
                                <strong>Impact Score:</strong>
                                <div className="mt-1">
                                  {analysisData.comparisonAnalysis.comparison.cancellationImpactAnalysis.impactScore}/100
                                </div>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-3">
                                <strong>Primary Causes:</strong>
                                <div className="mt-1">
                                  {analysisData.comparisonAnalysis.comparison.cancellationImpactAnalysis.primaryCauses?.map((cause, index) => (
                                    <div key={index} className="small">
                                      • {cause.reason} ({cause.percentage}%) - {cause.impact}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                )}

                {/* Recommendations */}
                {analysisData.recommendations && (
                  <Row>
                    <Col>
                      <h6 className="mb-3">
                        <i className="fas fa-star me-2 text-warning"></i>
                        Top Recommendations
                      </h6>
                      <div className="d-flex flex-wrap gap-2">
                        {analysisData.recommendations.map((rec, index) => (
                          <Badge
                            key={index}
                            bg={rec.priority === 'HIGH' ? 'danger' : rec.priority === 'MEDIUM' ? 'warning' : 'info'}
                            className="px-3 py-2"
                          >
                            <i className="fas fa-arrow-right me-1"></i>
                            {rec.action}
                          </Badge>
                        ))}
                      </div>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Action Plan Modal */}
      <Modal show={showActionPlan} onHide={() => setShowActionPlan(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-tasks me-2 text-primary"></i>
            AI-Generated Action Plan
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {actionPlanData && (
            <div>
              {/* Executive Summary */}
              {actionPlanData.executiveSummary && (
                <Card className="mb-4 border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <Card.Body>
                    <h6 className="mb-3">
                      <i className="fas fa-chart-pie me-2"></i>
                      Executive Summary
                    </h6>
                    <Row>
                      <Col md={3}>
                        <div className="text-center">
                          <h4>₹{actionPlanData.executiveSummary.totalLoss || 0}</h4>
                          <small>Total Loss</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center">
                          <h4>{actionPlanData.executiveSummary.criticalIssues || 0}</h4>
                          <small>Critical Issues</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center">
                          <h4>₹{actionPlanData.executiveSummary.estimatedRecovery || 0}</h4>
                          <small>Estimated Recovery</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center">
                          <h4>{actionPlanData.executiveSummary.timeline || 'N/A'}</h4>
                          <small>Timeline</small>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Immediate Actions */}
              {actionPlanData.immediateActions && (
                <Card className="mb-4">
                  <Card.Header className="bg-danger text-white">
                    <h6 className="mb-0">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Immediate Actions ({actionPlanData.immediateActions.length})
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Action</th>
                            <th>Priority</th>
                            <th>Timeline</th>
                            <th>Responsible</th>
                            <th>Impact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {actionPlanData.immediateActions.map((action, index) => (
                            <tr key={index}>
                              <td>
                                <strong>{action.title}</strong>
                                <br />
                                <small className="text-muted">{action.description}</small>
                              </td>
                              <td>
                                <Badge bg={action.priority === 'CRITICAL' ? 'danger' : action.priority === 'HIGH' ? 'warning' : 'info'}>
                                  {action.priority}
                                </Badge>
                              </td>
                              <td>{action.timeline}</td>
                              <td>{action.responsible}</td>
                              <td>{action.expectedImpact}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* Strategic Actions */}
              {actionPlanData.strategicActions && (
                <Card className="mb-4">
                  <Card.Header className="bg-primary text-white">
                    <h6 className="mb-0">
                      <i className="fas fa-chess me-2"></i>
                      Strategic Actions ({actionPlanData.strategicActions.length})
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Action</th>
                            <th>Category</th>
                            <th>Timeline</th>
                            <th>Responsible</th>
                            <th>Impact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {actionPlanData.strategicActions.map((action, index) => (
                            <tr key={index}>
                              <td>
                                <strong>{action.title}</strong>
                                <br />
                                <small className="text-muted">{action.description}</small>
                              </td>
                              <td>
                                <Badge bg="info">{action.category}</Badge>
                              </td>
                              <td>{action.timeline}</td>
                              <td>{action.responsible}</td>
                              <td>{action.expectedImpact}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* Cancellation Reduction Actions */}
              {actionPlanData.cancellationReductionActions && (
                <Card className="mb-4">
                  <Card.Header className="bg-danger text-white">
                    <h6 className="mb-0">
                      <i className="fas fa-ban me-2"></i>
                      Cancellation Reduction Actions ({actionPlanData.cancellationReductionActions.length})
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Action</th>
                            <th>Target Reason</th>
                            <th>Priority</th>
                            <th>Timeline</th>
                            <th>Expected Impact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {actionPlanData.cancellationReductionActions.map((action, index) => (
                            <tr key={index}>
                              <td>
                                <strong>{action.title}</strong>
                                <br />
                                <small className="text-muted">{action.description}</small>
                              </td>
                              <td>
                                <Badge bg="warning">{action.targetReason}</Badge>
                              </td>
                              <td>
                                <Badge bg={action.priority === 'CRITICAL' ? 'danger' : action.priority === 'HIGH' ? 'warning' : 'info'}>
                                  {action.priority}
                                </Badge>
                              </td>
                              <td>{action.timeline}</td>
                              <td>{action.expectedImpact}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* Success Metrics */}
              {actionPlanData.successMetrics && (
                <Card className="mb-4">
                  <Card.Header className="bg-success text-white">
                    <h6 className="mb-0">
                      <i className="fas fa-target me-2"></i>
                      Success Metrics
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={4}>
                        <h6>Financial Targets</h6>
                        <ul>
                          <li>Revenue Increase: ₹{actionPlanData.successMetrics.financial?.targetRevenueIncrease || 0}</li>
                          <li>Loss Reduction: ₹{actionPlanData.successMetrics.financial?.targetLossReduction || 0}</li>
                          <li>Cancellation Reduction: {actionPlanData.successMetrics.financial?.targetCancellationReduction || 0}%</li>
                        </ul>
                      </Col>
                      <Col md={4}>
                        <h6>Operational Targets</h6>
                        <ul>
                          <li>Conversion Rate: {actionPlanData.successMetrics.operational?.targetConversionRate || 0}%</li>
                          <li>Customer Satisfaction: {actionPlanData.successMetrics.operational?.targetCustomerSatisfaction || 0}</li>
                          <li>Staff Performance: {actionPlanData.successMetrics.operational?.targetStaffPerformance || 0}%</li>
                        </ul>
                      </Col>
                      <Col md={4}>
                        <h6>Timeline</h6>
                        <ul>
                          <li>Immediate: {actionPlanData.successMetrics.timeline?.immediateResults || 'N/A'}</li>
                          <li>Short-term: {actionPlanData.successMetrics.timeline?.shortTermResults || 'N/A'}</li>
                          <li>Long-term: {actionPlanData.successMetrics.timeline?.longTermResults || 'N/A'}</li>
                        </ul>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActionPlan(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={exportActionPlan}>
            <i className="fas fa-download me-2"></i>
            Export Action Plan
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default IntegratedAnalysisDashboard;
