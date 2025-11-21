const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 8080;

const contentStore = new Map();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-CMS-Client',
  'Content-Type': 'application/json'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (method === 'GET' && path.startsWith('/content/')) {
    const contentId = path.split('/')[2];
    
    if (contentStore.has(contentId)) {
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify(contentStore.get(contentId)));
    } else {
      res.writeHead(404, corsHeaders);
      res.end(JSON.stringify({ error: 'Content not found' }));
    }
    return;
  }

  if (method === 'POST' && path === '/content') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const content = JSON.parse(body);
        if (!content.id) {
          res.writeHead(400, corsHeaders);
          res.end(JSON.stringify({ error: 'Content ID required' }));
          return;
        }

        contentStore.set(content.id, content);
        res.writeHead(201, corsHeaders);
        res.end(JSON.stringify({ success: true, id: content.id }));
      } catch (error) {
        res.writeHead(400, corsHeaders);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (method === 'GET' && path === '/content') {
    const allContent = Array.from(contentStore.entries()).map(([id, content]) => ({
      id,
      ...content
    }));
    
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(allContent));
    return;
  }

  if (method === 'DELETE' && path.startsWith('/content/')) {
    const contentId = path.split('/')[2];
    
    if (contentStore.has(contentId)) {
      contentStore.delete(contentId);
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({ success: true }));
    } else {
      res.writeHead(404, corsHeaders);
      res.end(JSON.stringify({ error: 'Content not found' }));
    }
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: 'Route not found' }));
});

server.listen(PORT, () => {
  console.log(`CMS API Server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET    /content/:id  - Fetch content by ID');
  console.log('  POST   /content      - Create/update content');
  console.log('  GET    /content      - List all content');
  console.log('  DELETE /content/:id  - Delete content');
});