import React, { useState } from 'react';
import { Card, Table, Badge, Row, Col, Button, Collapse, Alert } from 'react-bootstrap';

const DSRAnalysisDashboard = ({ data }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Helper function to safely join arrays
  const joinArray = (arr) => {
    return Array.isArray(arr) ? arr.join(', ') : '';
  };

  if (!data) {
    return (
      <Card>
        <Card.Body className="text-center">
          <p>No DSR data available</p>
        </Card.Body>
      </Card>
    );
  }

  // Get performance metrics
  const getPerformanceMetrics = () => {
    if (!data.analysisSummary) {
      return {
        totalStores: 0,
        overallPerformance: 'No data',
        keyFindings: 'No analysis available'
      };
    }

    const totalStores = data.analysisSummary.totalStores || 0;
    const badPerformingStores = data.badPerformingStores ? data.badPerformingStores.length : 0;
    const topPerformingStores = data.topPerformers ? data.topPerformers.length : 0;
    const attentionNeeded = data.badPerformingStores ? data.badPerformingStores.length : 0;

    return {
      totalStores,
      badPerformingStores,
      topPerformingStores,
      attentionNeeded,
      overallPerformance: data.analysisSummary.overallPerformance || 'No data',
      keyFindings: data.analysisSummary.keyFindings || 'No analysis available'
    };
  };

  const metrics = getPerformanceMetrics();

  // Get performance badge color
  const getPerformanceBadge = (performance) => {
    switch (performance?.toUpperCase()) {
      case 'EXCELLENT': return 'success';
      case 'GOOD': return 'primary';
      case 'AVERAGE': return 'warning';
      case 'POOR': return 'danger';
      default: return 'secondary';
    }
  };

  // Get priority badge color
  const getPriorityBadge = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <div>
      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{metrics.totalStores}</h3>
              <p className="mb-0">Total Stores</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{metrics.topPerformingStores}</h3>
              <p className="mb-0">Top Performers</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-danger">{metrics.badPerformingStores}</h3>
              <p className="mb-0">Bad Performers</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-warning">{metrics.attentionNeeded}</h3>
              <p className="mb-0">Need Attention</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Analysis Summary */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">📊 Analysis Summary</h5>
            </Card.Header>
            <Card.Body>
              <p><strong>Overall Performance:</strong> {metrics.overallPerformance}</p>
              <p><strong>Key Findings:</strong> {metrics.keyFindings}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Theoretical Analysis Framework */}
      {data.theoreticalAnalysis && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">🧠 Theoretical Analysis Framework</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6 className="text-danger">🔴 Issues Identified:</h6>
                    <ul className="list-unstyled">
                      {data.theoreticalAnalysis.staffFollowUpIssues && data.theoreticalAnalysis.staffFollowUpIssues.length > 0 && (
                        <li><Badge bg="danger" className="me-2">Staff Follow-up</Badge> {data.theoreticalAnalysis.staffFollowUpIssues.join(', ')}</li>
                      )}
                      {data.theoreticalAnalysis.marketingVisibilityIssues && data.theoreticalAnalysis.marketingVisibilityIssues.length > 0 && (
                        <li><Badge bg="warning" className="me-2">Marketing</Badge> {data.theoreticalAnalysis.marketingVisibilityIssues.join(', ')}</li>
                      )}
                      {data.theoreticalAnalysis.inventoryPlanningIssues && data.theoreticalAnalysis.inventoryPlanningIssues.length > 0 && (
                        <li><Badge bg="info" className="me-2">Inventory</Badge> {data.theoreticalAnalysis.inventoryPlanningIssues.join(', ')}</li>
                      )}
                      {data.theoreticalAnalysis.costManagementIssues && data.theoreticalAnalysis.costManagementIssues.length > 0 && (
                        <li><Badge bg="secondary" className="me-2">Cost Mgmt</Badge> {data.theoreticalAnalysis.costManagementIssues.join(', ')}</li>
                      )}
                      {data.theoreticalAnalysis.customerFollowUpIssues && data.theoreticalAnalysis.customerFollowUpIssues.length > 0 && (
                        <li><Badge bg="dark" className="me-2">Customer</Badge> {data.theoreticalAnalysis.customerFollowUpIssues.join(', ')}</li>
                      )}
                      {data.theoreticalAnalysis.pricingVarietyIssues && data.theoreticalAnalysis.pricingVarietyIssues.length > 0 && (
                        <li><Badge bg="primary" className="me-2">Pricing</Badge> {data.theoreticalAnalysis.pricingVarietyIssues.join(', ')}</li>
                      )}
                    </ul>
                  </Col>
                  <Col md={6}>
                    <h6 className="text-success">✅ Framework Applied:</h6>
                    <div className="small">
                      <p><strong>High walk-ins, low conversion</strong> → Staff follow-up issue</p>
                      <p><strong>Low walk-ins, normal conversion</strong> → Marketing issue</p>
                      <p><strong>High loss with size issue</strong> → Inventory planning issue</p>
                      <p><strong>High expense, low order value</strong> → Cost management issue</p>
                      <p><strong>Low Google reviews</strong> → Customer follow-up issue</p>
                      <p><strong>Drop in order value</strong> → Product pricing/variety issue</p>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Bad Performing Stores */}
      {data.badPerformingStores && data.badPerformingStores.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-danger text-white">
                <h5 className="mb-0">⚠️ Bad Performing Stores ({data.badPerformingStores.length})</h5>
              </Card.Header>
              <Card.Body>
                {data.badPerformingStores.map((store, index) => (
                  <Alert key={index} variant="danger" className="mb-3">
                    <h6><strong>{store.storeName}</strong></h6>
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Conversion Rate:</strong> {store.conversionRate || 'N/A'}</p>
                        <p><strong>Bills Performance:</strong> {store.billsPerformance || 'N/A'}</p>
                        <p><strong>Quantity Performance:</strong> {store.quantityPerformance || 'N/A'}</p>
                        <p><strong>Walk-ins:</strong> {store.walkIns || 'N/A'}</p>
                        <p><strong>Loss of Sale:</strong> {store.lossOfSale || 'N/A'}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>ABS Value:</strong> {store.absValue || 'N/A'}</p>
                        <p><strong>Why Bad Performing:</strong> {store.whyBadPerforming || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <strong>Suggested Actions:</strong>
                      <p className="mb-0">{store.suggestedActions || 'N/A'}</p>
                    </div>
                  </Alert>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Performance Breakdown */}
      {data.performanceBreakdown && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">📊 Performance Breakdown by Criteria</h5>
              </Card.Header>
              <Card.Body>
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-danger">🔴 Underperforming Criteria:</h6>
                    <ul className="list-unstyled">
                      {data.performanceBreakdown.conversionUnder70 && data.performanceBreakdown.conversionUnder70.length > 0 && (
                        <li><Badge bg="danger" className="me-2">Conversion &lt; 70%</Badge> {joinArray(data.performanceBreakdown.conversionUnder70)}</li>
                      )}
                      {data.performanceBreakdown.lowABS && data.performanceBreakdown.lowABS.length > 0 && (
                        <li><Badge bg="warning" className="me-2">Low ABS</Badge> {joinArray(data.performanceBreakdown.lowABS)}</li>
                      )}
                      {data.performanceBreakdown.lowABV && data.performanceBreakdown.lowABV.length > 0 && (
                        <li><Badge bg="info" className="me-2">Low ABV</Badge> {joinArray(data.performanceBreakdown.lowABV)}</li>
                      )}
                      {data.performanceBreakdown.highWalkInsLowBills && data.performanceBreakdown.highWalkInsLowBills.length > 0 && (
                        <li><Badge bg="secondary" className="me-2">High Walk-ins Low Bills</Badge> {joinArray(data.performanceBreakdown.highWalkInsLowBills)}</li>
                      )}
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-warning">⚠️ More Issues:</h6>
                    <ul className="list-unstyled">
                      {data.performanceBreakdown.highLossOfSale && data.performanceBreakdown.highLossOfSale.length > 0 && (
                        <li><Badge bg="dark" className="me-2">High Loss of Sale</Badge> {joinArray(data.performanceBreakdown.highLossOfSale)}</li>
                      )}
                      {data.performanceBreakdown.negativeL2LBills && data.performanceBreakdown.negativeL2LBills.length > 0 && (
                        <li><Badge bg="danger" className="me-2">Negative L2L Bills</Badge> {joinArray(data.performanceBreakdown.negativeL2LBills)}</li>
                      )}
                      {data.performanceBreakdown.negativeL2LQuantity && data.performanceBreakdown.negativeL2LQuantity.length > 0 && (
                        <li><Badge bg="warning" className="me-2">Negative L2L Quantity</Badge> {joinArray(data.performanceBreakdown.negativeL2LQuantity)}</li>
                      )}
                      {data.performanceBreakdown.negativeL2LWalkIns && data.performanceBreakdown.negativeL2LWalkIns.length > 0 && (
                        <li><Badge bg="info" className="me-2">Negative L2L Walk-ins</Badge> {joinArray(data.performanceBreakdown.negativeL2LWalkIns)}</li>
                      )}
                    </ul>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Summary Table */}
      {data.summaryTable && data.summaryTable.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">📊 Store Performance Summary Table</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>🏪 Store</th>
                      <th>📈 Conversion %</th>
                      <th>💰 Bills %</th>
                      <th>📦 Quantity %</th>
                      <th>🧠 Why Bad Performing</th>
                      <th>🛠️ Suggested Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.summaryTable.map((store, index) => (
                      <tr key={index}>
                        <td><strong>{store.storeName}</strong></td>
                        <td>{store.conversionPercent || 'N/A'}</td>
                        <td>{store.billsPercent || 'N/A'}</td>
                        <td>{store.quantityPercent || 'N/A'}</td>
                        <td>{store.whyBadPerforming || 'N/A'}</td>
                        <td>{store.suggestedAction || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Store Ranking */}
      {data.storeRanking && data.storeRanking.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">🏆 Store Ranking</h5>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Store Name</th>
                      <th>Conversion Rate</th>
                      <th>Bills Performance</th>
                      <th>Overall Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.storeRanking.map((store, index) => (
                      <tr key={index}>
                        <td>
                          <Badge bg={store.rank <= 5 ? 'success' : store.rank <= 10 ? 'warning' : 'danger'}>
                            #{store.rank}
                          </Badge>
                        </td>
                        <td><strong>{store.storeName}</strong></td>
                        <td>{store.conversionRate || 'N/A'}</td>
                        <td>{store.billsPerformance || 'N/A'}</td>
                        <td>{store.overallScore || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Top Performers */}
      {data.topPerformers && data.topPerformers.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">🏆 Top Performing Stores</h5>
              </Card.Header>
              <Card.Body>
                {data.topPerformers.map((store, index) => (
                  <Alert key={index} variant="success" className="mb-2">
                    <h6><strong>{store.storeName}</strong></h6>
                    <p><strong>Reason:</strong> {store.reason}</p>
                    <p><strong>Metrics:</strong> {store.metrics}</p>
                    <p><strong>What They're Doing Right:</strong> {store.noIssues}</p>
                  </Alert>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Poor Performers */}
      {data.poorPerformers && data.poorPerformers.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-danger text-white">
                <h5 className="mb-0">📉 Poor Performing Stores (Bottom 5)</h5>
              </Card.Header>
              <Card.Body>
                {data.poorPerformers.map((store, index) => (
                  <Alert key={index} variant="danger" className="mb-3">
                    <h6><strong>{store.storeName}</strong></h6>
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Conversion Rate:</strong> {store.conversionRate || 'N/A'}</p>
                        <p><strong>Loss of Sale:</strong> 
                          <Badge bg={store.lossOfSale === 'High' ? 'danger' : store.lossOfSale === 'Medium' ? 'warning' : 'success'} className="ms-2">
                            {store.lossOfSale || 'N/A'}
                          </Badge>
                        </p>
                        <p><strong>Bills Drop:</strong> {store.billsDrop || 'N/A'}</p>
                        <p><strong>Qty Drop:</strong> {store.qtyDrop || 'N/A'}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Root Cause:</strong> {store.rootCause || 'N/A'}</p>
                        <p><strong>Analysis:</strong> {store.analysis || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <strong>Suggested Actions:</strong>
                      <ul className="mb-0">
                        {store.suggestedActions && store.suggestedActions.map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </Alert>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default DSRAnalysisDashboard;