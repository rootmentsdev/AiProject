import React, { useState } from 'react';
import { Card, Table, Row, Col, Button, Alert, Spinner, Badge, Form } from 'react-bootstrap';

const StaffPerformanceView = () => {
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState('2025-8-21');
  const [dateTo, setDateTo] = useState('2025-8-21');
  const [locationID, setLocationID] = useState('0');

  const fetchStaffPerformance = async () => {
    console.log('🚀 Fetching staff performance data...');
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        DateFrom: dateFrom,
        DateTo: dateTo,
        LocationID: locationID,
        UserID: '7777'
      });

      console.log('📤 Request params:', params.toString());
      const response = await fetch(`http://localhost:5000/api/staff-performance-data?${params}`);

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Staff performance data received:', data);
      setStaffData(data);
      
    } catch (err) {
      console.error('❌ Failed to fetch staff performance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceBadge = (status) => {
    switch(status) {
      case 'CRITICAL': return 'danger';
      case 'POOR': return 'warning';
      case 'AVERAGE': return 'info';
      case 'GOOD': return 'success';
      default: return 'secondary';
    }
  };

  const stores = staffData?.analysis?.storeWisePerformance 
    ? Object.values(staffData.analysis.storeWisePerformance).sort((a, b) => 
        parseFloat(a.conversionRate) - parseFloat(b.conversionRate)
      )
    : [];

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
              <h2 className="mb-2">
                <i className="fas fa-users me-3"></i>
                Staff Performance Dashboard
              </h2>
              <p className="mb-0 opacity-75">
                View detailed staff performance metrics by store location
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-filter me-2"></i>
                Filters
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Date From</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      placeholder="2025-8-21"
                    />
                    <Form.Text className="text-muted">
                      Format: YYYY-M-D
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Date To</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      placeholder="2025-8-21"
                    />
                    <Form.Text className="text-muted">
                      Format: YYYY-M-D
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Location ID</Form.Label>
                    <Form.Select 
                      value={locationID}
                      onChange={(e) => setLocationID(e.target.value)}
                    >
                      <option value="0">All Stores (0)</option>
                      <option value="1">Z Edapally (1)</option>
                      <option value="3">SG Edapally (3)</option>
                      <option value="5">Trivandrum (5)</option>
                      <option value="7">Z Perinthalmanna (7)</option>
                      <option value="8">Z Kottakkal (8)</option>
                      <option value="9">Z Kottayam (9)</option>
                      <option value="10">SG Perumbavoor (10)</option>
                      <option value="11">SG Thrissur (11)</option>
                      <option value="12">SG Chavakkad (12)</option>
                      <option value="13">SG Calicut (13)</option>
                      <option value="14">SG Vadakara (14)</option>
                      <option value="15">SG Edapally (15)</option>
                      <option value="16">SG Perinthalmanna (16)</option>
                      <option value="17">SG Kottakkal (17)</option>
                      <option value="18">SG Manjeri (18)</option>
                      <option value="19">SG Palakkad (19)</option>
                      <option value="20">SG Kalpetta (20)</option>
                      <option value="21">SG Kannur (21)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3} className="d-flex align-items-end">
                  <Button 
                    variant="primary" 
                    onClick={fetchStaffPerformance}
                    disabled={loading}
                    className="w-100"
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-search me-2"></i>
                        Fetch Data
                      </>
                    )}
                  </Button>
                </Col>
              </Row>
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
                Error Fetching Staff Performance Data
              </Alert.Heading>
              <p className="mb-0">{error}</p>
              <hr />
              <p className="mb-0 small">
                <strong>Troubleshooting:</strong>
                <br />• Check if backend server is running (http://localhost:5000)
                <br />• Verify the date format is YYYY-M-D (e.g., 2025-8-21)
                <br />• Check terminal logs for detailed error information
                <br />• Test API directly: http://localhost:5000/api/test-staff-performance
              </p>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Loading */}
      {loading && (
        <Row className="mb-4">
          <Col className="text-center">
            <Spinner animation="border" style={{ width: '3rem', height: '3rem' }} />
            <p className="mt-3 text-muted">Fetching staff performance data...</p>
          </Col>
        </Row>
      )}

      {/* Summary Cards */}
      {staffData && staffData.success && (
        <>
          <Row className="mb-4">
            <Col md={3}>
              <Card className="h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Card.Body className="text-center">
                  <h4>{stores.length}</h4>
                  <small>Total Stores</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <Card.Body className="text-center">
                  <h4>{stores.filter(s => s.performanceStatus === 'CRITICAL' || s.performanceStatus === 'POOR').length}</h4>
                  <small>Needs Attention</small>
                  <p className="small mb-0 mt-2 opacity-75">CRITICAL or POOR</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                <Card.Body className="text-center">
                  <h4>{staffData.analysis?.overallMetrics?.averageConversionRate || 0}%</h4>
                  <small>Avg Conversion Rate</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', color: 'white' }}>
                <Card.Body className="text-center">
                  <h4>{staffData.analysis?.overallMetrics?.totalWalkIns || 0}</h4>
                  <small>Total Walk-ins</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Staff Performance Table */}
          <Row className="mb-4">
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-primary text-white py-3">
                  <h5 className="mb-0">
                    <i className="fas fa-table me-2"></i>
                    Store-wise Staff Performance
                    <Badge bg="light" text="dark" className="ms-3">
                      {stores.length} Stores
                    </Badge>
                  </h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0">
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        <th style={{ width: '50px' }}>#</th>
                        <th style={{ width: '200px' }}>Store Name</th>
                        <th className="text-center">Performance</th>
                        <th className="text-center">Conversion Rate</th>
                        <th className="text-center">Walk-ins</th>
                        <th className="text-center">Bills</th>
                        <th className="text-center">Quantity</th>
                        <th className="text-center">Loss of Sale</th>
                        <th className="text-center">Staff Count</th>
                        <th>Staff Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stores.map((store, index) => (
                        <tr key={index} style={{ 
                          animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                        }}>
                          <td className="text-center">
                            <strong>{index + 1}</strong>
                          </td>
                          <td>
                            <strong>{store.storeName}</strong>
                          </td>
                          <td className="text-center">
                            <Badge 
                              bg={getPerformanceBadge(store.performanceStatus)}
                              className="px-3 py-2"
                            >
                              {store.performanceStatus}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <strong style={{ 
                              color: parseFloat(store.conversionRate) < 50 ? '#dc3545' : 
                                     parseFloat(store.conversionRate) < 70 ? '#ffc107' : '#28a745'
                            }}>
                              {store.conversionRate}%
                            </strong>
                          </td>
                          <td className="text-center">{store.walkIns}</td>
                          <td className="text-center">{store.bills}</td>
                          <td className="text-center">{store.quantity}</td>
                          <td className="text-center">
                            <Badge bg={store.lossOfSale > 10 ? 'danger' : 'secondary'}>
                              {store.lossOfSale}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Badge bg="info">{store.staffCount}</Badge>
                          </td>
                          <td>
                            {store.staffIssues && store.staffIssues.length > 0 ? (
                              <ul className="mb-0 small ps-3">
                                {store.staffIssues.slice(0, 2).map((issue, i) => (
                                  <li key={i} className="text-danger">{issue}</li>
                                ))}
                                {store.staffIssues.length > 2 && (
                                  <li className="text-muted">+{store.staffIssues.length - 2} more</li>
                                )}
                              </ul>
                            ) : (
                              <span className="text-success small">No issues</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Individual Staff Details */}
          {stores.filter(s => s.staffDetails && s.staffDetails.length > 0).length > 0 && (
            <Row>
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-info text-white py-3">
                    <h5 className="mb-0">
                      <i className="fas fa-user me-2"></i>
                      Individual Staff Performance Details
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    {stores.filter(s => s.staffDetails && s.staffDetails.length > 0).map((store, storeIndex) => (
                      <div key={storeIndex} className="mb-4">
                        <h6 className="text-primary">
                          <i className="fas fa-store me-2"></i>
                          {store.storeName}
                        </h6>
                        <Table responsive size="sm" hover className="mb-0">
                          <thead style={{ backgroundColor: '#f8f9fa' }}>
                            <tr>
                              <th>Staff Name</th>
                              <th className="text-center">Walk-ins</th>
                              <th className="text-center">Bills</th>
                              <th className="text-center">Quantity</th>
                              <th className="text-center">Conversion Rate</th>
                              <th className="text-center">Loss of Sale</th>
                            </tr>
                          </thead>
                          <tbody>
                            {store.staffDetails.map((staff, staffIndex) => (
                              <tr key={staffIndex}>
                                <td><strong>{staff.name}</strong></td>
                                <td className="text-center">{staff.walkIns}</td>
                                <td className="text-center">{staff.bills}</td>
                                <td className="text-center">{staff.quantity}</td>
                                <td className="text-center">
                                  <Badge 
                                    bg={staff.conversionRate < 50 ? 'danger' : 
                                        staff.conversionRate < 70 ? 'warning' : 'success'}
                                  >
                                    {staff.conversionRate.toFixed(2)}%
                                  </Badge>
                                </td>
                                <td className="text-center">{staff.lossOfSale}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}

      {/* No Data Message */}
      {staffData && !staffData.success && (
        <Row>
          <Col>
            <Alert variant="warning">
              <Alert.Heading>
                <i className="fas fa-info-circle me-2"></i>
                No Staff Performance Data Available
              </Alert.Heading>
              <p>The API returned no data or an error occurred.</p>
              <p className="mb-0">
                <strong>Error:</strong> {staffData.error || 'Unknown error'}
              </p>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Initial State */}
      {!staffData && !loading && !error && (
        <Row>
          <Col>
            <Card className="text-center py-5">
              <Card.Body>
                <i className="fas fa-users fa-4x text-muted mb-3"></i>
                <h4>No Data Loaded</h4>
                <p className="text-muted">
                  Click "Fetch Data" to load staff performance data
                </p>
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
      `}</style>
    </div>
  );
};

export default StaffPerformanceView;

