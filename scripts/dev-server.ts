import { createServer } from 'vite';
import ngrok from 'ngrok';
import dotenv from 'dotenv';

dotenv.config();

async function start() {
  try {
    const server = await createServer({
      // Use the existing vite.config.ts automatically
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
    });

    await server.listen();

    const authtoken = process.env.NGROK_AUTHTOKEN;
    const domain = process.env.NGROK_DOMAIN || 'asp-clear-perfectly.ngrok-free.app';

    if (!authtoken) {
      console.warn('\n  ⚠️  NGROK_AUTHTOKEN tidak ditemukan di .env. Ngrok tidak akan dijalankan.');
      server.printUrls();
      return;
    }

    try {
      const url = await ngrok.connect({
        addr: 3000,
        authtoken: authtoken,
        domain: domain,
      });

      server.printUrls();
      console.log(`  ➜  Ngrok:   \x1b[36m${url}\x1b[0m`);
    } catch (ngrokError: any) {
      console.error('\n  ❌ Gagal menjalankan Ngrok:', ngrokError.message);
      server.printUrls();
    }

  } catch (error: any) {
    console.error('\n  ❌ Gagal menjalankan server:', error.message);
    process.exit(1);
  }
}

start();
