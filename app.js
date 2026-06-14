// ═══════════════════════════
// DARK MODE
// ═══════════════════════════
(function () {
  if (localStorage.getItem('bm_dark') === '1') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

function darkModeToggle() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.classList.add('no-transition');
  if (dark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('bm_dark', '0');
    localStorage.setItem('merakTema', 'acik');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('bm_dark', '1');
    localStorage.setItem('merakTema', 'karanlik');
  }
  _darkBtnGuncelle();
  requestAnimationFrame(() => document.documentElement.classList.remove('no-transition'));
}

function _darkBtnGuncelle() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const btn = document.getElementById('navDarkBtn');
  if (btn) btn.textContent = dark ? '☀️' : '🌙';
}

document.addEventListener('DOMContentLoaded', _darkBtnGuncelle);

window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'temaGuncelle') {
    document.documentElement.classList.add('no-transition');
    if (e.data.dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    _darkBtnGuncelle();
    requestAnimationFrame(() => document.documentElement.classList.remove('no-transition'));
  }
});

// ═══════════════════════════
// ÇEVRİMDIŞI / ONLINE DETECTION
// ═══════════════════════════
function offlineDurumGuncelle() {
  const banner = document.getElementById('offlineBanner');
  if (!banner) return;
  banner.style.display = navigator.onLine ? 'none' : 'block';
}

window.addEventListener('online',  () => { offlineDurumGuncelle(); toastGoster('✅ İnternet bağlantısı sağlandı', true); });
window.addEventListener('offline', () => { offlineDurumGuncelle(); toastGoster('📡 Çevrimdışı mod — sorular çalışmaya devam ediyor'); });

// ═══════════════════════════
// STATE
// ═══════════════════════════
let oyuncuMood = 5;
let seciliKategori = 'all';
let seciliZorluk = 'orta';
let seciliSure = 60;
let sorular = [];
let soruIndex = 0;
let toplamPuan = 0;
let dogruSayisi = 0;
let yanlisSayisi = 0;
let kalanSure = 120;
let timerInterval = null;
let cevaplandi = false;
let baslangicZamani = 0;
let oyundaJokerKullanildi = false;
let joker5050Hak = 1;
let jokerTimeHak = 1;
let buSoruda5050Kullanildi = false;
let kullaniciAdi = 'Misafir';
let audioCtx = null;
let sesAcik = localStorage.getItem('bm_ses') !== 'kapali';
let streak = 0;
let canSayisi = 3;
let jokerHintHak = 1;
let tarihteBugunMod = false;
let maxStreak = 0;
let challengeMod = false;
let yanlisMod = false;
let oyunModu = 'klasik'; // klasik | hiz | sonsuz | sinav
let sonsuzMod = false;
let hizMod = false;
let sinavMod = false;
let challengeSkor = 0;
let challengeSeed = null;
let currentUser = null;
let authMod = 'giris';

const MOOD_SOZLER = {
  1: { emoji: '😞', text: 'Bazı günler zordur, yarın daha iyi olacak 🌧️' },
  2: { emoji: '😕', text: 'Yavaş yavaş açılıyorsun, sabret 🌅' },
  3: { emoji: '😐', text: 'Nötr bir gün, sürprizlere açık 🎲' },
  4: { emoji: '🙂', text: 'Enerjin yükseliyor, hisset ⚡' },
  5: { emoji: '😊', text: 'Tam ortası, denge harika bir şey ⚖️' },
  6: { emoji: '😄', text: 'Gülümseme bulaşıcıdır, yay 😊' },
  7: { emoji: '🤩', text: 'Harika hissediyorsun, tadını çıkar 🌟' },
  8: { emoji: '😍', text: 'Bugün senin günün! Parlıyorsun 💎' },
  9: { emoji: '🔥', text: 'Ateş ediyorsun! Durdurulamazsın 🔥' },
  10: { emoji: '🚀', text: 'Zirvedesin! Dünyayı fethet 🚀' }
};

const ROZETLER = {
  ilk_adim:     { icon: '🎯', isim: 'İlk Adım',       aciklama: 'İlk doğru cevabı ver' },
  atesli:       { icon: '🔥', isim: 'Ateşli',          aciklama: '5\'li streak yap' },
  combo_king:   { icon: '👑', isim: 'Combo King',      aciklama: '8\'li streak yap' },
  mukemmel:     { icon: '💎', isim: 'Mükemmel',        aciklama: '10/10 doğru yap' },
  sampiyon:     { icon: '🏆', isim: 'Şampiyon',        aciklama: '500+ puan al' },
  dokunulmaz:   { icon: '❤️', isim: 'Dokunulmaz',     aciklama: 'Hiç can kaybetmeden bitir' },
  hizli:        { icon: '⚡', isim: 'Hızlı Düşünür',   aciklama: '60sn\'de bitir (5+ doğru)' },
  zor_kahraman: { icon: '💪', isim: 'Zor Kahraman',    aciklama: 'Zor modda 7+ doğru yap' },
  bilge:        { icon: '🧠', isim: 'Bilge',            aciklama: '5 farklı kategoride oyna' }
};

const KAT_UNVANLARI = {
  tarih:    ['Tarih Meraklısı','Tarih Severi','Tarih Uzmanı','Tarih Dehası','Tarih Efsanesi'],
  bilim:    ['Bilim Meraklısı','Bilim Severi','Bilim Uzmanı','Bilim Dehası','Bilim Efsanesi'],
  cografya: ['Coğrafya Meraklısı','Coğrafya Severi','Coğrafya Uzmanı','Coğrafya Dehası','Coğrafya Efsanesi'],
  sanat:    ['Sanat Meraklısı','Sanat Severi','Sanat Uzmanı','Sanat Dehası','Sanat Efsanesi'],
  spor:     ['Spor Meraklısı','Spor Severi','Spor Uzmanı','Spor Dehası','Spor Efsanesi'],
  sinema:   ['Sinema Meraklısı','Sinema Severi','Sinema Uzmanı','Sinema Dehası','Sinema Efsanesi'],
  muzik:    ['Müzik Meraklısı','Müzik Severi','Müzik Uzmanı','Müzik Dehası','Müzik Efsanesi'],
  teknoloji:['Teknoloji Meraklısı','Teknoloji Severi','Teknoloji Uzmanı','Teknoloji Dehası','Teknoloji Efsanesi'],
  yemek:    ['Gurme Meraklısı','Gurme Severi','Gurme Uzmanı','Gurme Dehası','Gurme Efsanesi'],
  edebiyat: ['Edebiyat Meraklısı','Edebiyat Severi','Edebiyat Uzmanı','Edebiyat Dehası','Edebiyat Efsanesi'],
  mitoloji: ['Mitoloji Meraklısı','Mitoloji Severi','Mitoloji Uzmanı','Mitoloji Dehası','Mitoloji Efsanesi'],
  astronomi:['Astronomi Meraklısı','Astronomi Severi','Astronomi Uzmanı','Astronomi Dehası','Astronomi Efsanesi'],
  saglik:   ['Sağlık Meraklısı','Sağlık Severi','Sağlık Uzmanı','Sağlık Dehası','Sağlık Efsanesi'],
  ekonomi:  ['Ekonomi Meraklısı','Ekonomi Severi','Ekonomi Uzmanı','Ekonomi Dehası','Ekonomi Efsanesi'],
  hayvanlar:['Hayvan Meraklısı','Hayvan Severi','Hayvan Uzmanı','Hayvan Dehası','Hayvan Efsanesi'],
  bayrak:   ['Bayrak Meraklısı','Bayrak Severi','Bayrak Uzmanı','Bayrak Dehası','Bayrak Efsanesi']
};

// ═══════════════════════════
// UNVAN SİSTEMİ
// ═══════════════════════════
function unvanSeviyesi(dogru) {
  if (dogru >= 100) return 4;
  if (dogru >= 60)  return 3;
  if (dogru >= 30)  return 2;
  if (dogru >= 15)  return 1;
  if (dogru >= 5)   return 0;
  return -1;
}

function enIyiUnvan() {
  const stats = JSON.parse(localStorage.getItem('bm_kat_stats') || '{}');
  let enIyi = null, enIyiSeviye = -1;
  for (const [kat, st] of Object.entries(stats)) {
    if (kat === 'all' || !KAT_UNVANLARI[kat]) continue;
    const seviye = unvanSeviyesi(st.dogru || 0);
    if (seviye > enIyiSeviye) { enIyiSeviye = seviye; enIyi = seviye >= 0 ? KAT_UNVANLARI[kat][seviye] : null; }
  }
  return enIyi;
}

function tumUnvanlar() {
  const stats = JSON.parse(localStorage.getItem('bm_kat_stats') || '{}');
  const result = [];
  for (const [kat, st] of Object.entries(stats)) {
    if (kat === 'all' || !KAT_UNVANLARI[kat]) continue;
    const seviye = unvanSeviyesi(st.dogru || 0);
    if (seviye >= 0) result.push({ kat, unvan: KAT_UNVANLARI[kat][seviye], seviye, dogru: st.dogru || 0 });
  }
  return result.sort((a, b) => b.seviye - a.seviye || b.dogru - a.dogru);
}

function unvanKontrolEt() {
  const key = seciliKategori;
  if (key === 'all' || !KAT_UNVANLARI[key]) return;
  const stats = JSON.parse(localStorage.getItem('bm_kat_stats') || '{}');
  const st = stats[key];
  if (!st) return;
  const yeniDogru = st.dogru || 0;
  const eskiSeviye = unvanSeviyesi(Math.max(0, yeniDogru - dogruSayisi));
  const yeniSeviye = unvanSeviyesi(yeniDogru);
  if (yeniSeviye > eskiSeviye && yeniSeviye >= 0) {
    const unvan = KAT_UNVANLARI[key][yeniSeviye];
    setTimeout(() => toastGoster(`🏅 Yeni unvan: ${unvan}!`, true), 1500);
  }
}

// ═══════════════════════════
// BEYİN PUANI
// ═══════════════════════════
function beynPuaniGuncelle(kazanilanPuan) {
  if (kazanilanPuan <= 0) return;
  const ayKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
  let bp = JSON.parse(localStorage.getItem('bm_beyin_puani') || '{"toplam":0,"buAy":0,"oncekiAy":0,"ayKey":""}');
  if (bp.ayKey !== ayKey) { bp.oncekiAy = bp.buAy; bp.buAy = 0; bp.ayKey = ayKey; }
  bp.toplam += kazanilanPuan;
  bp.buAy += kazanilanPuan;
  localStorage.setItem('bm_beyin_puani', JSON.stringify(bp));
}

function beynPuaniGetir() {
  const ayKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
  let bp = JSON.parse(localStorage.getItem('bm_beyin_puani') || '{"toplam":0,"buAy":0,"oncekiAy":0,"ayKey":""}');
  if (bp.ayKey !== ayKey && bp.buAy > 0) { bp.oncekiAy = bp.buAy; bp.buAy = 0; bp.ayKey = ayKey; }
  return bp;
}

function beynPuaniGoster() { /* artık sadece profilde gösteriliyor */ }

// ═══════════════════════════
// EKONOMİ VE MAĞAZA (ALTIN)
// ═══════════════════════════
let altin = 0;
let envanter = { cerceveler: ['yok'], aktifCerceve: 'yok', jokerler: { '5050': 0, 'time': 0, 'hint': 0 } };

const MAGAZA_URUNLERI = [
  { id: '5050', tip: 'joker', ad: '+1 50:50 Jokeri', ikon: '🃏', fiyat: 50, aciklama: 'İki yanlış şıkkı siler' },
  { id: 'time', tip: 'joker', ad: '+1 Süre Jokeri', ikon: '⏳', fiyat: 50, aciklama: '+15 saniye ekler' },
  { id: 'hint', tip: 'joker', ad: '+1 İpucu Jokeri', ikon: '💡', fiyat: 50, aciklama: 'İlk harfi gösterir' },
  { id: 'altin', tip: 'cerceve', ad: 'Altın Çerçeve', ikon: '🔲', fiyat: 1000, aciklama: 'Özel avatar çerçevesi' },
  { id: 'ates', tip: 'cerceve', ad: 'Ateş Çerçevesi', ikon: '🔥', fiyat: 2500, aciklama: 'Ateşli avatar çerçevesi' },
  { id: 'elmas', tip: 'cerceve', ad: 'Elmas Çerçeve', ikon: '💎', fiyat: 5000, aciklama: 'Elmas avatar çerçevesi' }
];

function ekonomiYukle() {
  const eko = JSON.parse(localStorage.getItem('bm_ekonomi') || 'null');
  if (eko) {
    altin = eko.altin || 0;
    envanter.cerceveler = eko.cerceveler || ['yok'];
    envanter.aktifCerceve = eko.aktifCerceve || 'yok';
    envanter.jokerler = eko.jokerler || { '5050': 0, 'time': 0, 'hint': 0 };
  }
  altinGoster();
  cerceveUygula();
}

function ekonomiKaydet() {
  localStorage.setItem('bm_ekonomi', JSON.stringify({
    altin: altin, cerceveler: envanter.cerceveler, aktifCerceve: envanter.aktifCerceve, jokerler: envanter.jokerler
  }));
}

function altinKazan(miktar) {
  if (miktar <= 0) return;
  altin += miktar;
  ekonomiKaydet();
  altinGoster();
}

function altinGoster() {
  document.querySelectorAll('.altin-miktar').forEach(el => el.textContent = altin);
}

function cerceveUygula() {
  const els = [document.getElementById('profileAvatar'), document.getElementById('miniProfilAv'), document.getElementById('avatarOnizleme')];
  els.forEach(el => {
    if (!el) return;
    el.classList.remove('avatar-cerceve-altin', 'avatar-cerceve-ates', 'avatar-cerceve-elmas');
    if (envanter.aktifCerceve !== 'yok') el.classList.add('avatar-cerceve-' + envanter.aktifCerceve);
  });
}

function magazaEkraniGoster() {
  const grid = document.getElementById('magazaGrid');
  if (!grid) return;
  grid.innerHTML = MAGAZA_URUNLERI.map(u => {
    let btnHtml = '';
    if (u.tip === 'cerceve') {
      const sahip = envanter.cerceveler.includes(u.id);
      const aktif = envanter.aktifCerceve === u.id;
      if (aktif) btnHtml = `<button class="store-btn owned" disabled>Kullanılıyor</button>`;
      else if (sahip) btnHtml = `<button class="store-btn owned" onclick="cerceveKullan('${u.id}')">Kullan</button>`;
      else btnHtml = `<button class="store-btn" onclick="satinAl('${u.id}')" ${altin < u.fiyat ? 'disabled' : ''}>${u.fiyat} 🪙</button>`;
    } else {
      const sahipSayi = envanter.jokerler[u.id] || 0;
      btnHtml = `<div style="font-size:0.75rem; margin-bottom:6px; color:var(--text3)">Sahipsin: ${sahipSayi}</div>
                 <button class="store-btn" onclick="satinAl('${u.id}')" ${altin < u.fiyat ? 'disabled' : ''}>${u.fiyat} 🪙</button>`;
    }
    return `<div class="store-item"><div class="store-ikon">${u.ikon}</div><div class="store-ad">${u.ad}</div><div style="font-size:0.75rem; color:var(--text3); margin-bottom:auto">${u.aciklama}</div>${btnHtml}</div>`;
  }).join('');
  ekranGoster('storeScreen');
}

function satinAl(id) {
  const urun = MAGAZA_URUNLERI.find(u => u.id === id);
  if (!urun || altin < urun.fiyat) { toastGoster('Yetersiz bakiye!', false); return; }
  altin -= urun.fiyat;
  if (urun.tip === 'cerceve') { envanter.cerceveler.push(urun.id); envanter.aktifCerceve = urun.id; } 
  else { envanter.jokerler[urun.id] = (envanter.jokerler[urun.id] || 0) + 1; }
  ekonomiKaydet(); altinGoster(); cerceveUygula(); magazaEkraniGoster();
  toastGoster(`🎉 ${urun.ad} satın alındı!`, true);
}

function cerceveKullan(id) {
  envanter.aktifCerceve = id;
  ekonomiKaydet(); cerceveUygula(); magazaEkraniGoster(); toastGoster('Çerçeve uygulandı', true);
}

// ═══════════════════════════
// GÖREVLER (DAILY QUESTS)
// ═══════════════════════════
const GOREV_HAVUZU = [
  { tip: 'oyun_klasik', hedef: 3, odul: 40, desc: 'Klasik modda 3 oyun oyna', ikon: '🎯' },
  { tip: 'oyun_hiz', hedef: 2, odul: 50, desc: 'Hız modunda 2 oyun oyna', ikon: '⚡' },
  { tip: 'oyun_sonsuz', hedef: 1, odul: 30, desc: 'Sonsuz modda 1 oyun oyna', ikon: '♾️' },
  { tip: 'dogru_tarih', hedef: 15, odul: 50, desc: 'Tarih kategorisinde 15 doğru yap', ikon: '📜' },
  { tip: 'dogru_bilim', hedef: 15, odul: 50, desc: 'Bilim kategorisinde 15 doğru yap', ikon: '🔬' },
  { tip: 'dogru_spor', hedef: 10, odul: 40, desc: 'Spor kategorisinde 10 doğru yap', ikon: '⚽' },
  { tip: 'jokersiz_oyun', hedef: 1, odul: 60, desc: 'Joker kullanmadan bir oyunda 7+ doğru yap', ikon: '🤹' },
  { tip: 'oyun_streak', hedef: 5, odul: 50, desc: 'Tek oyunda 5\'li ateşli seri (streak) yap', ikon: '🔥' },
  { tip: 'oyun_10_dogru', hedef: 1, odul: 100, desc: 'Bir oyunda 10 sorunun hepsini bil', ikon: '💎' },
  { tip: 'wordle_oyna', hedef: 1, odul: 40, desc: 'Bugünün Tahminle kelimesini doğru bul', ikon: '🔤' }
];

function gorevleriKur() {
  const bugun = new Date().toDateString();
  let qData = JSON.parse(localStorage.getItem('bm_quests') || 'null');
  
  if (!qData || qData.date !== bugun) {
    const seed = new Date().getFullYear() * 10000 + (new Date().getMonth() + 1) * 100 + new Date().getDate();
    const rand = mulberry32(seed);
    let havuz = [...GOREV_HAVUZU].sort(() => rand() - 0.5);
    
    qData = {
      date: bugun,
      quests: havuz.slice(0, 3).map((q, i) => ({
        id: i, tip: q.tip, hedef: q.hedef, odul: q.odul, desc: q.desc, ikon: q.ikon,
        progress: 0, completed: false, claimed: false
      }))
    };
    localStorage.setItem('bm_quests', JSON.stringify(qData));
  }
  gorevBannerGuncelle();
}

function gorevIlerleme(tip, miktar, isSet = false) {
  let qData = JSON.parse(localStorage.getItem('bm_quests') || 'null');
  if (!qData || qData.date !== new Date().toDateString()) return;

  let changed = false;
  qData.quests.forEach(q => {
    if (q.tip === tip && !q.completed) {
      if (isSet) {
        if (miktar > q.progress) q.progress = miktar;
      } else {
        q.progress += miktar;
      }
      if (q.progress >= q.hedef) {
        q.progress = q.hedef;
        q.completed = true;
        setTimeout(() => toastGoster(`📜 Görev Tamamlandı: ${q.desc}`, true), 500);
      }
      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem('bm_quests', JSON.stringify(qData));
    gorevBannerGuncelle();
  }
}

function gorevEkraniGoster() {
  const qData = JSON.parse(localStorage.getItem('bm_quests') || 'null');
  if (!qData) return;
  const listEl = document.getElementById('questList');
  if (!listEl) return;
  
  listEl.innerHTML = qData.quests.map(q => {
    let btnHtml = '';
    if (q.claimed) btnHtml = `<button class="quest-btn claimed">Alındı ✓</button>`;
    else if (q.completed) btnHtml = `<button class="quest-btn claim" onclick="gorevOdulAl(${q.id})">Ödülü Al 🪙</button>`;
    else btnHtml = `<button class="quest-btn working">${q.progress} / ${q.hedef}</button>`;
    
    const pct = Math.min(100, Math.round((q.progress / q.hedef) * 100));
    return `<div class="quest-item"><div class="quest-icon">${q.ikon}</div><div class="quest-info"><div class="quest-title">${q.desc}</div><div class="quest-progress-bar"><div class="quest-progress-fill" style="width:${pct}%; background:${q.completed ? 'var(--correct)' : 'var(--accent)'}"></div></div><div class="quest-status">${q.completed ? (q.claimed ? 'Tamamlandı' : 'Ödül Bekliyor!') : 'Devam Ediyor'} <span style="float:right; color:var(--gold)">+${q.odul} 🪙</span></div></div><div>${btnHtml}</div></div>`;
  }).join('');
  ekranGoster('questScreen');
}

function gorevOdulAl(id) {
  let qData = JSON.parse(localStorage.getItem('bm_quests') || 'null');
  const q = qData?.quests.find(x => x.id === id);
  if (q && q.completed && !q.claimed) {
    q.claimed = true;
    localStorage.setItem('bm_quests', JSON.stringify(qData));
    altinKazan(q.odul);
    toastGoster(`🎉 Görevden ${q.odul} altın kazandın!`, true);
    gorevEkraniGoster(); gorevBannerGuncelle();
  }
}

function gorevBannerGuncelle() {
  const qData = JSON.parse(localStorage.getItem('bm_quests') || 'null');
  if (!qData || qData.date !== new Date().toDateString()) return;
  let beklemede = 0, tamamlanan = 0;
  qData.quests.forEach(q => { if (q.completed && !q.claimed) beklemede++; if (q.completed) tamamlanan++; });
  const badge = document.getElementById('questBadge');
  if (badge) { badge.style.display = beklemede > 0 ? 'inline-block' : 'none'; badge.textContent = beklemede + ' Yeni'; }
  const sub = document.getElementById('questSubText');
  if (sub) sub.textContent = (tamamlanan === 3 && beklemede === 0) ? 'Günün tüm görevleri tamamlandı ✅' : `${tamamlanan}/3 görev tamamlandı`;
}

// ═══════════════════════════
// YANLIŞ KUTUSU
// ═══════════════════════════
function yanlisSakla(soru, kat, zorluk) {
  let kutu = JSON.parse(localStorage.getItem('bm_yanlis_kutusu') || '[]');
  if (kutu.some(k => k.q === soru.q)) return;
  kutu.push({ q: soru.q, o: soru.o, a: soru.a, e: soru.e, img: soru.img, audio: soru.audio, kat, zorluk });
  if (kutu.length > 50) kutu = kutu.slice(-50);
  localStorage.setItem('bm_yanlis_kutusu', JSON.stringify(kutu));
}

function yanlisKutusuBannerGuncelle() {
  const kutu = JSON.parse(localStorage.getItem('bm_yanlis_kutusu') || '[]');
  const el = document.getElementById('yanlisKutusuBanner');
  if (!el) return;
  if (kutu.length === 0) { el.style.display = 'none'; return; }
  el.style.display = 'flex';
  const sayiEl = document.getElementById('yanlisKutusuSayi');
  if (sayiEl) sayiEl.textContent = kutu.length;
}

function yanlisEkraniGoster() {
  const kutu = JSON.parse(localStorage.getItem('bm_yanlis_kutusu') || '[]');
  const cozulen = parseInt(localStorage.getItem('bm_yanlis_cozulen') || '0');

  // Özet
  document.getElementById('yanlisBekleyen').textContent = kutu.length;
  document.getElementById('yanlisCozulen').textContent = cozulen;

  // Kategori dağılımı
  const katSayac = {};
  kutu.forEach(s => { katSayac[s.kat] = (katSayac[s.kat] || 0) + 1; });
  document.getElementById('yanlisKategoriSayi').textContent = Object.keys(katSayac).length;

  const katListEl = document.getElementById('yanlisKatList');
  if (Object.keys(katSayac).length === 0) {
    katListEl.innerHTML = '<div style="color:var(--text3);font-size:0.8rem;padding:8px">Kategori verisi yok</div>';
  } else {
    katListEl.innerHTML = Object.entries(katSayac)
      .sort((a, b) => b[1] - a[1])
      .map(([kat, sayi]) => {
        const bilgi = KATEGORI_BILGI[kat] || { emoji: '📚', isim: kat };
        return `<div class="yanlis-kat-item">
          <span class="yanlis-kat-emoji">${bilgi.emoji}</span>
          <span class="yanlis-kat-isim">${bilgi.isim || kat}</span>
          <span class="yanlis-kat-sayi">${sayi} soru</span>
        </div>`;
      }).join('');
  }

  // Son 5 yanlış soru
  const soruListEl = document.getElementById('yanlisSoruList');
  const son5 = kutu.slice(-5).reverse();
  if (son5.length === 0) {
    soruListEl.innerHTML = '<div style="color:var(--text3);font-size:0.8rem;padding:8px">Henüz yanlış soru yok</div>';
  } else {
    soruListEl.innerHTML = son5.map(s => {
      const dogru = s.o[s.a];
      return `<div class="yanlis-soru-item">
        <div class="yanlis-soru-q">${htmlKacis(s.q)}</div>
        <div class="yanlis-soru-dogru">✓ ${htmlKacis(dogru)}</div>
      </div>`;
    }).join('');
  }

  ekranGoster('yanlisScreen');
}

function yanlisKutusuTemizle() {
  const kutu = JSON.parse(localStorage.getItem('bm_yanlis_kutusu') || '[]');
  if (kutu.length === 0) { toastGoster('Zaten boş!'); return; }
  if (!confirm(`${kutu.length} soruyu yanlış kutusundan sil?`)) return;
  localStorage.removeItem('bm_yanlis_kutusu');
  yanlisKutusuBannerGuncelle();
  toastGoster('🗑 Yanlış kutusu temizlendi', true);
  ekranGoster('homeScreen', true);
}

// ═══════════════════════════
// PROFİL KARTI (Canvas)
// ═══════════════════════════
function profilKartiIndir() {
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1080;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 1080, 1080);
  bg.addColorStop(0, '#060d1f'); bg.addColorStop(1, '#0e1730');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1080);

  [[150,180,280,'rgba(79,143,255,0.12)'],[960,900,220,'rgba(139,92,246,0.1)'],[900,150,150,'rgba(16,185,129,0.08)']].forEach(([x,y,r,c]) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fillStyle = c; ctx.fill();
  });

  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.beginPath(); ctx.roundRect(50, 50, 980, 980, 40); ctx.fill();
  ctx.strokeStyle = 'rgba(79,143,255,0.25)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(50, 50, 980, 980, 40); ctx.stroke();

  const ad = currentUser?.displayName || kullaniciAdi || 'Misafir';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#4f8fff'; ctx.font = 'bold 38px Arial, sans-serif';
  ctx.fillText('Merak', 540, 150);

  const renkler = ['#4f8fff','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899'];
  const avatarRenk = renkler[ad.charCodeAt(0) % renkler.length];
  ctx.beginPath(); ctx.arc(540, 310, 90, 0, Math.PI*2);
  ctx.fillStyle = avatarRenk; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(540, 310, 90, 0, Math.PI*2); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 72px Arial, sans-serif';
  ctx.fillText(ad.charAt(0).toUpperCase(), 540, 342);

  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 52px Arial, sans-serif';
  ctx.fillText(ad, 540, 460);

  const unvan = enIyiUnvan();
  if (unvan) { ctx.fillStyle = '#4f8fff'; ctx.font = '32px Arial, sans-serif'; ctx.fillText(unvan, 540, 510); }

  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(140, 545); ctx.lineTo(940, 545); ctx.stroke();

  const bp = beynPuaniGetir();
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '26px Arial, sans-serif';
  ctx.fillText('BEYİN PUANI', 540, 615);
  ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 76px Arial, sans-serif';
  ctx.fillText(bp.toplam.toLocaleString('tr-TR'), 540, 705);

  const unvanlar = tumUnvanlar().slice(0, 3);
  if (unvanlar.length > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '26px Arial, sans-serif';
    ctx.fillText(unvanlar.map(u => u.unvan).join('  ·  '), 540, 800);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.font = '26px Arial, sans-serif';
  ctx.fillText('merak.io', 540, 970);

  const link = document.createElement('a');
  link.download = 'merak-profil.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  toastGoster('📥 Profil kartı indirildi!', true);
}

// ═══════════════════════════
// SES EFEKTLERİ
// ═══════════════════════════
function sesDegistir() {
  sesAcik = !sesAcik;
  localStorage.setItem('bm_ses', sesAcik ? 'acik' : 'kapali');
  const btn = document.getElementById('sesBtn');
  if (btn) btn.textContent = sesAcik ? '🔊' : '🔇';
  toastGoster(sesAcik ? '🔊 Ses açıldı' : '🔇 Ses kapatıldı', true);
}

function sesOynat(tip) {
  if (!sesAcik) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const ctx = audioCtx;
    const now = ctx.currentTime;

    const nota = (freq, start, dur, vol = 0.2, type = 'sine') => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(vol, now + start);
      g.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    };

    if (tip === 'dogru') {
      const a = new Audio('sounds/dogru.mp3');
      a.volume = 0.7;
      a.play().catch(() => {});
      return;
    } else if (tip === 'yanlis') {
      const a = new Audio('sounds/yanlis.mp3');
      a.volume = 0.7;
      a.play().catch(() => {});
      return;
    } else if (tip === 'tick') {
      nota(880, 0, 0.07, 0.07);
    } else if (tip === 'bitis') {
      nota(523, 0, 0.3, 0.2);
      nota(659, 0.15, 0.3, 0.2);
      nota(784, 0.3, 0.3, 0.2);
      nota(1047, 0.45, 0.5, 0.25);
    }
  } catch(e) {}
}

// ═══════════════════════════
// FIREBASE — Online Liderlik
// ═══════════════════════════
// Kurulum:
// 1. console.firebase.google.com → Proje oluştur
// 2. Firestore Database → Oluştur → Test modunda başlat
// 3. Proje Ayarları → Uygulama Ekle (Web) → Config objesini aşağıya gir
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAqZ5Xdr2J4iOTSs587DrFtD6dqTzAN8ac',
  authDomain: 'baris-2ddf6.firebaseapp.com',
  projectId: 'baris-2ddf6',
  storageBucket: 'baris-2ddf6.firebasestorage.app',
  messagingSenderId: '736508330364',
  appId: '1:736508330364:web:7a4281b2ee1f1dfd7d24f9'
};

let db = null;
let messaging = null;

function firebaseBaslat() {
  if (!FIREBASE_CONFIG.projectId || typeof firebase === 'undefined') return;
  try {
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore(app);
    if (firebase.messaging.isSupported()) {
      messaging = firebase.messaging(app);
      messaging.onMessage((payload) => {
        toastGoster('🔔 ' + payload.notification.title + ': ' + payload.notification.body, true);
      });
    }
    authBaslat();
  } catch(e) {}
}

function authBaslat() {
  firebase.auth().getRedirectResult().then(result => {
    if (result && result.user) yonlendirSonEkrana();
  }).catch(e => {
    // Sadece kullanıcıya gösterilmesi gereken hatalar — bağlantı/init hataları gösterilmez
    const gizliHatalar = ['auth/no-auth-event', 'auth/internal-error', 'auth/network-request-failed'];
    if (e.code && !gizliHatalar.includes(e.code)) authHataGoster(hataMesaji(e.code));
  });
  firebase.auth().onAuthStateChanged(user => {
    currentUser = user;
    const aktifEkranYok = !document.querySelector('.screen.active');
    const authAktif = document.getElementById('authScreen')?.classList.contains('active');

    if (user) {
      kullaniciAdi = user.displayName || user.email?.split('@')[0] || 'Oyuncu';
      localStorage.setItem('bm_displayName', kullaniciAdi);
      if (window.STANDALONE === 'giris') {
        document.body.style.visibility = '';
        window.parent.postMessage('authBasarili', '*');
        return;
      }
      const isimEl = document.getElementById('isimInput');
      if (isimEl) { isimEl.value = kullaniciAdi; isimEl.readOnly = true; }
      document.getElementById('userBarName').textContent = `👤 ${kullaniciAdi}`;
      document.getElementById('userBar')?.classList.add('show');
      miniProfilGuncelle();
      if (aktifEkranYok || authAktif) {
        yonlendirSonEkrana();
      }
    } else {
      if (localStorage.getItem('bm_misafir') !== '1') localStorage.removeItem('bm_displayName');
      document.getElementById('userBar')?.classList.remove('show');
      const isimEl = document.getElementById('isimInput');
      if (isimEl) { isimEl.value = ''; isimEl.readOnly = false; }
      miniProfilGuncelle();
      if (window.STANDALONE === 'giris') return;
      // Misafir kullanıcı yeniledi — son ekrana geri dön
      if (localStorage.getItem('bm_misafir') === '1') {
        if (aktifEkranYok || authAktif) {
          yonlendirSonEkrana();
        }
      } else if (window.STANDALONE) {
        // iframe içinde araç/oyun açık — zaten bir şey gösteriliyor, auth ekranı ezmesin
        if (aktifEkranYok || authAktif) ekranGoster('authScreen');
      } else {
        ekranGoster('authScreen');
      }
    }
  });
}

async function googleIleGiris() {
  if (typeof firebase === 'undefined') {
    authHataGoster('Bağlantı hatası, sayfayı yenile');
    return;
  }
  const btn = document.getElementById('googleBtn');
  const btnText = document.getElementById('googleBtnText');
  const orijinalMetin = btnText ? btnText.textContent : 'Google ile Giriş Yap';
  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Bağlanıyor...';
  const provider = new firebase.auth.GoogleAuthProvider();
  const isPWA = window.matchMedia('(display-mode: standalone)').matches
             || window.navigator.standalone === true;
  if (isPWA) {
    try {
      await firebase.auth().signInWithRedirect(provider);
    } catch(e) {
      authHataGoster(hataMesaji(e.code));
      if (btn) btn.disabled = false;
      if (btnText) btnText.textContent = orijinalMetin;
    }
    return;
  }
  try {
    await firebase.auth().signInWithPopup(provider);
  } catch(e) {
    if (e.code === 'auth/popup-blocked') {
      try {
        await firebase.auth().signInWithRedirect(provider);
        return;
      } catch(e2) {
        authHataGoster(hataMesaji(e2.code));
      }
    } else if (e.code !== 'auth/popup-closed-by-user') {
      authHataGoster(hataMesaji(e.code));
    }
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = orijinalMetin;
  }
}

async function emailIslem() {
  const email = document.getElementById('authEmail').value.trim();
  const sifre = document.getElementById('authSifre').value;
  const isim = document.getElementById('authIsim').value.trim();
  if (!email || !sifre) { authHataGoster('E-posta ve şifre gerekli'); return; }

  const btn = document.getElementById('authBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Lütfen bekle...';
  authHataGoster('');

  try {
    if (authMod === 'giris') {
      await firebase.auth().signInWithEmailAndPassword(email, sifre);
    } else {
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, sifre);
      const ad = isim || email.split('@')[0];
      await cred.user.updateProfile({ displayName: ad });
      kullaniciAdi = ad;
    }
  } catch(e) {
    authHataGoster(hataMesaji(e.code));
    btn.disabled = false;
    btn.textContent = authMod === 'giris' ? 'Giriş Yap' : 'Kayıt Ol';
  }
}

function authTabSec(mod, btn) {
  authMod = mod;
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('authBtn').textContent = mod === 'giris' ? 'Giriş Yap' : 'Kayıt Ol';
  document.getElementById('authIsim').style.display = mod === 'kayit' ? 'block' : 'none';
  const gBtnText = document.getElementById('googleBtnText');
  if (gBtnText) gBtnText.textContent = mod === 'giris' ? 'Google ile Giriş Yap' : 'Google ile Kayıt Ol';
  authHataGoster('');
}

function authHataGoster(mesaj) {
  const el = document.getElementById('authError');
  if (el) { el.textContent = mesaj; el.style.display = mesaj ? 'block' : 'none'; }
}

function hataMesaji(code) {
  const m = {
    'auth/email-already-in-use': 'Bu e-posta zaten kayıtlı',
    'auth/weak-password': 'Şifre en az 6 karakter olmalı',
    'auth/user-not-found': 'Kullanıcı bulunamadı',
    'auth/wrong-password': 'Şifre yanlış',
    'auth/invalid-email': 'Geçersiz e-posta adresi',
    'auth/invalid-credential': 'E-posta veya şifre hatalı',
    'auth/popup-closed-by-user': '',
    'auth/unauthorized-domain': 'Bu domain Firebase\'de yetkili değil',
    'auth/network-request-failed': 'İnternet bağlantısı yok'
  };
  return m[code] || ('Hata: ' + code);
}

function miniProfilGuncelle() {
  const kart = document.getElementById('miniProfilKart');
  const av = document.getElementById('miniProfilAv');
  const isim = document.getElementById('miniProfilIsim');
  const alt = document.getElementById('miniProfilAlt');
  const navUser = document.getElementById('edNavUser');
  if (currentUser) {
    const ad = currentUser.displayName || kullaniciAdi || 'Oyuncu';
    if (kart) {
      av.textContent = ad[0].toUpperCase();
      av.classList.remove('misafir');
      isim.textContent = ad;
      const streak = JSON.parse(localStorage.getItem('bm_streak') || '{}');
      alt.textContent = (streak.streak > 0) ? `🔥 ${streak.streak} günlük seri` : 'Profilini görüntüle →';
      kart.classList.remove('giris-yap');
    }
    if (navUser) navUser.textContent = `${ad[0].toUpperCase()} →`;
  } else {
    if (kart) {
      av.textContent = '👤';
      av.classList.add('misafir');
      isim.textContent = 'Giriş Yap';
      alt.textContent = 'Kayıt ol, ilerlemeni takip et';
      kart.classList.add('giris-yap');
    }
    if (navUser) navUser.textContent = 'Giriş Yap →';
  }
}

function miniProfilTikla() {
  if (currentUser) {
    profilGoster();
  } else {
    ekranGoster('authScreen');
  }
}

function anaEkranBaslat() {
  ekranGoster('homeScreen');
  kategorileriYukle();
  liderlikGoster();
  rozetVitrinGuncelle();
  tarihteBugunGuncelle();
  challengeBannerGuncelle();
  streakYukle();
  wordleBannerGuncelle();
  beynPuaniGoster();
  yanlisKutusuBannerGuncelle();
  miniProfilGuncelle();
  edBaslat();
}

function yonlendirSonEkrana() {
  const hedef = localStorage.getItem('bm_son_ekran') || 'homeScreen';
  if (hedef === 'profileScreen') profilGoster();
  else if (hedef === 'yanlisScreen') yanlisEkraniGoster();
  else if (hedef === 'storeScreen') magazaEkraniGoster();
  else if (hedef === 'questScreen') gorevEkraniGoster();
  else if (hedef === 'wordleScreen') { anaEkranBaslat(); wordleBaslat(); }
  else if (hedef === 'flashcardScreen') flashcardBaslat();
  else anaEkranBaslat();
}

function misafirOyna() {
  localStorage.setItem('bm_misafir', '1');
  if (window.STANDALONE === 'giris') {
    window.parent.postMessage('oyunKapat', '*');
    return;
  }
  anaEkranBaslat();
}

// ── Speed Dial FAB ────────────────────────────────────────────────────
let fabAcik = false;

function fabToggle() {
  fabAcik = !fabAcik;
  document.getElementById('fabWrap').classList.toggle('acik', fabAcik);
  document.getElementById('fabIkon').textContent = fabAcik ? '✕' : '✦';
}

function fabKapat() {
  if (!fabAcik) return;
  fabAcik = false;
  document.getElementById('fabWrap').classList.remove('acik');
  document.getElementById('fabIkon').textContent = '✦';
}

function fabGit(hedef) {
  fabKapat();
  if (hedef === 'wordle')  { wordleBaslat(); return; }
  if (hedef === 'duello')  { dvEkranGoster(); return; }
  if (hedef === 'yanlis')  { yanlisEkraniGoster(); return; }
  if (hedef === 'profil')  { profilGoster(); return; }
  if (hedef === 'magaza')  { magazaEkraniGoster(); return; }
  if (hedef === 'gorevler') { gorevEkraniGoster(); return; }
}

document.addEventListener('click', e => {
  if (fabAcik && !e.target.closest('#fabWrap')) fabKapat();
});

function fabEkranaGore(ekranId) {
  const fab = document.getElementById('fabWrap');
  if (!fab) return;
  if (window.STANDALONE) { fab.style.display = 'none'; return; }
  const gizli = ['authScreen', 'quizScreen', 'resultScreen', 'storeScreen', 'questScreen', 'tahminScreen', 'flashcardScreen'];
  fab.style.display = gizli.includes(ekranId) ? 'none' : 'flex';
}

// ── Çıkış ─────────────────────────────────────────────────────────────
function cikisYap() {
  if (typeof firebase !== 'undefined') firebase.auth().signOut();
  currentUser = null;
  kullaniciAdi = 'Misafir';
  localStorage.removeItem('bm_misafir');
  localStorage.removeItem('bm_son_ekran');
  ekranGoster('authScreen');
}

// ── Güvenlik yardımcıları ──────────────────────────────────────────────────

function htmlKacis(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function skorGecerliMi(puan, dogru, toplam, zorluk) {
  if (typeof puan !== 'number' || typeof dogru !== 'number' || typeof toplam !== 'number') return false;
  if (puan < 0 || puan > 12000) return false;
  if (dogru < 0 || dogru > toplam) return false;
  if (toplam < 1 || toplam > 20) return false;
  if (typeof zorluk !== 'string' || zorluk.length === 0) return false;
  return true;
}

// ──────────────────────────────────────────────────────────────────────────

async function firebaseEkle(veri) {
  if (!db || !currentUser) return;
  if (!skorGecerliMi(veri.puan, veri.dogru, veri.toplam, veri.zorluk)) return;
  try {
    await db.collection('scores').add({
      ...veri,
      uid: currentUser.uid,
      tarih: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(e) {}
}

async function firebaseGetir() {
  if (!db) return [];
  try {
    const snap = await db.collection('scores').orderBy('puan', 'desc').limit(10).get();
    return snap.docs.map(d => d.data());
  } catch(e) { return []; }
}

async function onlineLiderlikGoster() {
  const el = document.getElementById('onlineLiderboardList');
  if (!el) return;
  if (!db) {
    el.innerHTML = '<div style="text-align:center;color:var(--text3);padding:14px;font-size:0.8rem">⚙️ Global liderlik için Firebase henüz ayarlanmamış</div>';
    return;
  }
  el.innerHTML = '<div style="text-align:center;color:var(--text3);padding:14px;font-size:0.8rem">⏳ Yükleniyor...</div>';
  const veriler = await firebaseGetir();
  if (!veriler.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--text3);padding:14px;font-size:0.8rem">Henüz global kayıt yok</div>';
    return;
  }
  el.innerHTML = veriler.map((e, i) => {
    let ikon = `#${i+1}`;
    if (i===0) ikon='🥇'; else if (i===1) ikon='🥈'; else if (i===2) ikon='🥉';
    const tarih = e.tarih?.toDate?.()?.toLocaleDateString('tr-TR') || '';
    return `<div class="lb-row">
      <span class="lb-rank">${ikon}</span>
      <div class="lb-info"><div class="lb-name">${htmlKacis(e.isim)}</div><div class="lb-meta">${parseInt(e.dogru)||0}/${parseInt(e.toplam)||0} · ${htmlKacis(e.zorluk)} · ${htmlKacis(tarih)}</div></div>
      <span class="lb-score">${parseInt(e.puan)||0} puan</span>
    </div>`;
  }).join('');
}

// ═══════════════════════════
// ROZETLER
// ═══════════════════════════
function rozetKazanildiMi(id) {
  return JSON.parse(localStorage.getItem('bm_rozetler') || '[]').includes(id);
}

function rozetVer(id) {
  if (rozetKazanildiMi(id)) return false;
  const list = JSON.parse(localStorage.getItem('bm_rozetler') || '[]');
  list.push(id);
  localStorage.setItem('bm_rozetler', JSON.stringify(list));
  return true;
}

function rozetleriKontrolEt(gecenSure) {
  const yeni = [];
  if (dogruSayisi >= 1 && rozetVer('ilk_adim')) yeni.push('ilk_adim');
  if (maxStreak >= 5 && rozetVer('atesli')) yeni.push('atesli');
  if (maxStreak >= 8 && rozetVer('combo_king')) yeni.push('combo_king');
  if (dogruSayisi >= 10 && rozetVer('mukemmel')) yeni.push('mukemmel');
  if (toplamPuan >= 500 && rozetVer('sampiyon')) yeni.push('sampiyon');
  if (canSayisi === 3 && dogruSayisi > 0 && rozetVer('dokunulmaz')) yeni.push('dokunulmaz');
  if (gecenSure <= 60 && dogruSayisi >= 5 && rozetVer('hizli')) yeni.push('hizli');
  if (seciliZorluk === 'zor' && dogruSayisi >= 7 && rozetVer('zor_kahraman')) yeni.push('zor_kahraman');
  const katStats = JSON.parse(localStorage.getItem('bm_kat_stats') || '{}');
  const benzersiz = Object.keys(katStats).filter(k => k !== 'all' && katStats[k].oyun > 0);
  if (benzersiz.length >= 5 && rozetVer('bilge')) yeni.push('bilge');
  return yeni;
}

function rozetVitrinGuncelle() {
  const el = document.getElementById('rozetVitrin');
  if (!el) return;
  const list = JSON.parse(localStorage.getItem('bm_rozetler') || '[]');
  if (list.length === 0) {
    el.innerHTML = '<span class="rozet-bos">Henüz rozet kazanılmadı!</span>';
    return;
  }
  el.innerHTML = list.map(id => {
    const r = ROZETLER[id];
    return r ? `<div class="rozet-chip" title="${r.isim}: ${r.aciklama}">${r.icon}</div>` : '';
  }).join('');
}

// ═══════════════════════════
// KATEGORİ İSTATİSTİK
// ═══════════════════════════
function kategoriStatGuncelle() {
  const stats = JSON.parse(localStorage.getItem('bm_kat_stats') || '{}');
  const key = seciliKategori;
  if (!stats[key]) stats[key] = { oyun: 0, dogru: 0, toplam: 0 };
  stats[key].oyun++;
  stats[key].dogru += dogruSayisi;
  stats[key].toplam += sorular.length;
  localStorage.setItem('bm_kat_stats', JSON.stringify(stats));
}

function kategoriInsightGoster() {
  const el = document.getElementById('kategoriInsight');
  if (!el) return;
  const stats = JSON.parse(localStorage.getItem('bm_kat_stats') || '{}');
  const key = seciliKategori;
  if (!stats[key] || stats[key].toplam === 0) { el.style.display = 'none'; return; }
  const oran = Math.round(stats[key].dogru / stats[key].toplam * 100);
  const katIsim = key === 'all' ? 'Karışık' : (KATEGORI_BILGI[key]?.isim || key);
  el.style.display = 'flex';
  document.getElementById('insightLabel').textContent = `📊 ${katIsim} genel başarın`;
  document.getElementById('insightVal').textContent = `${oran}%`;
  document.getElementById('insightSub').textContent = `${stats[key].toplam} soruda ${stats[key].dogru} doğru`;
}

// ═══════════════════════════
// ANİMASYONLAR
// ═══════════════════════════
function sayacAnimasyonu(elementId, hedef, sure, suffix) {
  const el = document.getElementById(elementId);
  if (!el) return;
  let current = 0;
  const adim = hedef / (sure / 16);
  const timer = setInterval(() => {
    current += adim;
    if (current >= hedef) { current = hedef; clearInterval(timer); }
    el.textContent = Math.floor(current) + suffix;
  }, 16);
}

function konfeti() {
  const canvas = document.getElementById('konfetiCanvas');
  if (!canvas) return;
  canvas.style.display = 'block';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const renkler = ['#4f8fff','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#fbbf24'];
  const p = Array.from({length: 90}, () => ({
    x: Math.random() * canvas.width, y: -20,
    w: Math.random() * 8 + 4, h: Math.random() * 4 + 3,
    color: renkler[Math.floor(Math.random() * renkler.length)],
    vx: (Math.random() - 0.5) * 5, vy: Math.random() * 4 + 2,
    rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 12, opacity: 1
  }));
  let frame = 0;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    p.forEach(pt => {
      pt.y += pt.vy; pt.x += pt.vx; pt.rot += pt.rotV;
      if (frame > 80) pt.opacity -= 0.015;
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.opacity);
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.rot * Math.PI / 180);
      ctx.fillStyle = pt.color;
      ctx.fillRect(-pt.w / 2, -pt.h / 2, pt.w, pt.h);
      ctx.restore();
    });
    frame++;
    if (frame < 150) requestAnimationFrame(draw);
    else canvas.style.display = 'none';
  };
  draw();
}

function urlKontrolEt() {
  const params = new URLSearchParams(window.location.search);

  // Kategori ön seçimi: index.html?kat=tarih
  const kat = params.get('kat');
  if (kat && KATEGORI_BILGI[kat]) {
    seciliKategori = kat;
  }

  const ch = params.get('ch');
  if (!ch) return;
  // Sadece alfanümerik ve tire karakterine izin ver
  if (!/^\d+-\d+$/.test(ch)) { history.replaceState({}, '', window.location.pathname); return; }
  const parts = ch.split('-');
  if (parts.length !== 2) return;
  const seed = parseInt(parts[0], 10);
  const skor = parseInt(parts[1], 10);
  if (isNaN(seed) || isNaN(skor)) return;
  // Skor makul aralıkta değilse yoksay (sahte link koruması)
  if (skor < 0 || skor > 12000) { history.replaceState({}, '', window.location.pathname); return; }
  challengeSeed = seed;
  challengeSkor = skor;
  history.replaceState({}, '', window.location.pathname);
}

function meydanOkuLinki() {
  const seed = Date.now();
  const url = `${window.location.origin}${window.location.pathname}?ch=${seed}-${toplamPuan}`;
  if (navigator.share) {
    navigator.share({
      title: 'Merak — Meydan Okuma!',
      text: `Seni ${toplamPuan} puanla bekliyorum! Kabul edebilir misin? 🤺`,
      url
    }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(url)
      .then(() => toastGoster('🔗 Meydan okuma linki kopyalandı!', true))
      .catch(() => prompt('Linki kopyala:', url));
  }
}

function lbTabSec(tip, btn) {
  document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const localEl = document.getElementById('leaderboardList');
  const globalEl = document.getElementById('onlineLiderboardList');
  if (tip === 'local') {
    localEl.style.display = 'block';
    globalEl.style.display = 'none';
  } else {
    localEl.style.display = 'none';
    globalEl.style.display = 'block';
    onlineLiderlikGoster();
  }
}

// ═══════════════════════════
// OYUN MODLARI
// ═══════════════════════════
const MOD_BILGI = {
  klasik: { ac: '10 soru · 3 can · jokerler aktif',          sure: true,  canVar: true,  jokerVar: true,  soruSayisi: 10 },
  hiz:    { ac: '5sn/soru · can yok · joker yok · puan x2', sure: true,  canVar: false, jokerVar: false, soruSayisi: 10 },
  sonsuz: { ac: 'Süresiz · 3 can · yanlışta oyun biter',     sure: false, canVar: true,  jokerVar: true,  soruSayisi: 999 },
  sinav:  { ac: '20 soru · 1 kategoride · can yok',          sure: true,  canVar: false, jokerVar: false, soruSayisi: 20 }
};

function modSec(mod, btn) {
  oyunModu = mod;
  document.querySelectorAll('.mod-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  const ac = document.getElementById('modAciklama');
  if (ac) ac.textContent = MOD_BILGI[mod].ac;
  const timeRow = document.getElementById('timeRow');
  if (timeRow) timeRow.style.opacity = (mod === 'sonsuz') ? '0.4' : '1';
}

// ═══════════════════════════
// TEMA
// ═══════════════════════════
function temaDegistir() {
  document.body.classList.add('no-transition');
  const isLight = document.body.classList.toggle('light-mode');
  const temaBtn = document.getElementById('temaMod');
  if (temaBtn) temaBtn.textContent = isLight ? '☀️' : '🌙';
  localStorage.setItem('bm_tema', isLight ? 'light' : 'dark');
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('no-transition')));
}

function aksanDegistir(renk, btn) {
  document.body.classList.remove('accent-mor', 'accent-yesil');
  document.querySelectorAll('.tema-renk').forEach(b => b.classList.remove('selected'));
  if (renk !== 'mavi') document.body.classList.add('accent-' + renk);
  btn.classList.add('selected');
  localStorage.setItem('bm_aksan', renk);
}

function temaYukle() {
  const tema = localStorage.getItem('bm_tema');
  const aksan = localStorage.getItem('bm_aksan');
  if (tema === 'light') {
    document.body.classList.add('light-mode');
    const btn = document.getElementById('temaMod');
    if (btn) btn.textContent = '☀️';
  }
  if (aksan && aksan !== 'mavi') {
    document.body.classList.add('accent-' + aksan);
    document.querySelector('.tema-renk.' + aksan)?.classList.add('selected');
    document.querySelector('.tema-renk.mavi')?.classList.remove('selected');
  }
}

// ═══════════════════════════
// GÜNLÜK MEYDAN OKUMA
// ═══════════════════════════
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ═══════════════════════════
// MOOD CHECK
// ═══════════════════════════
function moodGuncelle(deger) {
  oyuncuMood = parseInt(deger);
  const mood = MOOD_SOZLER[oyuncuMood];

  const emojiEl = document.getElementById('moodEmoji');
  emojiEl.textContent = mood.emoji;
  emojiEl.classList.remove('pop');
  void emojiEl.offsetWidth;
  emojiEl.classList.add('pop');

  document.getElementById('moodValue').textContent = oyuncuMood;
  document.getElementById('moodText').textContent = mood.text;

  const moodColors = ['','#ef4444','#f97316','#f59e0b','#eab308','#22c55e','#4f8fff','#8b5cf6','#a855f7','#ec4899','#fbbf24'];
  document.documentElement.style.setProperty('--mood-color', moodColors[oyuncuMood]);
}

function moodOnayla() {
  kullaniciAdi = document.getElementById('isimInput').value.trim() || 'Misafir';
  ekranGoster('homeScreen');
  kategorileriYukle();
  liderlikGoster();
  rozetVitrinGuncelle();
  challengeBannerGuncelle();
  streakYukle();
  wordleBannerGuncelle();
}

// ═══════════════════════════
// KATEGORİLER
// ═══════════════════════════
function katStatClass(st) {
  const oran = st.toplam > 0 ? st.dogru / st.toplam : 0;
  return oran >= 0.7 ? 'iyi' : oran >= 0.4 ? 'orta' : 'kotu';
}

function kategorileriYukle() {
  const grid = document.getElementById('categoryGrid');
  const stats = JSON.parse(localStorage.getItem('bm_kat_stats') || '{}');

  function statHtml(key) {
    const st = stats[key];
    if (!st || st.toplam === 0) return '';
    const pct = Math.round(st.dogru / st.toplam * 100);
    return `<div class="cat-stat ${katStatClass(st)}">%${pct}</div>`;
  }

  function katIkonHtml(bilgi) {
    if (bilgi.img) {
      return `<span class="cat-icon"><img src="${bilgi.img}" alt="${bilgi.isim}" class="cat-img" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<span class=\\'cat-emoji\\'>${bilgi.emoji}</span>'"></span>`;
    }
    return `<span class="cat-icon"><span class="cat-emoji">${bilgi.emoji}</span></span>`;
  }

  let html = `<div class="cat-btn ${seciliKategori === 'all' ? 'selected' : ''}" data-cat="all" onclick="kategoriSec('all', this)">
    <span class="cat-icon"><span class="cat-emoji">🎲</span></span><span class="cat-name">Karışık</span>
    ${statHtml('all')}</div>`;

  for (const [key, bilgi] of Object.entries(KATEGORI_BILGI)) {
    html += `<div class="cat-btn ${seciliKategori === key ? 'selected' : ''}" data-cat="${key}" onclick="kategoriSec('${key}', this)">
      ${katIkonHtml(bilgi)}<span class="cat-name">${bilgi.isim}</span>
      ${statHtml(key)}</div>`;
  }
  grid.innerHTML = html;

  // URL'den gelen kategori varsa butona kaydır
  if (seciliKategori !== 'all') {
    const btn = grid.querySelector(`[data-cat="${seciliKategori}"]`);
    if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

function kategoriSec(kat, el) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  seciliKategori = kat;

  // Bayrak kategorisi için zorluk seçimini gizle/göster
  const zorlukSatiri = document.getElementById('zorlukRow');
  if (zorlukSatiri) {
    zorlukSatiri.style.display = 'flex'; // Satırı her zaman göster
    document.querySelectorAll('.diff-btn').forEach(btn => {
      if (kat === 'bayrak' || kat === 'logo') {
        btn.disabled = true;
        btn.style.opacity = '0.3';
        btn.style.pointerEvents = 'none';
      } else {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      }
    });
  }
}

// ═══════════════════════════
// ZORLUK & SÜRE
// ═══════════════════════════
function zorlukSec(seviye, btn) {
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  seciliZorluk = seviye;
}

function sureSec(saniye, btn) {
  document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  seciliSure = saniye;
}

// ═══════════════════════════
// QUIZ BAŞLAT — fonksiyonlar quiz.js'te
// ═══════════════════════════

function ekranGoster(id, geri = false) {
  if (id === 'homeScreen' && window.STANDALONE && document.body.style.visibility !== 'hidden') {
    window.parent.postMessage('oyunKapat', '*');
    return;
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active', 'slide-back'));
  const el = document.getElementById(id);
  if (geri) el.classList.add('slide-back');
  el.classList.add('active');
  window.scrollTo(0, 0);
  const RESTORABLE = ['homeScreen', 'profileScreen', 'yanlisScreen', 'storeScreen', 'questScreen', 'wordleScreen', 'flashcardScreen'];
  if (RESTORABLE.includes(id)) localStorage.setItem('bm_son_ekran', id);
  if (id === 'authScreen') localStorage.removeItem('bm_son_ekran');
  fabKapat();
  fabEkranaGore(id);
}

// SORU GÖSTER, JOKER, CEVAP VER, SÜRE, SONUÇ — quiz.js'te

// ═══════════════════════════
// LİDERLİK
// ═══════════════════════════
function liderlikKaydet() {
  let lb = JSON.parse(localStorage.getItem('bm_quiz_liderlik') || '[]');
  lb.push({
    isim: kullaniciAdi,
    puan: toplamPuan,
    dogru: dogruSayisi,
    toplam: sorular.length,
    mood: oyuncuMood,
    zorluk: seciliZorluk,
    tarih: new Date().toLocaleDateString('tr-TR')
  });
  lb.sort((a, b) => b.puan - a.puan);
  localStorage.setItem('bm_quiz_liderlik', JSON.stringify(lb.slice(0, 20)));
}

function liderlikGoster() {
  const lb = JSON.parse(localStorage.getItem('bm_quiz_liderlik') || '[]');
  const container = document.getElementById('leaderboardList');
  if (!container) return;
  
  container.innerHTML = lb.slice(0, 10).map((e, i) => {
    const ikon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`;
    const isBen = e.isim === kullaniciAdi;
    const avatarHarf = (e.isim || '?')[0].toUpperCase();
    return `<div class="lb-row${isBen ? ' lb-row-ben' : ''}">
      <span class="lb-rank">${ikon}</span>
      <div class="lb-avatar-circle">${avatarHarf}</div>
      <div class="lb-info">
        <div class="lb-name">${htmlKacis(e.isim)}${isBen ? ' <span class="lb-sen">· Sen</span>' : ''}</div>
        <div class="lb-meta">${parseInt(e.dogru)||0}/${parseInt(e.toplam)||0} · ${htmlKacis(e.zorluk)} · ${htmlKacis(e.tarih)}</div>
      </div>
      <span class="lb-score">${parseInt(e.puan)||0}</span>
    </div>`;
  }).join('') || '<div style="text-align:center;color:var(--text3);padding:10px;font-size:0.8rem">Henüz skor yok</div>';
}

// ═══════════════════════════
// YARDIMCILAR
// ═══════════════════════════
function anaSayfa() {
  quizMedyaDurdur();
  if (window.STANDALONE) { window.parent.postMessage('oyunKapat', '*'); return; }
  ekranGoster('homeScreen', true);
  kategorileriYukle();
  liderlikGoster();
  rozetVitrinGuncelle();
  challengeBannerGuncelle();
  streakYukle();
  wordleBannerGuncelle();
  beynPuaniGoster();
  yanlisKutusuBannerGuncelle();
  miniProfilGuncelle();
  edBaslat();
}

// ═══════════════════════════
// MODAL SİSTEMİ
// ═══════════════════════════
const MODAL_ICERIKLER = {
  hakkinda: {
    baslik: '💡 Hakkında',
    html: `
      <p><strong>Merak</strong> — Türkçe bilgi yarışması ve trivia quiz platformu.</p>
      <h3>Ne Sunuyoruz?</h3>
      <p>Tarih, bilim, spor, sanat, coğrafya, sinema, müzik, edebiyat, mitoloji ve daha fazlasında 1600'den fazla soru. Günlük quiz, kelime oyunu (Tahminle), rozet sistemi ve küresel liderlik tablosu.</p>
      <h3>Geliştirici</h3>
      <div class="info-chip">👨‍💻 Barış Kızıl &nbsp;·&nbsp; <a href="https://merak.io" target="_blank">merak.io</a></div>
      <h3>Sürüm</h3>
      <div class="info-chip">🚀 v1.0 &nbsp;·&nbsp; 2026</div>
    `
  },
  gizlilik: {
    baslik: '🔒 Gizlilik Politikası',
    html: `
      <p style="color:var(--text-muted);font-size:0.85rem">Son güncelleme: Mayıs 2026 &nbsp;·&nbsp; KVKK Uyumlu</p>

      <h3>Veri Sorumlusu</h3>
      <p><strong>merak.io</strong> platformunun veri sorumlusu Barış Kızıl'dır. 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamındaki haklarınız için <button onclick="iletisimMailAc()" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:inherit;padding:0;text-decoration:underline">iletişime geçebilirsiniz</button>.</p>

      <h3>İşlenen Kişisel Veriler</h3>
      <p><strong>Google ile giriş yapanlar:</strong> Ad-soyad ve e-posta adresi Google OAuth aracılığıyla alınır; yalnızca hesap tanımlaması ve liderlik tablosunda görünecek kullanıcı adı için işlenir.</p>
      <p><strong>Anonim oyuncular:</strong> Herhangi bir kişisel veri işlenmez.</p>

      <h3>İşleme Amacı ve Hukuki Dayanağı</h3>
      <p>Verileriniz KVKK Madde 5/2-f kapsamında <em>meşru menfaat</em> ve Madde 5/1 kapsamında <em>açık rıza</em> temelinde; hizmetin sunulması, liderlik tablosunun oluşturulması ve platform güvenliğinin sağlanması amacıyla işlenmektedir.</p>

      <h3>Yerel Depolama (localStorage)</h3>
      <p>Oyun istatistikleriniz (streak, rozetler, yanlış kutusu, kategori puanları) yalnızca cihazınızda saklanır. Bu veriler sunucuya gönderilmez ve tarayıcı geçmişini temizleyerek her zaman silinebilir.</p>

      <h3>Veri Güvenliği</h3>
      <p>Tüm veriler Google Firebase altyapısı üzerinde TLS/SSL şifreli iletimle işlenir. Firestore güvenlik kuralları yalnızca yetkili kullanıcıların kendi verilerine erişmesine izin verir.</p>

      <h3>Üçüncü Taraf Paylaşımı</h3>
      <p>Kişisel verileriniz hiçbir üçüncü tarafa satılmaz, kiralanmaz veya pazarlama amaçlı paylaşılmaz. Yalnızca Google Firebase hizmeti kullanılmaktadır (<a href="https://firebase.google.com/support/privacy" target="_blank" style="color:var(--accent)">Firebase Gizlilik Politikası</a>).</p>

      <h3>Saklama Süresi</h3>
      <p>Liderlik tablosu kayıtları süresiz saklanabilir. Hesabınızı silmek veya verilerinizin kaldırılmasını talep etmek için iletişime geçin; talebiniz 30 gün içinde yerine getirilir.</p>

      <h3>KVKK Kapsamındaki Haklarınız</h3>
      <p>Madde 11 uyarınca; verilerinize erişme, düzeltme, silme, işlemeye itiraz etme ve taşınabilirlik haklarına sahipsiniz. Bu haklarınızı kullanmak için <button onclick="iletisimMailAc()" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:inherit;padding:0;text-decoration:underline">yazılı başvuru yapabilirsiniz</button>.</p>
    `
  },
  kosullar: {
    baslik: '📋 Kullanım Koşulları',
    html: `
      <p style="color:var(--text-muted);font-size:0.85rem">Son güncelleme: Mayıs 2026 &nbsp;·&nbsp; Türk Hukuku Uygulanır</p>

      <h3>Taraflar ve Hizmet</h3>
      <p><strong>merak.io</strong> ("Platform"), Barış Kızıl tarafından işletilen, Türkçe genel kültür ve trivia soruları sunan ücretsiz bir eğitim-eğlence uygulamasıdır. Platformu kullanarak bu koşulları kabul etmiş sayılırsınız.</p>

      <h3>Fikri Mülkiyet ve Marka Hakları</h3>
      <p><strong>merak.io</strong> adı, logosu, tasarımı, arayüzü ve soru içerikleri telif hakkı ve fikri mülkiyet hukuku kapsamında koruma altındadır.</p>
      <ul style="padding-left:1.2rem;line-height:1.9">
        <li>Platform adı ve logosu izinsiz kullanılamaz, taklit edilemez veya ticari amaçla çoğaltılamaz.</li>
        <li>Soru içerikleri, tasarım öğeleri ve yazılım kodu <strong>© 2026 merak.io — Tüm hakları saklıdır.</strong></li>
        <li>İçeriklerin izinsiz kopyalanması, dağıtılması veya türev eser oluşturulması yasaktır.</li>
      </ul>

      <h3>İzin Verilen Kullanım</h3>
      <p>Platform yalnızca kişisel, ticari olmayan ve eğitim amaçlı kullanım içindir. Sosyal medyada paylaşım ve arkadaşlara tanıtım serbesttir.</p>

      <h3>Yasaklanan Kullanım</h3>
      <ul style="padding-left:1.2rem;line-height:1.9">
        <li>Otomatik araçlar (bot, scraper, makro) ile platform kullanımı</li>
        <li>Liderlik tablosunu manipüle etmeye yönelik girişimler</li>
        <li>Platformu tersine mühendislik ile kopyalamak veya rakip ürün geliştirmek</li>
        <li>Başka kullanıcıların verilerine yetkisiz erişim sağlamak</li>
      </ul>

      <h3>Sorumluluk Reddi</h3>
      <p>Platform "olduğu gibi" sunulmaktadır. Kesintisiz erişim veya hatasız içerik garantisi verilmez. Hatalı sorular için 🚩 bildirim mekanizması mevcuttur; platform doğru cevabı tescil etmez, sorumluluk kabul etmez.</p>

      <h3>Uygulanacak Hukuk</h3>
      <p>Bu koşullar Türk Hukuku'na tabidir. Uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.</p>

      <h3>Değişiklikler</h3>
      <p>Koşullar önceden bildirilmeksizin güncellenebilir. Güncel koşullar her zaman bu sayfada yayımlanır. Platformu kullanmaya devam etmek güncel koşulları kabul etmek anlamına gelir.</p>
    `
  },
  iletisim: {
    baslik: '✉️ İletişim',
    html: `
      <p>Soru, öneri veya hata bildirimi için ulaşabilirsiniz.</p>
      <h3>E-posta</h3>
      <div class="info-chip">📧 <button onclick="iletisimMailAc()" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:inherit;padding:0">E-posta gönder</button></div>
      <h3>Hatalı Soru Bildirimi</h3>
      <p>Quiz sırasında 🚩 butonuna basarak hatalı soruları doğrudan bildirebilirsiniz.</p>
      <h3>Web</h3>
      <div class="info-chip">🌐 <a href="https://merak.io" target="_blank">merak.io</a></div>
    `
  }
};

function iletisimMailAc() {
  const p = ['kizilbaris85', 'gmail.com'];
  window.location.href = 'mailto:' + p[0] + '\x40' + p[1];
}

function modalAc(tip) {
  const data = MODAL_ICERIKLER[tip];
  if (!data) return;
  document.getElementById('modalBaslik').textContent = data.baslik;
  document.getElementById('modalIcerik').innerHTML = data.html;
  document.getElementById('modalOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function modalKapat() {
  document.getElementById('modalOverlay').classList.remove('show');
  document.body.style.overflow = '';
}

let klavyeSeciliIdx = -1;

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { modalKapat(); return; }

  if (document.getElementById('quizScreen')?.classList.contains('active')) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const keyMap = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
    if (e.key in keyMap && !cevaplandi) {
      const idx = keyMap[e.key];
      const btns = document.querySelectorAll('#optionsList .option-btn');
      const btn = btns[idx];
      if (!btn || btn.classList.contains('disabled')) return;
      btns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      klavyeSeciliIdx = idx;
      return;
    }

    if (e.key === 'Enter') {
      const nextBtn = document.getElementById('nextBtn');
      if (nextBtn?.classList.contains('show')) { nextBtnTikla(); return; }
      if (!cevaplandi && klavyeSeciliIdx >= 0) {
        const btn = document.querySelectorAll('#optionsList .option-btn')[klavyeSeciliIdx];
        if (btn && !btn.classList.contains('disabled')) btn.click();
      }
      return;
    }
  }
});


function paylasWhatsApp() {
  const metin = `🎯 Merak oyununda ${dogruSayisi}/10 doğru yaptım ve ${toplamPuan} puan aldım!\n\nSen de dene: https://merak.io`;
  window.open(`https://wa.me/?text=${encodeURIComponent(metin)}`, '_blank');
}

function paylasTwitter() {
  const metin = `🎯 Merak oyununda ${dogruSayisi}/10 doğru yaparak ${toplamPuan} puan aldım! Sen de dene 👇`;
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(metin)}&url=${encodeURIComponent('https://merak.io')}`, '_blank');
}

function toastGoster(mesaj, dogru) {
  const t = document.getElementById('toast');
  t.textContent = mesaj;
  t.className = 'toast show ' + (dogru ? 'correct' : 'wrong');
  setTimeout(() => t.classList.remove('show'), 1800);
}

// ═══════════════════════════
// GÜNLÜK SERİ (STREAK)
// ═══════════════════════════
function streakGuncelle() {
  const bugun = new Date().toDateString();
  const dun = new Date(Date.now() - 86400000).toDateString();
  let data = JSON.parse(localStorage.getItem('bm_streak') || '{"son_tarih":"","mevcut":0,"maksimum":0}');

  if (data.son_tarih === bugun) {
    // Bu gün zaten oynadı, sadece göster
  } else if (data.son_tarih === dun) {
    data.mevcut++;
    if (data.mevcut > data.maksimum) data.maksimum = data.mevcut;
    data.son_tarih = bugun;
    localStorage.setItem('bm_streak', JSON.stringify(data));
    if (data.mevcut >= 3) toastGoster(`🔥 ${data.mevcut} günlük seri! Harika!`, true);
  } else {
    data.mevcut = 1;
    if (data.maksimum < 1) data.maksimum = 1;
    data.son_tarih = bugun;
    localStorage.setItem('bm_streak', JSON.stringify(data));
  }

  streakBannerGoster(data);
}

function streakBannerGoster(data) {
  const banner = document.getElementById('gunlukStreakBanner');
  if (!banner) return;

  // Mobil header streak chip
  const mobilChip = document.getElementById('mobilStreakChip');
  const mobilSayi = document.getElementById('mobilStreakSayi');
  if (mobilChip && mobilSayi) {
    if (data.mevcut >= 1) {
      mobilChip.style.display = 'block';
      mobilSayi.textContent = data.mevcut;
    } else {
      mobilChip.style.display = 'none';
    }
  }

  if (data.mevcut >= 1) {
    banner.style.display = 'flex';
    document.getElementById('streakSayi').textContent = data.mevcut;
    document.getElementById('streakRecord').textContent = `🏆 En iyi: ${data.maksimum} gün`;
    const durum = document.getElementById('streakDurum');
    if (durum) {
      if (data.mevcut >= 30)      { durum.textContent = '🔥 Efsane!';    durum.style.color = '#f59e0b'; }
      else if (data.mevcut >= 14) { durum.textContent = '⚡ Muhteşem!'; durum.style.color = '#8b5cf6'; }
      else if (data.mevcut >= 7)  { durum.textContent = '💪 Harika!';   durum.style.color = '#10b981'; }
      else if (data.mevcut >= 3)  { durum.textContent = '🌱 İyi gidiyor!'; durum.style.color = '#4f8fff'; }
      else                        { durum.textContent = 'Devam et!';    durum.style.color = 'var(--text3)'; }
    }
  } else {
    banner.style.display = 'none';
  }
}

function streakKoptuKontrol() {
  const dun = new Date(Date.now() - 86400000).toDateString();
  const data = JSON.parse(localStorage.getItem('bm_streak') || '{}');
  if (data.mevcut > 1 && data.son_tarih && data.son_tarih !== new Date().toDateString() && data.son_tarih !== dun) {
    setTimeout(() => toastGoster(`💔 ${data.mevcut} günlük serin koptu! Yeniden başla.`), 1200);
    data.mevcut = 0;
    localStorage.setItem('bm_streak', JSON.stringify(data));
  }
}

function streakYukle() {
  streakKoptuKontrol();
  const data = JSON.parse(localStorage.getItem('bm_streak') || '{"son_tarih":"","mevcut":0,"maksimum":0}');
  streakBannerGoster(data);
}

// ═══════════════════════════
// SORU RAPORLAMA
// ═══════════════════════════
function soruRaporla() {
  const btn = document.getElementById('raporBtn');
  if (btn?.classList.contains('raporlandi')) return;
  const soru = sorular[soruIndex];
  if (!soru) return;
  const raporlar = JSON.parse(localStorage.getItem('bm_raporlar') || '[]');
  raporlar.push({ q: soru.q, kategori: seciliKategori, zorluk: seciliZorluk, tarih: new Date().toLocaleDateString('tr-TR') });
  localStorage.setItem('bm_raporlar', JSON.stringify(raporlar));
  if (btn) { btn.classList.add('raporlandi'); btn.textContent = '✓'; }
  toastGoster('🚩 Soru raporlandı, teşekkürler!', true);
}

// ═══════════════════════════
// BİLDİRİM
// ═══════════════════════════
async function bildirimIzniIste() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
  if (Notification.permission === 'granted') { fcmTokenAlVeKaydet(); return; }
  if (Notification.permission === 'denied') return;
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    toastGoster('🔔 Günlük hatırlatıcı açıldı!', true);
    fcmTokenAlVeKaydet();
  }
}

async function fcmTokenAlVeKaydet() {
  if (!messaging || !currentUser || !db) return;
  try {
    // VAPID anahtarı eklendi
    const token = await messaging.getToken({ vapidKey: 'BBHwuF6k1t3cwnVjfUctG68xBtxXe02nv3yeq7V__ByWK7QfxSumC2hgjD3UhKu_xcyYplabUkoe1KmL7tMGrvg' });
    if (token) {
      const btn = document.getElementById('bildirimBtn');
      if (btn) btn.style.display = 'none'; // İzin verildiyse butonu gizle
      
      await db.collection('users').doc(currentUser.uid).set({
        fcmToken: token,
        isim: kullaniciAdi
      }, { merge: true });
    }
  } catch (error) {
    console.error('FCM Token hatası:', error);
  }
}

// ═══════════════════════════
// PWA
// ═══════════════════════════
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBtn')?.classList.add('show');
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  document.getElementById('installBtn')?.classList.remove('show');
  toastGoster('✅ Uygulama ana ekrana eklendi!', true);
});

function uygulamaKur() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    deferredPrompt = null;
    document.getElementById('installBtn')?.classList.remove('show');
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
    // Yeni SW devreye girince sayfayı otomatik yenile
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing && !window.STANDALONE) { refreshing = true; window.location.reload(); }
    });
  });
}

// ═══════════════════════════
// PROFİL
// ═══════════════════════════
// ═══════════════════════════════════════
// BEYİN HARİTASI — Radar Chart
// ═══════════════════════════════════════
function beynHaritasiCiz() {
  const wrap = document.querySelector('.bh-wrap');
  const canvas = document.getElementById('beynHaritasi');
  if (!canvas || !wrap) return;

  const katStats = JSON.parse(localStorage.getItem('bm_kat_stats') || '{}');
  const kategoriler = Object.entries(KATEGORI_BILGI)
    .filter(([k]) => katStats[k]?.toplam >= 1)
    .map(([k, b]) => ({
      key: k, isim: b.isim, emoji: b.emoji,
      oran: Math.min(1, (katStats[k]?.dogru || 0) / (katStats[k]?.toplam || 1))
    }));

  if (kategoriler.length < 3) {
    wrap.innerHTML = '<div class="bh-bos">🧠 En az 3 farklı kategoride oynayınca beyin haritası oluşur</div>';
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const size = 180;
  canvas.width = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + 'px'; canvas.style.height = size + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const cx = size / 2, cy = size / 2, maxR = size / 2 - 28;
  const n = kategoriler.length;

  const pt = (i, r) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  // Arka plan ızgara
  [0.25, 0.5, 0.75, 1].forEach(lv => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p = pt(i, maxR * lv);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = lv === 1 ? 'rgba(79,143,255,0.18)' : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1; ctx.stroke();
  });

  // Eksenler
  for (let i = 0; i < n; i++) {
    const p = pt(i, maxR);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.stroke();
  }

  // Veri poligonu
  ctx.beginPath();
  kategoriler.forEach((k, i) => {
    const p = pt(i, maxR * Math.max(0.04, k.oran));
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  grad.addColorStop(0, 'rgba(139,92,246,0.35)');
  grad.addColorStop(1, 'rgba(79,143,255,0.15)');
  ctx.fillStyle = grad; ctx.fill();
  ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2; ctx.stroke();

  // Nokta ve emoji
  kategoriler.forEach((k, i) => {
    const p = pt(i, maxR * Math.max(0.04, k.oran));
    const renk = k.oran >= 0.7 ? '#10b981' : k.oran >= 0.4 ? '#f59e0b' : '#ef4444';
    ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = renk; ctx.fill();
    ctx.strokeStyle = '#0a0b10'; ctx.lineWidth = 1.5; ctx.stroke();

    // Emoji etiket
    const lp = pt(i, maxR + 14);
    ctx.font = '12px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(k.emoji, lp.x, lp.y);
  });

  // Legend
  const legend = document.getElementById('bhLegend');
  if (legend) {
    legend.innerHTML = kategoriler
      .slice().sort((a, b) => b.oran - a.oran)
      .map(k => {
        const renk = k.oran >= 0.7 ? '#10b981' : k.oran >= 0.4 ? '#f59e0b' : '#ef4444';
        return `<div class="bh-legend-item">
          <div class="bh-legend-dot" style="background:${renk}"></div>
          <span class="bh-legend-kat">${k.isim}</span>
          <span class="bh-legend-pct" style="color:${renk}">${Math.round(k.oran * 100)}%</span>
        </div>`;
      }).join('');
  }
}

// ═══════════════════════════════════════
// SEZON SİSTEMİ
// ═══════════════════════════════════════
// ═══════════════════════════════════════════════════
// 1v1 DÜELLO SİSTEMİ
// ═══════════════════════════════════════════════════
let dvOdaRef = null;
let dvListener = null;
let dvSorular = [];
let dvSoruIndex = 0;
let dvPuan = 0;
let dvRakipPuan = 0;
let dvCevaplandi = false;
let dvTimerInterval = null;
let dvKalanSure = 15;
let dvRolum = null; // 'ev_sahibi' | 'rakip'
let dvOdaKodu = null;

function dvKodOlustur() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function dvSorularUret(seed) {
  const rand = mulberry32(seed);
  let tumSorular = [];
  for (const kat of Object.keys(SORU_HAVUZU)) {
    if (SORU_HAVUZU[kat]?.hepsi) tumSorular.push(...SORU_HAVUZU[kat].hepsi);
  }
  for (let i = tumSorular.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [tumSorular[i], tumSorular[j]] = [tumSorular[j], tumSorular[i]];
  }
  return tumSorular.slice(0, 10).map(s => {
    const dogru = s.o[s.a];
    const opts = [...s.o].sort(() => rand() - 0.5);
    return { q: s.q, o: opts, a: opts.indexOf(dogru), e: s.e, img: s.img, audio: s.audio };
  });
}

function dvEkranGoster() {
  ekranGoster('dvScreen');
  dvGirisRender();
}

function dvGirisRender() {
  document.getElementById('dvIcerik').innerHTML = `
    <div class="dv-giris">
      <div class="dv-giris-logo">⚔️</div>
      <div class="dv-giris-baslik">1v1 Düello</div>
      <div class="dv-giris-alt">Arkadaşınla gerçek zamanlı quiz yarışı</div>
      <button class="dv-btn-red" onclick="dvOdaOlustur()">🏠 Oda Oluştur</button>
      <div class="dv-ayrac">— veya —</div>
      <input class="dv-kod-input" id="dvKodInput" placeholder="XXXX" maxlength="4"
        oninput="this.value=this.value.toUpperCase()" autocomplete="off">
      <button class="btn btn-primary" onclick="dvOdaKatil()">🚪 Odaya Katıl</button>
    </div>`;
}

async function dvOdaOlustur() {
  if (!db) { toastGoster('Firebase bağlantısı gerekli'); return; }
  if (!currentUser) { toastGoster('Giriş yapman gerekiyor'); return; }
  const kod = dvKodOlustur();
  dvOdaKodu = kod;
  dvRolum = 'ev_sahibi';
  dvOdaRef = db.collection('rooms').doc(kod);
  try {
    await dvOdaRef.set({
      ev_sahibi: { uid: currentUser.uid, isim: kullaniciAdi, puan: 0, soru: 0, bitti: false },
      rakip: null,
      durum: 'bekliyor',
      seed: Date.now(),
      olusturma: firebase.firestore.FieldValue.serverTimestamp()
    });
    dvBekleyenRender(kod);
    dvDinle();
  } catch(e) { toastGoster('Oda oluşturulamadı'); }
}

function dvBekleyenRender(kod) {
  document.getElementById('dvIcerik').innerHTML = `
    <div class="dv-bekliyor">
      <div class="dv-oda-kodu-box">
        <div class="dv-oda-kodu-label">ODA KODU</div>
        <div class="dv-oda-kodu-text">${kod}</div>
      </div>
      <div class="dv-spinner">⏳ Rakip bekleniyor...</div>
      <button class="btn" onclick="dvPaylas('${kod}')" style="width:100%">📤 Kodu Paylaş</button>
    </div>`;
}

function dvPaylas(kod) {
  const msg = `Merak 1v1 düellosuna davet edildin!\nOda kodu: ${kod}\nmerak.io`;
  if (navigator.share) navigator.share({ title: 'Düello Daveti', text: msg }).catch(() => {});
  else { navigator.clipboard?.writeText(kod); toastGoster('Kod kopyalandı: ' + kod); }
}

async function dvOdaKatil() {
  if (!db) { toastGoster('Firebase bağlantısı gerekli'); return; }
  if (!currentUser) { toastGoster('Giriş yapman gerekiyor'); return; }
  const kod = (document.getElementById('dvKodInput')?.value || '').trim().toUpperCase();
  if (kod.length !== 4) { toastGoster('4 haneli kodu gir'); return; }
  dvOdaKodu = kod;
  dvRolum = 'rakip';
  dvOdaRef = db.collection('rooms').doc(kod);
  try {
    const snap = await dvOdaRef.get();
    if (!snap.exists) { toastGoster('Oda bulunamadı'); return; }
    const data = snap.data();
    if (data.durum !== 'bekliyor') { toastGoster('Bu oda dolu veya oyun başladı'); return; }
    if (data.ev_sahibi?.uid === currentUser.uid) { toastGoster('Kendi odana katılamazsın'); return; }
    await dvOdaRef.update({
      rakip: { uid: currentUser.uid, isim: kullaniciAdi, puan: 0, soru: 0, bitti: false },
      durum: 'lobide'
    });
    dvDinle();
  } catch(e) { toastGoster('Odaya katılınamadı'); }
}

function dvDinle() {
  if (dvListener) dvListener();
  dvListener = dvOdaRef.onSnapshot(snap => {
    if (!snap.exists) return;
    const data = snap.data();
    if (data.durum === 'lobide' && dvRolum === 'ev_sahibi') dvLobiRender(data);
    else if (data.durum === 'lobide' && dvRolum === 'rakip') dvLobiRender(data);
    else if (data.durum === 'oynaniyor') dvOyunGuncelle(data);
    else if (data.durum === 'bitti') dvSonucGoster(data);
  });
}

function dvLobiRender(data) {
  const es = data.ev_sahibi;
  const r = data.rakip || {};
  document.getElementById('dvIcerik').innerHTML = `
    <div class="dv-lobi">
      <div class="dv-oyuncular">
        <div class="dv-oyuncu">
          <div class="dv-oyuncu-av">${(es.isim||'?').charAt(0)}</div>
          <div class="dv-oyuncu-isim">${htmlKacis(es.isim || '?')}</div>
          <div class="dv-hazir-chip hazir">Hazır ✓</div>
        </div>
        <div class="dv-vs">VS</div>
        <div class="dv-oyuncu">
          <div class="dv-oyuncu-av rakip">${(r.isim||'?').charAt(0)}</div>
          <div class="dv-oyuncu-isim">${htmlKacis(r.isim || 'Bekleniyor...')}</div>
          ${r.isim ? '<div class="dv-hazir-chip hazir">Hazır ✓</div>' : '<div class="dv-hazir-chip bekliyor">Bekleniyor</div>'}
        </div>
      </div>
      ${dvRolum === 'ev_sahibi' && data.rakip
        ? `<button class="dv-btn-red" onclick="dvBaslat()">🚀 Oyunu Başlat!</button>`
        : `<div class="dv-spinner">⏳ Ev sahibinin başlatması bekleniyor...</div>`}
    </div>`;
}

async function dvBaslat() {
  if (!dvOdaRef || dvRolum !== 'ev_sahibi') return;
  const snap = await dvOdaRef.get();
  const seed = snap.data().seed;
  dvSorular = dvSorularUret(seed);
  await dvOdaRef.update({ durum: 'oynaniyor' });
}

function dvOyunGuncelle(data) {
  const benim = data[dvRolum];
  const rakipRol = dvRolum === 'ev_sahibi' ? 'rakip' : 'ev_sahibi';
  const rakip = data[rakipRol];

  // Soruları henüz üretmedik (rakip taraf için)
  if (dvSorular.length === 0) {
    dvSorular = dvSorularUret(data.seed);
    dvSoruIndex = 0; dvPuan = 0; dvCevaplandi = false;
  }

  dvRakipPuan = rakip?.puan || 0;
  dvSkordaGuncelle(benim?.isim || kullaniciAdi, dvPuan, rakip?.isim || 'Rakip', dvRakipPuan);

  // Her iki oyuncu da bittiyse
  if (benim?.bitti && rakip?.bitti) {
    if (dvListener) { dvListener(); dvListener = null; }
    return;
  }

  if (dvSoruIndex < dvSorular.length && !dvCevaplandi) dvSoruRender();
}

function dvSkordaGuncelle(benimIsim, benimPuan, rakipIsim, rakipPuan) {
  const bar = document.getElementById('dvSkorBar');
  if (bar) {
    bar.querySelector('.dv-skor-sen .dv-skor-isim').textContent = benimIsim;
    bar.querySelector('.dv-skor-sen .dv-skor-puan').textContent = benimPuan + 'p';
    bar.querySelector('.dv-skor-rakip .dv-skor-isim').textContent = rakipIsim;
    bar.querySelector('.dv-skor-rakip .dv-skor-puan').textContent = rakipPuan + 'p';
  }
}

function dvSoruRender() {
  quizMedyaDurdur();
  if (dvSoruIndex >= dvSorular.length) { dvBit(); return; }
  const soru = dvSorular[dvSoruIndex];
  dvCevaplandi = false;
  dvKalanSure = 15;

  document.getElementById('dvIcerik').innerHTML = `
    <div class="dv-quiz">
      <div id="dvSkorBar" class="dv-skor-bar">
        <div class="dv-skor-sen">
          <div class="dv-skor-isim">${htmlKacis(kullaniciAdi)}</div>
          <div class="dv-skor-puan">${dvPuan}p</div>
        </div>
        <div class="dv-skor-vs">⚔️</div>
        <div class="dv-skor-rakip">
          <div class="dv-skor-isim">Rakip</div>
          <div class="dv-skor-puan">${dvRakipPuan}p</div>
        </div>
      </div>
      <div class="dv-timer-bar"><div class="dv-timer-fill" id="dvTimerFill" style="width:100%"></div></div>
      <div class="dv-progress"><div class="dv-progress-fill" style="width:${((dvSoruIndex)/10)*100}%"></div></div>
      <div class="dv-soru-no">SORU ${dvSoruIndex + 1} / 10</div>
      ${soru.img ? `<div class="media-container show"><img src="${soru.img}" class="quiz-image"></div>` : ''}
      ${soru.audio ? `<div class="media-container show"><audio src="${soru.audio}" class="quiz-audio" controls autoplay></audio></div>` : ''}
      <div class="dv-soru-text">${htmlKacis(soru.q)}</div>
      <div class="dv-secenekler">
        ${soru.o.map((opt, i) => `<button class="dv-secenek" onclick="dvCevapla(${i})">${htmlKacis(opt)}</button>`).join('')}
      </div>
    </div>`;

  dvTimerBaslat();
}

function dvTimerBaslat() {
  if (dvTimerInterval) clearInterval(dvTimerInterval);
  dvKalanSure = 15;
  dvTimerInterval = setInterval(() => {
    dvKalanSure--;
    const fill = document.getElementById('dvTimerFill');
    if (fill) {
      fill.style.width = (dvKalanSure / 15 * 100) + '%';
      fill.style.background = dvKalanSure <= 5 ? '#ef4444' : dvKalanSure <= 10 ? '#f59e0b' : 'var(--correct)';
    }
    if (dvKalanSure <= 0) { clearInterval(dvTimerInterval); dvCevapla(-1); }
  }, 1000);
}

async function dvCevapla(idx) {
  if (dvCevaplandi) return;
  dvCevaplandi = true;
  if (dvTimerInterval) { clearInterval(dvTimerInterval); dvTimerInterval = null; }

  const soru = dvSorular[dvSoruIndex];
  const dogru = idx === soru.a;
  const btns = document.querySelectorAll('.dv-secenek');
  btns.forEach((b, i) => {
    b.classList.add('disabled');
    if (i === soru.a) b.classList.add('dogru');
    else if (i === idx) b.classList.add('yanlis');
  });

  if (dogru) {
    dvPuan += 100 + Math.max(0, dvKalanSure * 5);
  }

  dvSoruIndex++;
  const bitti = dvSoruIndex >= dvSorular.length;

  // Firestore güncelle
  if (dvOdaRef && currentUser) {
    await dvOdaRef.update({
      [`${dvRolum}.puan`]: dvPuan,
      [`${dvRolum}.soru`]: dvSoruIndex,
      [`${dvRolum}.bitti`]: bitti,
      ...(bitti ? { durum: 'bitti' } : {})
    });
  }

  if (bitti) { setTimeout(dvBit, 1200); return; }
  setTimeout(dvSoruRender, 1200);
}

async function dvBit() {
  if (dvTimerInterval) { clearInterval(dvTimerInterval); dvTimerInterval = null; }
  if (!dvOdaRef) return;
  try {
    const snap = await dvOdaRef.get();
    dvSonucGoster(snap.data());
  } catch(e) { dvSonucGoster(null); }
}

function dvSonucGoster(data) {
  quizMedyaDurdur();
  if (dvListener) { dvListener(); dvListener = null; }
  if (dvTimerInterval) { clearInterval(dvTimerInterval); dvTimerInterval = null; }

  const es = data?.ev_sahibi || {};
  const r = data?.rakip || {};
  const benimRol = dvRolum;
  const benim = data?.[benimRol] || { isim: kullaniciAdi, puan: dvPuan };
  const rakipRol = dvRolum === 'ev_sahibi' ? 'rakip' : 'ev_sahibi';
  const rakip = data?.[rakipRol] || { isim: 'Rakip', puan: dvRakipPuan };

  const kazandim = benim.puan > rakip.puan;
  const berabere = benim.puan === rakip.puan;

  document.getElementById('dvIcerik').innerHTML = `
    <div class="dv-sonuc">
      <div class="dv-sonuc-rozet">${berabere ? '🤝' : kazandim ? '🏆' : '😤'}</div>
      <div class="dv-sonuc-baslik">${berabere ? 'Berabere!' : kazandim ? 'Kazandın!' : 'Kaybettin!'}</div>
      <div class="dv-sonuc-alt">${berabere ? 'İkiniz de eşit puan aldınız' : kazandim ? `${rakip.isim}\'i geçtin!` : `${rakip.isim} seni geçti!`}</div>
      <div class="dv-skor-karsilastir">
        <div class="dv-skor-kart ${benim.puan >= rakip.puan ? 'kazanan' : ''}">
          <div class="dv-skor-kart-isim">${htmlKacis(benim.isim || 'Sen')}</div>
          <div class="dv-skor-kart-puan">${benim.puan}</div>
        </div>
        <div class="dv-skor-kart ${rakip.puan > benim.puan ? 'kazanan' : ''}">
          <div class="dv-skor-kart-isim">${htmlKacis(rakip.isim || 'Rakip')}</div>
          <div class="dv-skor-kart-puan">${rakip.puan}</div>
        </div>
      </div>
      <button class="dv-btn-red" onclick="dvGirisRender()">🔄 Tekrar Oyna</button>
      <button class="btn" onclick="ekranGoster('homeScreen', true)" style="width:100%;margin-top:8px">Ana Sayfa</button>
    </div>`;
}

function dvCikis() {
  quizMedyaDurdur();
  if (dvListener) { dvListener(); dvListener = null; }
  if (dvTimerInterval) { clearInterval(dvTimerInterval); dvTimerInterval = null; }
  dvSorular = []; dvSoruIndex = 0; dvPuan = 0; dvCevaplandi = false;
  dvOdaRef = null; dvOdaKodu = null; dvRolum = null;
  ekranGoster('homeScreen', true);
}

function sezonIdGetir() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function sezonAdiGetir() {
  const aylar = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const now = new Date();
  return `${aylar[now.getMonth()]} ${now.getFullYear()} Sezonu`;
}

function sezonKalanGun() {
  const now = new Date();
  const son = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return son.getDate() - now.getDate();
}

async function sezonSkoru(puan, dogru, toplam) {
  if (!db || !currentUser) return;
  const sezonId = sezonIdGetir();
  try {
    await db.collection('seasons').doc(sezonId).collection('scores').add({
      uid: currentUser.uid,
      isim: kullaniciAdi,
      puan, dogru, toplam,
      tarih: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(e) {}
}

async function sezonProfilGoster() {
  const adiEl = document.getElementById('sezonAdi');
  const kalanEl = document.getElementById('sezonKalan');
  const liderEl = document.getElementById('sezonLider');
  if (!adiEl) return;

  adiEl.textContent = sezonAdiGetir();
  const kalan = sezonKalanGun();
  kalanEl.textContent = `${kalan} gün kaldı`;

  if (!db) {
    liderEl.innerHTML = '<div class="sezon-bos">Firebase bağlantısı yok</div>';
    return;
  }

  liderEl.innerHTML = '<div class="sezon-bos">⏳ Yükleniyor...</div>';

  try {
    const sezonId = sezonIdGetir();
    const snap = await db.collection('seasons').doc(sezonId).collection('scores')
      .orderBy('puan', 'desc').limit(5).get();

    if (snap.empty) {
      liderEl.innerHTML = '<div class="sezon-bos">Henüz bu sezon skor yok — ilk sen ol!</div>';
      return;
    }

    // uid başına en yüksek skoru al
    const enIyi = {};
    snap.docs.forEach(d => {
      const dt = d.data();
      if (!enIyi[dt.uid] || enIyi[dt.uid].puan < dt.puan) enIyi[dt.uid] = dt;
    });
    const sirali = Object.values(enIyi).sort((a, b) => b.puan - a.puan).slice(0, 3);

    const ikonlar = ['🥇', '🥈', '🥉'];
    liderEl.innerHTML = sirali.map((e, i) => {
      const benim = e.uid === currentUser?.uid;
      return `<div class="sezon-lb-row ${benim ? 'ben' : ''}">
        <span class="sezon-lb-rank">${ikonlar[i] || `#${i+1}`}</span>
        <span class="sezon-lb-isim">${htmlKacis(e.isim)}${benim ? ' 👈' : ''}</span>
        <span class="sezon-lb-puan">${parseInt(e.puan)}p</span>
      </div>`;
    }).join('');
  } catch(e) {
    liderEl.innerHTML = '<div class="sezon-bos">Sezon verisi yüklenemedi</div>';
  }
}

// ── Avatar yardımcıları ──────────────────────────────────────────────
const AVATAR_EMOJILER = [
  '🦁','🐯','🦊','🐺','🐼','🐨','🦝','🦄','🐲','🦋',
  '🌊','🔥','⚡','🌙','🌟','💎','🎯','🎮','🚀','🏆',
  '👾','🤖','🧙','🥷','🦸','🎭','🎪','🌈','🍀','🎸'
];

function avatarUygula(el) {
  if (!el) return;
  const kayit = JSON.parse(localStorage.getItem('bm_avatar') || 'null');
  if (!kayit) {
    const ad = currentUser?.displayName || kullaniciAdi || '?';
    const renkler = ['#4f8fff','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899'];
    el.style.background = renkler[ad.charCodeAt(0) % renkler.length];
    el.style.backgroundImage = '';
    el.style.fontSize = '';
    el.textContent = ad.charAt(0).toUpperCase();
  } else if (kayit.tip === 'emoji') {
    el.style.background = 'linear-gradient(135deg,#1e1b4b,#312e81)';
    el.style.backgroundImage = '';
    el.style.fontSize = '2rem';
    el.textContent = kayit.deger;
  } else if (kayit.tip === 'foto') {
    el.textContent = '';
    el.style.backgroundImage = `url(${kayit.deger})`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.background = '';
  }
}

function prAvatarTikla() {
  document.getElementById('prFotoInput')?.click();
}

function prFotoSec(input) {
  const file = input.files[0];
  if (!file) return;
  input.value = '';
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const MAX = 400;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      localStorage.setItem('bm_avatar', JSON.stringify({ tip: 'foto', deger: dataUrl }));
      prAvatarGuncelle();
      toastGoster('Profil fotoğrafı güncellendi ✓');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function prAvatarGuncelle() {
  const kayit = JSON.parse(localStorage.getItem('bm_avatar') || 'null');
  const fotoEl = document.getElementById('prAvatarFoto');
  const harfEl = document.getElementById('prAvatarHarf');
  if (!fotoEl || !harfEl) return;
  if (kayit?.tip === 'foto' && kayit.deger) {
    fotoEl.src = kayit.deger;
    fotoEl.style.display = 'block';
    harfEl.style.display = 'none';
  } else if (kayit?.tip === 'emoji') {
    fotoEl.style.display = 'none';
    harfEl.style.display = '';
    harfEl.textContent = kayit.deger;
  } else {
    fotoEl.style.display = 'none';
    harfEl.style.display = '';
  }
}

function avatarDegistirAc() {
  if (!currentUser) { toastGoster('Profil resmi değiştirmek için giriş yap'); return; }
  const onizleme = document.getElementById('avatarOnizleme');
  avatarUygula(onizleme);
  const grid = document.getElementById('avatarEmojiGrid');
  const mevcut = JSON.parse(localStorage.getItem('bm_avatar') || 'null');
  grid.innerHTML = AVATAR_EMOJILER.map(e =>
    `<button class="avatar-emoji-btn ${mevcut?.deger === e ? 'secili' : ''}" onclick="avatarEmojiSec('${e}')">${e}</button>`
  ).join('');
  document.getElementById('avatarModal').classList.add('show');
}

function avatarModalKapat() {
  document.getElementById('avatarModal').classList.remove('show');
}

function avatarEmojiSec(emoji) {
  localStorage.setItem('bm_avatar', JSON.stringify({ tip: 'emoji', deger: emoji }));
  avatarUygula(document.getElementById('profileAvatar'));
  avatarUygula(document.getElementById('avatarOnizleme'));
  document.querySelectorAll('.avatar-emoji-btn').forEach(b => b.classList.toggle('secili', b.textContent === emoji));
  toastGoster('✅ Avatar güncellendi', true);
  setTimeout(avatarModalKapat, 800);
}

function avatarFotografYukle(input) {
  const dosya = input.files[0];
  if (!dosya) return;
  const okuyucu = new FileReader();
  okuyucu.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 200;
      const ctx = canvas.getContext('2d');
      ctx.beginPath(); ctx.arc(100, 100, 100, 0, Math.PI * 2); ctx.clip();
      const boyut = Math.min(img.width, img.height);
      const ox = (img.width - boyut) / 2;
      const oy = (img.height - boyut) / 2;
      ctx.drawImage(img, ox, oy, boyut, boyut, 0, 0, 200, 200);
      const veri = canvas.toDataURL('image/jpeg', 0.8);
      localStorage.setItem('bm_avatar', JSON.stringify({ tip: 'foto', deger: veri }));
      avatarUygula(document.getElementById('profileAvatar'));
      avatarUygula(document.getElementById('avatarOnizleme'));
      toastGoster('✅ Fotoğraf güncellendi', true);
      setTimeout(avatarModalKapat, 800);
    };
    img.src = e.target.result;
  };
  okuyucu.readAsDataURL(dosya);
  input.value = '';
}

function avatarSifirla() {
  localStorage.removeItem('bm_avatar');
  avatarUygula(document.getElementById('profileAvatar'));
  avatarUygula(document.getElementById('avatarOnizleme'));
  document.querySelectorAll('.avatar-emoji-btn').forEach(b => b.classList.remove('secili'));
  toastGoster('Avatar sıfırlandı', true);
  setTimeout(avatarModalKapat, 600);
}

// ── Profil ──────────────────────────────────────────────────────────
function profilGoster() {
  const ad = currentUser?.displayName || kullaniciAdi || 'Misafir';

  // İsim
  const prName = document.getElementById('prName');
  if (prName) prName.textContent = ad;

  // Avatar baş harfi (mobil)
  const prAvatarHarf = document.getElementById('prAvatarHarf');
  if (prAvatarHarf) prAvatarHarf.textContent = (ad[0] || 'M').toUpperCase();
  prAvatarGuncelle();

  // Meta: "ÜYE · X AY" — kayıt tarihinden hesapla
  const prMeta = document.getElementById('prMeta');
  let kayitAy = 1;
  if (prMeta) {
    const kayitTarih = localStorage.getItem('bm_kayit_tarih');
    if (kayitTarih) {
      kayitAy = Math.max(1, Math.floor((Date.now() - parseInt(kayitTarih)) / (30 * 86400000)));
      prMeta.textContent = `ÜYE · ${kayitAy} AY`;
    } else {
      localStorage.setItem('bm_kayit_tarih', Date.now());
      prMeta.textContent = 'ÜYE · 1 AY';
    }
  }

  // Mobil alt başlık: "Üye · N ay · Portal"
  const prSubMeta = document.getElementById('prSubMeta');
  if (prSubMeta) prSubMeta.textContent = `Üye · ${kayitAy} ay · Portal`;

  // Alt bilgi (desktop)
  const prSub = document.getElementById('prSub');
  const streakDataSub = JSON.parse(localStorage.getItem('bm_streak') || '{}');
  const seriSub = streakDataSub.mevcut || 0;
  if (prSub) prSub.textContent = seriSub > 0 ? `🔥 ${seriSub} günlük seri aktif` : 'merak.io oyuncusu';

  // Seri pill (mobil)
  const prStreakPill = document.getElementById('prStreakPill');
  if (prStreakPill) {
    if (seriSub > 0) {
      prStreakPill.textContent = `🔥 ${seriSub} günlük seri aktif`;
      prStreakPill.style.display = '';
    } else {
      prStreakPill.style.display = 'none';
    }
  }

  // İstatistikler
  const lb = JSON.parse(localStorage.getItem('bm_quiz_liderlik') || '[]');
  const katStats = JSON.parse(localStorage.getItem('bm_kat_stats') || '{}');
  const streakData2 = JSON.parse(localStorage.getItem('bm_streak') || '{}');

  let toplamDogru = 0, toplamSoru = 0;
  for (const v of Object.values(katStats)) {
    toplamDogru += v.dogru || 0;
    toplamSoru += v.toplam || 0;
  }
  const oran = toplamSoru > 0 ? Math.round(toplamDogru / toplamSoru * 100) : 0;
  const bp = beynPuaniGetir();

  const sayacAnim = (id, hedef, fmt = (v) => v.toLocaleString('tr-TR')) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (hedef === 0) { el.textContent = '—'; return; }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 800, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(hedef * ease));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  sayacAnim('prTotalPuan', bp.toplam);
  sayacAnim('prTotalOyun', lb.length, v => v);
  const oranEl = document.getElementById('prOran');
  if (oranEl) oranEl.textContent = oran > 0 ? `%${oran}` : '—';
  const maxSt = document.getElementById('prMaxStreak');
  if (maxSt) maxSt.textContent = (streakData2.maksimum || 0) > 0 ? `${streakData2.maksimum} gün` : '—';

  // Bu hafta puanı
  const prBuHafta = document.getElementById('prBuHafta');
  if (prBuHafta) {
    const now = new Date();
    const thisWeek = haftaNo(now);
    const thisYear = now.getFullYear();
    const buHaftaPuan = lb.reduce((s, e) => {
      const d = new Date(e.tarih);
      return (d.getFullYear() === thisYear && haftaNo(d) === thisWeek) ? s + (e.puan || 0) : s;
    }, 0);
    prBuHafta.textContent = buHaftaPuan > 0 ? buHaftaPuan.toLocaleString('tr-TR') : '—';
  }

  // Hint metinleri: veri varsa gizle
  const puanHint = document.getElementById('prTotalPuanHint');
  const oyunHint = document.getElementById('prTotalOyunHint');
  if (puanHint) puanHint.style.display = bp.toplam > 0 ? 'none' : '';
  if (oyunHint) oyunHint.style.display = lb.length > 0 ? 'none' : '';

  // Kategori barları
  prKatBarsCiz(katStats);

  // Bar chart (13 hafta)
  prBarChartCiz(lb);

  // Hafta günlük
  prWeekCiz();

  // Rozetler
  prRozetlerCiz();

  // Liderlik tablosu
  prLbCiz();

  // Eski ID'leri de doldur (geriye dönük uyumluluk)
  avatarUygula(document.getElementById('profileAvatar'));
  document.getElementById('profilBeynSayi').textContent = bp.toplam;
  document.getElementById('pToplam').textContent = lb.length;
  const enYuksek = lb.length > 0 ? Math.max(...lb.map(e => e.puan)) : 0;
  document.getElementById('pEnYuksek').textContent = enYuksek;
  const ortalama = lb.length > 0 ? Math.round(lb.reduce((s,e) => s+e.puan, 0)/lb.length) : 0;
  document.getElementById('pOrtalama').textContent = ortalama;
  document.getElementById('pToplamDogru').textContent = toplamDogru;
  document.getElementById('profilStreakSayi').textContent = streakData2.mevcut || 0;
  document.getElementById('profilStreakMax').textContent = `En iyi: ${streakData2.maksimum || 0} gün`;

  ekranGoster('profileScreen');
}

function prKatBarsCiz(katStats) {
  const el = document.getElementById('prKatBars');
  if (!el) return;
  const entries = Object.entries(katStats).filter(([k, v]) => v.toplam > 0 && k !== 'all');
  if (!entries.length) { el.innerHTML = '<div style="font-size:0.7rem;color:var(--text3)">Henüz oynanmış kategori yok</div>'; return; }
  const allKats = { ...KATEGORI_BILGI, ...(typeof KATEGORI_BILGI_EK !== 'undefined' ? KATEGORI_BILGI_EK : {}) };
  el.innerHTML = entries.sort(([,a],[,b]) => b.oyun - a.oyun).slice(0, 8).map(([key, stat]) => {
    const oran = Math.round(stat.dogru / stat.toplam * 100);
    const isim = allKats[key]?.isim || key;
    return `<div class="pr-kat-row">
      <div class="pr-kat-top"><span>${isim}</span><span class="pr-kat-pct">${oran}%</span></div>
      <div class="pr-kat-track"><div class="pr-kat-fill" data-w="${oran}"></div></div>
    </div>`;
  }).join('');
  setTimeout(() => el.querySelectorAll('.pr-kat-fill').forEach(f => f.style.width = f.dataset.w + '%'), 80);
}

function prBarChartCiz(lb) {
  const el = document.getElementById('prBarChart');
  if (!el) return;
  // Son 13 haftayı hesapla
  const now = new Date();
  const weeks = Array.from({length: 13}, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (12 - i) * 7);
    return { year: d.getFullYear(), week: haftaNo(d), sum: 0 };
  });
  lb.forEach(entry => {
    if (!entry.tarih) return;
    // tarih: "dd.mm.yyyy" (tr-TR formatı)
    const parts = entry.tarih.split('.');
    if (parts.length < 3) return;
    const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    const w = haftaNo(d);
    const y = d.getFullYear();
    const match = weeks.find(wk => wk.week === w && wk.year === y);
    if (match) match.sum += entry.puan || 0;
  });
  const max = Math.max(...weeks.map(w => w.sum), 1);
  el.innerHTML = weeks.map((w, i) => {
    const h = Math.round((w.sum / max) * 100);
    const isCurrent = i === 12;
    const cls = isCurrent ? 'pr-bar pr-bar-current' : (h === 0 ? 'pr-bar pr-bar-empty' : 'pr-bar');
    return `<div class="${cls}" style="height:${Math.max(h, 3)}%" title="${w.sum} puan"></div>`;
  }).join('');
}

function haftaNo(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function prWeekCiz() {
  const el = document.getElementById('prWeek');
  if (!el) return;
  const gunler = ['P','S','Ç','P','C','C','P'];
  const now = new Date();
  const bugunIdx = (now.getDay() + 6) % 7; // 0=Pzt
  const pazartesi = new Date(now);
  pazartesi.setDate(now.getDate() - bugunIdx);
  el.innerHTML = Array.from({length: 7}, (_, i) => {
    const gun = new Date(pazartesi);
    gun.setDate(pazartesi.getDate() + i);
    const isToday = i === bugunIdx;
    const isFuture = i > bugunIdx;
    let cls = 'pr-week-sq';
    if (isFuture) cls += ' pr-empty';
    else if (isToday) cls += ' pr-today';
    // Geçmiş günler için wordle kaydı var mı?
    else {
      const kayit = localStorage.getItem(`bm_wordle_${gun.toDateString()}`);
      if (!kayit) cls += ' pr-empty';
    }
    return `<div class="pr-week-day"><div class="${cls}"></div><div class="pr-week-lbl">${gunler[i]}</div></div>`;
  }).join('');
}

function prRozetlerCiz() {
  const el = document.getElementById('prRozetler');
  if (!el || typeof ROZETLER === 'undefined') return;
  const kazanilan = JSON.parse(localStorage.getItem('bm_rozetler') || '[]');
  el.innerHTML = Object.entries(ROZETLER).map(([id, r]) => {
    const earned = kazanilan.includes(id);
    return `<span class="pr-rozet ${earned ? '' : 'pr-locked'}" title="${r.isim}">${r.icon}</span>`;
  }).join('');
}

async function prLbCiz() {
  const listEl = document.getElementById('prLbList');
  const ligEl = document.getElementById('prLigAdi');
  const haftaEl = document.getElementById('prLigHafta');
  if (!listEl) return;

  if (ligEl) ligEl.textContent = 'LİG';
  if (haftaEl) haftaEl.textContent = sezonAdiGetir ? sezonAdiGetir().toUpperCase() : '';

  listEl.innerHTML = '<div style="padding:12px 0;font-size:0.7rem;color:var(--text3)">⏳ Yükleniyor...</div>';

  if (!db) {
    listEl.innerHTML = '<div style="padding:12px 0;font-size:0.7rem;color:var(--text3)">Firebase bağlantısı yok</div>';
    return;
  }

  try {
    const sezonId = sezonIdGetir();
    const snap = await db.collection('seasons').doc(sezonId).collection('scores')
      .orderBy('puan', 'desc').limit(20).get();

    if (snap.empty) {
      listEl.innerHTML = '<div style="padding:12px 0;font-size:0.7rem;color:var(--text3)">Henüz skor yok</div>';
      return;
    }

    const enIyi = {};
    snap.docs.forEach(d => {
      const dt = d.data();
      if (!enIyi[dt.uid] || enIyi[dt.uid].puan < dt.puan) enIyi[dt.uid] = dt;
    });
    const sirali = Object.values(enIyi).sort((a, b) => b.puan - a.puan).slice(0, 10);

    if (ligEl) ligEl.textContent = 'SEZON LİGİ';
    const hafta = Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1)) / (7 * 86400000));
    if (haftaEl) haftaEl.textContent = `HAFTA ${hafta}`;

    listEl.innerHTML = sirali.map((e, i) => {
      const benim = e.uid === currentUser?.uid;
      const trend = e.trend > 0 ? '↑' : e.trend < 0 ? '↓' : '—';
      const puan = parseInt(e.puan).toLocaleString('tr-TR');
      return `<div class="pr-lb-row ${benim ? 'pr-me' : ''}">
        <span class="pr-lb-rank">${String(i+1).padStart(2,'0')}</span>
        <span class="pr-lb-name">${htmlKacis(e.isim)}${benim ? '' : ''}</span>
        <span class="pr-lb-puan">${puan}</span>
        <span class="pr-lb-trend">${trend}</span>
      </div>`;
    }).join('');
  } catch(e) {
    listEl.innerHTML = '<div style="padding:12px 0;font-size:0.7rem;color:var(--text3)">Sezon verisi yüklenemedi</div>';
  }
}

// ═══════════════════════════
// MERAK DEFTERİ
// ═══════════════════════════
function merakLogKaydet(kat) {
  const gun = new Date().toISOString().slice(0, 10);
  let log = JSON.parse(localStorage.getItem('bm_merak_log') || '{}');
  if (!log[gun]) log[gun] = { toplam: 0 };
  log[gun].toplam = (log[gun].toplam || 0) + 1;
  if (kat && kat !== 'all') log[gun][kat] = (log[gun][kat] || 0) + 1;
  const gunler = Object.keys(log).sort();
  if (gunler.length > 400) gunler.slice(0, gunler.length - 400).forEach(g => delete log[g]);
  localStorage.setItem('bm_merak_log', JSON.stringify(log));
}

function defteriGoster() {
  const log = JSON.parse(localStorage.getItem('bm_merak_log') || '{}');
  const bugun = new Date().toISOString().slice(0, 10);
  const buAyKey = bugun.slice(0, 7);

  let toplam = 0, bugunSayi = 0, buAySayi = 0;
  const katToplam = {};
  for (const [gun, data] of Object.entries(log)) {
    toplam += data.toplam || 0;
    if (gun === bugun) bugunSayi = data.toplam || 0;
    if (gun.startsWith(buAyKey)) buAySayi += data.toplam || 0;
    for (const [k, v] of Object.entries(data)) {
      if (k === 'toplam') continue;
      katToplam[k] = (katToplam[k] || 0) + v;
    }
  }

  document.getElementById('defteriToplamSayi').textContent = toplam.toLocaleString('tr-TR');
  document.getElementById('defteriBugun').textContent = bugunSayi;
  document.getElementById('defteriBuAy').textContent = buAySayi;
  document.getElementById('defteriKatSayi').textContent = Object.keys(katToplam).length;

  const ayIsimler = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const now = new Date();
  const aylar = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const sayi = Object.entries(log)
      .filter(([g]) => g.startsWith(key))
      .reduce((s, [, dd]) => s + (dd.toplam || 0), 0);
    aylar.push({ isim: ayIsimler[d.getMonth()], sayi, buay: i === 0 });
  }
  const maxAy = Math.max(...aylar.map(a => a.sayi), 1);
  document.getElementById('defteriAylar').innerHTML = aylar.map(a => {
    const h = Math.max(Math.round((a.sayi / maxAy) * 72), a.sayi > 0 ? 4 : 2);
    return `<div class="defteri-ay-col">
      <div class="defteri-ay-bar${a.buay ? ' buay' : ''}" style="height:${h}px" title="${a.sayi}"></div>
      <div class="defteri-ay-isim">${a.isim}</div>
    </div>`;
  }).join('');

  const katEntries = Object.entries(katToplam).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxKat = katEntries.length > 0 ? katEntries[0][1] : 1;
  const katListEl = document.getElementById('defteriKatList');
  if (katEntries.length === 0) {
    katListEl.innerHTML = '<div style="color:var(--text3);font-size:0.85rem;text-align:center;padding:8px">Henüz veri yok — oynamaya başla!</div>';
  } else {
    katListEl.innerHTML = katEntries.map(([k, v]) => {
      const bilgi = KATEGORI_BILGI[k] || { emoji: '📚', isim: k };
      const pct = Math.round((v / maxKat) * 100);
      return `<div class="defteri-kat-row">
        <span class="defteri-kat-emoji">${bilgi.emoji}</span>
        <span class="defteri-kat-isim">${bilgi.isim}</span>
        <div class="defteri-kat-bar-track"><div class="defteri-kat-bar-fill" data-w="${pct}" style="width:0%"></div></div>
        <span class="defteri-kat-sayi">${v}</span>
      </div>`;
    }).join('');
    setTimeout(() => {
      document.querySelectorAll('.defteri-kat-bar-fill').forEach(el => { el.style.width = el.dataset.w + '%'; });
    }, 100);
  }

  const milestones = [
    { hedef: 10, etiket: '🌱 10' }, { hedef: 50, etiket: '⚡ 50' },
    { hedef: 100, etiket: '🎯 100' }, { hedef: 250, etiket: '🔥 250' },
    { hedef: 500, etiket: '💎 500' }, { hedef: 1000, etiket: '🚀 1.000' },
    { hedef: 2500, etiket: '🧠 2.500' }, { hedef: 5000, etiket: '👑 5.000' }
  ];
  document.getElementById('defteriMilestones').innerHTML = milestones.map(m =>
    `<div class="defteri-milestone ${toplam >= m.hedef ? 'kazanildi' : ''}">${m.etiket}</div>`
  ).join('');

  ekranGoster('defteriScreen');
}

function defteriWrappedKarti() {
  const log = JSON.parse(localStorage.getItem('bm_merak_log') || '{}');
  const yil = new Date().getFullYear();
  const yilKey = String(yil);

  let toplam = 0;
  const katToplam = {}, ayToplam = {};
  for (const [gun, data] of Object.entries(log)) {
    if (!gun.startsWith(yilKey)) continue;
    toplam += data.toplam || 0;
    const ay = gun.slice(0, 7);
    ayToplam[ay] = (ayToplam[ay] || 0) + (data.toplam || 0);
    for (const [k, v] of Object.entries(data)) {
      if (k === 'toplam') continue;
      katToplam[k] = (katToplam[k] || 0) + v;
    }
  }

  const enAktifAy = Object.entries(ayToplam).sort((a, b) => b[1] - a[1])[0];
  const topKatlar = Object.entries(katToplam).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const ayIsimler = {'01':'Ocak','02':'Şubat','03':'Mart','04':'Nisan','05':'Mayıs','06':'Haziran','07':'Temmuz','08':'Ağustos','09':'Eylül','10':'Ekim','11':'Kasım','12':'Aralık'};

  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 1080, 1350);
  bg.addColorStop(0, '#060d1f'); bg.addColorStop(1, '#0e1730');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1350);

  [[160,200,300,'rgba(79,143,255,0.12)'],[920,1100,280,'rgba(139,92,246,0.1)'],[900,200,180,'rgba(16,185,129,0.07)']].forEach(([x,y,r,c]) => {
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=c; ctx.fill();
  });
  ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.beginPath(); ctx.roundRect(40,40,1000,1270,32); ctx.fill();
  ctx.strokeStyle='rgba(79,143,255,0.2)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.roundRect(40,40,1000,1270,32); ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle='#4f8fff'; ctx.font='bold 44px Arial,sans-serif'; ctx.fillText('📔 Merak Defterim', 540, 140);
  ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='32px Arial,sans-serif'; ctx.fillText(String(yil), 540, 190);

  ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(140,220); ctx.lineTo(940,220); ctx.stroke();

  ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.font='30px Arial,sans-serif'; ctx.fillText('bu yıl öğrendiğin şey', 540, 320);
  ctx.fillStyle='#fff'; ctx.font='bold 140px Arial,sans-serif'; ctx.fillText(toplam.toLocaleString('tr-TR'), 540, 460);

  ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(140,510); ctx.lineTo(940,510); ctx.stroke();

  ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='28px Arial,sans-serif'; ctx.fillText('En çok öğrendiğin konular', 540, 570);
  const renkler = ['#4f8fff','#8b5cf6','#10b981'];
  topKatlar.forEach(([k, v], i) => {
    const bilgi = KATEGORI_BILGI[k] || { emoji:'📚', isim:k };
    const y = 640 + i * 80;
    ctx.textAlign='left'; ctx.fillStyle=renkler[i]; ctx.font='bold 36px Arial,sans-serif';
    ctx.fillText(`${i+1}. ${bilgi.emoji} ${bilgi.isim}`, 200, y);
    ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.font='30px Arial,sans-serif'; ctx.textAlign='right';
    ctx.fillText(`${v} şey`, 880, y);
  });

  if (enAktifAy) {
    ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(140,910); ctx.lineTo(940,910); ctx.stroke();
    ctx.textAlign='center';
    ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='28px Arial,sans-serif'; ctx.fillText('En aktif ayın', 540, 970);
    ctx.fillStyle='#f59e0b'; ctx.font='bold 52px Arial,sans-serif'; ctx.fillText(ayIsimler[enAktifAy[0].slice(5)] || enAktifAy[0], 540, 1040);
    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='30px Arial,sans-serif'; ctx.fillText(`${enAktifAy[1]} öğrenilen`, 540, 1085);
  }

  ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(140,1200); ctx.lineTo(940,1200); ctx.stroke();
  ctx.textAlign='center';
  ctx.fillStyle='#4f8fff'; ctx.font='bold 36px Arial,sans-serif'; ctx.fillText('merak.io', 540, 1270);
  ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.font='24px Arial,sans-serif'; ctx.fillText('merak et, öğren, kazan', 540, 1310);

  const link = document.createElement('a');
  link.download = `merak-defteri-${yil}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  toastGoster('📔 Wrapped kartı indirildi!', true);
}

// ═══════════════════════════
// SAYFA YÜKLENDİ
// ═══════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  console.log('Sayfa yüklendi');
  console.log('SORU_HAVUZU var mı?', typeof SORU_HAVUZU !== 'undefined');
  console.log('KATEGORI_BILGI var mı?', typeof KATEGORI_BILGI !== 'undefined');
  ekonomiYukle();
  gorevleriKur();

  // Ön yükleme: ana menü bileşenlerini doldur (geri dönüldüğünde boş kalmasın)
  kategorileriYukle();
  liderlikGoster();
  wordleBannerGuncelle();
  yanlisKutusuBannerGuncelle();
  miniProfilGuncelle();

  // EAGER EKRAN GEÇİŞİ: Giriş ekranının boş kalmasını engeller
  const isMisafir = localStorage.getItem('bm_misafir') === '1';
  const sonEkran = localStorage.getItem('bm_son_ekran');

  if (window.STANDALONE) {
    // Portal iframe'inden açıldı: body gizli başlar, oyun hazır olunca fade-in
    document.body.style.visibility = 'hidden';
    document.body.classList.add('portal-iframe');
    anaEkranBaslat();
    const h = window.STANDALONE;
    setTimeout(() => {
      if (h === 'wordle') wordleBaslat();
      else if (h === 'tahmin') tahminBaslat();
      else if (h === 'quiz') {
        document.body.classList.add('portal-nav-aktif');
        const btn = document.querySelectorAll('.ed-tab-btn')[1];
        edTabSec('bolumler', btn);
      } else if (h === 'kartlar') {
        document.body.classList.add('portal-nav-aktif');
        const btn = document.querySelectorAll('.ed-tab-btn')[2];
        edTabSec('kartlar', btn);
        flashcardBaslat();
      } else if (h === 'atolye' || h.startsWith('atolye-')) {
        const btn = document.querySelectorAll('.ed-tab-btn')[3];
        edTabSec('arsiv', btn);
        const aracId = h.includes('-') ? h.split('-')[1] : null;
        if (aracId) {
          setTimeout(() => {
            if (aracId === 'ders') dersProgramiAc();
            else atAc(aracId);
            document.body.classList.add('portal-tool-aktif');
            document.body.style.visibility = '';
            window.parent.postMessage('oyunHazir', '*');
          }, 60);
          return;
        }
      } else if (h === 'profil') {
        profilGoster();
      } else if (h === 'gorevler') {
        gorevEkraniGoster();
      } else if (h === 'magaza') {
        magazaEkraniGoster();
      } else if (h === 'yanlis') {
        yanlisEkraniGoster();
      } else if (h === 'giris') {
        document.body.classList.add('portal-giris');
        ekranGoster('authScreen');
        document.body.style.visibility = '';
        window.parent.postMessage('oyunHazir', '*');
        return;
      }
      document.body.style.visibility = '';
      window.parent.postMessage('oyunHazir', '*');
    }, 60);
  } else if (sonEkran || isMisafir) {
    yonlendirSonEkrana();
  } else {
    ekranGoster('authScreen');
  }

  function wordleAktifMi() {
    const panel = document.getElementById('edWordlePanel');
    return panel && panel.style.display !== 'none';
  }

  document.addEventListener('keydown', e => {
    if (!wordleAktifMi()) return;
    if (e.key === 'Enter')     { wTus('GİR'); return; }
    if (e.key === 'Backspace') { wTus('⌫'); return; }
    const harfMap = {
      'a':'A','b':'B','c':'C','ç':'Ç','d':'D','e':'E','f':'F','g':'G','ğ':'Ğ',
      'h':'H','ı':'I','i':'İ','j':'J','k':'K','l':'L','m':'M','n':'N',
      'o':'O','ö':'Ö','p':'P','r':'R','s':'S','ş':'Ş','t':'T','u':'U',
      'ü':'Ü','v':'V','y':'Y','z':'Z'
    };
    const harf = harfMap[e.key.toLowerCase()];
    if (harf) wTus(harf);
  });

  // Telefon klavyesi — gizli input
  const gizliInput = document.getElementById('wordleGizliInput');
  if (gizliInput) {
    gizliInput.addEventListener('input', () => {
      if (wBitti || !wordleAktifMi()) return;
      const val = gizliInput.value.toUpperCase();
      gizliInput.value = '';
      for (const ch of val) {
        if (/^[A-ZÇĞİÖŞÜ]$/.test(ch)) wTus(ch);
      }
    });
    gizliInput.addEventListener('keydown', e => {
      if (!wordleAktifMi()) return;
      if (e.key === 'Enter') { wTus('GİR'); e.preventDefault(); e.stopPropagation(); }
      else if (e.key === 'Backspace') { wTus('⌫'); e.stopPropagation(); }
    });
    document.getElementById('wordleGrid')?.addEventListener('click', () => {
      if ('ontouchstart' in window) gizliInput.focus();
    });
  }

  // İlk yüklemede aktif tab'ı görünür yap
  requestAnimationFrame(() => document.getElementById('edTabBugun')?.classList.add('ed-tab-visible'));

  urlKontrolEt();
  firebaseBaslat();
  moodGuncelle(5);
  temaYukle();
  const sesBtn = document.getElementById('sesBtn');
  if (sesBtn) sesBtn.textContent = sesAcik ? '🔊' : '🔇';
  streakYukle();
  tarihteBugunGuncelle();
  rozetVitrinGuncelle();
  // Bildirim butonu: izin verilmediyse göster
  if ('Notification' in window && Notification.permission === 'default') {
    document.getElementById('bildirimBtn')?.style.setProperty('display', 'block');
  } else if (Notification.permission === 'granted') {
    fcmTokenAlVeKaydet();
  }
});

// ════════════════════════════════════════
// EDİTÖRYEL UI FONKSİYONLARI
// ════════════════════════════════════════

function edTabSec(tab, btn) {
  document.querySelectorAll('.ed-tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const tabs = { bugun: 'edTabBugun', bolumler: 'edTabBolumler', kartlar: 'edTabKartlar', arsiv: 'edTabArsiv' };
  const hasVisible = !!document.querySelector('.ed-content.ed-tab-visible');
  const inDelay = hasVisible ? 90 : 0;

  Object.entries(tabs).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (key === tab) {
      setTimeout(() => {
        el.style.display = '';
        requestAnimationFrame(() => el.classList.add('ed-tab-visible'));
        if (tab === 'bolumler') edBolumlerDoldur();
        if (tab === 'arsiv')    edArsivDoldur();
        if (tab === 'kartlar')  ktIstatistikGoster();
        const fab = document.getElementById('fabWrap');
        if (fab) fab.style.display = tab === 'bugun' ? 'flex' : 'none';
        const footer = document.querySelector('.site-footer');
        if (footer) footer.style.display = tab === 'bugun' ? '' : 'none';
      }, inDelay);
    } else {
      el.classList.remove('ed-tab-visible');
      el.classList.add('ed-tab-leaving');
      setTimeout(() => {
        el.classList.remove('ed-tab-leaving');
        if (!el.classList.contains('ed-tab-visible')) el.style.display = 'none';
      }, 170);
    }
  });
}

function edModSec(mod, el) {
  document.querySelectorAll('.ed-mode, .m-mode').forEach(m => m.classList.remove('selected'));
  if (el) el.classList.add('selected');
  // Sync diğer layouttaki aynı modu da seç
  document.querySelectorAll(`.ed-mode[data-mod="${mod}"], .m-mode[data-mod="${mod}"]`).forEach(m => m.classList.add('selected'));
  const legacyBtn = document.querySelector(`.mod-btn[data-mod="${mod}"]`);
  if (legacyBtn) legacyBtn.click();
}

function edDiffSec(diff, el) {
  document.querySelectorAll('.ed-diff-btn, .m-diff-btn').forEach(b => b.classList.remove('selected'));
  if (el) el.classList.add('selected');
  document.querySelectorAll(`.ed-diff-btn[data-diff="${diff}"], .m-diff-btn[data-diff="${diff}"]`).forEach(b => b.classList.add('selected'));
  const legacyBtn = document.querySelector(`.diff-btn[data-diff="${diff}"]`);
  if (legacyBtn) legacyBtn.click();
}

function edKategoriSec(kat) {
  document.querySelectorAll('.ed-cat-cell, .m-cat-row').forEach(r => r.classList.remove('selected'));
  document.querySelectorAll('.ed-cat-cell-all, .m-cat-row-all').forEach(r => r.classList.remove('selected'));
  if (kat === 'all') {
    document.querySelectorAll('.ed-cat-cell-all, .m-cat-row-all').forEach(r => r.classList.add('selected'));
  } else {
    document.querySelectorAll(`.ed-cat-cell[data-kat="${kat}"], .m-cat-row[data-kat="${kat}"]`).forEach(r => r.classList.add('selected'));
  }
  seciliKategori = kat;
  const legacyBtn = document.querySelector(`.cat-btn[data-kat="${kat}"]`);
  if (legacyBtn) legacyBtn.click();
  // Bayrak/logo için zorluk butonlarını devre dışı bırak
  const diffDisable = kat === 'bayrak' || kat === 'logo';
  document.querySelectorAll('.ed-diff-btn, .m-diff-btn').forEach(btn => {
    btn.disabled = diffDisable;
    btn.style.opacity = diffDisable ? '0.3' : '1';
    btn.style.pointerEvents = diffDisable ? 'none' : 'auto';
  });
}

function edMastheadGuncelle() {
  const gunNo = wordleGunNo();
  const el = document.getElementById('edSayi');
  if (el) el.textContent = gunNo;
  const heroNo = document.getElementById('edHeroNo');
  if (heroNo) heroNo.textContent = gunNo;
  const mHeroNo = document.getElementById('mHeroNo');
  if (mHeroNo) mHeroNo.textContent = gunNo;
  const now = new Date();
  const dateEl = document.getElementById('edDate');
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  const authSayi = document.getElementById('edAuthSayi');
  if (authSayi) authSayi.textContent = gunNo;
  const authDate = document.getElementById('edAuthDate');
  if (authDate) authDate.textContent = now.toLocaleDateString('tr-TR', { day:'2-digit', month:'2-digit', year:'2-digit' });
}

function edStreakGuncelle() {
  const data = JSON.parse(localStorage.getItem('bm_streak') || '{"mevcut":0}');
  const n = data.mevcut || 0;
  const tag = document.getElementById('edStreakTag');
  const statEl = document.getElementById('edStatStreak');
  if (tag) {
    if (n > 0) { tag.textContent = `🔥 ${n} GÜN`; tag.style.display = ''; }
    else { tag.style.display = 'none'; }
  }
  if (statEl) statEl.textContent = n > 0 ? `${n}🔥` : '—';
}

function edHeroGridDoldur() {
  const container = document.getElementById('edHeroGrid');
  if (!container) return;
  const today = new Date().toDateString();
  const kayit = JSON.parse(localStorage.getItem(`bm_wordle_${today}`) || 'null');
  const pattern = [
    ['correct','empty','empty','close','empty'],
    ['wrong','correct','empty','empty','empty'],
    ['empty','wrong','correct','close','empty'],
    ['empty','empty','wrong','correct','empty'],
    ['empty','empty','empty','wrong','correct'],
    ['empty','empty','empty','empty','empty']
  ];
  let html = '';
  let denemeStr = '';
  if (kayit && kayit.tahminler && kayit.tahminler.length) {
    const ans = kayit.kelime || bugunkunKelime();
    const n = kayit.tahminler.length;
    denemeStr = `${n} / 6 DENEME`;
    kayit.tahminler.slice(0, 6).forEach(tahmin => {
      const renkler = tahminRenkle(tahmin, ans);
      html += '<div class="ed-wg-row">';
      for (let i = 0; i < 5; i++) {
        const ch = (tahmin[i] || '').toUpperCase();
        const clsMap = { yesil: 'correct', sari: 'close', gri: 'wrong' };
        const cls = ch ? (clsMap[renkler[i]] || 'wrong') : 'empty';
        html += `<div class="ed-wg-cell ${cls}">${ch}</div>`;
      }
      html += '</div>';
    });
    for (let r = n; r < 6; r++) {
      html += '<div class="ed-wg-row">' + '<div class="ed-wg-cell empty"></div>'.repeat(5) + '</div>';
    }
  } else {
    denemeStr = '';
    pattern.forEach(row => {
      html += '<div class="ed-wg-row">';
      row.forEach(cls => { html += `<div class="ed-wg-cell ${cls}"></div>`; });
      html += '</div>';
    });
  }
  container.innerHTML = html;
  const denemeEl = document.getElementById('edWgDeneme');
  if (denemeEl) denemeEl.textContent = denemeStr;

  // Mobil harf önizlemesini güncelle
  const mHarfOn = document.getElementById('mHarfOn');
  if (mHarfOn) {
    const oynandi = !!(kayit && kayit.tahminler && kayit.tahminler.length);
    const dolum = oynandi ? 5 : 1;
    mHarfOn.innerHTML = Array.from({length: 5}, (_, i) =>
      `<div class="m-harf${i < dolum ? ' dolu' : ''}"></div>`
    ).join('');
  }

  // Countdown
  const sureEl = document.getElementById('edStatSure');
  if (sureEl) {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.floor((midnight - now) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    sureEl.textContent = h > 0 ? `${h} saat ${m} dakika` : `${m} dakika`;
  }

  // Total question count
  const toplamEl = document.getElementById('edStatToplam');
  if (toplamEl && typeof SORU_HAVUZU !== 'undefined') {
    let toplam = 0;
    for (const kat of Object.values(SORU_HAVUZU)) {
      for (const lvl of Object.values(kat)) {
        if (Array.isArray(lvl)) toplam += lvl.length;
      }
    }
    if (typeof SORULAR_EK !== 'undefined') {
      for (const kat of Object.values(SORULAR_EK)) {
        for (const lvl of Object.values(kat)) {
          if (Array.isArray(lvl)) toplam += lvl.length;
        }
      }
    }
    toplamEl.textContent = toplam.toLocaleString('tr-TR');
  }
}

function edSoruSayisiHesapla(kat) {
  const havuz = typeof SORU_HAVUZU !== 'undefined' ? SORU_HAVUZU : {};
  const havuzEk = typeof SORULAR_EK !== 'undefined' ? SORULAR_EK : {};
  const src = havuz[kat] || havuzEk[kat];
  if (!src) return 0;
  return Object.values(src).reduce((s, lvl) => s + (Array.isArray(lvl) ? lvl.length : 0), 0);
}

function edCatTblDoldur() {
  const tbl = document.getElementById('edCatTbl');
  if (!tbl) return;
  const tümKats = { ...KATEGORI_BILGI, ...(typeof KATEGORI_BILGI_EK !== 'undefined' ? KATEGORI_BILGI_EK : {}) };
  let html = '';
  html += `<div class="ed-cat-cell-all selected" onclick="edKategoriSec('all')">Tüm Kategoriler &nbsp;→</div>`;
  let i = 1;
  for (const [kat, bilgi] of Object.entries(tümKats)) {
    const soruSayisi = edSoruSayisiHesapla(kat);
    const cntStr = soruSayisi > 0 ? `${soruSayisi} soru` : '';
    html += `<div class="ed-cat-cell" data-kat="${kat}">
      <div class="ed-cat-cell-top">
        <span class="ed-cat-num">${String(i).padStart(2,'0')}</span>
        <span class="ed-cat-name">${bilgi.isim}</span>
        <span class="ed-cat-arr">→</span>
      </div>
      <div class="ed-cat-cnt">${cntStr}</div>
    </div>`;
    i++;
  }
  tbl.innerHTML = html;
  tbl.querySelectorAll('.ed-cat-cell').forEach(cell => {
    const kat = cell.dataset.kat;
    cell.onclick = () => edKategoriSec(kat);
  });
}

function edBolumlerDoldur() {
  const list = document.getElementById('edBolumList');
  if (!list || list.children.length) return;
  const tümKats = { ...KATEGORI_BILGI, ...(typeof KATEGORI_BILGI_EK !== 'undefined' ? KATEGORI_BILGI_EK : {}) };
  const aciklamalar = {
    tarih: 'Antikiteden cumhuriyete, insan hatırlar.',
    sanat: 'Bir fırça darbesi, bir asır.',
    spor: 'Saha içinde, saha dışında.',
    cografya: 'Yeryüzü hâlâ büyük.',
    bilim: 'Atomdan kozmosa, yöntem aynı kalır.',
    sinema: 'Karanlık salon, gümüş perde.',
    muzik: 'Telli, üflemeli, davullu hafıza.',
    teknoloji: 'Silikon, fiber, sinyal.',
    yemek: 'Mutfak da bir kütüphanedir.',
    edebiyat: 'Bir cümlede çağ, bir dizede yüzyıl.',
    mitoloji: 'Tanrılar, kahramanlar, hatalar.',
    astronomi: 'Yıldızlar, ışık, geçen zaman.',
    saglik: 'Beden bilir, akıl sorar.',
    ekonomi: 'Sayıların ardındaki insan.',
    hayvanlar: 'Evrim durmuyor, hayvanlar da.',
    bayrak: 'Her rengin bir anlamı var.',
    logo: 'Bir bakışta tanırsın.'
  };
  const toplamSoru = Object.keys(tümKats).reduce((t, k) => t + edSoruSayisiHesapla(k), 0);
  let html = `<div class="ed-kart ed-kart-karisik" onclick="edBolumSecVeOyna('all', this)">
    <div class="ed-kart-top">
      <span class="ed-kart-num">00</span>
      <span class="ed-kart-ok">→</span>
    </div>
    <div class="ed-kart-isim">Karışık</div>
    <div class="ed-kart-desc">Tüm kategorilerden rastgele sorular.</div>
    <div class="ed-kart-footer">
      <div class="ed-kart-soru"><span class="ed-kart-lbl">SORU</span><span class="ed-kart-sayi">${toplamSoru}</span></div>
      <button class="ed-kart-btn" onclick="event.stopPropagation();edModAc('all')">OYNA</button>
    </div>
  </div>`;
  let i = 1;
  for (const [kat, bilgi] of Object.entries(tümKats)) {
    const desc = aciklamalar[kat] || '';
    const soruSayisi = edSoruSayisiHesapla(kat);
    html += `<div class="ed-kart" onclick="edBolumSecVeOyna('${kat}', this)">
      <div class="ed-kart-top">
        <span class="ed-kart-num">${String(i).padStart(2,'0')}</span>
        <span class="ed-kart-ok">→</span>
      </div>
      <div class="ed-kart-isim">${bilgi.isim}</div>
      <div class="ed-kart-desc">${desc}</div>
      <div class="ed-kart-footer">
        <div class="ed-kart-soru"><span class="ed-kart-lbl">SORU</span><span class="ed-kart-sayi">${soruSayisi}</span></div>
        <button class="ed-kart-btn" onclick="event.stopPropagation();edModAc('${kat}')">OYNA</button>
      </div>
    </div>`;
    i++;
  }
  list.innerHTML = html;
  if (window.innerWidth > 640) initBolumSphere();
}

function initBolumSphere() {
  if (document.getElementById('bolumSphere')) return;
  const list = document.getElementById('edBolumList');
  if (!list) return;

  const NO_JPG = new Set(['saglik','ekonomi','bayrak','logo']);
  const tümKats = { ...KATEGORI_BILGI, ...(typeof KATEGORI_BILGI_EK !== 'undefined' ? KATEGORI_BILGI_EK : {}) };
  const toplamSoru = Object.keys(tümKats).reduce((t, k) => t + edSoruSayisiHesapla(k), 0);

  const katNodes = [
    { kat: 'all', isim: 'Karışık', sayi: toplamSoru, karisik: true, img: null },
    ...Object.entries(tümKats).map(([kat, bilgi]) => ({
      kat, isim: bilgi.isim, sayi: edSoruSayisiHesapla(kat),
      img: NO_JPG.has(kat) ? null : `images/${kat}.jpg`
    }))
  ];

  const N = katNodes.length;
  const RADIUS = 210;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  const positions = katNodes.map((node, i) => {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    return { ...node, ox: Math.cos(theta) * r * RADIUS, oy: y * RADIUS, oz: Math.sin(theta) * r * RADIUS };
  });

  list.className = 'ed-bolum-sphere-wrap';
  list.innerHTML = '';

  const scene = document.createElement('div');
  scene.id = 'bolumSphere';
  list.appendChild(scene);

  // Ambient glow + halo ring
  const glow = document.createElement('div');
  glow.className = 'bsph-glow';
  scene.appendChild(glow);
  const halo = document.createElement('div');
  halo.className = 'bsph-halo';
  scene.appendChild(halo);

  // Canvas for wireframe lines
  const canvas = document.createElement('canvas');
  canvas.className = 'bsph-canvas';
  scene.appendChild(canvas);

  // Pre-generate wireframe circle points (raw object-space coords)
  const SEGS = 72;
  const wireCircles = [];
  for (let i = 0; i < 4; i++) {          // 4 longitude great-circles
    const phi = (i / 4) * Math.PI;
    const pts = [];
    for (let j = 0; j <= SEGS; j++) {
      const t = (j / SEGS) * Math.PI * 2;
      pts.push([Math.cos(t) * Math.cos(phi) * RADIUS, Math.sin(t) * RADIUS, Math.cos(t) * Math.sin(phi) * RADIUS]);
    }
    wireCircles.push(pts);
  }
  for (const lat of [-0.45, 0, 0.45]) {  // 3 latitude parallels
    const ry = lat * RADIUS, cr = Math.sqrt(RADIUS * RADIUS - ry * ry);
    const pts = [];
    for (let j = 0; j <= SEGS; j++) {
      const t = (j / SEGS) * Math.PI * 2;
      pts.push([Math.cos(t) * cr, ry, Math.sin(t) * cr]);
    }
    wireCircles.push(pts);
  }

  // Build node elements
  const nodeEls = positions.map(pos => {
    const el = document.createElement('div');
    el.className = 'bsph-node' + (pos.karisik ? ' bsph-node-karisik' : '');
    if (pos.img) {
      const photo = document.createElement('div');
      photo.className = 'bsph-photo';
      photo.style.backgroundImage = `url('${pos.img}')`;
      el.appendChild(photo);
      const overlay = document.createElement('div');
      overlay.className = 'bsph-overlay';
      el.appendChild(overlay);
    }
    const nameEl = document.createElement('span');
    nameEl.className = 'bsph-name';
    nameEl.textContent = pos.isim;
    el.appendChild(nameEl);
    const cntEl = document.createElement('span');
    cntEl.className = 'bsph-cnt';
    cntEl.textContent = pos.sayi;
    el.appendChild(cntEl);
    el.dataset.ox = pos.ox;
    el.dataset.oy = pos.oy;
    el.dataset.oz = pos.oz;
    el.addEventListener('click', () => { edModSeciliKat = pos.kat; edModAc(pos.kat); });
    scene.appendChild(el);
    return el;
  });

  let rotY = 0, rotX = 0, targetRotX = 0, hovering = false;
  scene.addEventListener('mouseenter', () => { hovering = true; });
  scene.addEventListener('mouseleave', () => { hovering = false; targetRotX = 0; });
  scene.addEventListener('mousemove', e => {
    const rect = scene.getBoundingClientRect();
    targetRotX = ((e.clientY - rect.top) / rect.height - 0.5) * -22;
  });

  let cvW = 0, cvH = 0;
  function syncCanvas() { cvW = canvas.width = scene.offsetWidth; cvH = canvas.height = scene.offsetHeight; }
  syncCanvas();

  function rotPt(ox, oy, oz, cosY, sinY, cosX, sinX) {
    const x1 = ox * cosY + oz * sinY;
    const z1 = -ox * sinY + oz * cosY;
    const y2 = oy * cosX - z1 * sinX;
    const z2 = oy * sinX + z1 * cosX;
    return [x1, y2, z2];
  }

  function tick() {
    if (!document.getElementById('bolumSphere')) return;
    if (!hovering) rotY += 0.18;
    rotX += (targetRotX - rotX) * 0.04;
    const cosY = Math.cos(rotY * Math.PI / 180), sinY = Math.sin(rotY * Math.PI / 180);
    const cosX = Math.cos(rotX * Math.PI / 180), sinX = Math.sin(rotX * Math.PI / 180);

    // Node transforms
    nodeEls.forEach(el => {
      const [x, y, z] = rotPt(+el.dataset.ox, +el.dataset.oy, +el.dataset.oz, cosY, sinY, cosX, sinX);
      const depth = (z + RADIUS) / (2 * RADIUS);
      const scale = 0.5 + depth * 0.75;
      el.style.transform = `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px)) scale(${scale.toFixed(3)})`;
      el.style.opacity = (0.15 + depth * 0.85).toFixed(3);
      el.style.zIndex = Math.round(depth * 100);
    });

    // Wireframe canvas
    if (!cvW) syncCanvas();
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cvW, cvH);
    const cx = cvW / 2, cy = cvH / 2;
    wireCircles.forEach(pts => {
      ctx.beginPath();
      pts.forEach(([ox, oy, oz], i) => {
        const [sx, sy] = rotPt(ox, oy, oz, cosY, sinY, cosX, sinX);
        i === 0 ? ctx.moveTo(cx + sx, cy + sy) : ctx.lineTo(cx + sx, cy + sy);
      });
      const [,,mz] = rotPt(...pts[Math.floor(pts.length / 2)], cosY, sinY, cosX, sinX);
      const d = (mz + RADIUS) / (2 * RADIUS);
      ctx.strokeStyle = `rgba(255,255,255,${(0.018 + d * 0.065).toFixed(3)})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    });

    requestAnimationFrame(tick);
  }
  tick();
}

let edModSeciliKat = null;

function edModAc(kat) {
  edModSeciliKat = kat;
  const tümKats = { ...KATEGORI_BILGI, ...(typeof KATEGORI_BILGI_EK !== 'undefined' ? KATEGORI_BILGI_EK : {}) };
  const katAdi = kat === 'all' ? 'Karışık' : (tümKats[kat]?.isim || kat);
  document.getElementById('edModKatAdi').textContent = katAdi.toUpperCase();
  document.querySelectorAll('.ed-mod-kart').forEach(k => k.classList.remove('selected'));
  document.querySelector('.ed-mod-kart[data-mod="klasik"]').classList.add('selected');
  oyunModu = 'klasik';
  document.getElementById('edModPanel').style.display = 'flex';
}

function edBolumSecVeOyna(kat, el) {
  // Zaten seçili olan karta ikinci kez basıldı → overlay aç
  if (edModSeciliKat === kat) {
    edModAc(kat);
    return;
  }
  // İlk basış: kartı seç, overlay açma
  document.querySelectorAll('.ed-kart').forEach(k => k.classList.remove('ed-kart-aktif'));
  if (el) el.classList.add('ed-kart-aktif');
  edModSeciliKat = kat;
}

function edModSecKart(mod, el) {
  oyunModu = mod;
  document.querySelectorAll('.ed-mod-kart').forEach(k => k.classList.remove('selected'));
  el.classList.add('selected');
}

function edModKapat(e) {
  if (e && e.target !== document.getElementById('edModPanel')) return;
  document.getElementById('edModPanel').style.display = 'none';
  document.querySelectorAll('.ed-kart').forEach(k => k.classList.remove('ed-kart-aktif'));
  edModSeciliKat = null;
}

function edModBasla() {
  document.getElementById('edModPanel').style.display = 'none';
  const bugunBtn = document.querySelector('.ed-tab-btn');
  edTabSec('bugun', bugunBtn);
  setTimeout(() => { edKategoriSec(edModSeciliKat); baslat(); }, 80);
}

// ════════════════════════════════════════
// ATÖLYE
// ════════════════════════════════════════

function atAc(araç) {
  const paneller = { pomodoro: 'atPomodoro', not: 'atNot', ses: 'atSes', sinav: 'atSinav', calisma: 'atCalisma' };
  const btnler   = { pomodoro: 'atPomodoroKart', not: 'atNotKart', ses: 'atSesKart', sinav: 'atSinavKart', calisma: 'atCalismaKart' };
  Object.entries(paneller).forEach(([key, id]) => {
    const panel = document.getElementById(id);
    const kart  = document.getElementById(btnler[key]);
    if (!panel) return;
    const acik = panel.style.display !== 'none';
    const btn = kart?.querySelector('.at-ac-btn');
    if (key === araç) {
      const yeniAcik = !acik;
      panel.style.display = yeniAcik ? '' : 'none';
      kart?.classList.toggle('at-kart-acik', yeniAcik);
      if (btn) btn.textContent = yeniAcik ? 'KAPA ×' : 'AÇ →';
      if (key === 'not' && yeniAcik) notYukle();
      if (key === 'sinav' && yeniAcik) sinavGoster();
      if (key === 'calisma' && yeniAcik) calismaGoster();
    } else {
      panel.style.display = 'none';
      kart?.classList.remove('at-kart-acik');
      if (btn) btn.textContent = 'AÇ →';
    }
  });
}

// ── Pomodoro ──
const POM_SURELER = { calis: 25 * 60, kisa: 5 * 60, uzun: 15 * 60 };
let pomMod = 'calis';
let pomKalan = POM_SURELER.calis;
let pomToplamSure = POM_SURELER.calis;
let pomTimer = null;
let pomCalisiyor = false;

function pomModSec(mod, btn) {
  pomDurdur();
  pomMod = mod;
  pomKalan = POM_SURELER[mod];
  pomToplamSure = POM_SURELER[mod];
  document.querySelectorAll('.at-pom-mod').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  pomGuncelle();
}

function pomBaslat() {
  if (pomCalisiyor) {
    pomDurdur();
  } else {
    pomCalisiyor = true;
    document.getElementById('pomBaslatBtn').textContent = 'DURAKLAT';
    pomFsBtnGuncelle();
    pomTimer = setInterval(() => {
      pomKalan--;
      pomGuncelle();
      if (pomKalan <= 0) {
        pomDurdur();
        pomKalan = 0;
        pomGuncelle();
        sesTomHepsiDurdur();
      }
    }, 1000);
  }
}

function pomDurdur() {
  clearInterval(pomTimer);
  pomCalisiyor = false;
  document.getElementById('pomBaslatBtn').textContent = 'BAŞLAT';
  pomFsBtnGuncelle();
}

function pomSifirla() {
  pomDurdur();
  pomKalan = POM_SURELER[pomMod];
  pomToplamSure = POM_SURELER[pomMod];
  pomGuncelle();
}

function pomGuncelle() {
  const dak = String(Math.floor(pomKalan / 60)).padStart(2, '0');
  const san = String(pomKalan % 60).padStart(2, '0');
  const str = `${dak}:${san}`;
  const pct = `${(pomKalan / pomToplamSure) * 100}%`;
  const el = document.getElementById('pomSure');    if (el) el.textContent = str;
  const bar = document.getElementById('pomBar');    if (bar) bar.style.width = pct;
  const fsEl = document.getElementById('pomFsSure'); if (fsEl) fsEl.textContent = str;
  const fsBar = document.getElementById('pomFsBar'); if (fsBar) fsBar.style.width = pct;
  document.title = pomCalisiyor ? `${str} — Pomodoro` : document.title.replace(/^\d{2}:\d{2}.*?—\s*/, '');
}

function pomTamEkranAc() {
  const ov = document.getElementById('pomFsOverlay');
  if (!ov) return;
  ov.style.display = 'flex';
  pomFsBtnGuncelle();
  pomFsModGuncelle();
  pomGuncelle();
}

function pomTamEkranKapat() {
  const ov = document.getElementById('pomFsOverlay');
  if (ov) ov.style.display = 'none';
}

function pomFsBtnGuncelle() {
  const btn = document.getElementById('pomFsBaslatBtn');
  if (btn) btn.textContent = pomCalisiyor ? 'DURAKLAT' : 'BAŞLAT';
}

function pomFsModGuncelle() {
  document.querySelectorAll('.pom-fs-mod').forEach(b => {
    b.classList.toggle('selected', b.onclick?.toString().includes(`'${pomMod}'`));
  });
}

// ── Not Defteri ──
function notYukle() {
  const alan = document.getElementById('atNotAlan');
  if (!alan) return;
  alan.value = localStorage.getItem('bm_not') || '';
  notSayacGuncelle();
}

function notKaydet() {
  const alan = document.getElementById('atNotAlan');
  if (!alan) return;
  localStorage.setItem('bm_not', alan.value);
  notSayacGuncelle();
  const durum = document.getElementById('atNotDurum');
  if (durum) { durum.textContent = 'Kaydedildi ✓'; setTimeout(() => { durum.textContent = ''; }, 1500); }
}

function notSayacGuncelle() {
  const alan = document.getElementById('atNotAlan');
  const sayac = document.getElementById('atNotSayac');
  if (alan && sayac) sayac.textContent = `${alan.value.length} karakter`;
}

// ── Quiz Müziği ──
let _qMuzik = null;
let _qMuzikSusturoldu = false;
let _qMuzikFadeTimer = null;

function quizMuzikBaslat() {
  if (_qMuzikSusturoldu) return;
  if (!_qMuzik) {
    _qMuzik = new Audio('sounds/muzik.mp3');
    _qMuzik.loop = true;
    _qMuzik.volume = 0;
  }
  clearInterval(_qMuzikFadeTimer);
  _qMuzik.play().catch(() => {});
  let v = _qMuzik.volume;
  _qMuzikFadeTimer = setInterval(() => {
    v = Math.min(0.35, v + 0.02);
    _qMuzik.volume = v;
    if (v >= 0.35) clearInterval(_qMuzikFadeTimer);
  }, 80);
  _qMuzikBtnGuncelle();
}

function quizMuzikDurdur() {
  if (!_qMuzik) return;
  clearInterval(_qMuzikFadeTimer);
  let v = _qMuzik.volume;
  _qMuzikFadeTimer = setInterval(() => {
    v = Math.max(0, v - 0.03);
    _qMuzik.volume = v;
    if (v <= 0) {
      clearInterval(_qMuzikFadeTimer);
      _qMuzik.pause();
      _qMuzik.currentTime = 0;
    }
  }, 60);
}

function quizMuzikToggle() {
  _qMuzikSusturoldu = !_qMuzikSusturoldu;
  if (_qMuzikSusturoldu) {
    quizMuzikDurdur();
  } else {
    quizMuzikBaslat();
  }
  _qMuzikBtnGuncelle();
}

function _qMuzikBtnGuncelle() {
  const btn = document.getElementById('qzMuzikBtn');
  if (!btn) return;
  btn.textContent = _qMuzikSusturoldu ? '🔇' : '🎵';
  btn.classList.toggle('susturuldu', _qMuzikSusturoldu);
}

// ── Ses Ortamı ──
// Dosya bazlı sesler (gerçek kayıt): yagmur, okyanus, firtina, ates
// Synthesis bazlı sesler: ruzgar, beyaz, pembe, kahve
const SES_DOSYALI = ['yagmur', 'okyanus', 'firtina', 'ates'];
const sesAktif = {};
const sesVolumes = { yagmur: 60, okyanus: 60, ruzgar: 60, firtina: 60, ates: 60, beyaz: 60, pembe: 60, kahve: 60 };
const sesAudioEls = {};

// ─ Dosya bazlı ─
function sesBaslatDosya(id) {
  if (!sesAudioEls[id]) {
    const a = new Audio(`sounds/${id}.wav`);
    a.loop = true;
    a.preload = 'auto';
    sesAudioEls[id] = a;
  }
  const a = sesAudioEls[id];
  a.volume = (sesVolumes[id] ?? 60) / 100;
  a.play().catch(() => {});
  sesAktif[id] = { type: 'file' };
}

function sesDurdurDosya(id) {
  const a = sesAudioEls[id];
  if (!a) return;
  a.pause();
  a.currentTime = 0;
  delete sesAktif[id];
}

// ─ Synthesis bazlı (beyaz/pembe/kahve) ─
let sesCtx = null;

function _sesNoiseBuf() {
  const sr = sesCtx.sampleRate;
  const buf = sesCtx.createBuffer(1, sr * 4, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function sesBaslatSynth(id) {
  if (!sesCtx) sesCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (sesCtx.state === 'suspended') sesCtx.resume();
  if (sesAktif[id]) return;

  const gainNode = sesCtx.createGain();
  gainNode.gain.value = 0;
  gainNode.connect(sesCtx.destination);

  const src = sesCtx.createBufferSource();
  src.buffer = _sesNoiseBuf();
  src.loop = true;

  if (id === 'beyaz') {
    src.connect(gainNode);
  } else if (id === 'pembe') {
    const f = sesCtx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 2200; f.Q.value = 0.5;
    src.connect(f); f.connect(gainNode);
  } else if (id === 'kahve') {
    const f1 = sesCtx.createBiquadFilter();
    f1.type = 'lowpass'; f1.frequency.value = 150;
    const f2 = sesCtx.createBiquadFilter();
    f2.type = 'lowpass'; f2.frequency.value = 150;
    src.connect(f1); f1.connect(f2); f2.connect(gainNode);
  } else if (id === 'ruzgar') {
    const bp = sesCtx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 1.5;
    const wg = sesCtx.createGain(); wg.gain.value = 1;
    src.connect(bp); bp.connect(wg); wg.connect(gainNode);
    const lfo = sesCtx.createOscillator();
    const lfoG = sesCtx.createGain(); lfoG.gain.value = 0.5;
    lfo.frequency.value = 0.07;
    lfo.connect(lfoG); lfoG.connect(wg.gain);
    lfo.start();
    sesAktif[id] = { type: 'synth', src, gainNode, lfo };
    src.start();
    gainNode.gain.setTargetAtTime((sesVolumes[id] ?? 60) / 100, sesCtx.currentTime, 0.3);
    return;
  }

  src.start();
  gainNode.gain.setTargetAtTime((sesVolumes[id] ?? 60) / 100, sesCtx.currentTime, 0.3);
  sesAktif[id] = { type: 'synth', src, gainNode };
}

function sesDurdurSynth(id) {
  const n = sesAktif[id];
  if (!n) return;
  delete sesAktif[id];
  n.gainNode.gain.setTargetAtTime(0, sesCtx.currentTime, 0.3);
  setTimeout(() => {
    try { n.src.stop(); } catch(e) {}
    if (n.lfo) { try { n.lfo.stop(); } catch(e) {} }
  }, 600);
}

// ─ Ortak API ─
function sesBaslat(id) {
  if (SES_DOSYALI.includes(id)) sesBaslatDosya(id);
  else sesBaslatSynth(id);
}

function sesDurdur(id) {
  if (SES_DOSYALI.includes(id)) sesDurdurDosya(id);
  else sesDurdurSynth(id);
}

function sesToggle(id, btn) {
  if (sesAktif[id]) {
    sesDurdur(id);
    btn?.classList.remove('ses-aktif');
  } else {
    sesBaslat(id);
    btn?.classList.add('ses-aktif');
  }
}

function sesVolume(id, val) {
  sesVolumes[id] = +val;
  if (!sesAktif[id]) return;
  if (SES_DOSYALI.includes(id)) {
    if (sesAudioEls[id]) sesAudioEls[id].volume = +val / 100;
  } else if (sesCtx) {
    sesAktif[id].gainNode.gain.setTargetAtTime(+val / 100, sesCtx.currentTime, 0.05);
  }
}

function sesTomHepsiDurdur() {
  Object.keys({ ...sesAktif }).forEach(id => {
    sesDurdur(id);
    const btn = document.getElementById('sesBtn-' + id);
    btn?.classList.remove('ses-aktif');
  });
}

// ── Ders Programı ──
const DP_GUNLER = [
  { ad: 'Pazartesi', kisa: 'PZT' },
  { ad: 'Salı',      kisa: 'SAL' },
  { ad: 'Çarşamba',  kisa: 'ÇAR' },
  { ad: 'Perşembe',  kisa: 'PER' },
  { ad: 'Cuma',      kisa: 'CUM' },
  { ad: 'Cumartesi', kisa: 'CTS' },
  { ad: 'Pazar',     kisa: 'PZR' },
];

function dersProgramiAc() {
  const overlay = document.getElementById('dpOverlay');
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  dersProgramiGoster();
}

function dersProgramiKapat() {
  if (window.STANDALONE) {
    window.parent.postMessage('oyunKapat', '*');
    return;
  }
  document.getElementById('dpOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

function dersProgramiGoster() {
  const el = document.getElementById('dpIcerik');
  if (!el) return;
  const program = JSON.parse(localStorage.getItem('bm_ders_programi') || '{}');
  const bugunIndex = (new Date().getDay() + 6) % 7;
  el.innerHTML = DP_GUNLER.map((g, gi) => {
    const dersler = program[g.ad] || [];
    const bugun = gi === bugunIndex;
    return `<div class="dp-gun${bugun ? ' dp-gun-bugun' : ''}">
      <div class="dp-gun-baslik">${g.kisa}${bugun ? ' ·' : ''}</div>
      <div class="dp-gun-dersler">
        ${dersler.length
          ? dersler.map((d, i) => `
              <div class="dp-ders">
                <span class="dp-ders-saat">${d.saat}</span>
                <span class="dp-ders-ad">${d.ad}</span>
                <button class="dp-ders-sil" onclick="dersSil(${gi},${i})">✕</button>
              </div>`).join('')
          : '<div class="dp-bos">—</div>'}
      </div>
      <div class="dp-ekle-wrap">
        <input class="dp-saat-input" id="dpS${gi}" type="time" value="09:00">
        <input class="dp-ad-input"   id="dpA${gi}" type="text" placeholder="Ders adı" maxlength="28"
          onkeydown="if(event.key==='Enter') dersEkle(${gi})">
        <button class="dp-ekle-btn" onclick="dersEkle(${gi})">+ EKLE</button>
      </div>
    </div>`;
  }).join('');
}

function dersEkle(gi) {
  const saat = document.getElementById(`dpS${gi}`).value || '09:00';
  const ad   = document.getElementById(`dpA${gi}`).value.trim();
  if (!ad) return;
  const gun  = DP_GUNLER[gi].ad;
  const program = JSON.parse(localStorage.getItem('bm_ders_programi') || '{}');
  if (!program[gun]) program[gun] = [];
  program[gun].push({ saat, ad });
  program[gun].sort((a, b) => a.saat.localeCompare(b.saat));
  localStorage.setItem('bm_ders_programi', JSON.stringify(program));
  dersProgramiGoster();
}

function dersSil(gi, index) {
  const gun  = DP_GUNLER[gi].ad;
  const program = JSON.parse(localStorage.getItem('bm_ders_programi') || '{}');
  if (program[gun]) program[gun].splice(index, 1);
  localStorage.setItem('bm_ders_programi', JSON.stringify(program));
  dersProgramiGoster();
}

// ── Sınav Geri Sayımı ──
const SINAVLAR = [
  { ad: 'LGS',       tarihler: ['2026-06-07', '2027-06-06'] },
  { ad: 'YKS / TYT', tarihler: ['2026-06-20', '2027-06-19'] },
  { ad: 'YKS / AYT', tarihler: ['2026-06-21', '2027-06-20'] },
  { ad: 'DGS',       tarihler: ['2026-07-19', '2027-07-18'] },
  { ad: 'YDS',       tarihler: ['2026-09-27', '2027-09-26'] },
  { ad: 'KPSS',      tarihler: ['2026-10-18', '2027-10-17'] },
  { ad: 'ALES',      tarihler: ['2026-11-08', '2027-11-07'] },
];

function sinavGoster() {
  const el = document.getElementById('atSinavListe');
  if (!el) return;
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  el.innerHTML = SINAVLAR.map(s => {
    const tarihStr = s.tarihler.find(d => new Date(d + 'T00:00:00') >= bugun)
      || s.tarihler[s.tarihler.length - 1];
    const t = new Date(tarihStr + 'T00:00:00');
    const gun = Math.ceil((t - bugun) / 86400000);
    const gecti = gun < 0;
    const etiket = t.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    return `<div class="sinav-satir${gecti ? ' sinav-gecti' : ''}">
      <span class="sinav-satir-ad">${s.ad}</span>
      <span class="sinav-satir-tarih">${etiket}</span>
      <span class="sinav-satir-gun">${gecti ? 'GEÇTİ' : gun}</span>
      ${gecti ? '' : '<span class="sinav-satir-lbl">GÜN</span>'}
    </div>`;
  }).join('');
}

// ── Çalışma Günlüğü ──
function calismaEkle() {
  const konu = document.getElementById('atCalismaKonu').value.trim();
  if (!konu) return;
  const sure = parseInt(document.getElementById('atCalismaSure').value) || 0;
  const tarih = new Date().toISOString().slice(0, 10);
  const kayitlar = JSON.parse(localStorage.getItem('bm_calisma') || '[]');
  kayitlar.push({ tarih, konu, sure, ts: Date.now() });
  localStorage.setItem('bm_calisma', JSON.stringify(kayitlar));
  document.getElementById('atCalismaKonu').value = '';
  document.getElementById('atCalismaSure').value = '';
  calismaGoster();
}

function calismaSil(ts) {
  let kayitlar = JSON.parse(localStorage.getItem('bm_calisma') || '[]');
  kayitlar = kayitlar.filter(k => k.ts !== ts);
  localStorage.setItem('bm_calisma', JSON.stringify(kayitlar));
  calismaGoster();
}

function calismaGoster() {
  const kayitlar = JSON.parse(localStorage.getItem('bm_calisma') || '[]');
  const bugun = new Date().toISOString().slice(0, 10);
  const bugunKayitlar = kayitlar.filter(k => k.tarih === bugun);
  const listeEl = document.getElementById('atCalismaListe');
  const ozetEl  = document.getElementById('atCalismaOzet');
  if (!listeEl) return;
  if (bugunKayitlar.length === 0) {
    listeEl.innerHTML = '<div class="at-calisma-bos">Bugün henüz kayıt yok.</div>';
    ozetEl.textContent = '';
    return;
  }
  listeEl.innerHTML = bugunKayitlar.map(k =>
    `<div class="at-calisma-kayit">
      <span class="at-calisma-konu">${k.konu}</span>
      <span class="at-calisma-sure-lbl">${k.sure ? k.sure + ' dk' : '—'}</span>
      <button class="at-calisma-sil" onclick="calismaSil(${k.ts})">✕</button>
    </div>`
  ).join('');
  const toplamDk = bugunKayitlar.reduce((a, k) => a + (k.sure || 0), 0);
  const saatStr = toplamDk >= 60
    ? `${Math.floor(toplamDk / 60)} sa ${toplamDk % 60} dk`
    : `${toplamDk} dk`;
  ozetEl.textContent = `Bugün: ${bugunKayitlar.length} konu · ${saatStr}`;
}

function calismaGecmisToggle() {
  const el = document.getElementById('atCalismaGecmis');
  const btn = document.getElementById('atCalismaGecmisBtn');
  const acik = el.style.display !== 'none';
  el.style.display = acik ? 'none' : '';
  if (btn) btn.textContent = acik ? 'GEÇMİŞ →' : 'GEÇMİŞİ GİZLE ↑';
  if (!acik) calismaGecmisGoster();
}

function calismaGecmisGoster() {
  const kayitlar = JSON.parse(localStorage.getItem('bm_calisma') || '[]');
  const bugun = new Date().toISOString().slice(0, 10);
  const gecmis = {};
  kayitlar.filter(k => k.tarih !== bugun).forEach(k => {
    if (!gecmis[k.tarih]) gecmis[k.tarih] = [];
    gecmis[k.tarih].push(k);
  });
  const tarihler = Object.keys(gecmis).sort().reverse().slice(0, 14);
  const el = document.getElementById('atCalismaGecmis');
  if (!tarihler.length) { el.innerHTML = '<div class="at-calisma-bos">Geçmiş kayıt yok.</div>'; return; }
  el.innerHTML = tarihler.map(t => {
    const g = gecmis[t];
    const dk = g.reduce((a, k) => a + (k.sure || 0), 0);
    const label = new Date(t + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    return `<div class="gecmis-gun">
      <div class="gecmis-gun-baslik">${label} · ${dk ? dk + ' dk' : g.length + ' konu'}</div>
      ${g.map(k => `<div class="gecmis-kayit">${k.konu}${k.sure ? ' · ' + k.sure + ' dk' : ''}</div>`).join('')}
    </div>`;
  }).join('');
}

function ktIstatistikGoster() {
  const kayit = JSON.parse(localStorage.getItem('bm_fc_ilerleme') || '{}');
  const bugun = new Date().toISOString().slice(0, 10);
  const bugunkuBildi = kayit[bugun]?.bildi ?? '—';
  const seri = (function() {
    let s = 0, d = new Date();
    while (true) {
      const k = d.toISOString().slice(0, 10);
      if (!kayit[k]) break;
      s++; d.setDate(d.getDate() - 1);
    }
    return s || '—';
  })();
  const toplam = typeof FLASHCARD_HAVUZU !== 'undefined' ? FLASHCARD_HAVUZU.length : '—';
  const seriEl = document.getElementById('ktSeriEl');
  const bugunkuEl = document.getElementById('ktBugunkuEl');
  const toplamEl = document.getElementById('ktToplamEl');
  if (seriEl) seriEl.textContent = seri;
  if (bugunkuEl) bugunkuEl.textContent = bugunkuBildi;
  if (toplamEl) toplamEl.textContent = toplam;
}

function edArsivDoldur() {
  const list = document.getElementById('edArsivList');
  if (!list || list.children.length) return;
  const gunNo = wordleGunNo();
  const TR_AY = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  let html = '';
  for (let g = gunNo; g >= Math.max(0, gunNo - 29); g--) {
    const tarih = new Date(new Date('2024-01-01').getTime() + g * 86400000);
    const key = `bm_wordle_${tarih.toDateString()}`;
    const kayit = JSON.parse(localStorage.getItem(key) || 'null');
    const tarihStr = `${tarih.getDate()} ${TR_AY[tarih.getMonth()]}`;
    const done = kayit?.bitti ? (kayit.kazandi ? '✓' : '✗') : '';
    const word = kayit?.cevap ? kayit.cevap : `№ ${g}`;
    html += `<div class="ed-arsiv-row">
      <span class="ed-arsiv-no">№ ${g}</span>
      <span class="ed-arsiv-word">${word}</span>
      <span class="ed-arsiv-date">${tarihStr}</span>
      <span class="ed-arsiv-done">${done}</span>
    </div>`;
  }
  const meta = document.getElementById('edArsivMeta');
  if (meta) meta.textContent = `ARŞİV · Son 30 Gün`;
  list.innerHTML = html || '<p style="padding:16px;color:var(--text3);font-size:0.8rem">Henüz oynanmış kelime yok.</p>';
}

function mCatListDoldur() {
  const list = document.getElementById('mCatList');
  if (!list || list.children.length) return;
  const tümKats = { ...KATEGORI_BILGI, ...(typeof KATEGORI_BILGI_EK !== 'undefined' ? KATEGORI_BILGI_EK : {}) };
  let html = `<div class="m-cat-row-all selected" onclick="edKategoriSec('all')">🎲 Tüm Kategoriler <span class="m-cat-arr">→</span></div>`;
  let i = 1;
  for (const [kat, bilgi] of Object.entries(tümKats)) {
    html += `<div class="m-cat-row" data-kat="${kat}">
      <span class="m-cat-num">${String(i).padStart(2,'0')}</span>
      <span class="m-cat-emoji">${bilgi.emoji}</span>
      <span class="m-cat-name">${bilgi.isim}</span>
      <span class="m-cat-arr">→</span>
    </div>`;
    i++;
  }
  list.innerHTML = html;
  list.querySelectorAll('.m-cat-row').forEach(row => {
    const kat = row.dataset.kat;
    row.onclick = () => edKategoriSec(kat);
  });
  // mEdHeroNo
  const mNo = document.getElementById('mEdHeroNo');
  if (mNo) mNo.textContent = wordleGunNo();

  // m-harf-on: bugünkü oyunun ilk tahmini varsa göster
  const harfOn = document.getElementById('mHarfOn');
  if (harfOn) {
    const gunNo = wordleGunNo();
    const saved = localStorage.getItem('wordle_' + gunNo);
    const tahminler = saved ? JSON.parse(saved) : [];
    const ilk = tahminler[0] || '';
    const harfler = harfOn.querySelectorAll('.m-harf');
    harfler.forEach((el, i) => {
      const harf = ilk[i] || '';
      el.textContent = harf || '·';
      el.classList.toggle('dolu', !!harf);
    });
  }
}

function edBaslat() {
  edMastheadGuncelle();
  edHeroGridDoldur();
  edCatTblDoldur();
  mCatListDoldur();
  edStreakGuncelle();
}
