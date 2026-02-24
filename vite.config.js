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
        contact: resolve(__dirname, 'contact.html')
      }
    }
  }
});
