# Barskuy-AI 🚀

Barskuy-AI adalah asisten AI pribadi yang sangat canggih, modern, dan elegan. Aplikasi ini dirancang untuk memberikan pengalaman chat AI terbaik dengan dukungan berbagai mesin AI (Gemini, Ollama, Llama.cpp), visualisasi data, dan fitur multimedia.

## ✨ Fitur Utama

- **Multi-Engine AI**: Dukungan untuk Google Gemini (Cloud), Ollama (Lokal), dan Llama.cpp (Lokal GGUF).
- **Visualisasi Grafik**: Otomatis membuat grafik batang, garis, atau pie dari data yang diberikan AI.
- **Ringkasan Cerdas**: Tombol info untuk melihat ringkasan cepat dari jawaban AI yang panjang.
- **Mode Gambar (Imagine)**: Tombol khusus untuk membuat gambar secara instan menggunakan AI.
- **Preview Gambar**: Klik gambar apa pun untuk melihatnya dalam mode full-screen dengan fitur unduh.
- **Mode Suara (Live)**: Interaksi suara real-time dengan latensi rendah.
- **Manajemen Sesi**: Simpan dan kelola riwayat percakapan Anda dengan mudah.
- **Tema Adaptif**: Mode gelap dan terang otomatis berdasarkan waktu atau preferensi sistem.
- **Keamanan**: Kunci API dikelola dengan aman dan tidak terekspos.

## 🛠️ Cara Instalasi & Menjalankan

### Prasyarat
- **Node.js** (Versi 18 atau lebih baru)
- **NPM** atau **Yarn**

### Langkah-langkah
1. **Ekstrak File**: Jika Anda mendownload dalam format ZIP, ekstrak ke folder pilihan Anda.
2. **Buka Terminal**: Masuk ke direktori proyek.
3. **Instal Dependensi**:
   ```bash
   npm install
   ```
4. **Jalankan Aplikasi**:
   ```bash
   npm run dev
   ```
5. **Akses di Browser**: Buka `http://localhost:3000` (atau port yang tertera di terminal).

---

## 🤖 Konfigurasi Mesin AI

### 1. Google Gemini (Default)
- Tidak perlu instalasi tambahan.
- Pastikan API Key sudah terkonfigurasi di lingkungan (otomatis jika menggunakan AI Studio).

### 2. Ollama (Lokal)
- Instal Ollama dari [ollama.com](https://ollama.com).
- **PENTING**: Jalankan Ollama dengan izin CORS agar browser bisa mengaksesnya:
  ```bash
  # Windows (PowerShell)
  $env:OLLAMA_ORIGINS="*"; ollama serve
  
  # Linux/Mac
  OLLAMA_ORIGINS="*" ollama serve
  ```
- Pilih model (contoh: `deepseek-r1:7b`) di pengaturan Barskuy-AI.

### 3. OpenRouter (Cloud)
- Tidak perlu instalasi tambahan.
- Masukkan **OpenRouter API Key** di pengaturan Barskuy-AI.
- Model akan diambil secara otomatis dari OpenRouter.
- Pilih model yang diinginkan (contoh: `google/gemini-2.0-flash-001` atau `anthropic/claude-3-opus`).

### 4. Llama.cpp (Lokal GGUF)
- Download `llama-server` dari repositori [llama.cpp](https://github.com/ggerganov/llama.cpp).
- **Penyimpanan File (File Storage)**: 
  - Buat folder khusus bernama `models` di direktori kerja Anda.
  - Letakkan file model berformat `.gguf` di dalam folder tersebut.
  - Anda bisa mendownload model GGUF dari [Hugging Face](https://huggingface.co/models?search=gguf) (contoh: Llama-3, Mistral, atau DeepSeek).
- **Pengaturan GPU (Multi-GPU Support)**:
  Gunakan perintah berikut untuk performa maksimal. Jika Anda memiliki lebih dari satu GPU (seperti RTX 3060 + RTX 4060), Llama.cpp akan mencoba membagi beban jika dikonfigurasi dengan benar saat kompilasi.
  ```bash
  # Menjalankan dengan semua layer di GPU (-ngl 99)
  ./llama-server -m models/nama_model.gguf -ngl 99 --host 0.0.0.0 --port 8080
  ```
  *Tips: Jika VRAM tidak cukup, kurangi angka `-ngl` (misal `-ngl 20`) agar sebagian model berjalan di CPU.*

---

## 📦 Cara Mendownload Aplikasi Ini

Jika Anda ingin mendownload aplikasi ini untuk digunakan secara offline atau dihosting sendiri:

1. **Melalui Menu Settings**: Di pojok kanan atas panel AI Studio Build, klik ikon **Settings** (roda gigi).
2. **Export to ZIP**: Pilih opsi "Export to ZIP" untuk mendownload seluruh kode sumber aplikasi.
3. **Export to GitHub**: Anda juga bisa menghubungkan akun GitHub Anda dan melakukan "Push" kode ini ke repositori baru.
4. **Share**: Gunakan tombol "Share" untuk mendapatkan link aplikasi yang bisa diakses oleh orang lain secara langsung.

---

## 💡 Tips Penggunaan
- Gunakan tombol **Kamera** di input chat untuk masuk ke mode pembuatan gambar.
- Gunakan tombol **Info** di setiap pesan AI untuk melihat ringkasan.
- Jika grafik tidak muncul, pastikan AI memberikan data dalam format JSON yang sesuai (AI sudah diinstruksikan secara otomatis melalui System Prompt).

Dibuat dengan ❤️ oleh **Barskuy-AI Team**
