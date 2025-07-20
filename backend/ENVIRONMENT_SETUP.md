# Backend Environment Configuration

## Required Environment Variables

Create a `.env` file in the backend directory with the following variables:

### Security (CRITICAL)
```bash
# JWT Secret Key (minimum 32 characters)
JWT_SECRET_KEY=your_secure_jwt_secret_key_here_minimum_32_characters

# Admin Credentials (CHANGE THESE IN PRODUCTION!)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_admin_password_here
```

### Environment
```bash
# Environment (development/production)
ENVIRONMENT=development
```

### CORS Configuration
```bash
# Allowed origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Rate Limiting
```bash
# Rate limits per minute/hour
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
```

## Production Security Checklist

- [ ] Set `ENVIRONMENT=production`
- [ ] Generate a secure `JWT_SECRET_KEY` (32+ characters)
- [ ] Set secure `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- [ ] Configure `CORS_ORIGINS` with your actual domain(s)
- [ ] Never use default credentials in production

## Generating Secure Secrets

```bash
# Generate JWT secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate admin password
python -c "import secrets; import string; print(''.join(secrets.choice(string.ascii_letters + string.digits + '!@#$%^&*') for _ in range(16)))"
``` 