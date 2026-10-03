import net from "node:net";
import tls from "node:tls";

type SmtpConfig = { host: string; port: number; username: string | null; password: string; security: string | null; senderName: string | null; senderEmail: string };

export async function sendSmtpTestEmail(config: SmtpConfig) {
  validateHeader(config.senderEmail);
  const implicitTls = config.security === "tls";
  let socket: net.Socket | tls.TLSSocket = implicitTls
    ? tls.connect({ host: config.host, port: config.port, servername: config.host, rejectUnauthorized: true })
    : net.createConnection({ host: config.host, port: config.port });
  socket.setTimeout(10_000);
  let reader = responseReader(socket);
  try {
    await reader.expect([220]);
    await send(socket, reader, `EHLO deeptechly.local`, [250]);
    if (config.security === "starttls") {
      await send(socket, reader, "STARTTLS", [220]);
      socket = await upgradeTls(socket, config.host);
      reader = responseReader(socket);
      await send(socket, reader, "EHLO deeptechly.local", [250]);
    }
    if (config.username) {
      const payload = Buffer.from(`\u0000${config.username}\u0000${config.password}`).toString("base64");
      await send(socket, reader, `AUTH PLAIN ${payload}`, [235]);
    }
    await send(socket, reader, `MAIL FROM:<${config.senderEmail}>`, [250]);
    await send(socket, reader, `RCPT TO:<${config.senderEmail}>`, [250, 251]);
    await send(socket, reader, "DATA", [354]);
    const name = (config.senderName || "DeepTechly").replace(/[\r\n]/g, " ");
    socket.write(`From: ${name} <${config.senderEmail}>\r\nTo: ${config.senderEmail}\r\nSubject: DeepTechly email delivery test\r\nDate: ${new Date().toUTCString()}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nDeepTechly successfully reached this SMTP configuration.\r\n.\r\n`);
    await reader.expect([250]);
    await send(socket, reader, "QUIT", [221]);
  } finally {
    socket.destroy();
  }
}

async function send(socket: net.Socket | tls.TLSSocket, reader: ReturnType<typeof responseReader>, command: string, expected: number[]) {
  socket.write(`${command}\r\n`);
  await reader.expect(expected);
}

function responseReader(socket: net.Socket | tls.TLSSocket) {
  let buffer = "";
  const pending: Array<(value: string) => void> = [];
  const flush = () => {
    const match = buffer.match(/(?:^|\r\n)(\d{3}) [^\r\n]*\r\n/);
    if (match && pending[0]) { const value = buffer; buffer = ""; pending.shift()!(value); }
  };
  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    flush();
  });
  return {
    async expect(expected: number[]) {
      const response = await new Promise<string>((resolve, reject) => {
        pending.push(resolve);
        flush();
        socket.once("error", reject);
        socket.once("timeout", () => reject(new Error("SMTP connection timed out")));
      });
      const code = Number(response.slice(0, 3));
      if (!expected.includes(code)) throw new Error(`SMTP server returned ${code || "an invalid response"}`);
    }
  };
}

function upgradeTls(socket: net.Socket, host: string) {
  return new Promise<tls.TLSSocket>((resolve, reject) => {
    const secured = tls.connect({ socket, servername: host, rejectUnauthorized: true }, () => resolve(secured));
    secured.once("error", reject);
  });
}

function validateHeader(value: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /[\r\n]/.test(value)) throw new Error("Invalid SMTP sender email");
}
