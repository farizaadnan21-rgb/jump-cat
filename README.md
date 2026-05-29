# jump-cat – Game Cat Endless Runner

Sebuah game endless runner modern berkinerja tinggi berbasis web yang dibangun menggunakan Vanilla JavaScript, HTML5 Canvas, dan Vanilla CSS. Game ini menampilkan model karakter kucing pixel-art asli yang di-porting secara akurat dari aplikasi grafis desktop C#, kini dimodernisasi dengan fisika gameplay premium, transisi visual dinamis, serta audio retro yang disintesis.

---

## ✨ Fitur Utama

### 🌌 Parallax Background Prosedural

* Pola bintang berkelap-kelip dinamis
* Lapisan awan multi-layer dengan kecepatan independen
* Siluet kota cyberpunk dengan jendela bercahaya acak
* Siklus transisi Siang/Malam berdasarkan skor pemain

### 🐱 Porting Sprite Kucing yang Akurat

* Pixel-art kucing asli dari project C#
* Animasi kaki, kepala, dan ekor secara prosedural
* Efek squash & stretch saat lompat dan mendarat

### 🚀 Mekanik Double Jump

* Sistem double jump responsif
* Lompatan kedua lebih berat dan realistis
* Efek partikel debu saat melakukan double jump

### ⚠️ Variasi Rintangan & Fase Flappy

* Duri tajam
* Kotak ganda
* Pilar tinggi
* Oktagon melayang
* Mode Flappy Bird aktif saat skor > `3500`

### 🎭 Estetika & Sistem Sarkasme

* UI glassmorphism modern
* Palet warna gelap nyaman di mata
* Notifikasi sarkasme setiap kelipatan skor tertentu

### 📱 Dukungan Mobile

* Touch control responsif
* Anti zoom & anti accidental scrolling
* Restart button mobile-friendly

### ⚙️ Sistem Teknis

* Delta-time physics independen terhadap framerate
* Audio sintetis menggunakan Web Audio API
* Screen shake & particle effect
* Optimasi performa HTML5 Canvas

---

# 📂 Struktur File

```text
GrafikaWeb/
├── index.html
├── style.css
├── script.js
├── vercel.json
└── README.md
```

---

# 🚀 Cara Menjalankan Secara Lokal

## Menggunakan Python

```bash
python3 -m http.server 8000
```

Lalu buka:

```text
http://localhost:8000
```

---

## Menggunakan Node.js

```bash
npx http-server -p 8000
```

## Kontrol Game

---

# 🌍 Deploy ke Vercel

## Menggunakan GitHub

1. Push project ke GitHub:

```bash
git add .
git commit -m "Initial release"
git push
```

2. Buka:
https://jump-cat.vercel.app/

3. Import repository GitHub
4. Klik **Deploy**

---

# 🎮 Kontrol Game

| Aksi              | Kontrol               |
| ----------------- | --------------------- |
| Lompat            | `Space`               |
| Double Jump       | `Space` saat di udara |
| Alternatif Lompat | `ArrowUp`             |
| Mouse Control     | Klik Canvas           |
| Mobile Control    | Tap layar             |
| Restart           | Tombol Restart        |

---

# 🛠 Tech Stack

* HTML5 Canvas
* Vanilla JavaScript (ES6 OOP)
* Vanilla CSS
* Web Audio API
* Vercel Deployment

---

# 👨‍💻 Developer

**Fariza Adnan**

GitHub:
https://github.com/farizaadnan21-rgb

---

# 🔗 Repository

https://github.com/farizaadnan21-rgb

---

# 📜 License

MIT License — free for learning and personal use.
