# jump-cat – Game Cat Endless Runner

Sebuah game endless runner modern berkinerja tinggi berbasis web yang dibangun menggunakan Vanilla JavaScript, HTML5 Canvas, dan Vanilla CSS. Game ini menampilkan model karakter kucing pixel-art asli yang di-porting secara akurat dari aplikasi grafis desktop C#, kini dimodernisasi dengan fisika gameplay premium, transisi visual dinamis, serta audio retro yang disintesis.

## Fitur Utama

1. **Parallax Background Prosedural**:
   * Pola bintang berkelap-kelip dinamis.
   * Lapisan awan komposit multi-layer yang bergerak dengan kecepatan independen.
   * Parallax cyberpunk skyline yang menampilkan siluet gedung dengan jendela bercahaya acak.
   * Siklus transisi Siang/Malam berdasarkan pencapaian skor.

2. **Porting Sprite Kucing yang Akurat**:
   * Penyelarasan pivot render presisi tinggi menggunakan penskalaan koordinat dan pencerminan.
   * Animasi kaki berayun, kepala bergoyang, dan ekor bergoyang secara prosedural.
   * Efek visual squash dan stretch saat melompat dan mendarat.

3. **Mekanik Double Jump**:
   * Kemampuan lompat ganda (double jump) dengan kurva lompatan kedua yang lebih pendek dan berbobot.
   * Menghasilkan efek ledakan partikel debu abu-abu di bawah kaki kucing untuk umpan balik visual yang responsif.

4. **Variasi Rintangan & Fase Flappy Bird**:
   * Siluet rintangan yang unik (duri tajam, kotak ganda, pilar tinggi, dan oktagon melayang).
   * **Tantangan Mode Flappy**: Dipicu saat skor melewati `3500`. Pipa ganda (gaya Flappy Bird) akan muncul secara acak, mengharuskan pemain menggunakan double-jump secara akurat untuk melewati celah tengah. Dilengkapi dengan spanduk peringatan sarkasme di skor `3100` sebelum tantangan dimulai.

5. **Estetika & Sistem Sarkasme**:
   * Palet warna gelap yang tenang (nada abu-abu baja `#334155`, `#cbd5e1`, dan `#475569`) membuat rintangan terlihat sangat jelas tanpa efek neon yang mencolok.
   * Desain UI overlay skor dan tombol restart menggunakan efek glassmorphic.
   * Sistem notifikasi sarkasme di layar yang mengejek pemain setiap kelipatan `1000` skor.

6. **Dukungan Perangkat Mobile (Tap Layar)**:
   * Kontrol sentuh responsif tinggi menggunakan event listener `touchstart` dengan optimasi anti-gesture (mencegah zoom dan scrolling tidak sengaja saat bermain).
   * Dukungan tap cepat pada tombol restart tanpa delay klik mobile.

7. **Sistem Teknis Under-the-Hood**:
   * **Skor & Fisika Independen Terhadap Framerate**: Menggunakan delta waktu presisi tinggi (`dt`) dan akumulator desimal untuk memastikan kecepatan gerakan dan perhitungan skor tetap konsisten di semua jenis monitor (60Hz, 120Hz, 144Hz+).
   * **Synthesized Audio 8-bit**: Efek suara nostalgia yang disintesis secara dinamis langsung dari Web Audio API browser (tanpa memerlukan aset file audio eksternal).
   * **Screen Shake & Particle Trails**: Umpan balik visual berupa guncangan layar saat menabrak rintangan, partikel lari, partikel mendarat, serta percikan skor.

## Struktur File

```text
GrafikaWeb/
├── index.html        # Kerangka HTML, Canvas, & Glass Overlay
├── style.css         # Styling UI, Tata Letak Glassmorphism, & Transisi
├── script.js         # Game Controller, Player, Renderer, ObstacleManager, Audio, dan UIManager
├── vercel.json       # Konfigurasi caching & keamanan untuk deployment Vercel
└── README.md         # Dokumentasi (Bahasa Indonesia)
```

## Cara Menjalankan Secara Lokal

Game ini dapat dijalankan menggunakan server HTTP lokal apa pun. Contoh:

### 1. Menggunakan Python
Buka terminal di dalam direktori `GrafikaWeb` dan jalankan:
```bash
python3 -m http.server 8000
```
Lalu buka `http://localhost:8000/` di browser Anda.

### 2. Menggunakan Node.js (http-server)
Instal dan jalankan http-server:
```bash
npx http-server -p 8000
```
Lalu buka `http://localhost:8000/` di browser Anda.

## Cara Deploy ke Vercel

Game ini sangat kompatibel untuk dideploy secara gratis ke Vercel:

1. **Menggunakan GitHub (Sangat Direkomendasikan)**:
   * Push folder `GrafikaWeb` ke repositori GitHub Anda.
   * Masuk ke dashboard [Vercel](https://vercel.com/).
   * Klik **Add New** > **Project**, lalu impor repositori GitHub tersebut.
   * Vercel akan otomatis mendeteksi konfigurasi static hosting dan menerapkan optimasi dari file `vercel.json` kita. Klik **Deploy**!
   
2. **Menggunakan Vercel CLI**:
   * Buka terminal di folder `GrafikaWeb` dan jalankan:
     ```bash
     npm install -g vercel
     vercel
     ```
   * Ikuti petunjuk di terminal untuk mempublikasikan proyek Anda secara instan.

## Kontrol Game

* **Lompat / Double Jump**: Tekan tombol `Space`, tombol `ArrowUp`, klik mouse pada canvas, atau tap layar ponsel Anda.
* **Restart**: Klik atau tap tombol **Restart Game** pada layar Game Over.
# jump-cat
