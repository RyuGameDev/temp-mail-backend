import http from 'node:http';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { config } from './config.js';
import { connectDatabase } from './db/connection.js';
import { ensureDefaultDomains } from './db/init.js';
import { getMailboxById } from './db/queries.js';
import { adminRouter } from './routes/admin.js';
import { createInboundRouter } from './routes/inbound.js';
import { publicRouter } from './routes/public.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST']
  }
});

app.use(helmet());
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json({ limit: '2mb' }));

io.on('connection', (socket) => {
  socket.on('mailbox:join', async ({ mailboxId }) => {
    const mailbox = await getMailboxById(mailboxId);
    if (mailbox) {
      socket.join(`mailbox:${mailbox.id}`);
      socket.emit('mailbox:joined', { mailboxId: mailbox.id });
    }
  });
});

app.use('/api', publicRouter);
app.use('/api/admin', adminRouter);
app.use('/api/inbound', createInboundRouter(io));

app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND' });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
});

await connectDatabase();
await ensureDefaultDomains();

server.listen(config.port, () => {
  console.log(`Backend listening on port ${config.port}`);
});
