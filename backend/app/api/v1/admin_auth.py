from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer
from datetime import timedelta, datetime
from pydantic import BaseModel
from app.models.blog_models import AdminLogin, AdminLoginResponse, AdminUser, AdminUserCreate
from app.utils.auth import (
    authenticate_user, 
    create_access_token, 
    get_current_user,
    get_current_admin_user,
    create_admin_user,
    init_default_admin,
    change_admin_password,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.utils.security import get_security_report
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()

# Rate limiter for admin login
limiter = Limiter(key_func=get_remote_address)

# Initialize default admin on startup
init_default_admin()

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/admin/auth/login", response_model=AdminLoginResponse)
@limiter.limit("5/minute")
async def admin_login(login_data: AdminLogin, request: Request):
    """
    Admin login endpoint - Hidden route for authentication.
    """
    try:
        # 🔒 SECURITY: Validate input
        if not login_data.email or not login_data.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and password are required"
            )
        
        # Authenticate user
        user = authenticate_user(login_data.email, login_data.password)
        if not user:
            # 🔒 SECURITY: Use generic error message to prevent user enumeration
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": user.id,
                "email": user.email,
                "role": user.role.value
            },
            expires_delta=access_token_expires
        )
        
        # 🔒 SECURITY: Log successful login without sensitive data
        logger.info(f"Admin login successful for user ID: {user.id}")
        
        return AdminLoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
            user=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # 🔒 SECURITY: Log error without exposing sensitive information
        logger.error(f"Admin login failed for request from {request.client.host}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )

@router.post("/admin/auth/create-user", response_model=AdminUser)
async def create_admin_user_endpoint(
    user_data: AdminUserCreate,
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """
    Create a new admin user - Only accessible by existing admins.
    """
    try:
        new_user = create_admin_user(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name,
            role=user_data.role
        )
        
        logger.info(f"New admin user created: {new_user.email} by {current_user.email}")
        
        return new_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create admin user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create admin user"
        )

@router.get("/admin/auth/me", response_model=AdminUser)
async def get_current_admin_info(current_user: AdminUser = Depends(get_current_user)):
    """
    Get current admin user information.
    """
    return current_user

@router.post("/admin/auth/logout")
async def admin_logout(current_user: AdminUser = Depends(get_current_user)):
    """
    Admin logout endpoint - Token invalidation happens on client side.
    """
    logger.info(f"Admin logout: {current_user.email}")
    return {"message": "Successfully logged out"}

@router.get("/admin/auth/verify-token")
async def verify_admin_token(current_user: AdminUser = Depends(get_current_admin_user)):
    """
    Verify admin token is valid and has admin privileges.
    """
    return {
        "valid": True,
        "user": current_user,
        "role": current_user.role,
        "message": "Token is valid"
    }

@router.post("/admin/auth/change-password")
async def change_admin_password_endpoint(
    password_data: PasswordChangeRequest,
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """
    Change admin password - Admin only.
    """
    try:
        # Verify current password
        if not authenticate_user(current_user.email, password_data.current_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect"
            )
        
        # Change password
        success = change_admin_password(current_user.email, password_data.new_password)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to change password"
            )
        
        logger.info(f"Password changed for admin: {current_user.email}")
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to change password for {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )

# Hidden endpoint to check if admin system is properly initialized
@router.get("/admin/auth/status")
async def admin_system_status():
    """
    Check admin system status - Hidden diagnostic endpoint.
    """
    from app.utils.auth import get_admin_security_status
    
    security_status = get_admin_security_status()
    
    return {
        "status": "operational" if security_status["system_initialized"] else "not_initialized",
        "admin_system_initialized": security_status["system_initialized"],
        "total_admins": security_status["total_admins"],
        "active_admins": security_status["active_admins"],
        "environment": security_status["environment"],
        "jwt_secret_configured": security_status["jwt_secret_configured"],
        "credentials_source": security_status["admin_credentials_source"],
        "message": "Admin system is operational" if security_status["system_initialized"] else "Admin system not initialized"
    } 

@router.get("/admin/security/report")
async def get_security_report_endpoint(
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """
    Get security monitoring report - Admin only.
    """
    try:
        report = get_security_report()
        
        logger.info(f"Security report requested by {current_user.email}")
        
        return {
            "status": "success",
            "data": report,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to generate security report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate security report"
        ) 