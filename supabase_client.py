import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

# Initialize Supabase Client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

class DebtDatabase:
    """Handle all Supabase database operations"""
    
    @staticmethod
    def create_debt_case(debt_data):
        """Insert new debt case into Supabase"""
        try:
            result = supabase.table('debt_cases').insert({
                'customer_id': debt_data['customerId'],
                'amount': float(debt_data['amount']),
                'days_overdue': int(debt_data['daysOverdue']),
                'previous_contacts': int(debt_data['previousContacts']),
                'propensity_score': int(debt_data['propensity']),
                'assigned_agency': debt_data['assignedTo'],
                'status': debt_data['status'],
                'risk_category': debt_data['riskCategory'],
                'ml_confidence': float(debt_data['mlConfidence']),
                'created_at': datetime.utcnow().isoformat(),
                'last_updated': datetime.utcnow().isoformat()
            }).execute()
            return result.data
        except Exception as e:
            print(f"Error inserting debt case: {str(e)}")
            raise e
    
    @staticmethod
    def bulk_insert_cases(cases_list):
        """Bulk insert multiple debt cases"""
        try:
            result = supabase.table('debt_cases').insert(cases_list).execute()
            return result.data
        except Exception as e:
            print(f"Error bulk inserting: {str(e)}")
            raise e
    
    @staticmethod
    def get_all_cases():
        """Retrieve all debt cases"""
        try:
            result = supabase.table('debt_cases').select("*").execute()
            return result.data
        except Exception as e:
            print(f"Error fetching cases: {str(e)}")
            raise e
    
    @staticmethod
    def update_case_status(case_id, new_status):
        """Update status of a debt case"""
        try:
            result = supabase.table('debt_cases').update({
                'status': new_status,
                'last_updated': datetime.utcnow().isoformat()
            }).eq('id', case_id).execute()
            return result.data
        except Exception as e:
            print(f"Error updating status: {str(e)}")
            raise e
    
    @staticmethod
    def get_agency_performance():
        """Get aggregated agency performance metrics"""
        try:
            result = supabase.table('debt_cases').select("*").execute()
            return result.data
        except Exception as e:
            print(f"Error fetching agency performance: {str(e)}")
            raise e
    
    @staticmethod
    def log_ml_prediction(prediction_data):
        """Log ML model predictions for audit"""
        try:
            result = supabase.table('ml_predictions').insert({
                'customer_id': prediction_data['customerId'],
                'input_features': prediction_data['features'],
                'predicted_score': prediction_data['score'],
                'model_version': prediction_data['modelVersion'],
                'confidence': prediction_data['confidence'],
                'timestamp': datetime.utcnow().isoformat()
            }).execute()
            return result.data
        except Exception as e:
            print(f"Error logging prediction: {str(e)}")
            raise e

    @staticmethod
    def create_user(username, email, password_hash, full_name, role, agency_name=None):
        """Create new user in database"""
        try:
            result = supabase.table('users').insert({
                'username': username,
                'email': email,
                'password_hash': password_hash,
                'full_name': full_name,
                'role': role,
                'agency_name': agency_name,
                'is_active': True,
                'created_at': datetime.utcnow().isoformat()
            }).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error creating user: {str(e)}")
            raise e
    
    @staticmethod
    def get_user_by_username(username):
        """Retrieve user by username"""
        try:
            result = supabase.table('users').select("*").eq('username', username).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error fetching user: {str(e)}")
            return None
    
    @staticmethod
    def get_user_by_email(email):
        """Retrieve user by email"""
        try:
            result = supabase.table('users').select("*").eq('email', email).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error fetching user by email: {str(e)}")
            return None
    
    @staticmethod
    def update_last_login(user_id):
        """Update user's last login timestamp"""
        try:
            result = supabase.table('users').update({
                'last_login': datetime.utcnow().isoformat()
            }).eq('id', user_id).execute()
            return result.data
        except Exception as e:
            print(f"Error updating last login: {str(e)}")
            return None
    
    @staticmethod
    def log_login_attempt(username, ip_address, success):
        """Log login attempt for security"""
        try:
            supabase.table('login_attempts').insert({
                'username': username,
                'ip_address': ip_address,
                'success': success,
                'attempted_at': datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            print(f"Error logging login attempt: {str(e)}")
    
    @staticmethod
    def create_session(user_id, token, ip_address, user_agent, expiry_hours=24):
        """Create user session"""
        try:
            expiry = datetime.utcnow() + timedelta(hours=expiry_hours)
            
            result = supabase.table('user_sessions').insert({
                'user_id': user_id,
                'token': token,
                'ip_address': ip_address,
                'user_agent': user_agent,
                'expires_at': expiry.isoformat(),
                'created_at': datetime.utcnow().isoformat()
            }).execute()
            return result.data
        except Exception as e:
            print(f"Error creating session: {str(e)}")
            return None
    
    @staticmethod
    def get_all_users():
        """Get all users (admin only)"""
        try:
            result = supabase.table('users').select("id, username, email, full_name, role, agency_name, is_active, created_at, last_login").execute()
            return result.data
        except Exception as e:
            print(f"Error fetching users: {str(e)}")
            return []
    
    @staticmethod
    def delete_user(user_id):
        """Delete user (admin only)"""
        try:
            result = supabase.table('users').delete().eq('id', user_id).execute()
            return result.data
        except Exception as e:
            print(f"Error deleting user: {str(e)}")
            raise e

