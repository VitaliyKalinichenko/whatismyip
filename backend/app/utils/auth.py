import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import secrets
from app.models.blog_models import AdminUser, TokenData, UserRole

# JWT Configuration with secure secret key generation
def generate_secure_jwt_secret() -> str:
    """Generate a secure JWT secret key if not provided."""
    return secrets.token_urlsafe(64)

# 🔒 SECURITY FIX - Enhanced JWT secret management
def get_jwt_secret() -> str:
    """Get JWT secret with proper validation and fallback."""
    secret = os.getenv("JWT_SECRET_KEY")
    
    # Check for weak default secrets
    weak_secrets = [
        "your-super-secret-key-change-in-production",
        "change-me-in-production",
        "default-secret-key",
        "secret",
        "key"
    ]
    
    if not secret or secret in weak_secrets:
        # Generate secure secret and log warning
        secret = generate_secure_jwt_secret()
        print("🔒 SECURITY WARNING: Using generated JWT secret!")
        print("🔒 Set JWT_SECRET_KEY environment variable for production!")
        print("🔒 Generated secret length:", len(secret))
        
        # In production, this should fail
        if os.getenv("ENVIRONMENT") == "production":
            raise RuntimeError("JWT_SECRET_KEY must be set in production environment!")
    
    # Validate secret strength
    if len(secret) < 32:
        raise ValueError("JWT_SECRET_KEY must be at least 32 characters long")
    
    return secret

# Use secure secret management
SECRET_KEY = get_jwt_secret()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Security instance
security = HTTPBearer()

# In-memory admin users storage (replace with database in production)
ADMIN_USERS: Dict[str, Dict[str, Any]] = {}

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> TokenData:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        exp: int = payload.get("exp")
        
        if user_id is None or email is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return TokenData(user_id=user_id, email=email, role=role, exp=exp)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> AdminUser:
    """Get the current authenticated user."""
    token_data = verify_token(credentials.credentials)
    user = get_user_by_id(token_data.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def get_user_by_id(user_id: str) -> Optional[AdminUser]:
    """Get user by ID."""
    user_data = ADMIN_USERS.get(user_id)
    if not user_data:
        return None
    
    return AdminUser(
        id=user_data["id"],
        email=user_data["email"],
        full_name=user_data["full_name"],
        role=UserRole(user_data["role"]),
        is_active=user_data["is_active"],
        created_at=user_data["created_at"],
        last_login=user_data["last_login"]
    )

def get_current_admin_user(current_user: AdminUser = Depends(get_current_user)) -> AdminUser:
    """Get current admin user with admin role verification."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def create_admin_user(email: str, password: str, full_name: str, role: UserRole = UserRole.ADMIN) -> AdminUser:
    """Create a new admin user."""
    if get_user_by_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user_id = secrets.token_urlsafe(32)
    hashed_password = hash_password(password)
    
    user_data = {
        "id": user_id,
        "email": email,
        "full_name": full_name,
        "role": role.value,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "last_login": None,
        "password_hash": hashed_password
    }
    
    ADMIN_USERS[user_id] = user_data
    
    return AdminUser(
        id=user_id,
        email=email,
        full_name=full_name,
        role=role,
        is_active=True,
        created_at=user_data["created_at"],
        last_login=None
    )

def get_user_by_email(email: str) -> Optional[AdminUser]:
    """Get user by email."""
    for user_data in ADMIN_USERS.values():
        if user_data["email"] == email:
            return AdminUser(
                id=user_data["id"],
                email=user_data["email"],
                full_name=user_data["full_name"],
                role=UserRole(user_data["role"]),
                is_active=user_data["is_active"],
                created_at=user_data["created_at"],
                last_login=user_data["last_login"]
            )
    return None

def authenticate_user(email: str, password: str) -> Optional[AdminUser]:
    """Authenticate a user with email and password."""
    # 🔒 SECURITY: Add basic input validation
    if not email or not password:
        return None
    
    # 🔒 SECURITY: Normalize email to prevent case-sensitivity issues
    email = email.lower().strip()
    
    user_data = None
    for uid, data in ADMIN_USERS.items():
        if data["email"].lower() == email:
            user_data = data
            break
    
    if not user_data:
        return None
    
    # 🔒 SECURITY: Check if account is active
    if not user_data["is_active"]:
        return None
    
    if not verify_password(password, user_data["password_hash"]):
        return None
    
    # Update last login
    user_data["last_login"] = datetime.utcnow()
    
    return AdminUser(
        id=user_data["id"],
        email=user_data["email"],
        full_name=user_data["full_name"],
        role=UserRole(user_data["role"]),
        is_active=user_data["is_active"],
        created_at=user_data["created_at"],
        last_login=user_data["last_login"]
    )

def change_admin_password(email: str, new_password: str) -> bool:
    """Change admin password by email."""
    try:
        user_data = None
        for uid, data in ADMIN_USERS.items():
            if data["email"] == email:
                user_data = data
                break
        
        if not user_data:
            return False
        
        # Hash new password
        new_password_hash = hash_password(new_password)
        
        # Update password
        user_data["password_hash"] = new_password_hash
        user_data["updated_at"] = datetime.utcnow()
        
        return True
        
    except Exception as e:
        print(f"Failed to change password for {email}: {e}")
        return False

def init_default_admin():
    """Initialize default admin user if none exists."""
    if not ADMIN_USERS:
        try:
            # 🔒 SECURITY: Use hardcoded credentials as requested
            # These credentials are hidden from logs for security
            default_email = "veremij@ukr.net"
            default_password = "Qwerty!67890"
            
            # Check if environment variables are set (for production override)
            env_email = os.getenv("ADMIN_EMAIL")
            env_password = os.getenv("ADMIN_PASSWORD")
            
            # Use environment variables if provided (for production)
            if env_email and env_password:
                default_email = env_email
                default_password = env_password
                print("🔐 Using environment variable admin credentials")
            else:
                print("🔐 Using hardcoded admin credentials")
            
            admin_user = create_admin_user(
                email=default_email,
                password=default_password,
                full_name="System Administrator",
                role=UserRole.ADMIN
            )
            
            # 🔒 SECURITY: Hide credentials from logs
            print("🔐 Default admin created:")
            print(f"   Email: {default_email}")
            print(f"   Password: ************ (hidden for security)")
            print(f"   ⚠️  WARNING: Change these credentials in production!")
            print(f"   🔒 Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables!")
            
        except Exception as e:
            print(f"❌ Failed to create default admin: {e}")

# Security utilities for production
def generate_secret_key() -> str:
    """Generate a secure secret key for JWT tokens."""
    return secrets.token_urlsafe(32)

def is_development() -> bool:
    """Check if running in development mode."""
    return os.getenv("ENVIRONMENT", "development") == "development"

def get_admin_security_status() -> dict:
    """Get admin system security status for monitoring."""
    admin_count = len(ADMIN_USERS)
    active_admins = sum(1 for user in ADMIN_USERS.values() if user["is_active"])
    
    return {
        "total_admins": admin_count,
        "active_admins": active_admins,
        "system_initialized": admin_count > 0,
        "environment": os.getenv("ENVIRONMENT", "development"),
        "jwt_secret_configured": bool(os.getenv("JWT_SECRET_KEY")),
        "admin_credentials_source": "environment" if (os.getenv("ADMIN_EMAIL") and os.getenv("ADMIN_PASSWORD")) else "hardcoded"
    }

def validate_admin_credentials(email: str, password: str) -> bool:
    """Validate admin credentials without logging sensitive information."""
    try:
        user = authenticate_user(email, password)
        return user is not None and user.is_active
    except Exception:
        return False 