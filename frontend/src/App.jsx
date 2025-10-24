import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Nav, Tab } from 'react-bootstrap';
import DSRAnalysisDashboard from './components/DSRAnalysisDashboard';
import AIInsights from './components/AIInsights';
import CancellationDataView from './components/CancellationDataView';
import IntegratedAnalysis from './components/IntegratedAnalysis';
import './App.css';

function App() {
  const [dsrData, setDsrData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('dsr');

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const analyzeDSRSheet = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/analyze-sheet');
      const result = await response.json();

      if (result.error) {
        setError(result.error);
      } else {
        setDsrData(result);
        setAiAnalysis(result);
      }
    } catch (err) {
      setError('Error connecting to server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ 
      background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
      minHeight: '100vh'
    }}>
      <Container fluid className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-lg" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              animation: 'slideInDown 0.8s ease-out'
            }}>
              <Card.Body className="text-center py-4">
                <div className="brand-container">
                  <h1 className="mb-2 text-white fw-bold">
                    <i className="fas fa-robot me-3"></i>
                    Brynx AI Project
                  </h1>
                  <p className="mb-1 text-white-50 fs-5">by Tech Team with Love</p>
                  <p className="mb-0 text-white-50">Daily Sales Report Analysis for December 2025</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Error Alert */}
        {error && (
          <Row className="mb-4">
            <Col>
              <Alert variant="danger" className="border-0 shadow-sm" style={{ 
                animation: 'shake 0.5s ease-in-out',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                color: 'white'
              }}>
                <Alert.Heading className="text-white">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  Error!
                </Alert.Heading>
                <p className="mb-0">{error}</p>
                <hr className="my-3" style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
                <div className="d-flex justify-content-end">
                  <Button 
                    variant="outline-light" 
                    onClick={analyzeDSRSheet}
                    className="border-white text-white"
                  >
                    <i className="fas fa-redo me-2"></i>Retry Analysis
                  </Button>
                </div>
              </Alert>
            </Col>
          </Row>
        )}

        {/* Navigation Tabs */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="py-2">
                <Nav variant="tabs" className="border-0" activeKey={activeTab} onSelect={setActiveTab}>
                  <Nav.Item>
                    <Nav.Link eventKey="dsr" className="border-0">
                      <i className="fas fa-chart-line me-2"></i>
                      DSR Analysis
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="cancellation" className="border-0">
                      <i className="fas fa-times-circle me-2"></i>
                      Cancellation Data
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="integrated" className="border-0">
                      <i className="fas fa-brain me-2"></i>
                      Action Plan
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tab Content */}
        <Tab.Container activeKey={activeTab}>
          <Tab.Content>
            {/* DSR Analysis Tab */}
            <Tab.Pane eventKey="dsr">
              {/* Start Analysis Button */}
              {!dsrData && !loading && (
                <Row className="mb-4">
                  <Col>
                    <Card className="border-0 shadow-lg text-center" style={{ 
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                      animation: 'fadeInUp 0.8s ease-out'
                    }}>
                      <Card.Header className="bg-white border-0 py-4">
                        <h4 className="mb-0 text-dark">
                          <i className="fas fa-play-circle me-2 text-primary"></i>
                          Start DSR Analysis
                        </h4>
                      </Card.Header>
                      <Card.Body className="py-5">
                        <p className="mb-4 text-muted fs-5">
                          Click the button below to analyze the Suitor Guy Kerala DSR sheet and identify store performance issues.
                        </p>
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={analyzeDSRSheet}
                          disabled={loading}
                          className="px-5 py-3 rounded-pill shadow-sm"
                          style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {loading ? (
                            <>
                              <Spinner size="sm" className="me-2" />
                              Analyzing DSR Data...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-rocket me-2"></i>
                              Start Analysis
                            </>
                          )}
                        </Button>
                        <div className="mt-4">
                          <small className="text-muted">
                            <i className="fas fa-link me-1"></i>
                            <strong>Connected to:</strong> Suitor Guy Kerala DSR Sheet |
                            <i className="fas fa-calendar me-1 ms-2"></i>
                            <strong> Period:</strong> December 2025
                          </small>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Analysis Results */}
              {dsrData && (
                <>
                  <Row className="mb-3">
                    <Col>
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 text-dark">
                          <i className="fas fa-chart-line me-2 text-primary"></i>
                          Analysis Results
                        </h5>
                        <Button
                          variant="outline-primary"
                          onClick={analyzeDSRSheet}
                          disabled={loading}
                          size="sm"
                          className="rounded-pill"
                        >
                          {loading ? <Spinner size="sm" className="me-1" /> : null}
                          {loading ? 'Refreshing...' : (
                            <>
                              <i className="fas fa-sync-alt me-1"></i>
                              Refresh Analysis
                            </>
                          )}
                        </Button>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={8}>
                      <DSRAnalysisDashboard data={dsrData} />
                    </Col>
                    <Col lg={4}>
                      <AIInsights analysis={aiAnalysis} />
                    </Col>
                  </Row>
                </>
              )}

              {/* Loading Spinner */}
              {loading && !dsrData && (
                <Row>
                  <Col className="text-center">
                    <div className="loading-container">
                      <Spinner animation="border" role="status" className="text-primary" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                      </Spinner>
                      <p className="mt-3 text-muted fs-5">
                        <i className="fas fa-cog fa-spin me-2"></i>
                        Analyzing Suitor Guy Kerala DSR data...
                      </p>
                    </div>
                  </Col>
                </Row>
              )}
            </Tab.Pane>

            {/* Cancellation Data Tab */}
            <Tab.Pane eventKey="cancellation">
              <CancellationDataView />
            </Tab.Pane>

            {/* Integrated Analysis Tab */}
            <Tab.Pane eventKey="integrated">
              <IntegratedAnalysis />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Container>
    </div>
  );
}

export default App;