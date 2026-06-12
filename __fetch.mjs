// Test the database directly via the REST API with the service_role key
const supabaseUrl = 'https://offjjvazojlvbrqumnpo.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZmpqdmF6b2psdmJycXVtbnBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTAzMTcyNCwiZXhwIjoyMDk2NjA3NzI0fQ.MwBJx-W-GEXGXl377atu-dMjel5OXsqDz88HBCoRcRc';

// Check if the table exists and has data
fetch(`${supabaseUrl}/rest/v1/sorteos?select=id,numero,titulo`, {
  headers: {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Accept': 'application/json'
  }
})
.then(r => {
  console.log('Status:', r.status);
  return r.text();
})
.then(data => {
  console.log('Response:', data);
})
.catch(e => console.error('Error:', e));
