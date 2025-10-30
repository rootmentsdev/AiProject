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

  // Calculate summary stats (only for top 4 worst stores)
  const getSummary = () => {
    if (!analysisData?.allStores) return null;
    
    // Filter to only show top 4 worst performing stores
    const top4Stores = analysisData.allStores
      .filter(s => !s.usedFallbackPlan)
      .slice(0, 4);
    
    const critical = top4Stores.filter(s => 
      parseFloat(s.dsrMetrics?.conversionRate || 100) < 50
    ).length;
    
    const needsAttention = top4Stores.filter(s => {
      const conv = parseFloat(s.dsrMetrics?.conversionRate || 100);
      return conv >= 50 && conv < 70;
    }).length;
    
    const good = top4Stores.filter(s => 
      parseFloat(s.dsrMetrics?.conversionRate || 100) >= 70
    ).length;
    
    const totalCancellations = top4Stores.reduce((sum, s) => 
      sum + (s.totalCancellations || 0), 0
    );
    
    const totalBills = top4Stores.reduce((sum, s) => 
      sum + (s.staffPerformance?.bills || 0), 0
    );
    
    const totalLossOfSale = top4Stores.reduce((sum, s) => 
      sum + (s.staffPerformance?.lossOfSale || 0), 0
    );

    return { critical, needsAttention, good, totalCancellations, totalBills, totalLossOfSale };
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

  // Determine which AI logic pattern was matched for this store
  const getAIFinding = (store) => {
    const conv = parseFloat(store.dsrMetrics?.conversionRate || 0);
    const walkIns = store.staffPerformance?.walkIns || 0;
    const lossOfSale = store.staffPerformance?.lossOfSale || 0;
    const cancellations = store.totalCancellations || 0;
    const staffCount = store.staffPerformance?.staffCount || 0;
    const hasAttendanceIssues = store.staffPerformance?.attendance?.totalIssues > 0;

    // Priority order of pattern matching
    if (hasAttendanceIssues) {
      return "Staff absent on DSR date";
    }
    if (walkIns > 10 && conv < 60) {
      return "High walk-ins, low conversion";
    }
    if (walkIns < 5 && conv >= 50) {
      return "Low walk-ins, normal conversion";
    }
    if (lossOfSale > 5) {
      return "High loss of sale with 'size issue'";
    }
    if (cancellations > 3) {
      return "High cancellations";
    }
    if (conv < 60 && staffCount < 3) {
      return "Low conversion with low staff count";
    }
    
    // Default fallback
    return "Performance metrics indicate issues";
  };

  const getAIConclusion = (store) => {
    const conv = parseFloat(store.dsrMetrics?.conversionRate || 0);
    const walkIns = store.staffPerformance?.walkIns || 0;
    const lossOfSale = store.staffPerformance?.lossOfSale || 0;
    const cancellations = store.totalCancellations || 0;
    const staffCount = store.staffPerformance?.staffCount || 0;
    const hasAttendanceIssues = store.staffPerformance?.attendance?.totalIssues > 0;

    // Match the same priority order
    if (hasAttendanceIssues) {
      return "Attendance and staffing issue";
    }
    if (walkIns > 10 && conv < 60) {
      return "Staff follow-up issue / poor selling skill";
    }
    if (walkIns < 5 && conv >= 50) {
      return "Marketing or visibility issue";
    }
    if (lossOfSale > 5) {
      return "Inventory planning issue";
    }
    if (cancellations > 3) {
      return "Product quality or fulfillment issue";
    }
    if (conv < 60 && staffCount < 3) {
      return "Insufficient staffing issue";
    }
    
    // Default fallback
    return "Multiple factors affecting performance";
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
              Critical (Top 4)
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
              Conv &lt; 50%
            </div>
          </Card>

          {/* Attention Needed */}
          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#fd7e14' }}>
              {summary.needsAttention}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Needs Attention (Top 4)
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
              Conv 50-70%
            </div>
          </Card>

          {/* Performing Well */}
          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#6c757d' }}>
              {summary.good}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Above Average (Top 4)
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
              Conv ≥ 70%
            </div>
          </Card>

          {/* Total Cancellations */}
          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#2563eb' }}>
              {summary.totalCancellations}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Cancellations
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
              Top 4 stores
            </div>
          </Card>

          {/* Total Bills */}
          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
              {summary.totalBills}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Total Bills
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
              Top 4 stores
            </div>
          </Card>

          {/* Total Loss of Sale */}
          <Card style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>
              {summary.totalLossOfSale}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
              Loss of Sale
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
              Top 4 stores
            </div>
          </Card>
        </div>
      )}

      {/* AI Logic Explanation */}
      {analysisData?.allStores && (
        <div style={{ 
          marginBottom: '32px', 
          padding: '24px', 
          backgroundColor: '#1e293b', 
          borderRadius: '12px',
          color: 'white'
        }}>
          <h4 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: '#ffffff', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            🤖 How Your AI Model Thinks
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '16px' 
          }}>
            {[
              { finds: 'High walk-ins, low conversion', concludes: 'Staff follow-up issue / poor selling skill' },
              { finds: 'Low walk-ins, normal conversion', concludes: 'Marketing or visibility issue' },
              { finds: 'High loss of sale with "size issue"', concludes: 'Inventory planning issue' },
              { finds: 'High cancellations', concludes: 'Product quality or fulfillment issue' },
              { finds: 'Staff absent on DSR date', concludes: 'Attendance and staffing issue' },
              { finds: 'Low conversion with low staff count', concludes: 'Insufficient staffing issue' }
            ].map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  padding: '16px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  borderLeft: '3px solid #3b82f6'
                }}
              >
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  If AI finds...
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '10px' }}>
                  {item.finds}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  It concludes root cause as...
                </div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#fbbf24' }}>
                  {item.concludes}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store List */}
      {analysisData?.allStores && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', marginBottom: '20px' }}>
            📊 Top 4 Worst Performing Stores (Need Urgent Attention)
          </h3>
          <div style={{ 
            padding: '12px 16px', 
            backgroundColor: '#fff3cd', 
            borderLeft: '4px solid #ffc107',
            marginBottom: '20px',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '13px', color: '#856404', lineHeight: '1.6' }}>
              <strong>📌 Note:</strong> Showing only the <strong>4 worst performing stores</strong> that need immediate action (ABS &lt; 1.8, ABV &lt; 4500, Conversion &lt; 80%). 
              These stores receive AI-powered action plans with detailed loss of sale analysis.
            </div>
          </div>

          {analysisData.allStores
            .filter(store => !store.usedFallbackPlan) // Show only AI-powered plan stores (top 4)
            .slice(0, 4) // Ensure we only show maximum 4 stores
            .map((store, index) => {
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
                    padding: '20px 24px', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isExpanded ? '#f8fafc' : 'white',
                    borderBottom: isExpanded ? '2px solid #e2e8f0' : 'none'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    {/* Store Name & Priority */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                        {store.storeName}
                      </h4>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '700', 
                        color: 'white',
                        backgroundColor: priority.color,
                        padding: '4px 12px',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {priority.level}
                      </span>
                    </div>

                    {/* Performance Metrics Banner */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '24px', 
                      padding: '12px 16px',
                      backgroundColor: priority.color === '#dc3545' ? '#fef2f2' : priority.color === '#fd7e14' ? '#fff7ed' : '#f8fafc',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>CONVERSION</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: conv < 50 ? '#dc2626' : conv < 70 ? '#f59e0b' : '#10b981' }}>
                          {conv.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>ABS</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: abs < 1.8 ? '#dc2626' : '#10b981' }}>
                          {abs}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>ABV</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: abv < 4500 ? '#dc2626' : '#10b981' }}>
                          ₹{abv}
                        </div>
                      </div>
                      {store.totalCancellations > 0 && (
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>CANCELLATIONS</div>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626' }}>
                            {store.totalCancellations}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div style={{ 
                    fontSize: '20px', 
                    color: '#64748b',
                    padding: '8px',
                    backgroundColor: isExpanded ? '#e2e8f0' : 'transparent',
                    borderRadius: '8px'
                  }}>
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: '24px', backgroundColor: '#ffffff' }}>
                      
                      {/* AI Logic Card - How AI Determined This */}
                      {store.actionPlan?.rootCause && (
                        <div style={{ marginBottom: '20px' }}>
                          <div style={{ 
                            padding: '16px 20px',
                            backgroundColor: '#1e293b',
                            borderRadius: '10px',
                            border: '2px solid #3b82f6'
                          }}>
                            <div style={{ 
                              fontSize: '12px', 
                              fontWeight: '600',
                              color: '#94a3b8', 
                              marginBottom: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              🤖 How AI Determined This
                            </div>
                            <div style={{ 
                              fontSize: '13px', 
                              color: '#94a3b8',
                              marginBottom: '4px'
                            }}>
                              If AI finds...
                            </div>
                            <div style={{ 
                              fontSize: '14px', 
                              fontWeight: '600',
                              color: '#ffffff',
                              marginBottom: '10px'
                            }}>
                              {getAIFinding(store)}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#94a3b8',
                              marginBottom: '4px'
                            }}>
                              It concludes root cause as...
                            </div>
                            <div style={{ 
                              fontSize: '13px', 
                              fontWeight: '600',
                              color: '#fbbf24'
                            }}>
                              {getAIConclusion(store)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Root Cause - Highlighted */}
                      {store.actionPlan?.rootCause && (
                        <div style={{ marginBottom: '24px' }}>
                          <div style={{ 
                            fontSize: '12px', 
                            fontWeight: '700', 
                            color: '#64748b', 
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ 
                              width: '4px', 
                              height: '16px', 
                              backgroundColor: '#dc2626',
                              borderRadius: '2px'
                            }}></span>
                            PRIMARY ROOT CAUSE
                          </div>
                          <div style={{ 
                            fontSize: '16px', 
                            fontWeight: '600',
                            color: '#0f172a', 
                            lineHeight: '1.6',
                            padding: '16px 20px',
                            backgroundColor: '#fef2f2',
                            borderRadius: '8px',
                            border: '1px solid #fecaca'
                          }}>
                            {store.actionPlan.rootCause}
                          </div>
                        </div>
                      )}

                      {/* Staff Performance */}
                      {store.staffPerformance && (
                        <div style={{ marginBottom: '24px' }}>
                          <div style={{ 
                            fontSize: '12px', 
                            fontWeight: '700', 
                            color: '#64748b', 
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ 
                              width: '4px', 
                              height: '16px', 
                              backgroundColor: '#3b82f6',
                              borderRadius: '2px'
                            }}></span>
                            STAFF PERFORMANCE
                          </div>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', 
                            gap: '16px',
                            padding: '16px 20px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <div>
                              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>WALK-INS</div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                                {store.staffPerformance.walkIns || 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>BILLS</div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                                {store.staffPerformance.bills}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>CONVERSION</div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: parseFloat(store.staffPerformance.conversionRate) < 60 ? '#dc2626' : '#10b981' }}>
                                {store.staffPerformance.conversionRate}%
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>LOSS OF SALE</div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: store.staffPerformance.lossOfSale > 5 ? '#dc2626' : '#0f172a' }}>
                                {store.staffPerformance.lossOfSale}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>STAFF COUNT</div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                                {store.staffPerformance.staffCount}
                              </div>
                            </div>
                          </div>

                          {/* Individual Staff Performance */}
                          {store.staffPerformance.staffDetails?.length > 0 && (
                            <div style={{ marginTop: '16px' }}>
                              <div style={{ 
                                fontSize: '12px', 
                                fontWeight: '600', 
                                color: '#64748b', 
                                marginBottom: '8px',
                                paddingLeft: '4px'
                              }}>
                                Individual Staff Performance:
                              </div>
                              {store.staffPerformance.staffDetails.map((staff, idx) => (
                                <div 
                                  key={idx} 
                                  style={{ 
                                    padding: '12px 16px',
                                    backgroundColor: 'white',
                                    borderRadius: '6px',
                                    marginTop: idx > 0 ? '8px' : 0,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: '1px solid #e2e8f0'
                                  }}
                                >
                                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{staff.name}</div>
                                  <div style={{ fontSize: '13px', color: '#475569' }}>
                                    <strong>{staff.bills}</strong> bill{staff.bills !== 1 ? 's' : ''} • <strong>{staff.conversionRate}%</strong> conversion
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Attendance Issues */}
                          {store.staffPerformance.attendance && store.staffPerformance.attendance.totalIssues > 0 && (
                            <div style={{ 
                              marginTop: '16px',
                              padding: '12px 16px',
                              backgroundColor: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '6px'
                            }}>
                              <div style={{ 
                                fontSize: '13px', 
                                fontWeight: '600', 
                                color: '#dc2626',
                                marginBottom: '8px'
                              }}>
                                🚨 Attendance Issues on DSR Date
                              </div>
                              
                              <div style={{ fontSize: '13px', color: '#7f1d1d', marginBottom: '8px' }}>
                                <strong>{store.staffPerformance.attendance.totalIssues} staff member(s)</strong> were not working:
                              </div>

                              {store.staffPerformance.attendance.absentCount > 0 && (
                                <div style={{ marginBottom: '6px' }}>
                                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#dc2626' }}>
                                    ❌ ABSENT ({store.staffPerformance.attendance.absentCount}):
                                  </div>
                                  {store.staffPerformance.attendance.absentEmployees.map((emp, idx) => (
                                    <div key={idx} style={{ fontSize: '12px', color: '#7f1d1d', marginLeft: '16px' }}>
                                      • {emp.name} ({emp.designation})
                                    </div>
                                  ))}
                                </div>
                              )}

                              {store.staffPerformance.attendance.lopCount > 0 && (
                                <div style={{ marginBottom: '6px' }}>
                                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#dc2626' }}>
                                    💸 LOSS OF PAY ({store.staffPerformance.attendance.lopCount}):
                                  </div>
                                  {store.staffPerformance.attendance.lopEmployees.map((emp, idx) => (
                                    <div key={idx} style={{ fontSize: '12px', color: '#7f1d1d', marginLeft: '16px' }}>
                                      • {emp.name} ({emp.designation})
                                    </div>
                                  ))}
                                </div>
                              )}

                              {store.staffPerformance.attendance.leaveCount > 0 && (
                                <div style={{ marginBottom: '6px' }}>
                                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#f59e0b' }}>
                                    🏖️ ON LEAVE ({store.staffPerformance.attendance.leaveCount}):
                                  </div>
                                  {store.staffPerformance.attendance.leaveEmployees.map((emp, idx) => (
                                    <div key={idx} style={{ fontSize: '12px', color: '#78350f', marginLeft: '16px' }}>
                                      • {emp.name} ({emp.designation})
                                    </div>
                                  ))}
                                </div>
                              )}

                              {store.staffPerformance.attendance.halfDayCount > 0 && (
                                <div style={{ marginBottom: '6px' }}>
                                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#f59e0b' }}>
                                    ⏰ HALF DAY ({store.staffPerformance.attendance.halfDayCount}):
                                  </div>
                                  {store.staffPerformance.attendance.halfDayEmployees.map((emp, idx) => (
                                    <div key={idx} style={{ fontSize: '12px', color: '#78350f', marginLeft: '16px' }}>
                                      • {emp.name} ({emp.designation})
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div style={{ 
                                marginTop: '8px',
                                paddingTop: '8px',
                                borderTop: '1px solid #fecaca',
                                fontSize: '12px',
                                color: '#7f1d1d'
                              }}>
                                ⚠️ <strong>Impact:</strong> Insufficient staff likely caused loss of sale and poor conversion
                              </div>
                            </div>
                          )}

                          {/* Loss of Sale Details Section - NEW */}
                          {store.staffPerformance.lossOfSaleDetails && store.staffPerformance.lossOfSaleDetails.totalLost > 0 && (
                            <div style={{ marginTop: '16px' }}>
                              <div style={{ 
                                padding: '16px 20px',
                                backgroundColor: '#fff7ed',
                                border: '2px solid #fb923c',
                                borderRadius: '8px'
                              }}>
                                <div style={{ 
                                  fontSize: '13px', 
                                  fontWeight: '700', 
                                  color: '#ea580c',
                                  marginBottom: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  <span style={{ fontSize: '18px' }}>📉</span>
                                  LOSS OF SALE ANALYSIS - {store.staffPerformance.lossOfSaleDetails.totalLost} Customers Lost
                                </div>

                                {/* Top Reasons */}
                                {store.staffPerformance.lossOfSaleDetails.topReasons && store.staffPerformance.lossOfSaleDetails.topReasons.length > 0 && (
                                  <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#9a3412', marginBottom: '6px' }}>
                                      🔍 Why Customers Left:
                                    </div>
                                    {store.staffPerformance.lossOfSaleDetails.topReasons.map((reason, idx) => (
                                      <div key={idx} style={{ 
                                        fontSize: '12px', 
                                        color: '#7c2d12', 
                                        marginLeft: '16px',
                                        marginBottom: '4px',
                                        padding: '6px 10px',
                                        backgroundColor: '#ffedd5',
                                        borderRadius: '4px',
                                        borderLeft: '3px solid #fb923c'
                                      }}>
                                        <strong>#{idx + 1}.</strong> {reason.reason} <span style={{ 
                                          fontWeight: '700',
                                          color: '#ea580c'
                                        }}>({reason.count} cases)</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* What Customers Wanted */}
                                {store.staffPerformance.lossOfSaleDetails.entries && 
                                 store.staffPerformance.lossOfSaleDetails.entries.some(e => e.otherComments && e.otherComments.trim()) && (
                                  <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#9a3412', marginBottom: '6px' }}>
                                      💡 What Customers Wanted (But We Didn't Have):
                                    </div>
                                    {store.staffPerformance.lossOfSaleDetails.entries
                                      .filter(e => e.otherComments && e.otherComments.trim())
                                      .slice(0, 5)
                                      .map((entry, idx) => (
                                        <div key={idx} style={{ 
                                          fontSize: '12px', 
                                          color: '#7c2d12', 
                                          marginLeft: '16px',
                                          marginBottom: '4px',
                                          padding: '6px 10px',
                                          backgroundColor: '#fed7aa',
                                          borderRadius: '4px',
                                          fontStyle: 'italic'
                                        }}>
                                          • {entry.otherComments}
                                          {entry.customerName && entry.customerName !== 'N/A' && (
                                            <span style={{ fontSize: '11px', color: '#9a3412', marginLeft: '6px' }}>
                                              (Customer: {entry.customerName})
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                  </div>
                                )}

                                {/* Product Unavailability */}
                                {store.staffPerformance.lossOfSaleDetails.entries && 
                                 store.staffPerformance.lossOfSaleDetails.entries.some(e => e.productUnavailability && e.productUnavailability.trim()) && (
                                  <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#9a3412', marginBottom: '6px' }}>
                                      ❌ Product Unavailability Issues:
                                    </div>
                                    {store.staffPerformance.lossOfSaleDetails.entries
                                      .filter(e => e.productUnavailability && e.productUnavailability.trim())
                                      .slice(0, 5)
                                      .map((entry, idx) => (
                                        <div key={idx} style={{ 
                                          fontSize: '12px', 
                                          color: '#7c2d12', 
                                          marginLeft: '16px',
                                          marginBottom: '4px',
                                          padding: '6px 10px',
                                          backgroundColor: '#ffedd5',
                                          borderRadius: '4px',
                                          borderLeft: '3px solid #dc2626'
                                        }}>
                                          • {entry.productUnavailability}
                                        </div>
                                      ))}
                                  </div>
                                )}

                                {/* Impact Summary */}
                                <div style={{ 
                                  marginTop: '12px',
                                  paddingTop: '12px',
                                  borderTop: '2px solid #fb923c',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  color: '#9a3412'
                                }}>
                                  💰 <strong>Impact:</strong> {store.staffPerformance.lossOfSaleDetails.totalLost} lost customers = 
                                  {' '}{((store.staffPerformance.lossOfSaleDetails.totalLost / (store.staffPerformance.walkIns || 1)) * 100).toFixed(1)}% of walk-ins lost
                                  <div style={{ fontSize: '11px', marginTop: '4px', color: '#7c2d12', fontWeight: 'normal' }}>
                                    These losses are PREVENTABLE with proper inventory and product variety!
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions Required */}
                      {store.actionPlan?.immediate && (
                        <div style={{ marginBottom: '24px' }}>
                          <div style={{ 
                            fontSize: '12px', 
                            fontWeight: '700', 
                            color: '#64748b', 
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ 
                              width: '4px', 
                              height: '16px', 
                              backgroundColor: '#f59e0b',
                              borderRadius: '2px'
                            }}></span>
                            ACTIONS REQUIRED (NEXT 24-48 HOURS)
                          </div>
                          <div style={{ 
                            padding: '20px',
                            backgroundColor: '#fffbeb',
                            borderRadius: '8px',
                            border: '1px solid #fcd34d'
                          }}>
                            {store.actionPlan.immediate.map((action, idx) => (
                              <div 
                                key={idx} 
                                style={{ 
                                  display: 'flex',
                                  gap: '16px',
                                  marginBottom: idx < store.actionPlan.immediate.length - 1 ? '16px' : 0,
                                  alignItems: 'flex-start'
                                }}
                              >
                                <div style={{ 
                                  minWidth: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  backgroundColor: '#f59e0b',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '13px',
                                  fontWeight: '700',
                                  flexShrink: 0
                                }}>
                                  {idx + 1}
                                </div>
                                <div style={{ 
                                  fontSize: '14px', 
                                  color: '#0f172a', 
                                  lineHeight: '1.8',
                                  fontWeight: '500',
                                  paddingTop: '3px'
                                }}>
                                  {action}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expected Outcome */}
                      {store.actionPlan?.expectedImpact && (
                        <div style={{ marginBottom: '0' }}>
                          <div style={{ 
                            fontSize: '12px', 
                            fontWeight: '700', 
                            color: '#64748b', 
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ 
                              width: '4px', 
                              height: '16px', 
                              backgroundColor: '#10b981',
                              borderRadius: '2px'
                            }}></span>
                            EXPECTED OUTCOME
                          </div>
                          <div style={{ 
                            padding: '16px 20px',
                            backgroundColor: '#f0fdf4',
                            borderRadius: '8px',
                            border: '1px solid #86efac',
                            fontSize: '14px', 
                            fontWeight: '500',
                            color: '#0f172a',
                            lineHeight: '1.8'
                          }}>
                            {store.actionPlan.expectedImpact}
                          </div>
                        </div>
                      )}
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

