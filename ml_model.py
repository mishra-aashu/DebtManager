import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import os

class DebtCollectionML:
    """Advanced ML Model for Debt Collection Propensity Scoring"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.model_version = "3.2.1"
        self.load_or_train_model()
    
    def load_or_train_model(self):
        """Load pre-trained model or train new one"""
        model_path = 'models/debt_model.pkl'
        scaler_path = 'models/scaler.pkl'
        
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            print("Loading pre-trained model...")
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
        else:
            print("Training new model...")
            self.train_model()
    
    def train_model(self):
        """Train model on synthetic historical data"""
        # Generate synthetic training data (50,000 historical cases)
        np.random.seed(42)
        n_samples = 50000
        
        # Features: amount, days_overdue, previous_contacts, customer_age_months
        X = np.column_stack([
            np.random.exponential(8000, n_samples),  # amount
            np.random.gamma(2, 20, n_samples),       # days_overdue
            np.random.poisson(3, n_samples),         # previous_contacts
            np.random.normal(180, 50, n_samples)     # customer_age_months
        ])
        
        # Target: propensity score (0-100)
        # Complex formula based on business rules
        y = (
            100 
            - (X[:, 0] / 1000)  # Higher amount = lower score
            - (X[:, 1] * 0.5)   # More days = lower score
            - (X[:, 2] * 5)     # More contacts = lower score
            + (X[:, 3] * 0.1)   # Longer relationship = higher score
            + np.random.normal(0, 10, n_samples)  # Noise
        )
        y = np.clip(y, 0, 100)  # Clamp to 0-100
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train Gradient Boosting Regressor
        self.model = GradientBoostingRegressor(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=5,
            random_state=42,
            subsample=0.8
        )
        self.model.fit(X_scaled, y)
        
        # Save model
        os.makedirs('models', exist_ok=True)
        joblib.dump(self.model, 'models/debt_model.pkl')
        joblib.dump(self.scaler, 'models/scaler.pkl')
        
        print(f"Model trained! R² Score: {self.model.score(X_scaled, y):.3f}")
    
    def predict_propensity(self, amount, days_overdue, previous_contacts, customer_age_months=180):
        """Predict propensity score for a single case"""
        # Prepare features
        features = np.array([[amount, days_overdue, previous_contacts, customer_age_months]])
        features_scaled = self.scaler.transform(features)
        
        # Predict
        score = self.model.predict(features_scaled)[0]
        score = np.clip(score, 0, 100)  # Ensure 0-100 range
        
        # Calculate confidence (based on prediction variance)
        confidence = min(95, max(65, 100 - (days_overdue * 0.2) - (previous_contacts * 3)))
        
        return {
            'score': round(float(score), 2),
            'confidence': round(float(confidence), 2),
            'model_version': self.model_version
        }
    
    def assign_agency(self, propensity_score):
        """Assign to appropriate agency based on ML score"""
        if propensity_score >= 70:
            return {
                'agency': 'Digital Bot',
                'reason': 'High propensity - automated collection suitable',
                'priority': 'Low',
                'recommended_action': 'Send automated SMS/Email reminder'
            }
        elif propensity_score >= 40:
            return {
                'agency': 'Quick Collections',
                'reason': 'Medium propensity - standard agent needed',
                'priority': 'Medium',
                'recommended_action': 'Assign to junior collection agent'
            }
        else:
            return {
                'agency': 'Shark Recovery',
                'reason': 'Low propensity - expert negotiation required',
                'priority': 'High',
                'recommended_action': 'Escalate to senior specialist'
            }
    
    def get_risk_category(self, propensity_score):
        """Categorize risk level"""
        if propensity_score >= 80:
            return 'Minimal Risk'
        elif propensity_score >= 60:
            return 'Low Risk'
        elif propensity_score >= 40:
            return 'Medium Risk'
        elif propensity_score >= 20:
            return 'High Risk'
        else:
            return 'Critical Risk'
    
    def batch_predict(self, cases_df):
        """Process multiple cases at once"""
        predictions = []
        
        for _, case in cases_df.iterrows():
            # Get ML prediction
            pred = self.predict_propensity(
                case['amount'],
                case['daysOverdue'],
                case['previousContacts']
            )
            
            # Get agency assignment
            assignment = self.assign_agency(pred['score'])
            
            # Compile results
            predictions.append({
                'customerId': case['customerId'],
                'amount': float(case['amount']),
                'daysOverdue': int(case['daysOverdue']),
                'previousContacts': int(case['previousContacts']),
                'propensity': int(pred['score']),
                'mlConfidence': pred['confidence'],
                'assignedTo': assignment['agency'],
                'priority': assignment['priority'],
                'recommendedAction': assignment['recommended_action'],
                'riskCategory': self.get_risk_category(pred['score']),
                'status': 'Pending',
                'modelVersion': self.model_version
            })
        
        return predictions
