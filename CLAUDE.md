# merak.io — Proje Bağlamı

Türkçe trivia/quiz PWA. Konsept: **"Meraklı yetişkinler — her gün 1 şey öğren."**
Hedef: günlük öğrenme alışkanlığı yaratan mobil-öncelikli web uygulaması.

---

## Dosya Yapısı

```
index.html        — tek sayfalık uygulama, tüm ekranlar burada
app.js            — tüm oyun mantığı (~2500 satır)
style.css         — tüm stiller (~2400 satır)
sorular.js        — orijinal soru havuzu (SORU_HAVUZU, 1662 soru)
sorular-ek.js     — ek sorular + yeni kategoriler + merge kodu (1829 soru)
validate.js       — soru doğrulama scripti (node validate.js)
kelimeler.js      — Wordle benzeri kelime oyunu verileri
sw.js             — Service Worker, şu an bm-v110
manifest.json     — PWA manifest, uygulama adı "Merak"
images/           — kategori görselleri (11 JPG + 6 SVG)
gemini-prompt.md  — Gemini ile soru üretmek için şablon prompt
```

---

## Kategori Sistemi

### `sorular.js` içindeki 11 orijinal kategori (key: `SORU_HAVUZU`)
Veri yapısında kolay/orta/zor alt dizileri var ama **kullanıcıya zorluk seçimi gösterilmiyor** — uygulama tüm soruları karışık havuzdan çekiyor.

| Kategori  | Toplam |
|-----------|--------|
| tarih     | 373    |
| spor      | 385    |
| cografya  | 377    |
| sanat     | 256    |
| bilim     | 225    |
| sinema    | 225    |
| teknoloji | 226    |
| yemek     | 232    |
| edebiyat  | 221    |
| mitoloji  | 216    |
| muzik     | 222    |

### `sorular-ek.js` içindeki kategoriler (key: `SORU_EK`)

| Kategori  | Toplam | Not                          |
|-----------|--------|------------------------------|
| astronomi | 65     | ★ En az soru, öncelikli      |
| hayvanlar | 97     | ★                            |
| ekonomi   | 102    |                              |
| saglik    | 139    |                              |
| bayrak    | 110    | GÖRSEL — özel format         |
| logo      | 20     | GÖRSEL — özel format         |

**Toplam: 3491 soru** (sorular.js: 1662 + sorular-ek.js: 1829)

---

## Soru Formatları — KRİTİK

### `sorular.js` formatı
```js
{ q: "Soru metni?", o: ["A","B","C","D"], a: 0, e: "Açıklama." }
//   soru metni      seçenekler            doğru idx  açıklama (opsiyonel)
```

### `sorular-ek.js` formatı
```js
{ s: "Soru metni?", c: ["A","B","C","D"], a: 0, x: "Açıklama." }
//   soru metni      seçenekler            doğru idx  açıklama (opsiyonel)
```

`a` her zaman doğru cevabın dizideki index'i (0-3).

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

## validate.js — Soru Doğrulama Scripti

```
node validate.js           — tüm kontrolleri çalıştır
node validate.js --export  — qa_export.txt üret (tüm soru-cevap çiftleri)
```

Kontroller: büyük harf, cevap index'i, yıl/sayı tutarsızlığı, duplicate/benzer sorular.
Yeni soru ekledikten sonra çalıştır. `Exact duplicate` veya `Jaccard >0.70` uyarısı çıkarsa gözden geçir.

---

## Service Worker

Dosya: `sw.js`
Şu anki versiyon: `bm-v370`
**Yeni dosya eklenince ASSETS listesine ekle ve versiyonu artır.**
**portal.html her değişince de versiyonu +1 artır** (network-first HTML ama cache temizliği için).

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

## Günlük Öğrenme Özelliği

- Günlük quizde `e:` alanı olan her soruda açıklama `gunlukOgrenilenler[]` array'ine eklenir
- `quizBitir()` sonunda `#gunlukOgrendimleriBlock` div'i render edilir (sadece günlük modda)
- "Arkadaşlarınla Paylaş" butonu → `gunlukFaktPaylasim()` → Web Share / WhatsApp

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
1. **Soru sayısı** — Hedef 5000, şu an 3491. Öncelik: astronomi (65), hayvanlar (97), ekonomi (102)
2. **Soru açıklamaları** — Mevcut soruların büyük çoğunluğunda `e:` alanı yok, içerik kalitesi için eklenecek
3. **Push notification** — kullanıcıyı geri getirecek en kritik özellik
4. **Görsel paylaşım kartı** — Canvas API ile Instagram story formatında kart, viral büyüme

---

## Dikkat Edilecekler

- `SORU_HAVUZU` ve `KATEGORI_BILGI` `sorular.js`'de `const` ile tanımlı — ama objeler olduğu için property ekleme mümkün.
- `sorular-ek.js`'deki merge loop sayfanın altında çalışır, `app.js` yüklenmeden önce tamamlanmış olur.
- Firebase entegrasyonu var (skor kaydetme) — `firebase.js` scripti `index.html`'de CDN'den yükleniyor.
- Kategori görselleri 48×48px daire olarak kırpılıyor (`object-fit: cover; border-radius: 50%`). SVG'lerde içeriği ortaya almak önemli.

---

## portal.html — Mobil Portal

Tek dosyalı uygulama (CSS + HTML + JS). `sessionStorage.merakPortal = '1'` ile index.html'e yönlendirme.

### Tema
- **Mobil (≤640px):** Bej/ışık tema — body `#ede8dc`, kartlar beyaz `#fff`
- **Desktop:** Koyu tema — body `#0c0c0c`, kartlar grid layout
- **Dark mode:** `@media (prefers-color-scheme:dark) and (max-width:640px)` ile otomatik

### Navigasyon (Mobil)
Instagram tarzı **view switching** — overlay/panel YOK.

Alt nav (5 sekme): **Ana Sayfa · Oyunlar · Araçlar · Piyasa · Hava**
`navAktifYap` map: `{ home:0, merak:1, araclar:2, piyasa:3, hava:4 }`

```
kartAc(id)         → body.sub-view-aktif + panel içeriği görünür + #viewHome gizlenir
goHome()           → panelKapat() + navAktifYap('home')
navAktifYap(id)    → alt nav aktif item güncelle
```

> **Kaldırılan özellikler** (kodda iz olabilir, geri ekleme bağlamı için):
> - **Maçlar** (futbol, ESPN API) — tüm `mac*` fonksiyonları ve CSS kodda DURUYOR ama nav/panelIcerik/kartAc bağlantıları kaldırıldı. ESPN API 400 veriyordu + diziliş/oyuncu arama eksikti.
> - **Video İndir** (`vi*` / `videoIndir*` fonksiyonları + `vi-*` CSS) — kod DURUYOR, UI tasarımı hazır, ama nav'dan kaldırıldı (yukarıdaki "öğrenilen ders"e bak).
> - **AI Quiz** — tamamen silindi (genel konularda havuzdan farkı yoktu, hatalı sorular üretiyordu). Worker `/quiz` endpoint'i hâlâ çalışıyor, istenirse yeniden bağlanabilir.

| Mod | Kullanım |
|-----|---------|
| View (default) | piyasa, hava, yks kartları |
| Modal overlay (panel-modal) | hızlı erişim, ayarlar |

### Panel Sınıfları
- `.panel.acik` — açık
- `.panel.panel-modal` — overlay mod (pozisyon:fixed, hızlı erişim/ayarlar)
- `.panel.hava-light` — hava durumu bej tema
- `.panel.panel-light` — genel açık tema

### Kart İkon Renkleri
| Kart | İkon arka plan |
|------|---------------|
| merak.io | `#ebe8ff` mor |
| TYT/AYT | `#dcf2e5` yeşil |
| Hava | `#dceeff` mavi |
| Piyasalar | `#fff3d6` sarı |

### API'lar
| Servis | Ne için | CORS/Key |
|--------|---------|----------|
| Open-Meteo | Hava + saatlik weathercode | Açık, key yok |
| Nominatim | Ters geocoding + şehir arama | Açık, key yok |
| Open-Meteo Air Quality | Avrupa AQI | Açık, key yok |
| CoinGecko `/coins/markets` | BTC/ETH/XRP sparkline | Açık, key yok |
| open.er-api.com | USD/EUR/GBP → TRY | Açık, key yok |
| collectapi `/economy/borsaIstanbul` | BIST 100 endeksi | **Key gerekli** (header: `authorization: apikey ...`) |

**Altın:** `gramAltinTry = (paxg.current_price / 31.1035) * usdTry`
**collectapi key:** kod içinde `COLLECTAPI_KEY` sabitinde. Ücretsiz plan SADECE `/borsaIstanbul` (endeks) verir; bireysel hisse (`/dbist`) ücretli — denendi, 500 döndü.

### Cloudflare Worker (önemli altyapı)
URL: `https://merak-video.kizilbaris85.workers.dev`
Kart/CORS sorunu olan API'lere **proxy** olarak kurulduk. Worker key'i gizler + CORS header ekler.
- **`POST /quiz`** → Groq API (`llama-3.3-70b-versatile`) ile JSON formatında quiz üretir. **Çalışıyor.** Groq key Worker içinde gizli (ücretsiz, kart yok).
- **`POST /`** (video) → TikTok (tikwm.com) + Twitter (vxtwitter). **Güvenilmez:** tikwm "1 istek/sn IP limiti" koyuyor, Cloudflare paylaşımlı IP yüzünden sürekli doluyor.

> **Öğrenilen ders:** Video indirme ücretsiz+güvenilir şekilde mümkün değil. cobalt artık JWT istiyor, RapidAPI Türk kartı kabul etmiyor, Piped/Invidious Cloudflare IP'sini blokluyor (403), tikwm IP-rate-limit. **Tekrar denemeye değmez.**

### localStorage
| Anahtar | İçerik |
|---------|--------|
| `havaKonum` | `{lat, lon, sehir, ulke}` |
| `merakStreak` | `{t: dateString, n: sayı}` |
| `merakPortalVisited` | `"1"` (splash bir kez göster) |

### Önemli Fonksiyonlar
```
havaYukle()          — konum al, havaFetch çağır (10dk arka plan yenileme)
havaFetch(lat,lon)   — Open-Meteo verisi, kartı güncelle
havaPanelGoster()    — hava panelini kur (hava-light sınıfı ekler)
havaIcerikGoster()   — window._hava → render
piyasaFetch()        — CoinGecko + forex → window._piyasa (5dk arka plan yenileme)
bistFetch()          — collectapi → window._bistIndex (BIST 100, piyasa ile paralel)
piyasaIcerikGoster() — piyasa içeriğini render et (döviz/altın/kripto + BIST + hesaplayıcılar)
piyasaAcildi()       — panel açılınca Promise.allSettled([piyasaFetch, bistFetch]) + render + interval
kartAc(id, el)       — panel/view aç
goHome()             — ana sayfaya dön
panelKapat()         — panel kapat, intervalları temizle
hizliErisimAc(el)    — hızlı erişim modalı (panel-modal)
ayarlarAc(el)        — ayarlar modalı (panel-modal)
```

### Hesaplayıcılar (canlı veriyle, API gerektirmez — `window._piyasa` kullanır)
Piyasalar panelinin altında **Döviz** + **Altın** hesaplayıcı, Araçlar panelinin altında **KDV** hesaplayıcı var.
```
doHesapla()      — USD/EUR/GBP ↔ TRY çevirir (#doMiktar, #doPara)
altinHesapla()   — gram/çeyrek/yarım/tam altın değeri (#altinMiktar, #altinTip). Çarpan: gram 1, çeyrek 1.75, yarım 3.5, tam 7
kdvHesapla()     — KDV hariç/dahil hesaplar (%1/%10/%20). Araçlar panelinde (#kdvFiyat, #kdvOran, #kdvDahil)
```

### Mobil Özellikler
- **Splash:** İlk ziyarette 1.8sn animasyon, `merakPortalVisited` flag
- **Streak:** 🔥 Günlük seri, greeting altında
- **Mini widget:** Hava kartı (sıcaklık/nem/ikon), Piyasa kartı (USD/altın/BTC%)
- **Swipe to close:** Panel üstünden aşağı 110px → `panelKapat()` (sadece modal panel için)
- **Kart press:** `scale(0.96)` spring animasyon

### SW Versiyonlama
```js
// sw.js
const CACHE = 'bm-vNNN'; // Her portal.html değişikliğinde +1 artır
```
Şu anki versiyon: `bm-v370`
