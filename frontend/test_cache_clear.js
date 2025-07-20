// Test script to clear cache and check API
console.log('🧹 Clearing cache...');

// Clear localStorage cache
try {
  localStorage.removeItem('whatismyip_cached_data');
  localStorage.removeItem('whatismyip_last_fetch');
  console.log('✅ Cache cleared');
} catch (error) {
  console.log('❌ Failed to clear cache:', error);
}

// Test API directly
console.log('🔍 Testing API...');
fetch('/api/v1/ip-info')
  .then(response => response.json())
  .then(data => {
    console.log('✅ API Response:', data);
    console.log('📍 Location:', `${data.city}, ${data.region}, ${data.country}`);
    console.log('🌐 ISP:', data.isp);
    console.log('⏰ Timezone:', data.timezone);
    console.log('💰 Currency:', data.currency);
    console.log('📞 Calling Code:', data.calling_code);
  })
  .catch(error => {
    console.log('❌ API Error:', error);
  }); 