import React, { useState } from 'react';
import { Card, Button, Collapse, Badge, Alert, ListGroup } from 'react-bootstrap';

const AIInsights = ({ analysis }) => {
  const [showInsights, setShowInsights] = useState(false);

  if (!analysis) {
    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">🧠 AI Theoretical Analysis</h5>
        </Card.Header>
        <Card.Body className="text-center">
          <p className="text-muted">Analyze a DSR sheet to see AI insights using theoretical framework</p>
        </Card.Body>
      </Card>
    );
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH': return <Badge bg="danger">High</Badge>;
      case 'MEDIUM': return <Badge bg="warning">Medium</Badge>;
      case 'LOW': return <Badge bg="success">Low</Badge>;
      default: return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const getRootCauseBadge = (rootCause) => {
    if (!rootCause) return <Badge bg="secondary">Unknown</Badge>;
    
    const cause = rootCause.toLowerCase();
    if (cause.includes('staff') || cause.includes('selling')) return <Badge bg="danger">Staff Issue</Badge>;
    if (cause.includes('marketing') || cause.includes('visibility')) return <Badge bg="warning">Marketing Issue</Badge>;
    if (cause.includes('inventory') || cause.includes('planning')) return <Badge bg="info">Inventory Issue</Badge>;
    if (cause.includes('cost') || cause.includes('management')) return <Badge bg="secondary">Cost Issue</Badge>;
    if (cause.includes('customer') || cause.includes('follow')) return <Badge bg="dark">Customer Issue</Badge>;
    if (cause.includes('pricing') || cause.includes('variety')) return <Badge bg="primary">Pricing Issue</Badge>;
    
    return <Badge bg="secondary">Other</Badge>;
  };

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">🧠 AI Theoretical Analysis</h5>
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={() => setShowInsights(!showInsights)}
        >
          {showInsights ? 'Hide' : 'Show'} Details
        </Button>
      </Card.Header>
      
      <Card.Body>
        {/* Analysis Summary */}
        {analysis.analysisSummary && (
          <div className="mb-3">
            <h6 className="text-primary">📊 Analysis Summary</h6>
            <p className="small text-muted mb-2">
              <strong>Period:</strong> {analysis.analysisSummary.analysisPeriod || 'N/A'}
            </p>
            <p className="small text-muted mb-2">
              <strong>Total Stores:</strong> {analysis.analysisSummary.totalStores || 'N/A'}
            </p>
            <p className="small text-muted mb-2">
              <strong>Overall Performance:</strong> {analysis.analysisSummary.overallPerformance || 'N/A'}
            </p>
            <p className="small text-muted">
              <strong>Key Findings:</strong> {analysis.analysisSummary.keyFindings || 'N/A'}
            </p>
          </div>
        )}

        {/* Theoretical Framework Application */}
        {analysis.theoreticalAnalysis && (
          <div className="mb-3">
            <h6 className="text-success">🎯 Framework Application</h6>
            <div className="small">
              <p><strong>High walk-ins, low conversion</strong> → Staff follow-up issue</p>
              <p><strong>Low walk-ins, normal conversion</strong> → Marketing issue</p>
              <p><strong>High loss with size issue</strong> → Inventory planning issue</p>
              <p><strong>High expense, low order value</strong> → Cost management issue</p>
              <p><strong>Low Google reviews</strong> → Customer follow-up issue</p>
              <p><strong>Drop in order value</strong> → Product pricing/variety issue</p>
            </div>
          </div>
        )}

        {/* Stores Needing Attention */}
        {analysis.storesNeedingAttention && analysis.storesNeedingAttention.length > 0 && (
          <div className="mb-3">
            <h6 className="text-warning">⚠️ Stores Needing Attention</h6>
            {analysis.storesNeedingAttention.map((store, index) => (
              <Alert key={index} variant="warning" className="py-2 px-3 mb-2">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <strong>{store.storeName}</strong>
                    <br />
                    <small>{store.rootCause}</small>
                  </div>
                  <Badge bg={store.urgency === 'HIGH' ? 'danger' : store.urgency === 'MEDIUM' ? 'warning' : 'success'}>
                    {store.urgency}
                  </Badge>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Top Performers */}
        {analysis.topPerformers && analysis.topPerformers.length > 0 && (
          <div className="mb-3">
            <h6 className="text-success">🏆 Top Performers</h6>
            {analysis.topPerformers.map((store, index) => (
              <Alert key={index} variant="success" className="py-2 px-3 mb-2">
                <strong>{store.storeName}</strong>
                <br />
                <small>{store.reason}</small>
              </Alert>
            ))}
          </div>
        )}

        {/* Underperformers */}
        {analysis.underperformers && analysis.underperformers.length > 0 && (
          <div className="mb-3">
            <h6 className="text-danger">📉 Underperformers</h6>
            {analysis.underperformers.map((store, index) => (
              <Alert key={index} variant="danger" className="py-2 px-3 mb-2">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <strong>{store.storeName}</strong>
                    <br />
                    <small>{store.rootCause}</small>
                  </div>
                  {getRootCauseBadge(store.rootCause)}
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Detailed Analysis (collapsed) */}
        <Collapse in={showInsights}>
          <div>
            {/* Store Performance Details */}
            {analysis.storePerformance && analysis.storePerformance.length > 0 && (
              <div className="mb-3">
                <h6 className="text-info">🏪 Store Performance Details</h6>
                <ListGroup>
                  {analysis.storePerformance.map((store, index) => (
                    <ListGroup.Item key={index} className="py-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{store.storeName}</strong>
                          <br />
                          <small className="text-muted">
                            <strong>Root Cause:</strong> {store.rootCause || 'N/A'}
                            <br />
                            <strong>Why Loss Occurs:</strong> {store.whyLossOccurs || 'N/A'}
                          </small>
                        </div>
                        <div className="text-end">
                          <Badge bg={store.needsAttention === 'YES' ? 'danger' : 'success'} className="mb-1">
                            {store.needsAttention === 'YES' ? 'Needs Attention' : 'OK'}
                          </Badge>
                          <br />
                          {getPriorityBadge(store.priority)}
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}

            {/* Theoretical Analysis Breakdown */}
            {analysis.theoreticalAnalysis && (
              <div className="mb-3">
                <h6 className="text-primary">🔍 Root Cause Breakdown</h6>
                <div className="row">
                  <div className="col-6">
                    <h6 className="text-danger">Issues Found:</h6>
                    <ul className="small">
                      {analysis.theoreticalAnalysis.staffFollowUpIssues && analysis.theoreticalAnalysis.staffFollowUpIssues.length > 0 && (
                        <li><Badge bg="danger" className="me-1">Staff</Badge> {analysis.theoreticalAnalysis.staffFollowUpIssues.join(', ')}</li>
                      )}
                      {analysis.theoreticalAnalysis.marketingVisibilityIssues && analysis.theoreticalAnalysis.marketingVisibilityIssues.length > 0 && (
                        <li><Badge bg="warning" className="me-1">Marketing</Badge> {analysis.theoreticalAnalysis.marketingVisibilityIssues.join(', ')}</li>
                      )}
                      {analysis.theoreticalAnalysis.inventoryPlanningIssues && analysis.theoreticalAnalysis.inventoryPlanningIssues.length > 0 && (
                        <li><Badge bg="info" className="me-1">Inventory</Badge> {analysis.theoreticalAnalysis.inventoryPlanningIssues.join(', ')}</li>
                      )}
                    </ul>
                  </div>
                  <div className="col-6">
                    <h6 className="text-warning">More Issues:</h6>
                    <ul className="small">
                      {analysis.theoreticalAnalysis.costManagementIssues && analysis.theoreticalAnalysis.costManagementIssues.length > 0 && (
                        <li><Badge bg="secondary" className="me-1">Cost</Badge> {analysis.theoreticalAnalysis.costManagementIssues.join(', ')}</li>
                      )}
                      {analysis.theoreticalAnalysis.customerFollowUpIssues && analysis.theoreticalAnalysis.customerFollowUpIssues.length > 0 && (
                        <li><Badge bg="dark" className="me-1">Customer</Badge> {analysis.theoreticalAnalysis.customerFollowUpIssues.join(', ')}</li>
                      )}
                      {analysis.theoreticalAnalysis.pricingVarietyIssues && analysis.theoreticalAnalysis.pricingVarietyIssues.length > 0 && (
                        <li><Badge bg="primary" className="me-1">Pricing</Badge> {analysis.theoreticalAnalysis.pricingVarietyIssues.join(', ')}</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Collapse>

        {/* Action Buttons */}
        <div className="d-grid gap-2">
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => setShowInsights(!showInsights)}
          >
            {showInsights ? 'Hide' : 'Show'} Detailed Analysis
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default AIInsights;