import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: 'localhost',  // Assure-toi que le serveur écoute sur localhost
    port: 3000,         // Utilise le port 3000 si tu veux accéder à http://localhost:3000
  }
});
