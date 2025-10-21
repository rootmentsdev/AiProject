import React, { useState, useEffect } from 'react';
import { Card, Badge, ProgressBar } from 'react-bootstrap';

const AIInsights = ({ analysis }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Get current date
  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!analysis) {
    return (
      <Card className="shadow-sm border-0" style={{ 
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        animation: 'fadeIn 0.6s ease-in-out'
      }}>
        <Card.Header className="bg-white border-0">
          <h5 className="mb-0 text-dark">
            <i className="fas fa-brain me-2 text-primary"></i>
            AI Analysis
          </h5>
        </Card.Header>
        <Card.Body className="text-center py-4">
          <div className="text-muted">
            <i className="fas fa-chart-pie fa-2x mb-3 opacity-50"></i>
            <p className="mb-0">Analyze a DSR sheet to see AI insights</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  const totalStores = analysis.analysisSummary?.totalStores || 0;
  const badPerformers = analysis.analysisSummary?.badPerformingStores || 0;
  const issueRate = totalStores > 0 ? Math.round((badPerformers / totalStores) * 100) : 0;

  return (
    <Card className="shadow-sm border-0" style={{ 
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
      animation: 'slideInUp 0.6s ease-out'
    }}>
      <Card.Header className="bg-white border-0 py-3">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-dark">
            <i className="fas fa-brain me-2 text-primary"></i>
            AI Analysis Summary
          </h5>
          <Badge bg="success" className="pulse-animation">
            <i className="fas fa-check me-1"></i>Active
          </Badge>
        </div>
      </Card.Header>
      <Card.Body className="py-4">
        {analysis.analysisSummary && (
          <div className="insights-container">
            {/* Current Date */}
            <div className="insight-item mb-4">
              <div className="text-center">
                <Badge bg="info" className="px-3 py-2 mb-2">
                  <i className="fas fa-calendar me-1"></i>
                  {getCurrentDate()}
                </Badge>
                <p className="text-muted mb-0 small">Analysis Date</p>
              </div>
            </div>

            {/* Store Statistics */}
            <div className="insight-item mb-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <i className="fas fa-store text-primary me-3"></i>
                  <div>
                    <strong className="text-dark">Total Stores</strong>
                    <p className="mb-0 text-muted small">Analyzed</p>
                  </div>
                </div>
                <Badge bg="primary" className="px-3 py-2">{totalStores}</Badge>
              </div>
            </div>
            
            <div className="insight-item mb-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle text-warning me-3"></i>
                  <div>
                    <strong className="text-dark">Issues Found</strong>
                    <p className="mb-0 text-muted small">Requiring Attention</p>
                  </div>
                </div>
                <Badge bg="danger" className="px-3 py-2">{badPerformers}</Badge>
              </div>
            </div>

            {/* Issue Rate Progress */}
            <div className="insight-item mb-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center">
                  <i className="fas fa-chart-pie text-info me-3"></i>
                  <div>
                    <strong className="text-dark">Issue Rate</strong>
                    <p className="mb-0 text-muted small">Performance Issues</p>
                  </div>
                </div>
                <Badge bg={issueRate > 50 ? 'danger' : issueRate > 30 ? 'warning' : 'success'} className="px-3 py-2">
                  {issueRate}%
                </Badge>
              </div>
              <ProgressBar 
                now={issueRate} 
                variant={issueRate > 50 ? 'danger' : issueRate > 30 ? 'warning' : 'success'}
                className="mb-2"
                style={{ height: '8px' }}
              />
            </div>
            
            {/* Analysis Period */}
            <div className="insight-item mb-3">
              <div className="d-flex align-items-center">
                <i className="fas fa-clock text-secondary me-3"></i>
                <div>
                  <strong className="text-dark">Analysis Period:</strong>
                  <p className="mb-0 text-muted small">{analysis.analysisSummary.analysisPeriod}</p>
                </div>
              </div>
            </div>
            
            {/* Key Findings */}
            <div className="insight-item">
              <div className="d-flex align-items-start">
                <i className="fas fa-lightbulb text-warning me-3 mt-1"></i>
                <div>
                  <strong className="text-dark">Key Findings:</strong>
                  <p className="text-muted mb-0 mt-1 small">{analysis.analysisSummary.keyFindings}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default AIInsights;