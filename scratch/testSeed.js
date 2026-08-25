import http from 'http';

http.get('http://localhost:3000/api/db/seed', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('--- SEED API RESPONSE ---');
    console.log(data);
  });
}).on('error', (err) => {
  console.error('API Seed Error:', err.message);
});
