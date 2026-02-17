const http = require('http');

function handler(req, res) {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end();
}

http.createServer(handler).listen(3001, () => {
  console.log('Server on 3001');
});

module.exports = { handler };
