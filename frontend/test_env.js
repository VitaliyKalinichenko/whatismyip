// Test environment variable configuration
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

// Test Next.js config
const nextConfig = require('./next.config.js');
console.log('Next.js Config:', {
  env: nextConfig.env,
  rewrites: nextConfig.rewrites ? 'Function defined' : 'Not defined'
});

// Test if we can access the backend
const testBackend = async () => {
  try {
    const response = await fetch('http://localhost:8000/health');
    console.log('Backend health check:', response.status, response.ok);
  } catch (error) {
    console.log('Backend health check failed:', error.message);
  }
};

if (typeof window !== 'undefined') {
  testBackend();
} 