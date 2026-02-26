const { resolve } = require('path');
const { defineConfig } = require('vite');

module.exports = defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        media: resolve(__dirname, 'media.html'),
        book: resolve(__dirname, 'book.html'),
        contact: resolve(__dirname, 'contact.html'),
        signin: resolve(__dirname, 'signin.html'),
        login: resolve(__dirname, 'login.html'),
        account: resolve(__dirname, 'account.html')
      }
    }
  }
});
