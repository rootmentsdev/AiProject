import React, { useState } from 'react';
import { Card, Table, Badge, Row, Col, Button, Collapse } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DSRAnalysisDashboard = ({ data }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!data) {
    return (
      <Card>
        <Card.Body className="text-center">
          <p>No DSR data available</p>
        </Card.Body>
      </Card>
    );
  }

  // Process data for charts based on AI analysis structure
  const processDataForCharts = () => {
    if (data.storePerformance && Array.isArray(data.storePerformance)) {
      return data.storePerformance.map(store => ({
        store: store.storeName,
        billsL2L: parseFloat(store.billsL2L) || 0,
        qtyL2L: parseFloat(store.qtyL2L) || 0,
        walkInL2L: parseFloat(store.walkInL2L) || 0,
        conversionRate: parseFloat(store.conversionRate) || 0,
        performance: store.performance
      }));
    }
    return [];
  };

  const chartData = processDataForCharts();

  // Calculate performance metrics
  const getPerformanceMetrics = () => {
    if (!data.analysisSummary) {
      return {
        totalStores: 0,
        overallPerformance: 'No data',
        keyFindings: 'No analysis available'
      };
    }

    const totalStores = data.analysisSummary.totalStores || 0;
    const underperformingStores = data.underperformers ? data.underperformers.length : 0;
    const topPerformingStores = data.topPerformers ? data.topPerformers.length : 0;

    return {
      totalStores,
      underperformingStores,
      topPerformingStores,
      overallPerformance: data.analysisSummary.overallPerformance || 'No data',
      keyFindings: data.analysisSummary.keyFindings || 'No analysis available'
    };
  };

  const metrics = getPerformanceMetrics();

  const getPerformanceBadge = (performance) => {
    switch (performance) {
      case 'EXCELLENT': return <Badge bg="success">Excellent</Badge>;
      case 'GOOD': return <Badge bg="info">Good</Badge>;
      case 'AVERAGE': return <Badge bg="warning">Average</Badge>;
      case 'POOR': return <Badge bg="danger">Poor</Badge>;
      default: return <Badge bg="secondary">Unknown</Badge>;
    }
  };

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
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">DSR Analysis Dashboard</h4>
          <div>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
        </div>
      </Card.Header>
      
      <Card.Body>
        {/* Analysis Summary */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h5 className="text-primary">{metrics.totalStores}</h5>
                <small className="text-muted">Total Stores</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h5 className="text-danger">{metrics.underperformingStores}</h5>
                <small className="text-muted">Underperforming</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h5 className="text-success">{metrics.topPerformingStores}</h5>
                <small className="text-muted">Top Performers</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h6 className="text-info">{metrics.overallPerformance}</h6>
                <small className="text-muted">Overall Performance</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Key Findings */}
        <Row className="mb-4">
          <Col>
            <Card className="bg-info text-white">
              <Card.Body>
                <h6 className="mb-2">Key Findings</h6>
                <p className="mb-0">{metrics.keyFindings}</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        {chartData.length > 0 && (
          <>
            <Row className="mb-4">
              <Col md={6}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Bills Performance (L2L %)</h6>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="store" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="billsL2L" fill="#8884d8" name="Bills L2L %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Quantity Performance (L2L %)</h6>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="store" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="qtyL2L" fill="#82ca9d" name="Qty L2L %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={6}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Walk-in Performance (L2L %)</h6>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="store" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="walkInL2L" fill="#ffc658" name="Walk-in L2L %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Conversion Rates</h6>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="store" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="conversionRate" fill="#ff7300" name="Conversion %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {/* Detailed Table */}
        <Collapse in={showDetails}>
          <div>
            <Card>
              <Card.Header>
                <h6 className="mb-0">Detailed Store Performance</h6>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Store</th>
                        <th>Performance</th>
                        <th>Bills L2L</th>
                        <th>Qty L2L</th>
                        <th>Walk-in L2L</th>
                        <th>Conversion %</th>
                        <th>Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((store, index) => (
                        <tr key={index}>
                          <td>{store.store}</td>
                          <td>{getPerformanceBadge(store.performance)}</td>
                          <td>{store.billsL2L.toFixed(1)}%</td>
                          <td>{store.qtyL2L.toFixed(1)}%</td>
                          <td>{store.walkInL2L.toFixed(1)}%</td>
                          <td>{store.conversionRate.toFixed(1)}%</td>
                          <td>{getPriorityBadge(data.storePerformance?.[index]?.priority)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Collapse>
      </Card.Body>
    </Card>
  );
  
};

export default DSRAnalysisDashboard;
