# 🛠️ Panduan Setup & Struktur Proyek Barskuy-AI

Selamat datang di **Barskuy-AI**! File ini akan membantu Anda memahami bagaimana aplikasi ini dibangun, struktur foldernya, dan cara melakukan setup di lingkungan lokal Anda.

---

## 🚀 Teknologi yang Digunakan (Tech Stack)

Aplikasi ini adalah aplikasi web modern (SPA - Single Page Application) yang dibangun dengan:
- **TypeScript**: Bahasa utama untuk keamanan kode.
- **React**: Framework UI untuk antarmuka yang reaktif.
- **Vite**: Build tool super cepat untuk pengembangan.
- **Tailwind CSS**: Framework CSS untuk desain modern dan responsif.
- **Framer Motion**: Untuk animasi dan transisi UI yang halus.
- **Lucide React**: Library ikon vektor.
- **Recharts & D3**: Untuk visualisasi data dan grafik.

---

## 📂 Struktur Folder & File

Berikut adalah penjelasan mengenai struktur direktori di dalam proyek ini:

```text
barskuy-ai/
├── src/                    # Source code utama aplikasi
│   ├── components/         # Komponen UI yang dapat digunakan kembali
│   │   ├── ChatInput.tsx   # Input chat dengan dukungan file & voice
│   │   ├── MessageItem.tsx # Tampilan bubble chat (User & AI)
│   │   ├── Sidebar.tsx    # Navigasi riwayat chat
│   │   ├── SettingsModal.tsx # Modal konfigurasi AI & Tema
│   │   └── VoiceMode.tsx   # Antarmuka mode suara/percakapan
│   ├── services/           # Logika integrasi API AI
│   │   ├── geminiService.ts # Integrasi Google Gemini SDK
│   │   ├── ollamaService.ts # Integrasi Ollama (Lokal)
│   │   ├── llamaCppService.ts # Integrasi Llama.cpp (Lokal GGUF)
│   │   ├── openRouterService.ts # Integrasi OpenRouter (Cloud)
│   │   └── fileService.ts   # Pemrosesan dokumen (PDF, Docx, Gambar)
│   ├── hooks/              # Custom React Hooks
│   │   └── useChatHistory.ts # Manajemen state riwayat chat & LocalStorage
│   ├── lib/                # Utilitas & Helper
│   │   └── utils.ts        # Fungsi helper (seperti cn untuk Tailwind)
│   ├── App.tsx             # Komponen utama (Root Component)
│   ├── main.tsx            # Entry point aplikasi ke DOM
│   ├── types.ts            # Definisi tipe data TypeScript (Interface & Enum)
│   └── index.css           # Global styles & Konfigurasi Tailwind
├── public/                 # Aset statis (Gambar, Favicon)
├── .env.example            # Contoh file variabel lingkungan
├── package.json            # Daftar dependensi & script npm
├── tsconfig.json           # Konfigurasi TypeScript
├── vite.config.ts          # Konfigurasi build tool Vite
└── README.md               # Dokumentasi umum aplikasi
```

---

## ⚙️ Persyaratan Sistem

Sebelum memulai, pastikan Anda telah menginstal:
1. **Node.js** (Versi 18 atau lebih baru)
2. **npm** atau **yarn**
3. Koneksi internet (untuk Gemini & OpenRouter) atau server AI lokal (Ollama/Llama.cpp)

---

## 🛠️ Langkah-Langkah Instalasi

### 1. Clone Repositori
```bash
git clone https://github.com/username/barskuy-ai.git
cd barskuy-ai
```

### 2. Instal Dependensi
Gunakan npm untuk menginstal semua library yang dibutuhkan:
```bash
npm install
```

### 3. Konfigurasi Variabel Lingkungan
Buat file `.env` di root direktori dan masukkan API Key Anda:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```
*Catatan: OpenRouter API Key dapat dimasukkan langsung melalui menu Settings di dalam aplikasi.*

### 4. Jalankan Aplikasi (Mode Pengembangan)
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:3000` (atau port lain yang muncul di terminal).

---

## 🏗️ Build untuk Produksi

Jika Anda ingin membuild aplikasi untuk dihosting (seperti di Vercel, Netlify, atau VPS):
```bash
npm run build
```
Hasil build akan berada di folder `dist/`. Anda cukup meng-upload isi folder tersebut ke web server Anda.

---

## 🤖 Menghubungkan ke Mesin AI

### Google Gemini
- Dapatkan API Key di [Google AI Studio](https://aistudio.google.com/).
- Masukkan ke file `.env` atau langsung pakai jika sudah terkonfigurasi.

### OpenRouter
- Dapatkan API Key di [OpenRouter.ai](https://openrouter.ai/).
- Masukkan di menu **Settings** aplikasi.

### Ollama (Lokal)
- Instal Ollama dari [ollama.com](https://ollama.com/).
- Jalankan dengan perintah: `OLLAMA_ORIGINS="*" ollama serve` (Penting agar browser bisa mengakses).

### 🦙 Llama.cpp (Mesin Lokal GGUF) - Panduan Lengkap

Llama.cpp memungkinkan Anda menjalankan model AI (seperti Llama-3, Mistral, atau DeepSeek) secara lokal dengan efisiensi tinggi menggunakan CPU dan GPU.

#### 1. Persiapan Llama.cpp
- Download rilis terbaru `llama-server` (atau `server.exe` untuk Windows) dari [Hugging Face Llama.cpp Releases](https://github.com/ggerganov/llama.cpp/releases).
- Pastikan Anda mendownload versi yang sesuai dengan hardware Anda (misalnya versi CUDA untuk pengguna NVIDIA GPU).

#### 2. Mendownload Model (GGUF)
- Cari model berformat `.gguf` di [Hugging Face](https://huggingface.co/models?search=gguf).
- **Rekomendasi**: Cari model dari kreator seperti `Bartowski` atau `MaziyarPanahi` yang menyediakan kuantisasi GGUF berkualitas tinggi.
- Contoh model populer: `Llama-3-8B-Instruct-GGUF`, `Mistral-7B-v0.3-GGUF`.

#### 3. Struktur Folder Model
Sangat disarankan untuk merapikan file model Anda:
```text
llama-cpp-folder/
├── llama-server (executable)
└── models/
    ├── llama-3-8b.gguf
    └── deepseek-v2.gguf
```

#### 4. Menjalankan Server dengan Akselerasi GPU
Buka terminal/command prompt di folder Llama.cpp dan jalankan perintah berikut:

**Untuk Windows (NVIDIA GPU):**
```powershell
.\llama-server.exe -m models\nama_model.gguf -ngl 99 --host 0.0.0.0 --port 8080
```

**Untuk Linux/Mac:**
```bash
./llama-server -m models/nama_model.gguf -ngl 99 --host 0.0.0.0 --port 8080
```

**Penjelasan Flag Penting:**
- `-m models/nama_model.gguf`: Menentukan file model yang akan dimuat.
- `-ngl 99` (Number of GPU Layers): Angka `99` memerintahkan server untuk memindahkan **semua** layer model ke GPU (VRAM). Jika VRAM Anda tidak cukup, kurangi angka ini (misal `-ngl 20`).
- `--host 0.0.0.0`: Mengizinkan akses dari perangkat lain di jaringan yang sama.
- `--port 8080`: Menentukan port server (default Barskuy-AI mencari di port 8080).

#### 5. Menghubungkan ke Barskuy-AI
- Buka aplikasi Barskuy-AI.
- Masuk ke menu **Settings** (ikon roda gigi).
- Pilih **Llama.cpp (Mesin Lokal GGUF)** sebagai Mesin AI Utama.
- Pastikan **Endpoint Llama.cpp** sesuai dengan alamat server Anda (default: `http://127.0.0.1:8080`).
- Klik **Tes Koneksi** untuk memastikan status server aktif.

---

## 📝 Catatan Tambahan
Aplikasi ini menyimpan riwayat chat dan pengaturan Anda di **LocalStorage** browser. Artinya, data Anda tetap aman di komputer Anda sendiri dan tidak dikirim ke server kami, kecuali pesan yang Anda kirim ke provider AI (Gemini/OpenRouter).

Selamat mencoba Barskuy-AI! 🚀
