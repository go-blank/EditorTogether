import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { WSSharedDoc } from 'y-websocket';

const wss = new WebSocketServer({ port: 1234 });

const docs = new Map();

const messageListener = (conn, doc, message) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const data = new Uint8Array(message);
  Y.applyUpdate(doc, data);

  // 广播给其他连接
  for (const c of doc.conns.keys()) {
    if (c !== conn) {
      c.send(encoder.encode(decoder.decode(data)));
    }
  }
};

const closeConn = (doc, conn) => {
  if (doc.conns.has(conn)) {
    doc.conns.delete(conn);
    if (doc.conns.size === 0) {
      docs.delete(doc.name);
    }
  }
};

wss.on('connection', (conn, req) => {
  const docName = req.url.slice(1).split('?')[0];
  let doc = docs.get(docName);

  if (!doc) {
    doc = new WSSharedDoc(docName);
    docs.set(docName, doc);
  }

  doc.conns.add(conn);

  conn.on('message', (message) => messageListener(conn, doc, message));
  conn.on('close', () => closeConn(doc, conn));
  conn.on('error', (err) => console.error(err));
});

console.log('WebSocket 协同服务已启动：ws://localhost:1234');