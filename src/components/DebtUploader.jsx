import { useState } from 'react';
import { processCSVData } from '../utils/mlEngine';
import { FaUpload, FaDownload, FaFileCsv, FaPaperclip, FaClipboardList } from 'react-icons/fa';

export default function DebtUploader({ updateDebts, existingDebts }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const rows = text.split('\n').map(row => row.split(','));
        setPreview(rows.slice(0, 6));
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const processedDebts = processCSVData(text, existingDebts.length);
      updateDebts([...existingDebts, ...processedDebts]);
      alert(`File processed. ${processedDebts.length} new collection files have been added to the system.`);
      setFile(null);
      setPreview([]);
    };
    reader.readAsText(file);
  };

  const downloadSample = () => {
    const csv = `customerId,amount,daysOverdue,previousContacts
CUST001,5000,30,2
CUST002,15000,90,5
`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_receivables_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="uploader-container">
      <div className="uploader-box">
        <h2><FaUpload /> Submit Collection File Documentation</h2>
        <p>Upload a CSV file containing outstanding receivables information. The system will automatically validate, score, and assign the files.</p>

        <div className="upload-actions">
          <button onClick={downloadSample} className="btn-secondary">
            <FaDownload /> Download Template (CSV)
          </button>
        </div>

        <div className="file-input-wrapper">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="file-label">
            {file ? <span><FaFileCsv /> {file.name}</span> : <span><FaPaperclip /> Select File for Upload</span>}
          </label>
        </div>

        {preview.length > 0 && (
          <div className="preview-section">
            <h3>File Preview (First 5 records)</h3>
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

            <button onClick={handleUpload} className="btn-primary">
              Process and Validate File
            </button>
          </div>
        )}

        <div className="upload-info">
          <h4><FaClipboardList /> Required File Format</h4>
          <ul>
            <li><strong>customerId</strong> - Unique Customer Identifier</li>
            <li><strong>amount</strong> - Receivable Amount (USD)</li>
            <li><strong>daysOverdue</strong> - Number of Days Overdue</li>
            <li><strong>previousContacts</strong> - Count of Previous Contact Attempts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
