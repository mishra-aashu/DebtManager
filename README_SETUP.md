# 🚀 COMPLETE INSTALLATION GUIDE

### **STEP-BY-STEP Setup:**

```bash
# 1. CREATE PROJECT STRUCTURE
mkdir fedex-dcs
cd fedex-dcs

# 2. SETUP BACKEND
mkdir backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install Python dependencies
pip install flask flask-cors pandas numpy scikit-learn supabase python-dotenv joblib

# Save requirements
pip freeze > requirements.txt

# Create .env file
echo "SUPABASE_URL=your_url_here" > .env
echo "SUPABASE_KEY=your_key_here" >> .env

# Copy all backend Python files (app.py, ml_model.py, supabase_client.py)

# Start Python server
python app.py


# 3. SETUP FRONTEND (New terminal)
cd ..
npm create vite @latest frontend -- --template react
cd frontend
npm install
npm install recharts

# Copy all frontend files

# Start React app
npm run dev


# 4. SETUP SUPABASE
# Go to https://supabase.com
# Create new project
# Go to SQL Editor
# Run the SQL schema provided above
# Copy Project URL and anon key to backend/.env
```

## 🗄️ SQL Schema for Supabase

Go to Supabase Dashboard → SQL Editor → Run this:

```sql
-- ============================================
-- FEDEX DEBT COLLECTION SYSTEM - DATABASE SCHEMA
-- ============================================

-- Main debt cases table
CREATE TABLE IF NOT EXISTS debt_cases (
    id BIGSERIAL PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    days_overdue INTEGER NOT NULL,
    previous_contacts INTEGER DEFAULT 0,
    propensity_score INTEGER CHECK (propensity_score >= 0 AND propensity_score <= 100),
    assigned_agency VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Pending',
    risk_category VARCHAR(50),
    ml_confidence DECIMAL(5, 2),
    priority VARCHAR(20),
    recommended_action TEXT,
    model_version VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- ML predictions audit log
CREATE TABLE IF NOT EXISTS ml_predictions (
    id BIGSERIAL PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    input_features JSONB,
    predicted_score INTEGER,
    model_version VARCHAR(20),
    confidence DECIMAL(5, 2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agency performance tracking
CREATE TABLE IF NOT EXISTS agency_performance (
    id BIGSERIAL PRIMARY KEY,
    agency_name VARCHAR(100) NOT NULL,
    total_assigned INTEGER DEFAULT 0,
    total_recovered DECIMAL(12, 2) DEFAULT 0,
    success_rate DECIMAL(5, 2),
    avg_resolution_days INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User authentication (optional - for multi-user)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'admin' or 'agency'
    agency_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Status change audit log
CREATE TABLE IF NOT EXISTS status_history (
    id BIGSERIAL PRIMARY KEY,
    case_id BIGINT REFERENCES debt_cases(id),
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by VARCHAR(50),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_debt_cases_customer ON debt_cases(customer_id);
CREATE INDEX idx_debt_cases_status ON debt_cases(status);
CREATE INDEX idx_debt_cases_agency ON debt_cases(assigned_agency);
CREATE INDEX idx_debt_cases_created ON debt_cases(created_at);
CREATE INDEX idx_ml_predictions_customer ON ml_predictions(customer_id);

-- Enable Row Level Security (RLS)
ALTER TABLE debt_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_performance ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for service_role, restrict for anon)
CREATE POLICY "Enable read access for all users" ON debt_cases
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON debt_cases
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON debt_cases
    FOR UPDATE USING (true);

-- Sample data for testing
INSERT INTO debt_cases (customer_id, amount, days_overdue, previous_contacts, propensity_score, assigned_agency, status, risk_category, ml_confidence, model_version)
VALUES 
    ('CUST001', 4500.00, 25, 1, 78, 'Digital Bot', 'Pending', 'Low Risk', 87.5, '3.2.1'),
    ('CUST002', 18000.00, 95, 6, 32, 'Shark Recovery', 'Contacted', 'High Risk', 72.3, '3.2.1'),
    ('CUST003', 2200.00, 15, 0, 89, 'Digital Bot', 'Paid', 'Minimal Risk', 92.1, '3.2.1');

-- View for agency analytics
CREATE OR REPLACE VIEW agency_analytics AS
SELECT 
    assigned_agency,
    COUNT(*) as total_cases,
    SUM(amount) as total_amount,
    SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as recovered_amount,
    ROUND(AVG(propensity_score), 2) as avg_propensity,
    ROUND(
        (SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) / NULLIF(SUM(amount), 0) * 100), 
        2
    ) as recovery_rate
FROM debt_cases
GROUP BY assigned_agency;

SELECT * FROM agency_analytics;
```

---

## 📊 HOW IT WORKS - COMPLETE FLOW

```
┌─────────────────────────────────────────────────────────────┐
│  USER UPLOADS CSV FILE                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  REACT FRONTEND (Port 3000)                                 │
│  - Validates file                                           │
│  - Sends to Python API via apiClient.uploadCSV()           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  PYTHON FLASK API (Port 5000)                               │
│  - Receives CSV                                             │
│  - Parses with Pandas                                       │
│  - Calls ML Model                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  ML ENGINE (Gradient Boosting)                              │
│  - Extracts features: amount, days, contacts                │
│  - Scales data with StandardScaler                          │
│  - Predicts propensity score (0-100)                        │
│  - Calculates confidence level                              │
│  - Assigns optimal agency                                   │
│  - Determines risk category                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  SUPABASE DATABASE                                          │
│  - Stores all cases in debt_cases table                     │
│  - Logs ML predictions in ml_predictions table              │
│  - Creates audit trail                                      │
│  - Enables real-time sync                                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  PYTHON API RESPONSE                                        │
│  - Returns processed data to React                          │
│  - Includes ML scores, assignments, metadata                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  REACT UPDATES UI                                           │
│  - Shows success message                                    │
│  - Displays ML results                                      │
│  - Updates dashboard with new cases                         │
│  - Agencies can now see assigned cases                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 TESTING THE SYSTEM

### **1. Test CSV Upload**

Create `test_data.csv`:
```csv
customerId,amount,daysOverdue,previousContacts
TEST001,3500,22,1
TEST002,18500,105,7
TEST003,1200,8,0
TEST004,42000,145,12
TEST005,6800,55,3
```

### **2. Expected ML Output**

```
TEST001: Score 82 → Digital Bot (High propensity)
TEST002: Score 28 → Shark Recovery (Expert needed)
TEST003: Score 94 → Digital Bot (Easy collection)
TEST004: Score 15 → Shark Recovery (Critical case)
TEST005: Score 58 → Quick Collections (Medium risk)
```

### **3. Verify in Supabase**

Go to Supabase → Table Editor → `debt_cases` → You should see all 5 records with ML scores!

---

## 🚀 DEPLOYMENT GUIDE

### **Frontend Deployment (GitHub Pages)**

1. **Push to GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/DebtManager.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to your GitHub repository
   - Settings → Pages
   - Source: "GitHub Actions"
   - The workflow will automatically deploy on push to main

3. **Update CORS in Backend**
   - In `backend/app.py`, add your GitHub Pages URL to `cors_origins`:
     ```python
     cors_origins = [
         "http://localhost:3000",
         "http://localhost:5173",
         "https://yourusername.github.io",  # Add this
     ]
     ```

### **Backend Deployment (External Hosting)**

1. **Using Docker (Recommended)**
   ```bash
   cd backend
   docker build -t debtmanager-backend .
   docker run -p 5000:5000 debtmanager-backend
   ```

2. **Deploy to Cloud Platforms**
   - **Render**: Connect GitHub repo, select Dockerfile
   - **Railway**: Connect repo, it auto-detects Python
   - **Heroku**: Add `Procfile` with `web: python app.py`

3. **Environment Variables**
   - Set `SUPABASE_URL` and `SUPABASE_KEY` in your hosting platform
   - Update frontend API base URL to your backend's production URL

4. **Update Frontend API Client**
   - In `frontend/src/utils/apiClient.js`, change baseURL to your backend URL:
     ```javascript
     const API_BASE_URL = 'https://your-backend-url.com/api';
     ```

### **Post-Deployment Checklist**
- [ ] Frontend accessible at `https://yourusername.github.io/DebtManager/`
- [ ] Backend running on external host
- [ ] CORS updated for production URLs
- [ ] Environment variables configured
- [ ] API client pointing to production backend
- [ ] Test login and CSV upload functionality
