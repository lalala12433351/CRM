import http from 'http';

http.get('http://localhost:3000/api/db/test', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('--- TEST API RESPONSE ---');
    console.log(data);
  });
}).on('error', (err) => {
  console.error('API Test Error:', err.message);
});
