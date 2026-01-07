import { useState } from 'react';
import { apiClient } from '../utils/apiClient';
import './DebtUploader.css';

export default function DebtUploader() {
  const [file, setFile] = useState(null);
  const [sqlPreview, setSqlPreview] = useState("");
  const [tableName, setTableName] = useState("");
  const [status, setStatus] = useState("idle"); // 'idle', 'schema_generated', 'table_created', 'embedding', 'processing', 'done'
  const [error, setError] = useState("");
  const [message, setMessage] = useState("Step 1: Upload a CSV file to begin.");

  const onFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setStatus("loading_schema");
    setError("");
    setMessage("Generating SQL schema from CSV...");

    try {
      const res = await apiClient.generateSchema(selectedFile);
      setSqlPreview(res.sql_code);
      setTableName(res.table_name);
      setStatus("schema_generated");
      setMessage(`Step 2: Review the generated SQL for table "${res.table_name}" and execute it.`);
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  const handleCreateSchema = async () => {
    setStatus("creating_table");
    setError("");
    setMessage("Executing SQL to create the table in Supabase...");

    try {
      await apiClient.executeSql(sqlPreview);
      setStatus("table_created");
      setMessage(`Step 3: Table "${tableName}" created. You can now embed the data.`);
    } catch (err) {
      setError(err.message);
      setStatus("schema_generated"); // Revert to previous step on error
    }
  };

  const handleEmbedding = async () => {
    setStatus("embedding");
    setError("");
    setMessage(`Embedding data from ${file.name} into "${tableName}"...`);
    
    try {
      const res = await apiClient.embedData(file, tableName);
      setMessage(`Embedding complete! ${res.rows_inserted} rows inserted. Now starting ML processing...`);
      await handleMLProcessing();
    } catch (err) {
      setError(err.message);
      setStatus("table_created");
    }
  };

  const handleMLProcessing = async () => {
    setStatus("processing");
    setError("");
    setMessage(`Running allocation logic on table "${tableName}"...`);
    
    try {
      const res = await apiClient.runAllocationLogic(tableName);
      setStatus("done");
      setMessage(res.message);
    } catch (err) {
      setError(err.message);
      setStatus("table_created"); // Allow retrying the processing step
    }
  };
  
  const handleReset = () => {
    setFile(null);
    setSqlPreview("");
    setTableName("");
    setStatus("idle");
    setError("");
    setMessage("Step 1: Upload a CSV file to begin.");
  };

  return (
    <div className="uploader-workflow">
      <h2>Data Ingestion & Processing Workflow</h2>
      <p className="workflow-status">{message}</p>
      {error && <p className="error-message">{error}</p>}

      {/* Step 1: File Upload */}
      <div className={`workflow-step ${status !== 'idle' ? 'step-completed' : ''}`}>
        <h3>Step 1: Upload CSV</h3>
        <input 
          type="file" 
          accept=".csv"
          onChange={onFileChange} 
          disabled={status !== 'idle'} 
        />
      </div>

      {/* Step 2: Schema Preview & Execution */}
      {status.startsWith('schema_generated') || status.startsWith('table_created') || status.startsWith('embedding') || status.startsWith('processing') || status.startsWith('done') ? (
        <div className={`workflow-step ${status !== 'schema_generated' ? 'step-completed' : ''}`}>
          <h3>Step 2: Create Table</h3>
          <textarea readOnly value={sqlPreview} />
          <button onClick={handleCreateSchema} disabled={status !== 'schema_generated'}>
            {status === 'creating_table' ? "Executing..." : "Run SQL to Create Table"}
          </button>
        </div>
      ) : null}

      {/* Step 3: Embed Data */}
      {status.startsWith('table_created') || status.startsWith('embedding') || status.startsWith('processing') || status.startsWith('done') ? (
        <div className={`workflow-step ${status !== 'table_created' ? 'step-completed' : ''}`}>
          <h3>Step 3: Embed Data</h3>
          <button onClick={handleEmbedding} disabled={status !== 'table_created'}>
            {status === 'embedding' ? "Embedding..." : "Start Embedding"}
          </button>
        </div>
      ) : null}

      {/* Step 4 & 5: Processing and Done */}
      {status === 'processing' || status === 'done' ? (
        <div className="workflow-step step-completed">
          <h3>Step 4: ML Allocation</h3>
          <p>{status === 'processing' ? 'Processing is underway...' : 'Allocation Done!'}</p>
        </div>
      ) : null}
      
      {status === 'done' && (
        <div className="workflow-step">
          <h3>Workflow Complete</h3>
          <button onClick={handleReset} className="btn-secondary">Start New Workflow</button>
        </div>
      )}
    </div>
  );
}
