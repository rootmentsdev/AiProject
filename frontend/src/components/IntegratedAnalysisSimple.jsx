import React, { useState } from 'react';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';

const IntegratedAnalysisSimple = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedStore, setExpandedStore] = useState(null);

  const performAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/integrated-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setAnalysisData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary stats
  const getSummary = () => {
    if (!analysisData?.allStores) return null;
    
    const critical = analysisData.allStores.filter(s => 
      parseFloat(s.dsrMetrics?.conversionRate || 100) < 50
    ).length;
    
    const needsAttention = analysisData.allStores.filter(s => {
      const conv = parseFloat(s.dsrMetrics?.conversionRate || 100);
      return conv >= 50 && conv < 70;
    }).length;
    
    const good = analysisData.allStores.filter(s => 
      parseFloat(s.dsrMetrics?.conversionRate || 100) >= 70
    ).length;
    
    const totalCancellations = analysisData.allStores.reduce((sum, s) => 
      sum + (s.totalCancellations || 0), 0
    );
    
    const totalRevenueLoss = analysisData.allStores.reduce((sum, s) => 
      sum + (parseFloat(s.dsrLoss) || 0), 0
    );

    return { critical, needsAttention, good, totalCancellations, totalRevenueLoss };
  };

  // Get priority level
  const getPriority = (store) => {
    const conv = parseFloat(store.dsrMetrics?.conversionRate || 100);
    if (conv < 50) return { level: 'URGENT', color: '#dc3545' };
    if (conv < 70) return { level: 'ATTENTION', color: '#fd7e14' };
    return { level: 'OK', color: '#6c757d' };
  };

  // Generate plain English summary
  const getPlainSummary = (store) => {
    const conv = parseFloat(store.dsrMetrics?.conversionRate || 0);
    const walkIns = store.staffPerformance?.walkIns || 'N/A';
    const bills = store.staffPerformance?.bills || 0;
    const cancellations = store.totalCancellations || 0;
    
    let summary = `${store.storeName} `;
    
    if (conv < 50) {
      summary += `needs urgent attention. `;
    } else if (conv < 70) {
      summary += `needs monitoring. `;
    } else {
      summary += `is performing well. `;
    }
    
    if (walkIns === 'N/A' || walkIns === 0) {
      summary += `Walk-in data not available. `;
    } else if (walkIns < 5) {
      summary += `Very low walk-ins (${walkIns}) - possible marketing issue. `;
    } else {
      summary += `${walkIns} customers walked in, ${bills} bills created. `;
    }
    
    if (cancellations > 0) {
      summary += `${cancellations} cancellations need follow-up.`;
    }
    
    return summary;
  };

  const summary = getSummary();

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
          Daily Store Performance Report
        </h2>
        <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
          {analysisData?.date ? new Date(analysisData.date).toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          }) : 'Latest Data'}
        </p>
      </div>

      {/* Analyze Button */}
      {!analysisData && (
        <Button 
          onClick={performAnalysis} 
          disabled={loading}
          style={{ 
            backgroundColor: '#2563eb',
            border: 'none',
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '500',
            borderRadius: '6px'
          }}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" style={{ marginRight: '8px' }} />
              Analyzing...
            </>
          ) : (
            '📊 Analyze All Stores'
          )}
        </Button>
      )}

      {/* Error */}
      {error && (
        <Alert variant="danger" style={{ marginTop: '20px', borderRadius: '6px' }}>
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {/* Executive Summary */}
      {analysisData && summary && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '30px' 
        }}>
          {/* Urgent Stores */}
          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc3545' }}>
              {summary.critical}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Stores Need Urgent Action
            </div>
          </Card>

          {/* Attention Needed */}
          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#fd7e14' }}>
              {summary.needsAttention}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Stores Need Monitoring
            </div>
          </Card>

          {/* Performing Well */}
          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#6c757d' }}>
              {summary.good}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Stores Performing Well
            </div>
          </Card>

          {/* Total Cancellations */}
          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#2563eb' }}>
              {summary.totalCancellations}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Total Cancellations
            </div>
          </Card>

          {/* Revenue Loss */}
          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#2563eb' }}>
              ₹{Math.round(summary.totalRevenueLoss).toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Potential Revenue Loss
            </div>
          </Card>
        </div>
      )}

      {/* Store List */}
      {analysisData?.allStores && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', marginBottom: '20px' }}>
            Store Performance ({analysisData.allStores.length} stores)
          </h3>

          {analysisData.allStores.map((store, index) => {
            const priority = getPriority(store);
            const isExpanded = expandedStore === index;
            const conv = parseFloat(store.dsrMetrics?.conversionRate || 0);
            const abs = parseFloat(store.dsrMetrics?.absValue || 0);
            const abv = parseFloat(store.dsrMetrics?.abvValue || 0);

            return (
              <Card 
                key={index} 
                style={{ 
                  marginBottom: '12px', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  borderLeft: `4px solid ${priority.color}`,
                  overflow: 'hidden'
                }}
              >
                {/* Store Header */}
                <div 
                  onClick={() => setExpandedStore(isExpanded ? null : index)}
                  style={{ 
                    padding: '16px 20px', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isExpanded ? '#f9fafb' : 'white'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    {/* Store Name & Priority */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
                        {store.storeName}
                      </h4>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        color: priority.color,
                        backgroundColor: `${priority.color}15`,
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {priority.level}
                      </span>
                    </div>

                    {/* Plain English Summary */}
                    <p style={{ fontSize: '14px', color: '#6c757d', margin: 0, lineHeight: '1.5' }}>
                      {getPlainSummary(store)}
                    </p>

                    {/* Quick Metrics */}
                    <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '13px' }}>
                      <div>
                        <span style={{ color: '#9ca3af' }}>Conversion: </span>
                        <span style={{ fontWeight: '600', color: conv < 50 ? '#dc3545' : conv < 70 ? '#fd7e14' : '#6c757d' }}>
                          {conv.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#9ca3af' }}>ABS: </span>
                        <span style={{ fontWeight: '600', color: abs < 1.8 ? '#dc3545' : '#6c757d' }}>
                          {abs}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#9ca3af' }}>ABV: </span>
                        <span style={{ fontWeight: '600', color: abv < 4500 ? '#dc3545' : '#6c757d' }}>
                          ₹{abv}
                        </span>
                      </div>
                      {store.totalCancellations > 0 && (
                        <div>
                          <span style={{ color: '#9ca3af' }}>Cancellations: </span>
                          <span style={{ fontWeight: '600', color: '#dc3545' }}>
                            {store.totalCancellations}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div style={{ fontSize: '20px', color: '#9ca3af' }}>
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: '0 20px 20px 20px', backgroundColor: '#f9fafb' }}>
                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                      
                      {/* Root Cause */}
                      {store.actionPlan?.rootCause && (
                        <div style={{ marginBottom: '24px' }}>
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: '#6c757d', 
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px'
                          }}>
                            Root Cause
                          </div>
                          <div style={{ 
                            fontSize: '15px', 
                            color: '#1a1a1a', 
                            lineHeight: '1.6',
                            padding: '12px 16px',
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            borderLeft: '3px solid #2563eb'
                          }}>
                            {store.actionPlan.rootCause}
                          </div>
                        </div>
                      )}

                      {/* Staff Performance */}
                      {store.staffPerformance && (
                        <div style={{ marginBottom: '24px' }}>
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: '#6c757d', 
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px'
                          }}>
                            Staff Performance
                          </div>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                            gap: '12px',
                            padding: '12px 16px',
                            backgroundColor: 'white',
                            borderRadius: '6px'
                          }}>
                            <div>
                              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Walk-ins</div>
                              <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                                {store.staffPerformance.walkIns || 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Bills</div>
                              <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                                {store.staffPerformance.bills}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Conversion</div>
                              <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                                {store.staffPerformance.conversionRate}%
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Loss of Sale</div>
                              <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                                {store.staffPerformance.lossOfSale}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Staff Count</div>
                              <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                                {store.staffPerformance.staffCount}
                              </div>
                            </div>
                          </div>

                          {/* Staff Details */}
                          {store.staffPerformance.staffDetails?.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                              {store.staffPerformance.staffDetails.map((staff, idx) => (
                                <div 
                                  key={idx} 
                                  style={{ 
                                    padding: '10px 16px',
                                    backgroundColor: 'white',
                                    borderRadius: '6px',
                                    marginTop: idx > 0 ? '8px' : 0,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <div style={{ fontWeight: '500', color: '#1a1a1a' }}>{staff.name}</div>
                                  <div style={{ fontSize: '14px', color: '#6c757d' }}>
                                    {staff.bills} bills • {staff.conversionRate}% conversion
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      {store.actionPlan?.immediate && (
                        <div>
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: '#6c757d', 
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px'
                          }}>
                            Actions Required (Next 24-48 Hours)
                          </div>
                          <div style={{ 
                            padding: '16px',
                            backgroundColor: 'white',
                            borderRadius: '6px'
                          }}>
                            {store.actionPlan.immediate.map((action, idx) => (
                              <div 
                                key={idx} 
                                style={{ 
                                  display: 'flex',
                                  gap: '12px',
                                  marginBottom: idx < store.actionPlan.immediate.length - 1 ? '12px' : 0
                                }}
                              >
                                <div style={{ 
                                  minWidth: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  backgroundColor: '#2563eb',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  flexShrink: 0
                                }}>
                                  {idx + 1}
                                </div>
                                <div style={{ fontSize: '14px', color: '#1a1a1a', lineHeight: '1.6' }}>
                                  {action}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expected Impact */}
                      {store.actionPlan?.expectedImpact && (
                        <div style={{ 
                          marginTop: '16px',
                          padding: '12px 16px',
                          backgroundColor: '#eff6ff',
                          borderRadius: '6px',
                          borderLeft: '3px solid #2563eb'
                        }}>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                            Expected Outcome
                          </div>
                          <div style={{ fontSize: '14px', color: '#1a1a1a' }}>
                            {store.actionPlan.expectedImpact}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Refresh Button */}
      {analysisData && (
        <Button 
          onClick={performAnalysis} 
          disabled={loading}
          style={{ 
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            color: '#1a1a1a',
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '500',
            borderRadius: '6px',
            marginTop: '20px'
          }}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Analysis'}
        </Button>
      )}
    </div>
  );
};

export default IntegratedAnalysisSimple;

