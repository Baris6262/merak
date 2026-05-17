# merak.io — Proje Bağlamı

Türkçe trivia/quiz PWA. Konsept: **"Meraklı yetişkinler — her gün 1 şey öğren."**
Hedef: günlük öğrenme alışkanlığı yaratan mobil-öncelikli web uygulaması.

---

## Dosya Yapısı

```
index.html      — tek sayfalık uygulama, tüm ekranlar burada
app.js          — tüm oyun mantığı (~2500 satır)
style.css       — tüm stiller (~2400 satır)
sorular.js      — orijinal soru havuzu (const SORU_HAVUZU, const KATEGORI_BILGI)
sorular-ek.js   — ek sorular + yeni kategoriler, merge kodu (1474 satır)
kelimeler.js    — Wordle benzeri kelime oyunu verileri
sw.js           — Service Worker, şu an bm-v11
manifest.json   — PWA manifest, uygulama adı "Merak"
images/         — kategori görselleri (11 JPG + 4 SVG)
icon.svg        — uygulama ikonu (mor arka plan, beyaz soru işareti + yıldız)
favicon.svg     — browser sekmesi ikonu
icon-maskable.svg — PWA install ikonu (80% safe zone)
```

---

## Kategori Sistemi

### `sorular.js` içindeki 11 orijinal kategori
`KATEGORI_BILGI` objesi — her kategori: `{ emoji, isim, img }`
Görsel: `images/tarih.jpg`, `images/sanat.jpg` ... (gerçek fotoğraflar)

Kategoriler: `tarih, sanat, spor, cografya, bilim, sinema, muzik, teknoloji, yemek, edebiyat, mitoloji`

### `sorular-ek.js` içindeki 4 yeni kategori
`KATEGORI_BILGI_EK` — merge ile `KATEGORI_BILGI`'ye ekleniyor:
- `astronomi` → `images/astronomi.svg`
- `saglik` → `images/saglik.svg`
- `ekonomi` → `images/ekonomi.svg`
- `hayvanlar` → `images/hayvanlar.svg`

---

## Soru Formatları — KRİTİK

### `sorular.js` formatı (orijinal)
```js
{ q: "Soru metni?", o: ["A","B","C","D"], a: 0, e: "Açıklama (opsiyonel)" }
```

### `sorular-ek.js` formatı (yeni)
```js
{ s: "Soru metni?", c: ["A","B","C","D"], a: 0, x: "Açıklama (opsiyonel)" }
```

### `app.js`'in beklediği format
`s.q`, `s.o`, `s.a`, `s.e` — yani orijinal format.

### Normalize fonksiyonu (`sorular-ek.js` sonunda)
```js
function _norm(arr) {
  return arr.map(function(s) {
    var out = { q: s.s || s.q, o: s.c || s.o, a: s.a };
    if (s.x || s.e) out.e = s.x || s.e;
    return out;
  });
}
```
`s/c/x` → `q/o/e` dönüşümü burada yapılıyor. Merge sırasında `_norm()` çağrılıyor.

---

## Script Yükleme Sırası

```html
<script src="sorular.js"></script>     <!-- SORU_HAVUZU ve KATEGORI_BILGI tanımlar -->
<script src="sorular-ek.js"></script>  <!-- SORU_EK tanımlar + merge yapar -->
<script src="kelimeler.js"></script>
<script src="app.js"></script>
```

**Sıra önemli.** `sorular-ek.js` sonunda merge loop çalışır, `app.js` başında her şey hazır olur.

---

## Önemli `app.js` State Değişkenleri

```js
let seciliKategori = 'all';
let seciliZorluk = 'orta';
let gunlukMod = false;
let gunlukOgrenilenler = [];   // günlük quizde toplanan açıklamalar
let oyunModu = 'klasik';       // klasik | hiz | sonsuz | sinav
let kullaniciAdi = 'Misafir';
```

---

## Önemli Fonksiyonlar

| Fonksiyon | Açıklama |
|-----------|----------|
| `baslat()` | Normal quiz başlatır |
| `gunlukBaslat()` | Günlük quiz başlatır, `gunlukOgrenilenler = []` sıfırlar |
| `gunlukSorular()` | Günün seed'ine göre 10 soru seçer, `e:` alanını taşır |
| `soruyuGoster()` | Soruyu ekrana basar |
| `cevapVer(idx, btn)` | Cevap işler, `aciklamaBar` gösterir, `gunlukOgrenilenler`'e ekler |
| `quizBitir()` | Sonuç ekranı, `gunlukOgrendimleriBlock` render eder |
| `gunlukFaktPaylasim()` | Öğrenilenleri Web Share API / WhatsApp ile paylaşır |
| `kategorileriYukle()` | Ana ekran kategori grid'ini oluşturur |
| `ekranGoster(id)` | Ekran geçişleri |

---

## Günlük Öğrenme Özelliği (Son Eklenen)

- Günlük quizde `e:` alanı olan her soruda açıklama `gunlukOgrenilenler[]` array'ine eklenir
- `quizBitir()` sonunda `#gunlukOgrendimleriBlock` div'i render edilir (sadece günlük modda)
- "Arkadaşlarınla Paylaş" butonu → `gunlukFaktPaylasim()` → Web Share / WhatsApp

---

## Service Worker

Dosya: `sw.js`
Şu anki versiyon: `bm-v11`
**Yeni dosya eklenince ASSETS listesine ve versiyonu bir artırmak gerekir.**

---

## CSS Breakpoint'leri

- `max-width: 720px` — kategori grid 3 sütun
- `max-width: 480px` — genel mobil optimizasyon, joker buton küçültme
- `max-width: 600px` — quiz ekranı tam ekran (padding: 16px 14px 20px)
- `max-width: 390px` — çok küçük ekran (iPhone SE vb.) ek sıkıştırma

Quiz ekranı 600px altında `min-height: 100dvh`, `border-radius: 0`, kenar çizgisi yok.

---

## PWA İkon Tasarımı

Tüm ikonlar (icon.svg, favicon.svg, icon-maskable.svg) aynı tasarım:
- Mor gradient arka plan (`#a855f7` → `#6d28d9`)
- Beyaz soru işareti (özel path: yay + kanca + nokta)
- Beyaz 10 köşeli yıldız (polygon) — soru işaretinin içinde

`icon-maskable.svg`: arka plan tam doldurur, içerik `transform="translate(51.2 51.2) scale(0.8)"` ile %80 safe zone'a alınmış.

---

## Yapılacaklar / Roadmap

Öncelik sırası:
1. **Push notification** — kullanıcıyı geri getirecek en kritik özellik
2. **Görsel paylaşım kartı** — Canvas API ile Instagram story formatında kart, viral büyüme
3. **Soru açıklamaları** — Mevcut soruların büyük çoğunluğunda `e:` alanı yok, içerik kalitesi için eklenecek
4. **Soru sayısı** — Hedef 5000, şu an ~2000

---

## Dikkat Edilecekler

- `SORU_HAVUZU` ve `KATEGORI_BILGI` `sorular.js`'de `const` ile tanımlı — ama objeler olduğu için property ekleme mümkün (`Object.assign`, property atama).
- `sorular-ek.js`'deki merge loop sayfanın altında çalışır, `app.js` yüklenmeden önce tamamlanmış olur.
- Firebase entegrasyonu var (skor kaydetme) ama `firestore.rules` dosyası var, `firebase.js` scripti `index.html`'de CDN'den yükleniyor.
- Kategori görselleri 48×48px daire olarak kırpılıyor (`object-fit: cover; border-radius: 50%`). SVG'lerde içeriği ortaya almak önemli, alt text gereksiz.
