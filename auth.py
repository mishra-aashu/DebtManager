import bcrypt
import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=dotenv_path)

JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'fedex_secret_key_2024')
JWT_EXPIRY = int(os.getenv('JWT_EXPIRY_HOURS', 24))
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

class AuthService:
    """Handle all authentication operations"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        try:
            return bcrypt.checkpw(
                password.encode('utf-8'), 
                password_hash.encode('utf-8')
            )
        except Exception as e:
            print(f"Password verification error: {e}")
            return False
    
    @staticmethod
    def generate_token(user_data: dict) -> str:
        """Generate JWT token"""
        payload = {
            'user_id': user_data['id'],
            'username': user_data['username'],
            'role': user_data['role'],
            'agency_name': user_data.get('agency_name'),
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRY),
            'iat': datetime.utcnow()
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)
        return token
    
    @staticmethod
    def verify_token(token: str) -> dict:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
            return {'valid': True, 'data': payload}
        except jwt.ExpiredSignatureError:
            return {'valid': False, 'error': 'Token expired'}
        except jwt.InvalidTokenError:
            return {'valid': False, 'error': 'Invalid token'}

auth_service = AuthService()

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

def get_current_user(token: str = Depends(oauth2_scheme)):
    result = auth_service.verify_token(token)
    if not result['valid']:
        raise credentials_exception
    return result['data']

def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Admin access required"
        )
    return current_user
