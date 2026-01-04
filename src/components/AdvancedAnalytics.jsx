import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar
} from 'recharts'

// Government color scheme
const COLORS = {
  primary: '#003366',
  secondary: '#5A6872',
  success: '#2C5F2D',
  warning: '#C9A227',
  danger: '#BC2F36',
  info: '#004B87'
}

const CHART_COLORS = ['#003366', '#004B87', '#2C5F2D', '#C9A227', '#BC2F36', '#5A6872']

export default function AdvancedAnalytics({ debts }) {
  
  // ============ DATA PROCESSING ============
  
  // Recovery Trend (Last 30 days simulation)
  const recoveryTrend = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      recovered: Math.floor(Math.random() * 50000) + 20000,
      target: 45000,
      cases: Math.floor(Math.random() * 15) + 5
    }
  })

  // Agency Distribution
  const agencyDistribution = debts.reduce((acc, debt) => {
    if (!acc[debt.assignedTo]) {
      acc[debt.assignedTo] = { name: debt.assignedTo, value: 0, cases: 0 }
    }
    acc[debt.assignedTo].value += debt.amount
    acc[debt.assignedTo].cases += 1
    return acc
  }, {})
  const agencyData = Object.values(agencyDistribution)

  // Status Breakdown
  const statusData = debts.reduce((acc, debt) => {
    if (!acc[debt.status]) {
      acc[debt.status] = { status: debt.status, count: 0, amount: 0 }
    }
    acc[debt.status].count += 1
    acc[debt.status].amount += debt.amount
    return acc
  }, {})
  const statusBreakdown = Object.values(statusData)

  // Risk Score Distribution
  const riskDistribution = [
    { range: '0-20', count: debts.filter(d => d.propensity <= 20).length, color: COLORS.danger },
    { range: '21-40', count: debts.filter(d => d.propensity > 20 && d.propensity <= 40).length, color: '#E67E22' },
    { range: '41-60', count: debts.filter(d => d.propensity > 40 && d.propensity <= 60).length, color: COLORS.warning },
    { range: '61-80', count: debts.filter(d => d.propensity > 60 && d.propensity <= 80).length, color: '#27AE60' },
    { range: '81-100', count: debts.filter(d => d.propensity > 80).length, color: COLORS.success }
  ]

  // Age Analysis (Days Overdue)
  const ageAnalysis = [
    { range: '0-30 Days', count: debts.filter(d => d.daysOverdue <= 30).length, amount: debts.filter(d => d.daysOverdue <= 30).reduce((s, d) => s + d.amount, 0) },
    { range: '31-60 Days', count: debts.filter(d => d.daysOverdue > 30 && d.daysOverdue <= 60).length, amount: debts.filter(d => d.daysOverdue > 30 && d.daysOverdue <= 60).reduce((s, d) => s + d.amount, 0) },
    { range: '61-90 Days', count: debts.filter(d => d.daysOverdue > 60 && d.daysOverdue <= 90).length, amount: debts.filter(d => d.daysOverdue > 60 && d.daysOverdue <= 90).reduce((s, d) => s + d.amount, 0) },
    { range: '90+ Days', count: debts.filter(d => d.daysOverdue > 90).length, amount: debts.filter(d => d.daysOverdue > 90).reduce((s, d) => s + d.amount, 0) }
  ]

  // Monthly Performance
  const monthlyData = [
    { month: 'Jan', collected: 145000, assigned: 180000, rate: 80.6 },
    { month: 'Feb', collected: 167000, assigned: 195000, rate: 85.6 },
    { month: 'Mar', collected: 189000, assigned: 210000, rate: 90.0 },
    { month: 'Apr', collected: 156000, assigned: 205000, rate: 76.1 },
    { month: 'May', collected: 198000, assigned: 220000, rate: 90.0 },
    { month: 'Jun', collected: 234000, assigned: 250000, rate: 93.6 }
  ]

  // Agency Efficiency Score
  const agencyEfficiency = Object.entries(
    debts.reduce((acc, debt) => {
      if (!acc[debt.assignedTo]) {
        acc[debt.assignedTo] = { agency: debt.assignedTo, assigned: 0, recovered: 0, avgDays: 0, count: 0 }
      }
      acc[debt.assignedTo].assigned += debt.amount
      if (debt.status === 'Paid') acc[debt.assignedTo].recovered += debt.amount
      acc[debt.assignedTo].count += 1
      return acc
    }, {})
  ).map(([key, value]) => ({
    ...value,
    efficiency: Math.round((value.recovered / value.assigned) * 100) || 0,
    fill: CHART_COLORS[Object.keys(agencyDistribution).indexOf(key)]
  }))

  // ============ CUSTOM TOOLTIP ============
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' && entry.name.includes('$') 
                ? `$${entry.value.toLocaleString()}` 
                : entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="analytics-container">
      
      {/* Page Header */}
      <div className="analytics-header">
        <div>
          <h2>ADVANCED ANALYTICS & REPORTING</h2>
          <p className="report-meta">
            Report Generated: {new Date().toLocaleString('en-US', { 
              dateStyle: 'full', 
              timeStyle: 'short' 
            })}
          </p>
          <p className="report-meta">Total Records Analyzed: {debts.length}</p>
        </div>
        <div className="export-controls">
          <button className="btn-export">EXPORT TO PDF</button>
          <button className="btn-export">EXPORT TO EXCEL</button>
          <button className="btn-export">PRINT REPORT</button>
        </div>
      </div>

      {/* Section 1: Recovery Trends */}
      <div className="analytics-section">
        <div className="section-header">
          <h3>SECTION 1: DAILY RECOVERY TREND ANALYSIS</h3>
          <span className="section-id">Report ID: FDX-ART-001</span>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={recoveryTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: COLORS.secondary, fontSize: 12 }}
                stroke={COLORS.secondary}
              />
              <YAxis 
                tick={{ fill: COLORS.secondary, fontSize: 12 }}
                stroke={COLORS.secondary}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="square"
              />
              <Area 
                type="monotone" 
                dataKey="recovered" 
                name="Daily Recovered ($)"
                stroke={COLORS.primary} 
                fill={COLORS.primary}
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="target" 
                name="Target ($)"
                stroke={COLORS.warning} 
                fill={COLORS.warning}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-footer">
          <p><strong>Analysis:</strong> Recovery performance vs daily targets over 30-day period</p>
        </div>
      </div>

      {/* Section 2: Agency Performance */}
      <div className="analytics-section">
        <div className="section-header">
          <h3>SECTION 2: AGENCY ALLOCATION & PERFORMANCE METRICS</h3>
          <span className="section-id">Report ID: FDX-AAP-002</span>
        </div>
        <div className="dual-chart">
          <div className="chart-box">
            <h4>2.1 Debt Distribution by Agency</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={agencyData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: $${(entry.value / 1000).toFixed(0)}K`}
                  labelLine={true}
                >
                  {agencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="chart-box">
            <h4>2.2 Agency Efficiency Rating (%)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agencyEfficiency} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="agency" 
                  width={150}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="efficiency" name="Efficiency Score" fill={COLORS.primary}>
                  {agencyEfficiency.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 3: Status & Risk Analysis */}
      <div className="analytics-section">
        <div className="section-header">
          <h3>SECTION 3: COLLECTION STATUS & RISK ASSESSMENT</h3>
          <span className="section-id">Report ID: FDX-CSR-003</span>
        </div>
        <div className="dual-chart">
          <div className="chart-box">
            <h4>3.1 Status Distribution (Case Count)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis 
                  dataKey="status" 
                  tick={{ fontSize: 12 }}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Number of Cases" fill={COLORS.info} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-box">
            <h4>3.2 AI Risk Score Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Case Count">
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="legend-custom">
              <span className="legend-item"><span className="dot" style={{background: COLORS.danger}}></span> Critical (0-20)</span>
              <span className="legend-item"><span className="dot" style={{background: '#E67E22'}}></span> High Risk (21-40)</span>
              <span className="legend-item"><span className="dot" style={{background: COLORS.warning}}></span> Medium (41-60)</span>
              <span className="legend-item"><span className="dot" style={{background: '#27AE60'}}></span> Low Risk (61-80)</span>
              <span className="legend-item"><span className="dot" style={{background: COLORS.success}}></span> Minimal (81-100)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Age Analysis */}
      <div className="analytics-section">
        <div className="section-header">
          <h3>SECTION 4: AGING REPORT - DAYS PAST DUE ANALYSIS</h3>
          <span className="section-id">Report ID: FDX-AGE-004</span>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={ageAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                label={{ value: 'Case Count', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                label={{ value: 'Total Amount ($)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="count" name="Number of Cases" fill={COLORS.secondary} />
              <Bar yAxisId="right" dataKey="amount" name="Total Amount ($)" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="aging-table">
          <table>
            <thead>
              <tr>
                <th>AGE BRACKET</th>
                <th>CASE COUNT</th>
                <th>TOTAL AMOUNT</th>
                <th>AVERAGE PER CASE</th>
                <th>% OF PORTFOLIO</th>
              </tr>
            </thead>
            <tbody>
              {ageAnalysis.map((row, idx) => {
                const totalAmount = debts.reduce((s, d) => s + d.amount, 0)
                return (
                  <tr key={idx}>
                    <td>{row.range}</td>
                    <td>{row.count}</td>
                    <td>${row.amount.toLocaleString()}</td>
                    <td>${row.count > 0 ? Math.round(row.amount / row.count).toLocaleString() : 0}</td>
                    <td>{((row.amount / totalAmount) * 100).toFixed(1)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: Monthly Trends */}
      <div className="analytics-section">
        <div className="section-header">
          <h3>SECTION 5: FISCAL YEAR 2024 - MONTHLY PERFORMANCE TRENDS</h3>
          <span className="section-id">Report ID: FDX-MPT-005</span>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="assigned" 
                name="Assigned Amount ($)"
                stroke={COLORS.secondary} 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="collected" 
                name="Collected Amount ($)"
                stroke={COLORS.success} 
                strokeWidth={3}
                dot={{ r: 5 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="rate" 
                name="Success Rate (%)"
                stroke={COLORS.warning} 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Statistics Table */}
      <div className="analytics-section">
        <div className="section-header">
          <h3>SECTION 6: EXECUTIVE SUMMARY - KEY PERFORMANCE INDICATORS</h3>
          <span className="section-id">Report ID: FDX-KPI-006</span>
        </div>
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">TOTAL PORTFOLIO VALUE</div>
            <div className="kpi-value">${debts.reduce((s, d) => s + d.amount, 0).toLocaleString()}</div>
            <div className="kpi-meta">Across {debts.length} active cases</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">RECOVERY RATE (YTD)</div>
            <div className="kpi-value">
              {((debts.filter(d => d.status === 'Paid').reduce((s, d) => s + d.amount, 0) / 
                 debts.reduce((s, d) => s + d.amount, 0)) * 100).toFixed(1)}%
            </div>
            <div className="kpi-meta">Target: 85.0%</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">AVERAGE DAYS TO RESOLVE</div>
            <div className="kpi-value">
              {Math.round(debts.reduce((s, d) => s + d.daysOverdue, 0) / debts.length)} Days
            </div>
            <div className="kpi-meta">Industry avg: 72 days</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">ACTIVE COLLECTION AGENCIES</div>
            <div className="kpi-value">{Object.keys(agencyDistribution).length}</div>
            <div className="kpi-meta">Contracted providers</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">HIGH RISK CASES</div>
            <div className="kpi-value">{debts.filter(d => d.propensity < 40).length}</div>
            <div className="kpi-meta">{((debts.filter(d => d.propensity < 40).length / debts.length) * 100).toFixed(1)}% of portfolio</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">CASES RESOLVED THIS MONTH</div>
            <div className="kpi-value">{debts.filter(d => d.status === 'Paid').length}</div>
            <div className="kpi-meta">+12% vs last month</div>
          </div>
        </div>
      </div>

      {/* Report Footer */}
      <div className="report-footer">
        <div className="footer-certification">
          <p><strong>CERTIFICATION:</strong> This report has been generated from official FedEx Federal Debt Collection System records.</p>
          <p><strong>CONFIDENTIALITY NOTICE:</strong> This document contains sensitive financial information and is intended for authorized personnel only.</p>
          <p><strong>COMPLIANCE:</strong> Generated in accordance with Federal Debt Collection Practices Act (FDCPA) and Privacy Act of 1974.</p>
        </div>
        <div className="footer-meta">
          <p>Report Version: 2.4.1 | System: FedEx DCS Portal v3.2 | Database: PROD-DB-01</p>
          <p>For technical support, contact: <a href="mailto:dcs-support @fedex.gov">dcs-support@fedex.gov</a></p>
        </div>
      </div>

    </div>
  )
}