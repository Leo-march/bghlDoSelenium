const http = require('http');
const cluster = require('cluster');
const os = require('os');

const PORT = 3099;
const NUM_CPUS = os.cpus().length;

// ── Rate Limiter simples em memória ──────────────────────────────────
const requestCounts = new Map();
const RATE_LIMIT = 200;       // max requisições por IP por janela
const RATE_WINDOW = 10000;    // janela de 10 segundos

function isRateLimited(ip) {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now - entry.start > RATE_WINDOW) {
    requestCounts.set(ip, { count: 1, start: now });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) return true;
  return false;
}

// Limpa IPs antigos a cada 30s pra não vazar memória
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of requestCounts.entries()) {
    if (now - entry.start > RATE_WINDOW * 2) requestCounts.delete(ip);
  }
}, 30000);

// ── Circuit Breaker ──────────────────────────────────────────────────
let errorCount = 0;
let circuitOpen = false;
let circuitOpenedAt = 0;
const ERROR_THRESHOLD = 50;
const CIRCUIT_TIMEOUT = 5000; // 5s aberto antes de tentar fechar

function checkCircuit() {
  if (!circuitOpen) return false;
  if (Date.now() - circuitOpenedAt > CIRCUIT_TIMEOUT) {
    circuitOpen = false;
    errorCount = 0;
    console.log('[Circuit Breaker] Fechado novamente');
    return false;
  }
  return true;
}

function recordError() {
  errorCount++;
  if (errorCount >= ERROR_THRESHOLD && !circuitOpen) {
    circuitOpen = true;
    circuitOpenedAt = Date.now();
    console.log('[Circuit Breaker] Aberto por excesso de erros');
  }
}

// ── Servidor ─────────────────────────────────────────────────────────
function createServer() {
  const server = http.createServer((req, res) => {

    // Só atende a rota /api/teste
    if (req.url !== '/api/teste' || req.method !== 'GET') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    // Pega IP real (suporte a proxy)
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown';

    // Rate limit
    if (isRateLimited(ip)) {
      res.writeHead(429, {
        'Content-Type': 'application/json',
        'Retry-After': '10'
      });
      res.end(JSON.stringify({
        error: 'Too Many Requests',
        message: 'Calma ai parceiro 😅',
        retryAfter: '10s'
      }));
      return;
    }

    // Circuit breaker
    if (checkCircuit()) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Service Unavailable',
        message: 'Servidor em modo de proteção, tente novamente em breve.'
      }));
      return;
    }

    // Responde com sucesso
    try {
      const payload = JSON.stringify({
        status: 'ok',
        message: 'Ainda de pé! 💪',
        timestamp: new Date().toISOString(),
        worker: process.pid,
        uptime: Math.floor(process.uptime()) + 's'
      });

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
      });
      res.end(payload);

    } catch (err) {
      recordError();
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });

  // Timeout de 15s por requisição pra não travar o servidor
  server.timeout = 15000;
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  // Trata erros de socket sem derrubar o processo
  server.on('error', (err) => {
    console.error(`[Worker ${process.pid}] Erro no servidor:`, err.message);
    recordError();
  });

  server.listen(PORT, () => {
    console.log(`[Worker ${process.pid}] Rodando na porta ${PORT}`);
  });
}

// ── Cluster: usa todos os núcleos da CPU ─────────────────────────────
if (cluster.isPrimary) {
  console.log(`\n🚀 API iniciada — ${NUM_CPUS} workers na porta ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}/api/teste\n`);

  // Spawna um worker por núcleo
  for (let i = 0; i < NUM_CPUS; i++) {
    cluster.fork();
  }

  // Se um worker morrer, sobe outro automaticamente
  cluster.on('exit', (worker, code) => {
    console.warn(`[Master] Worker ${worker.process.pid} morreu (código ${code}). Subindo novo...`);
    cluster.fork();
  });

} else {
  createServer();
}