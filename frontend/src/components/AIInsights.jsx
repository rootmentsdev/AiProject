import React, { useState } from 'react';
import { Card, Button, Collapse, Badge, ListGroup } from 'react-bootstrap';

const AIInsights = ({ analysis }) => {
  const [showInsights, setShowInsights] = useState(false);

  if (!analysis) {
    return (
      <Card>
        <Card.Header>
          <h5 className="mb-0">AI Analysis</h5>
        </Card.Header>
        <Card.Body className="text-center">
          <p className="text-muted">Analyze a DSR sheet to see AI insights</p>
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

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">AI Analysis</h5>
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
            <h6 className="text-primary">Analysis Summary</h6>
            <p className="small text-muted mb-2">
              <strong>Period:</strong> {analysis.analysisSummary.analysisPeriod || 'N/A'}
            </p>
            <p className="small text-muted mb-2">
              <strong>Overall Performance:</strong> {analysis.analysisSummary.overallPerformance || 'N/A'}
            </p>
            <p className="small text-muted">
              <strong>Key Findings:</strong> {analysis.analysisSummary.keyFindings || 'N/A'}
            </p>
          </div>
        )}

        {/* Top Performers */}
        {analysis.topPerformers && analysis.topPerformers.length > 0 && (
          <div className="mb-3">
            <h6 className="text-success">Top Performers</h6>
            <ListGroup variant="flush">
              {analysis.topPerformers.map((performer, index) => (
                <ListGroup.Item key={index} className="px-0 py-2">
                  <div className="d-flex align-items-start">
                    <Badge bg="success" className="me-2">{index + 1}</Badge>
                    <div>
                      <strong>{performer.storeName}</strong>
                      <p className="small mb-1">{performer.reason}</p>
                      <small className="text-muted">{performer.metrics}</small>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {/* Underperformers */}
        {analysis.underperformers && analysis.underperformers.length > 0 && (
          <div className="mb-3">
            <h6 className="text-danger">Underperformers</h6>
            <ListGroup variant="flush">
              {analysis.underperformers.map((underperformer, index) => (
                <ListGroup.Item key={index} className="px-0 py-2">
                  <div className="d-flex align-items-start">
                    <Badge bg="danger" className="me-2">{index + 1}</Badge>
                    <div>
                      <strong>{underperformer.storeName}</strong>
                      <p className="small mb-1 text-danger">{underperformer.impact}</p>
                      <small className="text-muted">
                        <strong>Issues:</strong> {underperformer.issues?.join(', ')}
                      </small>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations && (
          <div className="mb-3">
            <h6 className="text-info">Recommendations</h6>
            {analysis.recommendations.immediate && analysis.recommendations.immediate.length > 0 && (
              <div className="mb-2">
                <Badge bg="danger" className="mb-1">Immediate</Badge>
                <ListGroup variant="flush">
                  {analysis.recommendations.immediate.map((rec, index) => (
                    <ListGroup.Item key={index} className="px-0 py-1">
                      <small>{rec}</small>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}
            {analysis.recommendations.shortTerm && analysis.recommendations.shortTerm.length > 0 && (
              <div className="mb-2">
                <Badge bg="warning" className="mb-1">Short Term</Badge>
                <ListGroup variant="flush">
                  {analysis.recommendations.shortTerm.map((rec, index) => (
                    <ListGroup.Item key={index} className="px-0 py-1">
                      <small>{rec}</small>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}
            {analysis.recommendations.longTerm && analysis.recommendations.longTerm.length > 0 && (
              <div className="mb-2">
                <Badge bg="info" className="mb-1">Long Term</Badge>
                <ListGroup variant="flush">
                  {analysis.recommendations.longTerm.map((rec, index) => (
                    <ListGroup.Item key={index} className="px-0 py-1">
                      <small>{rec}</small>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}
          </div>
        )}

        {/* Detailed Analysis */}
        <Collapse in={showInsights}>
          <div>
            <hr />
            
            {/* Store Performance Details */}
            {analysis.storePerformance && analysis.storePerformance.length > 0 && (
              <div className="mb-3">
                <h6 className="text-warning">Store Performance Details</h6>
                <ListGroup variant="flush">
                  {analysis.storePerformance.map((store, index) => (
                    <ListGroup.Item key={index} className="px-0 py-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{store.storeName}</strong>
                          <div className="d-flex gap-2 mt-1">
                            {getPriorityBadge(store.priority)}
                            <Badge bg={store.performance === 'POOR' ? 'danger' : store.performance === 'GOOD' ? 'success' : 'warning'}>
                              {store.performance}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-end">
                          <small className="text-muted">
                            Bills L2L: {store.billsL2L}%<br/>
                            Qty L2L: {store.qtyL2L}%<br/>
                            Walk-in L2L: {store.walkInL2L}%
                          </small>
                        </div>
                      </div>
                      {store.keyIssues && store.keyIssues.length > 0 && (
                        <div className="mt-2">
                          <small className="text-danger">
                            <strong>Issues:</strong> {store.keyIssues.join(', ')}
                          </small>
                        </div>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}

            {/* Risk Assessment */}
            {analysis.riskAssessment && analysis.riskAssessment.length > 0 && (
              <div className="mb-3">
                <h6 className="text-danger">Risk Assessment</h6>
                <ListGroup variant="flush">
                  {analysis.riskAssessment.map((risk, index) => (
                    <ListGroup.Item key={index} className="px-0 py-1">
                      <small>{risk}</small>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}
          </div>
        </Collapse>

        {/* Action Buttons */}
        <div className="mt-3 d-grid gap-2">
          <Button variant="outline-primary" size="sm">
            Export Report
          </Button>
          <Button variant="outline-success" size="sm">
            Generate Action Plan
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default AIInsights;
