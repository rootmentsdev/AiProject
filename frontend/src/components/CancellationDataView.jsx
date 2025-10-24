import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col, Form, Badge, Button, Alert, Spinner } from 'react-bootstrap';

const CancellationDataView = () => {
  const [cancellationData, setCancellationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    DateFrom: "",
    DateTo: "",
    LocationID: "0",
    UserID: "7777"
  });

  // Fetch cancellation data
  const fetchCancellationData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams(dateRange);
      const response = await fetch(`http://localhost:5000/api/cancellation-data?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setCancellationData(data);
      } else {
        setError(data.error || 'Failed to fetch cancellation data');
      }
      
    } catch (err) {
      console.error('Cancellation data fetch failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on component mount
  useEffect(() => {
    fetchCancellationData();
  }, []);

  // Group cancellations by store
  const getStoreWiseData = () => {
    if (!cancellationData?.analysis?.storeWiseProblems) {
      return [];
    }

    return Object.values(cancellationData.analysis.storeWiseProblems)
      .sort((a, b) => b.totalCancellations - a.totalCancellations);
  };

  const storeData = getStoreWiseData();
  const totalCancellations = cancellationData?.analysis?.totalCancellations || 0;

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0" style={{ 
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
            color: 'white'
          }}>
            <Card.Body className="py-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-2">
                    <i className="fas fa-times-circle me-3"></i>
                    Cancellation Data by Store
                  </h2>
                  <p className="mb-0 opacity-75">
                    View cancellation details organized by store location
                  </p>
                </div>
                <div className="text-end">
                  <Badge bg="light" text="dark" className="fs-6 px-3 py-2">
                    <i className="fas fa-store me-2"></i>
                    {storeData.length} Stores
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
                <i className="fas fa-calendar me-2 text-primary"></i>
                Date Range (Optional)
              </h6>
            </Card.Header>
            <Card.Body>
              <Alert variant="info" className="mb-3">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Auto-Date Detection:</strong> Leave date fields empty to automatically use the date from your DSR sheet (12/8/2025).
              </Alert>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date From</Form.Label>
                    <Form.Control
                      type="text"
                      value={dateRange.DateFrom}
                      onChange={(e) => setDateRange({...dateRange, DateFrom: e.target.value})}
                      placeholder="Auto-detected from DSR"
                    />
                    <Form.Text className="text-muted">
                      Format: YYYY-M-D (e.g., 2025-12-8)
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date To</Form.Label>
                    <Form.Control
                      type="text"
                      value={dateRange.DateTo}
                      onChange={(e) => setDateRange({...dateRange, DateTo: e.target.value})}
                      placeholder="Auto-detected from DSR"
                    />
                    <Form.Text className="text-muted">
                      Format: YYYY-M-D (e.g., 2025-12-8)
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
                      placeholder="0 (All locations)"
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
              <div className="d-flex justify-content-end">
                <Button
                  variant="primary"
                  onClick={fetchCancellationData}
                  disabled={loading}
                  className="px-4"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sync-alt me-2"></i>
                      Fetch Data
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
                Error
              </Alert.Heading>
              <p>{error}</p>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Loading Spinner */}
      {loading && (
        <Row className="mb-4">
          <Col className="text-center">
            <Spinner animation="border" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-3 text-muted">Fetching cancellation data...</p>
          </Col>
        </Row>
      )}

      {/* Summary Cards */}
      {cancellationData && !loading && (
        <>
          <Row className="mb-4">
            <Col md={4}>
              <Card className="shadow-sm border-0 h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Card.Body className="text-center">
                  <div className="display-4 mb-2">
                    <i className="fas fa-ban"></i>
                  </div>
                  <h3 className="mb-1">{totalCancellations}</h3>
                  <p className="mb-0 opacity-75">Total Cancellations</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="shadow-sm border-0 h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <Card.Body className="text-center">
                  <div className="display-4 mb-2">
                    <i className="fas fa-store"></i>
                  </div>
                  <h3 className="mb-1">{storeData.length}</h3>
                  <p className="mb-0 opacity-75">Stores Affected</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="shadow-sm border-0 h-100" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                <Card.Body className="text-center">
                  <div className="display-4 mb-2">
                    <i className="fas fa-exclamation-circle"></i>
                  </div>
                  <h3 className="mb-1">
                    {cancellationData?.analysis?.topCancellationReasons?.length || 0}
                  </h3>
                  <p className="mb-0 opacity-75">Unique Reasons</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Top Cancellation Reasons */}
          {cancellationData?.analysis?.topCancellationReasons && (
            <Row className="mb-4">
              <Col>
                <Card className="shadow-sm border-0">
                  <Card.Header className="bg-white border-0 py-3">
                    <h6 className="mb-0">
                      <i className="fas fa-chart-bar me-2 text-warning"></i>
                      Top Cancellation Reasons (Overall)
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Reason</th>
                            <th>Count</th>
                            <th>Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cancellationData.analysis.topCancellationReasons.map((reason, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>{reason.reason}</td>
                              <td>
                                <Badge bg="danger" className="px-3">
                                  {reason.count}
                                </Badge>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="progress flex-grow-1 me-2" style={{ height: '20px' }}>
                                    <div 
                                      className="progress-bar bg-danger" 
                                      role="progressbar" 
                                      style={{ width: `${reason.percentage}%` }}
                                      aria-valuenow={reason.percentage} 
                                      aria-valuemin="0" 
                                      aria-valuemax="100"
                                    >
                                      {reason.percentage}%
                                    </div>
                                  </div>
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
          )}

          {/* Store-wise Cancellation Data */}
          <Row>
            <Col>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white border-0 py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      <i className="fas fa-store me-2 text-primary"></i>
                      Cancellations by Store
                    </h6>
                    <Badge bg="primary" className="px-3">
                      {storeData.length} Store{storeData.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </Card.Header>
                <Card.Body>
                  {storeData.length === 0 ? (
                    <Alert variant="info" className="mb-0">
                      <i className="fas fa-info-circle me-2"></i>
                      No cancellations found for the selected date range.
                    </Alert>
                  ) : (
                    <Row>
                      {storeData.map((store, index) => (
                        <Col md={6} lg={4} key={index} className="mb-4">
                          <Card className="h-100 border-0 shadow-sm" style={{ 
                            borderLeft: '4px solid #ee5a52',
                            transition: 'all 0.3s ease'
                          }}>
                            <Card.Header className="bg-light border-0 py-3">
                              <div className="d-flex justify-content-between align-items-center">
                                <h6 className="mb-0 text-truncate me-2">
                                  <i className="fas fa-map-marker-alt me-2 text-danger"></i>
                                  {store.storeName}
                                </h6>
                                <Badge bg="danger" className="px-3">
                                  {store.totalCancellations}
                                </Badge>
                              </div>
                            </Card.Header>
                            <Card.Body>
                              <div className="mb-2">
                                <strong className="text-muted small">CANCELLATION REASONS:</strong>
                              </div>
                              <div className="list-group list-group-flush">
                                {store.topReasons.slice(0, 5).map((reason, reasonIndex) => (
                                  <div 
                                    key={reasonIndex} 
                                    className="list-group-item border-0 px-0 py-2"
                                    style={{ background: 'transparent' }}
                                  >
                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                      <span className="small text-truncate me-2" style={{ maxWidth: '70%' }}>
                                        {reasonIndex + 1}. {reason.reason}
                                      </span>
                                      <Badge bg="secondary" className="ms-auto">
                                        {reason.count}
                                      </Badge>
                                    </div>
                                    <div className="progress" style={{ height: '6px' }}>
                                      <div 
                                        className="progress-bar bg-danger" 
                                        role="progressbar" 
                                        style={{ width: `${reason.percentage}%` }}
                                        aria-valuenow={reason.percentage} 
                                        aria-valuemin="0" 
                                        aria-valuemax="100"
                                      ></div>
                                    </div>
                                    <small className="text-muted">{reason.percentage}%</small>
                                  </div>
                                ))}
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default CancellationDataView;

