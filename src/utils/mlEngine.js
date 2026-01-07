// Smart ML-based Propensity Scoring Engine
export function calculatePropensity(debt) {
  let score = 50 // Base score

  // Amount factor (smaller debts more likely to be paid)
  if (debt.amount < 5000) score += 25
  else if (debt.amount < 15000) score += 10
  else score -= 15

  // Days overdue factor
  if (debt.daysOverdue < 30) score += 20
  else if (debt.daysOverdue < 60) score += 5
  else if (debt.daysOverdue > 90) score -= 20

  // Previous contacts (more contacts = lower propensity)
  score -= debt.previousContacts * 3

  // Normalize to 0-100
  return Math.max(0, Math.min(100, score))
}

export function assignAgency(propensityScore) {
  if (propensityScore >= 70) {
    return 'Digital Bot' // High chance - automated
  } else if (propensityScore >= 40) {
    return 'Quick Collections' // Medium chance - junior agents
  } else {
    return 'Shark Recovery' // Low chance - experts
  }
}

export function processCSVData(csvText, startId) {
  const lines = csvText.trim().split('\n')

  return lines.slice(1).map((line, index) => {
    const values = line.split(',').map(v => v.trim())
    const debt = {
      id: startId + index + 1,
      customerId: values[0],
      amount: parseFloat(values[1]),
      daysOverdue: parseInt(values[2]),
      previousContacts: parseInt(values[3]),
      status: 'Pending',
      lastUpdated: new Date().toISOString()
    }
    
    debt.propensity = calculatePropensity(debt)
    debt.assignedTo = assignAgency(debt.propensity)
    
    return debt
  })
}

export function initializeData() {
  const sampleData = [
    { customerId: 'CUST001', amount: 4500, daysOverdue: 25, previousContacts: 1 },
    { customerId: 'CUST002', amount: 18000, daysOverdue: 95, previousContacts: 6 },
    { customerId: 'CUST003', amount: 2200, daysOverdue: 15, previousContacts: 0 },
    { customerId: 'CUST004', amount: 32000, daysOverdue: 135, previousContacts: 10 },
    { customerId: 'CUST005', amount: 3800, daysOverdue: 45, previousContacts: 2 },
    { customerId: 'CUST006', amount: 7500, daysOverdue: 60, previousContacts: 3 },
    { customerId: 'CUST007', amount: 1500, daysOverdue: 20, previousContacts: 1 },
    { customerId: 'CUST008', amount: 22000, daysOverdue: 110, previousContacts: 7 },
    { customerId: 'CUST009', amount: 5200, daysOverdue: 35, previousContacts: 2 },
    { customerId: 'CUST010', amount: 9800, daysOverdue: 70, previousContacts: 4 },
  ]

  return sampleData.map((data, index) => {
    const debt = {
      id: index + 1,
      ...data,
      status: Math.random() > 0.7 ? 'Paid' : 'Pending',
      lastUpdated: new Date().toISOString()
    }
    debt.propensity = calculatePropensity(debt)
    debt.assignedTo = assignAgency(debt.propensity)
    return debt
  })
}
