import { useState } from 'react'
import { apiClient } from '../utils/apiClient'

export default function DebtUploader({ updateDebts, existingDebts }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [uploading, setUploading] = useState(false)
  const [mlResults, setMlResults] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    setMlResults(null)
    
    if (selectedFile) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target.result
        const rows = text.split('\n').map(row => row.split(','))
        setPreview(rows.slice(0, 6))
      }
      reader.readAsText(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    
    try {
      console.log('🚀 Uploading to Python ML Backend...')
      
      // Call Python API
      const result = await apiClient.uploadCSV(file)
      
      console.log('✅ ML Processing Complete:', result)
      
      setMlResults(result)
      
      // Update local state with new data
      const newDebts = result.predictions.map((pred, idx) => ({
        id: existingDebts.length + idx + 1,
        ...pred,
        lastUpdated: new Date().toISOString()
      }))
      
      updateDebts([...existingDebts, ...newDebts])
      
      alert(`
✅ SUCCESS! 

📊 ML Processing Complete
━━━━━━━━━━━━━━━━━━━━━━
✓ Cases Processed: ${result.cases_processed}
✓ Stored in Supabase: ${result.cases_stored}
✓ Model Version: ${result.model_version}

🤖 AI Assignment:
${result.predictions.map(p => `
   ${p.customerId}: Score ${p.propensity} → ${p.assignedTo}
`).join('')}
      `)
      
      setFile(null)
      setPreview([])
      
    } catch (error) {
      console.error('❌ Upload Error:', error)
      alert(`Upload Failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const downloadSample = () => {
    const csv = `customerId,amount,daysOverdue,previousContacts
CUST001,5000,30,2
CUST002,15000,90,5
CUST003,2000,15,1
CUST004,25000,120,8
CUST005,3500,45,3`
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_debt_data.csv'
    a.click()
  }

  return (
    <div className="uploader-container">
      <div className="uploader-box">
        <h2>📤 UPLOAD DEBT DATA - AI PROCESSING</h2>
        <p>Upload CSV file for automatic ML scoring and Supabase storage</p>
        
        <div className="upload-actions">
          <button onClick={downloadSample} className="btn-secondary">
            📥 DOWNLOAD SAMPLE CSV
          </button>
        </div>

        <div className="file-input-wrapper">
          <input 
            type="file" 
            accept=".csv"
            onChange={handleFileChange}
            id="csv-upload"
            disabled={uploading}
          />
          <label htmlFor="csv-upload" className="file-label">
            {file ? `📄 ${file.name}` : '📎 CHOOSE CSV FILE'}
          </label>
        </div>

        {preview.length > 0 && (
          <div className="preview-section">
            <h3>PREVIEW (First 5 rows)</h3>
            <div className="preview-table">
              <table>
                <thead>
                  <tr>
                    {preview[0].map((header, i) => <th key={i}>{header}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(1).map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => <td key={j}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button 
              onClick={handleUpload} 
              className="btn-primary"
              disabled={uploading}
            >
              {uploading ? '🔄 PROCESSING WITH ML...' : '🚀 PROCESS WITH PYTHON ML & UPLOAD'}
            </button>
          </div>
        )}

        {mlResults && (
          <div className="ml-results">
            <h3>🤖 ML PROCESSING RESULTS</h3>
            <div className="result-stats">
              <div className="stat">
                <span>Cases Processed:</span>
                <strong>{mlResults.cases_processed}</strong>
              </div>
              <div className="stat">
                <span>Stored in Supabase:</span>
                <strong>{mlResults.cases_stored}</strong>
              </div>
              <div className="stat">
                <span>Model Version:</span>
                <strong>{mlResults.model_version}</strong>
              </div>
            </div>
            
            <h4>AI Assignment Details:</h4>
            <div className="predictions-list">
              {mlResults.predictions.slice(0, 5).map((pred, idx) => (
                <div key={idx} className="prediction-item">
                  <strong>{pred.customerId}</strong>
                  <span>Score: {pred.propensity}/100</span>
                  <span>Agency: {pred.assignedTo}</span>
                  <span>Risk: {pred.riskCategory}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="upload-info">
          <h4>📋 SYSTEM WORKFLOW:</h4>
          <ol>
            <li>Upload CSV file</li>
            <li><strong>Python ML Model</strong> analyzes each case</li>
            <li>Propensity scoring (0-100) using Gradient Boosting</li>
            <li>Auto-assignment to optimal agency</li>
            <li><strong>Automatic storage in Supabase database</strong></li>
            <li>Real-time sync with frontend</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
