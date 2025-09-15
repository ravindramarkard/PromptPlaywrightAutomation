import React from 'react';
import styled from 'styled-components';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiSkipForward, FiHelpCircle } from 'react-icons/fi';

const AnalyticsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
`;

const AnalyticsPanel = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e5e9;
`;

const PanelTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatusCircle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${props => props.color || '#27ae60'};
  margin: 0 auto 16px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    bottom: 8px;
    border-radius: 50%;
    background: white;
  }
`;

const StatusPercentage = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.color || '#27ae60'};
  z-index: 1;
`;

const StatusLegend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #7f8c8d;
`;

const LegendColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: ${props => props.color};
`;

const BarChart = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BarItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BarLabel = styled.div`
  font-size: 12px;
  color: #7f8c8d;
  min-width: 60px;
`;

const BarContainer = styled.div`
  flex: 1;
  height: 20px;
  background: #f8f9fa;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const BarFill = styled.div`
  height: 100%;
  width: ${props => props.percentage}%;
  background: ${props => props.color || '#3498db'};
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const BarValue = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #2c3e50;
  min-width: 20px;
  text-align: right;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #7f8c8d;
  font-style: italic;
`;

const TestAnalytics = ({ data }) => {
  if (!data) {
    return (
      <AnalyticsContainer>
        <AnalyticsPanel>
          <PanelTitle>Status</PanelTitle>
          <EmptyState>No data available</EmptyState>
        </AnalyticsPanel>
        <AnalyticsPanel>
          <PanelTitle>Severity</PanelTitle>
          <EmptyState>No data available</EmptyState>
        </AnalyticsPanel>
        <AnalyticsPanel>
          <PanelTitle>Duration</PanelTitle>
          <EmptyState>No data available</EmptyState>
        </AnalyticsPanel>
        <AnalyticsPanel>
          <PanelTitle>Duration Trend</PanelTitle>
          <EmptyState>No data available</EmptyState>
        </AnalyticsPanel>
      </AnalyticsContainer>
    );
  }

  const { statusDistribution, durationDistribution, severityDistribution } = data;

  // Calculate status percentage for circle
  const totalStatus = Object.values(statusDistribution).reduce((sum, count) => sum + count, 0);
  const passedPercentage = totalStatus > 0 ? Math.round((statusDistribution.passed / totalStatus) * 100) : 0;

  // Get max count for bar chart scaling
  const maxDurationCount = Math.max(...durationDistribution.map(item => item.count));
  const maxSeverityCount = Math.max(...Object.values(severityDistribution));

  return (
    <AnalyticsContainer>
      {/* Status Panel */}
      <AnalyticsPanel>
        <PanelTitle>Status</PanelTitle>
        <StatusCircle color="#27ae60">
          <StatusPercentage color="#27ae60">{passedPercentage}%</StatusPercentage>
        </StatusCircle>
        <StatusLegend>
          <LegendItem>
            <LegendColor color="#e74c3c" />
            <span>Failed ({statusDistribution.failed || 0})</span>
          </LegendItem>
          <LegendItem>
            <LegendColor color="#f39c12" />
            <span>Broken ({statusDistribution.broken || 0})</span>
          </LegendItem>
          <LegendItem>
            <LegendColor color="#27ae60" />
            <span>Passed ({statusDistribution.passed || 0})</span>
          </LegendItem>
          <LegendItem>
            <LegendColor color="#95a5a6" />
            <span>Skipped ({statusDistribution.skipped || 0})</span>
          </LegendItem>
          <LegendItem>
            <LegendColor color="#9b59b6" />
            <span>Unknown ({statusDistribution.unknown || 0})</span>
          </LegendItem>
        </StatusLegend>
      </AnalyticsPanel>

      {/* Severity Panel */}
      <AnalyticsPanel>
        <PanelTitle>Severity</PanelTitle>
        <BarChart>
          {Object.entries(severityDistribution).map(([severity, count]) => (
            <BarItem key={severity}>
              <BarLabel>{severity}</BarLabel>
              <BarContainer>
                <BarFill 
                  percentage={maxSeverityCount > 0 ? (count / maxSeverityCount) * 100 : 0}
                  color={getSeverityColor(severity)}
                />
              </BarContainer>
              <BarValue>{count}</BarValue>
            </BarItem>
          ))}
        </BarChart>
      </AnalyticsPanel>

      {/* Duration Panel */}
      <AnalyticsPanel>
        <PanelTitle>Duration</PanelTitle>
        <BarChart>
          {durationDistribution.map((item, index) => (
            <BarItem key={index}>
              <BarLabel>{item.label}</BarLabel>
              <BarContainer>
                <BarFill 
                  percentage={maxDurationCount > 0 ? (item.count / maxDurationCount) * 100 : 0}
                  color="#3498db"
                />
              </BarContainer>
              <BarValue>{item.count}</BarValue>
            </BarItem>
          ))}
        </BarChart>
      </AnalyticsPanel>

      {/* Duration Trend Panel */}
      <AnalyticsPanel>
        <PanelTitle>Duration Trend</PanelTitle>
        <EmptyState>There is nothing to show</EmptyState>
      </AnalyticsPanel>
    </AnalyticsContainer>
  );
};

// Helper function to get color for severity
function getSeverityColor(severity) {
  const colors = {
    blocker: '#e74c3c',
    critical: '#e67e22',
    normal: '#27ae60',
    minor: '#f39c12',
    trivial: '#95a5a6'
  };
  return colors[severity] || '#3498db';
}

export default TestAnalytics;
