
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import DSRAnalysisDashboard from './components/DSRAnalysisDashboard';
import AIInsights from './components/AIInsights';
import './App.css';

function App() {
  const [dsrData, setDsrData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Removed automatic analysis - now triggered by button click only

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <Card className="text-center bg-primary text-white">
            <Card.Body>
              <h1 className="mb-0">Suitor Guy Kerala - DSR Analysis</h1>
              <p className="mb-0">Daily Sales Report Analysis for December 2025</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger">
              <Alert.Heading>Error!</Alert.Heading>
              <p>{error}</p>
              <hr />
              <div className="d-flex justify-content-end">
                <Button variant="outline-danger" onClick={analyzeDSRSheet}>
                  Retry Analysis
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col>
          <Card className="text-center">
            <Card.Header>
              <h4 className="mb-0">Start DSR Analysis</h4>
            </Card.Header>
            <Card.Body>
              <p className="mb-3">
                Click the button below to analyze the Suitor Guy Kerala DSR sheet and identify store performance issues.
              </p>
              <Button 
                variant="primary" 
                size="lg"
                onClick={analyzeDSRSheet}
                disabled={loading}
                className="px-5 py-3"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Analyzing DSR Data...
                  </>
                ) : (
                  <>
                    🚀 Start Analysis
                  </>
                )}
              </Button>
              <div className="mt-3">
                <small className="text-muted">
                  <strong>Connected to:</strong> Suitor Guy Kerala DSR Sheet | 
                  <strong> Period:</strong> December 2025
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {dsrData && (
        <>
          <Row className="mb-3">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Analysis Results</h5>
                <Button 
                  variant="outline-primary" 
                  onClick={analyzeDSRSheet}
                  disabled={loading}
                  size="sm"
                >
                  {loading ? <Spinner size="sm" className="me-1" /> : null}
                  {loading ? 'Refreshing...' : '🔄 Refresh Analysis'}
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

      {loading && !dsrData && (
        <Row>
          <Col className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Analyzing Suitor Guy Kerala DSR data...</p>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default App;
