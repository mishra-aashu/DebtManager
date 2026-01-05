from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import io
from ml_model import DebtCollectionML
from supabase_client import DebtDatabase
from auth import AuthService
from datetime import datetime
import os

app = Flask(__name__)

# CORS configuration - add production URLs when deploying
cors_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    # Add your GitHub Pages URL here, e.g., "https://yourusername.github.io"
    # Add your backend hosting URL if needed
]

CORS(app, resources={
    r"/api/*": {
        "origins": cors_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize
ml_engine = DebtCollectionML()
db = DebtDatabase()
auth = AuthService()

# ============================================
# AUTHENTICATION ENDPOINTS
# ============================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register new user"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['username', 'password', 'email', 'full_name', 'role']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if username exists
        existing_user = db.get_user_by_username(data['username'])
        if existing_user:
            return jsonify({'error': 'Username already exists'}), 409
        
        # Check if email exists
        existing_email = db.get_user_by_email(data['email'])
        if existing_email:
            return jsonify({'error': 'Email already registered'}), 409
        
        # Validate role
        if data['role'] not in ['admin', 'agency']:
            return jsonify({'error': 'Invalid role. Must be admin or agency'}), 400
        
        # Agency users must have agency_name
        if data['role'] == 'agency' and not data.get('agency_name'):
            return jsonify({'error': 'Agency users must provide agency_name'}), 400
        
        # Hash password
        password_hash = auth.hash_password(data['password'])
        
        # Create user
        user = db.create_user(
            username=data['username'],
            email=data['email'],
            password_hash=password_hash,
            full_name=data['full_name'],
            role=data['role'],
            agency_name=data.get('agency_name')
        )
        
        print(f"✅ New user registered: {user['username']} ({user['role']})")
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role'],
                'agency_name': user.get('agency_name')
            }
        }), 201
    
    except Exception as e:
        print(f"❌ Registration error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user and return JWT token"""
    try:
        data = request.json
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password required'}), 400
        
        # Get client IP
        ip_address = request.remote_addr
        
        # Get user from database
        user = db.get_user_by_username(data['username'])
        
        if not user:
            # Log failed attempt
            db.log_login_attempt(data['username'], ip_address, False)
            return jsonify({'error': 'Invalid username or password'}), 401
        
        # Check if user is active
        if not user.get('is_active', True):
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Verify password
        if not auth.verify_password(data['password'], user['password_hash']):
            # Log failed attempt
            db.log_login_attempt(data['username'], ip_address, False)
            return jsonify({'error': 'Invalid username or password'}), 401
        
        # Generate JWT token
        token = auth.generate_token(user)
        
        # Update last login
        db.update_last_login(user['id'])
        
        # Create session
        db.create_session(
            user['id'], 
            token, 
            ip_address, 
            request.headers.get('User-Agent', 'Unknown')
        )
        
        # Log successful attempt
        db.log_login_attempt(data['username'], ip_address, True)
        
        print(f"✅ User logged in: {user['username']} ({user['role']})")
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user.get('email'),
                'full_name': user.get('full_name'),
                'role': user['role'],
                'agency_name': user.get('agency_name')
            }
        }), 200
    
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/verify', methods=['GET'])
@auth.token_required
def verify_token():
    """Verify if token is still valid"""
    return jsonify({
        'success': True,
        'user': request.current_user
    }), 200

@app.route('/api/auth/users', methods=['GET'])
@auth.token_required
@auth.admin_required
def get_users():
    """Get all users (admin only)"""
    try:
        users = db.get_all_users()
        return jsonify({
            'success': True,
            'count': len(users),
            'users': users
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/users/<int:user_id>', methods=['DELETE'])
@auth.token_required
@auth.admin_required
def delete_user(user_id):
    """Delete user (admin only)"""
    try:
        db.delete_user(user_id)
        return jsonify({
            'success': True,
            'message': 'User deleted successfully'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================
# PROTECTED DEBT MANAGEMENT ENDPOINTS
# ============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint (public)"""
    return jsonify({
        'status': 'healthy',
        'model_version': ml_engine.model_version,
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/upload-csv', methods=['POST'])
@auth.token_required
@auth.admin_required
def upload_csv():
    """Upload CSV - Admin only"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400
        
        # Read and process CSV
        csv_content = file.read().decode('utf-8')
        df = pd.read_csv(io.StringIO(csv_content))
        
        required_cols = ['customerId', 'amount', 'daysOverdue', 'previousContacts']
        if not all(col in df.columns for col in required_cols):
            return jsonify({'error': f'Missing columns: {required_cols}'}), 400
        
        # Clean data
        df = df.dropna()
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
        df['daysOverdue'] = pd.to_numeric(df['daysOverdue'], errors='coerce')
        df['previousContacts'] = pd.to_numeric(df['previousContacts'], errors='coerce')
        df = df.dropna()
        
        print(f"🤖 Processing {len(df)} cases with ML...")
        
        # Run ML predictions
        predictions = ml_engine.batch_predict(df)
        
        # Prepare for Supabase
        supabase_records = []
        for pred in predictions:
            supabase_records.append({
                'customer_id': pred['customerId'],
                'amount': pred['amount'],
                'days_overdue': pred['daysOverdue'],
                'previous_contacts': pred['previousContacts'],
                'propensity_score': pred['propensity'],
                'assigned_agency': pred['assignedTo'],
                'status': pred['status'],
                'risk_category': pred['riskCategory'],
                'ml_confidence': pred['mlConfidence'],
                'priority': pred['priority'],
                'recommended_action': pred['recommendedAction'],
                'model_version': pred['modelVersion'],
                'created_at': datetime.utcnow().isoformat(),
                'last_updated': datetime.utcnow().isoformat()
            })
        
        # Store in Supabase
        db_result = db.bulk_insert_cases(supabase_records)
        
        print(f"✅ Uploaded by: {request.current_user['username']}")
        
        return jsonify({
            'success': True,
            'message': f'Processed {len(predictions)} cases',
            'cases_processed': len(predictions),
            'cases_stored': len(db_result),
            'predictions': predictions,
            'uploaded_by': request.current_user['username']
        }), 200
    
    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cases', methods=['GET'])
@auth.token_required
def get_all_cases():
    """Get cases (filtered by role)"""
    try:
        cases = db.get_all_cases()
        
        # Filter for agency users
        if request.current_user['role'] == 'agency':
            agency_name = request.current_user.get('agency_name')
            cases = [c for c in cases if c.get('assigned_agency') == agency_name]
        
        return jsonify({
            'success': True,
            'count': len(cases),
            'cases': cases
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cases/<int:case_id>/status', methods=['PUT'])
@auth.token_required
def update_case_status(case_id):
    """Update case status"""
    try:
        data = request.json
        new_status = data.get('status')
        
        result = db.update_case_status(case_id, new_status)
        
        print(f"✅ Status updated by: {request.current_user['username']}")
        
        return jsonify({
            'success': True,
            'updated': result
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("="*60)
    print("🚀 FedEx Debt Collection ML API Server")
    print("="*60)
    print(f"📊 Model Version: {ml_engine.model_version}")
    print(f"🗄️  Database: Supabase Connected")
    print(f"🔐 Auth: JWT with bcrypt password hashing")
    print(f"🌐 Server: http://localhost:5000")
    print("="*60)
    app.run(debug=True, port=5000)