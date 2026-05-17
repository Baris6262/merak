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
let seciliSure = 120;
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

function yanlisKutusuBaslat() {
  const kutu = JSON.parse(localStorage.getItem('bm_yanlis_kutusu') || '[]');
  if (kutu.length === 0) { toastGoster('🎉 Yanlış kutun boş! Tüm soruları biliyor musun?', true); return; }
  yanlisMod = true;
  sorular = [...kutu].sort(() => Math.random() - 0.5).slice(0, Math.min(10, kutu.length)).map(s => {
    const dogru = s.o[s.a];
    const k = [...s.o].sort(() => Math.random() - 0.5);
    return { q: s.q, o: k, a: k.indexOf(dogru), e: s.e, img: s.img, audio: s.audio };
  });
  soruIndex = 0; toplamPuan = 0; dogruSayisi = 0; yanlisSayisi = 0;
  kalanSure = 120; cevaplandi = false; baslangicZamani = Date.now();
  streak = 0; maxStreak = 0; canSayisi = 3;
  jokerleriKur(true);
  canGuncelle(); streakGuncelle();
  ekranGoster('quizScreen');
  soruyuGoster();
  sayacBaslat();
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
      nota(523, 0, 0.18);
      nota(659, 0.1, 0.18);
      nota(784, 0.2, 0.28);
    } else if (tip === 'yanlis') {
      nota(220, 0, 0.15, 0.15, 'sawtooth');
      nota(165, 0.15, 0.25, 0.12, 'sawtooth');
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
// MEDYA YÖNETİMİ
// ═══════════════════════════
function quizMedyaDurdur() {
  document.querySelectorAll('audio.quiz-audio').forEach(a => {
    try { a.pause(); a.currentTime = 0; } catch(e) {}
  });
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
      const isimEl = document.getElementById('isimInput');
      if (isimEl) { isimEl.value = kullaniciAdi; isimEl.readOnly = true; }
      document.getElementById('userBarName').textContent = `👤 ${kullaniciAdi}`;
      document.getElementById('userBar')?.classList.add('show');
      miniProfilGuncelle();
      if (aktifEkranYok || authAktif) {
        yonlendirSonEkrana();
      }
    } else {
      document.getElementById('userBar')?.classList.remove('show');
      const isimEl = document.getElementById('isimInput');
      if (isimEl) { isimEl.value = ''; isimEl.readOnly = false; }
      miniProfilGuncelle();
      // Misafir kullanıcı yeniledi — son ekrana geri dön
      if (localStorage.getItem('bm_misafir') === '1') {
        if (aktifEkranYok || authAktif) {
          yonlendirSonEkrana();
        }
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
  const gizli = ['authScreen', 'quizScreen', 'resultScreen', 'storeScreen', 'questScreen'];
  const fab = document.getElementById('fabWrap');
  if (fab) fab.style.display = gizli.includes(ekranId) ? 'none' : 'flex';
  const fabLeft = document.getElementById('fabWrapLeft');
  if (fabLeft) fabLeft.style.display = gizli.includes(ekranId) ? 'none' : 'flex';
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
  if (!['kolay', 'orta', 'zor'].includes(zorluk)) return false;
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

// ═══════════════════════════
// MEYDAN OKUMA (Challenge)
// ═══════════════════════════
function challengeSorular() {
  const rand = mulberry32(challengeSeed);
  let tumSorular = [];
  for (const kat of Object.keys(SORU_HAVUZU)) {
    for (const zorluk of ['kolay', 'orta', 'zor']) {
      if (SORU_HAVUZU[kat]?.[zorluk]) tumSorular.push(...SORU_HAVUZU[kat][zorluk]);
    }
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

function challengeBaslat() {
  challengeMod = true;
  sorular = challengeSorular();
  soruIndex = 0; toplamPuan = 0; dogruSayisi = 0; yanlisSayisi = 0;
  kalanSure = seciliSure; cevaplandi = false;
  baslangicZamani = Date.now();
  streak = 0; maxStreak = 0; canSayisi = 3;
  jokerleriKur(true);
  canGuncelle(); streakGuncelle();
  ekranGoster('quizScreen');
  soruyuGoster();
  sayacBaslat();
}

function challengeBannerGuncelle() {
  const banner = document.getElementById('challengeBanner');
  if (!banner) return;
  if (challengeSeed !== null) {
    banner.style.display = 'flex';
    const sub = document.getElementById('challengeSub');
    if (sub) sub.textContent = `Rakibinin skoru: ${challengeSkor} puan — Geçebilir misin?`;
  } else {
    banner.style.display = 'none';
  }
}

function urlKontrolEt() {
  const params = new URLSearchParams(window.location.search);
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
  document.getElementById('temaMod').textContent = isLight ? '☀️' : '🌙';
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
// TARİHTE BUGÜN MODU
// ═══════════════════════════
function tarihteBugunGuncelle() {
  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const d = new Date();
  const el = document.getElementById('tbSubText');
  if (el) el.textContent = `Bugün ${d.getDate()} ${aylar[d.getMonth()]}. Neler yaşandı?`;
}

function tarihteBugunSorulari() {
  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const d = new Date();
  const gun = d.getDate().toString();
  const ayIsim = aylar[d.getMonth()];
  const queryExact = gun + " " + ayIsim;
  const queryMonth = ayIsim;

  let scored = [];
  for (const kat of Object.keys(SORU_HAVUZU)) {
    for (const zorluk of ['kolay', 'orta', 'zor']) {
      if (!SORU_HAVUZU[kat][zorluk]) continue;
      for (const s of SORU_HAVUZU[kat][zorluk]) {
        let score = 0;
        const text = (s.q + " " + (s.e || "")).toLowerCase();
        
        if (text.includes(queryExact.toLowerCase())) score += 100;
        else if (text.includes(queryMonth.toLowerCase())) score += 15;
        
        // YALNIZCA KESİN veya AY EŞLEŞMESİ OLANLARI AL
        if (score > 0) {
          score += Math.random(); // Aynı puandakileri karıştırmak için
          scored.push({ s, score });
        }
      }
    }
  }
  
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10).map(item => {
    const s = item.s;
    const dogru = s.o[s.a];
    const opts = [...s.o].sort(() => Math.random() - 0.5);
    return { q: s.q, o: opts, a: opts.indexOf(dogru), e: s.e, img: s.img, audio: s.audio };
  });
}

function tarihteBugunBaslat() {
  let uretilenSorular = tarihteBugunSorulari();
  
  if (uretilenSorular.length === 0) {
    toastGoster('Bugüne dair özel kayıt bulamadık. Senin için rastgele Tarih testi hazırladık! 📜', true);
    let tarihHavuz = [];
    for (const z of ['kolay','orta','zor']) {
      if (SORU_HAVUZU['tarih']?.[z]) tarihHavuz.push(...SORU_HAVUZU['tarih'][z]);
    }
    tarihHavuz.sort(() => Math.random() - 0.5);
    uretilenSorular = tarihHavuz.slice(0, 10).map(s => {
      const dogru = s.o[s.a];
      const opts = [...s.o].sort(() => Math.random() - 0.5);
      return { q: s.q, o: opts, a: opts.indexOf(dogru), e: s.e, img: s.img, audio: s.audio };
    });
  } else if (uretilenSorular.length < 10) {
    toastGoster(`Bugüne dair ${uretilenSorular.length} özel soru bulduk! ⏳`, true);
  } else {
    toastGoster('Günün anlamına özel sorular hazır! ⏳', true);
  }

  tarihteBugunMod = true;
  sorular = uretilenSorular;
  soruIndex = 0; toplamPuan = 0; dogruSayisi = 0; yanlisSayisi = 0;
  kalanSure = seciliSure; cevaplandi = false; baslangicZamani = Date.now();
  oyundaJokerKullanildi = false; buSoruda5050Kullanildi = false;
  streak = 0; maxStreak = 0; canSayisi = 3;
  oyunModu = 'klasik'; 
  
  jokerleriKur(true);
  canGuncelle();
  
  geriSayimBaslat('⏳ Tarihte Bugün', () => {
    streakGuncelle();
    ekranGoster('quizScreen');
    soruyuGoster();
    sayacBaslat();
  });
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

  let html = `<div class="cat-btn selected" data-cat="all" onclick="kategoriSec('all', this)">
    <span class="cat-icon"><span class="cat-emoji">🎲</span></span><span class="cat-name">Karışık</span>
    ${statHtml('all')}</div>`;

  for (const [key, bilgi] of Object.entries(KATEGORI_BILGI)) {
    html += `<div class="cat-btn" data-cat="${key}" onclick="kategoriSec('${key}', this)">
      ${katIkonHtml(bilgi)}<span class="cat-name">${bilgi.isim}</span>
      ${statHtml(key)}</div>`;
  }
  grid.innerHTML = html;
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
// QUIZ BAŞLAT
// ═══════════════════════════
let freeJokers = { '5050': 1, 'time': 1, 'hint': 1 };
function jokerleriKur(jokerAktif) {
  freeJokers = { '5050': 1, 'time': 1, 'hint': 1 };
  if (typeof envanter === 'undefined') window.envanter = { jokerler: {'5050':0, 'time':0, 'hint':0} };
  joker5050Hak = freeJokers['5050'] + (envanter.jokerler['5050'] || 0);
  jokerTimeHak = freeJokers['time'] + (envanter.jokerler['time'] || 0);
  jokerHintHak = freeJokers['hint'] + (envanter.jokerler['hint'] || 0);

  ['joker5050','jokerTime','jokerHint'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('used');
    let hak = id === 'joker5050' ? joker5050Hak : id === 'jokerTime' ? jokerTimeHak : jokerHintHak;
    el.querySelector('small').textContent = jokerAktif ? `${hak} hak kaldı` : 'Kapalı';
    el.disabled = !jokerAktif;
    el.style.opacity = jokerAktif ? '1' : '0.4';
  });
}

function geriSayimBaslat(kategoriAdi, callback) {
  const overlay = document.getElementById('countdownOverlay');
  const numEl   = document.getElementById('countdownNum');
  const katEl   = document.getElementById('countdownKategori');
  if (!overlay) { callback(); return; }
  if (katEl) katEl.textContent = kategoriAdi;
  overlay.classList.add('show');
  let sayac = 3;
  numEl.className = 'countdown-num';
  numEl.textContent = sayac;

  const tick = setInterval(() => {
    sayac--;
    numEl.className = 'countdown-num';
    void numEl.offsetWidth;
    if (sayac === 0) {
      clearInterval(tick);
      numEl.classList.add('basla');
      numEl.textContent = 'BAŞLA!';
      setTimeout(() => {
        overlay.classList.remove('show');
        callback();
      }, 700);
    } else {
      numEl.textContent = sayac;
    }
  }, 800);
}

function baslat() {
  sonsuzMod = (oyunModu === 'sonsuz');
  hizMod    = (oyunModu === 'hiz');
  sinavMod  = (oyunModu === 'sinav');

  const modBilgi = MOD_BILGI[oyunModu];
  const hedefSayi = modBilgi.soruSayisi;

  let havuz = [];
  if (seciliKategori === 'all') { // Karışık kategori
    for (const kat of Object.keys(SORU_HAVUZU)) {
      for (const z of ['kolay', 'orta', 'zor', 'hepsi']) {
        if (SORU_HAVUZU[kat]?.[z]) havuz.push(...SORU_HAVUZU[kat][z]);
      }
    }
  } else if (seciliKategori === 'bayrak') { // Bayrak için tüm zorlukları tek potada erit
    const b = SORU_HAVUZU.bayrak;
    if (b) {
      if (b.hepsi) havuz.push(...b.hepsi);
      if (b.kolay) havuz.push(...b.kolay);
      if (b.orta)  havuz.push(...b.orta);
      if (b.zor)   havuz.push(...b.zor);
    }
  } else if (SORU_HAVUZU[seciliKategori]?.hepsi) { // Tek seviyeli kategori (örn: Bayrak)
    havuz = SORU_HAVUZU[seciliKategori].hepsi;
  } else {
    if (sinavMod) { // Zorluk seviyeli kategorilerde Sınav Modu
      // Sınav: seçili kategorinin tüm zorlukları
      for (const z of ['kolay','orta','zor']) {
        if (SORU_HAVUZU[seciliKategori]?.[z]) havuz.push(...SORU_HAVUZU[seciliKategori][z]);
      }
    } else { // Zorluk seviyeli kategorilerde standart mod
      if (SORU_HAVUZU[seciliKategori]?.[seciliZorluk]) {
        havuz = SORU_HAVUZU[seciliKategori][seciliZorluk];
      }
    }
  }

  if (havuz.length === 0) {
    toastGoster('Bu kategori ve zorlukta soru yok!', false);
    return;
  }

  havuz = [...havuz].sort(() => Math.random() - 0.5);

  if (sonsuzMod) {
    // Sonsuz: tüm havuz, karışık
    sorular = havuz.map(s => {
      const dogru = s.o[s.a];
      const k = [...s.o].sort(() => Math.random() - 0.5);
        return { q: s.q, o: k, a: k.indexOf(dogru), e: s.e, img: s.img, audio: s.audio };
    });
  } else {
    sorular = havuz.slice(0, Math.min(hedefSayi, havuz.length)).map(s => {
      const dogru = s.o[s.a];
      const k = [...s.o].sort(() => Math.random() - 0.5);
        return { q: s.q, o: k, a: k.indexOf(dogru), e: s.e, img: s.img, audio: s.audio };
    });
  }

  soruIndex = 0; toplamPuan = 0; dogruSayisi = 0; yanlisSayisi = 0;
  kalanSure = hizMod ? 5 : seciliSure;
  cevaplandi = false; baslangicZamani = Date.now();
  oyundaJokerKullanildi = false;
  buSoruda5050Kullanildi = false; streak = 0; maxStreak = 0;
  canSayisi = modBilgi.canVar ? 3 : 99;

  jokerleriKur(modBilgi.jokerVar);

  const livesEl = document.getElementById('livesDisplay');
  if (livesEl) livesEl.style.display = modBilgi.canVar ? 'flex' : 'none';

  canGuncelle();
  const katAdi = seciliKategori === 'all' ? 'Karışık' : (KATEGORI_BILGI[seciliKategori]?.isim || seciliKategori);
  geriSayimBaslat(katAdi, () => {
    streakGuncelle();
    ekranGoster('quizScreen');
    soruyuGoster();
    if (sonsuzMod) {
      clearInterval(timerInterval);
      document.getElementById('quizTimer').textContent = '♾️ Sonsuz';
      document.getElementById('quizTimer').classList.remove('urgent');
    } else if (hizMod) {
      hizSayacBaslat();
    } else {
      sayacBaslat();
    }
  });
}

function hizSayacBaslat() {
  clearInterval(timerInterval);
  kalanSure = 5;
  document.getElementById('quizTimer').classList.remove('urgent');
  timerGuncelle();
  timerInterval = setInterval(() => {
    kalanSure--;
    timerGuncelle();
    if (kalanSure <= 2) document.getElementById('quizTimer').classList.add('urgent');
    if (kalanSure <= 0) {
      clearInterval(timerInterval);
      if (!cevaplandi) {
        cevaplandi = true;
        yanlisSayisi++;
        streak = 0; canSayisi = Math.max(0, canSayisi - 1);
        canGuncelle(); streakGuncelle();
        geriBildirim('⏰ SÜRE DOLDU!', false);
        sesOynat('yanlis');
        document.getElementById('nextBtn').classList.add('show');
        const acEl = document.getElementById('aciklamaBar');
        const aciklama = sorular[soruIndex]?.e;
        if (acEl && aciklama) { acEl.textContent = '💡 ' + aciklama; acEl.classList.add('show'); }
        document.querySelector(`.option-btn[data-idx="${sorular[soruIndex].a}"]`)?.classList.add('correct');
        document.querySelectorAll('.option-btn').forEach(b => b.classList.add('disabled'));
      }
    }
  }, 1000);
}

function ekranGoster(id, geri = false) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active', 'slide-back'));
  const el = document.getElementById(id);
  if (geri) el.classList.add('slide-back');
  el.classList.add('active');
  const RESTORABLE = ['homeScreen', 'profileScreen', 'yanlisScreen', 'storeScreen', 'questScreen', 'wordleScreen', 'flashcardScreen'];
  if (RESTORABLE.includes(id)) localStorage.setItem('bm_son_ekran', id);
  if (id === 'authScreen') localStorage.removeItem('bm_son_ekran');
  fabKapat();
  fabEkranaGore(id);
}

// ═══════════════════════════
// SORU GÖSTER
// ═══════════════════════════
function soruyuGoster() {
  if (soruIndex >= sorular.length) { quizBitir(); return; }

  cevaplandi = false;
  buSoruda5050Kullanildi = false;
  const soru = sorular[soruIndex];
  const harfler = ['A', 'B', 'C', 'D'];

  document.getElementById('questionNumber').textContent = `SORU ${soruIndex + 1} / ${sorular.length}`;
  document.getElementById('progressFill').style.width = `${((soruIndex + 1) / sorular.length) * 100}%`;

  const qEl = document.getElementById('questionText');
  const oEl = document.getElementById('optionsList');
  qEl.classList.remove('question-enter');
  oEl.classList.remove('question-enter');
  void qEl.offsetWidth;

  qEl.textContent = soru.q;
  qEl.classList.add('question-enter');

  oEl.innerHTML = soru.o.map((opt, i) => `
    <button class="option-btn" onclick="cevapVer(${i}, this)" data-idx="${i}">
      <span class="opt-letter">${harfler[i]}</span>${opt}
    </button>
  `).join('');
  oEl.classList.add('question-enter');

  const mediaContainer = document.getElementById('mediaContainer');
  if (mediaContainer) {
    mediaContainer.innerHTML = '';
    if (soru.img || soru.audio) {
      if (soru.img) {
        // Logoların (özellikle şeffaf/siyah olanların) karanlık modda net görünmesi için beyaz arka plan kartı
        const imgStyle = seciliKategori === 'logo' ? 'background-color: #ffffff; padding: 15px; border-radius: 12px;' : '';
        mediaContainer.innerHTML += `<img src="${soru.img}" class="quiz-image" alt="Soru Görseli" style="${imgStyle}">`;
      }
      if (soru.audio) mediaContainer.innerHTML += `<audio src="${soru.audio}" class="quiz-audio" controls autoplay></audio>`;
      mediaContainer.classList.add('show');
    } else {
      mediaContainer.classList.remove('show');
    }
  }

  document.getElementById('feedbackBar').className = 'feedback-bar';
  const acEl = document.getElementById('aciklamaBar');
  if (acEl) { acEl.textContent = ''; acEl.classList.remove('show'); }
  document.getElementById('nextBtn').classList.remove('show');
  const raporBtn = document.getElementById('raporBtn');
  if (raporBtn) { raporBtn.classList.remove('raporlandi'); raporBtn.textContent = '🚩'; }

  const j5050 = document.getElementById('joker5050');
  if (j5050 && !j5050.disabled && joker5050Hak > 0) {
    j5050.classList.remove('used');
    j5050.querySelector('small').textContent = `${joker5050Hak} hak kaldı`;
  }
}

// ═══════════════════════════
// JOKER
// ═══════════════════════════
function jokerKullan(tip) {
  if (cevaplandi) return;
  oyundaJokerKullanildi = true;
  
  if (tip === '5050') {
    if (joker5050Hak <= 0 || buSoruda5050Kullanildi) return;
    
    joker5050Hak--;
    buSoruda5050Kullanildi = true;
    if (freeJokers['5050'] > 0) freeJokers['5050']--;
    else { envanter.jokerler['5050']--; ekonomiKaydet(); }
    
    const soru = sorular[soruIndex];
    const yanlisIndexler = soru.o.map((_, i) => i).filter(i => i !== soru.a);
    const silinecek = yanlisIndexler.sort(() => Math.random() - 0.5).slice(0, 2);
    
    silinecek.forEach(i => {
      document.querySelector(`.option-btn[data-idx="${i}"]`)?.classList.add('hidden');
    });
    
    document.getElementById('joker5050').classList.add('used');
    document.getElementById('joker5050').querySelector('small').textContent = joker5050Hak > 0 ? `${joker5050Hak} hak kaldı` : 'Tükendi';
    toastGoster('🃏 50:50 kullanıldı!', true);
    
  } else if (tip === 'time') {
    if (jokerTimeHak <= 0) return;

    jokerTimeHak--;
    if (freeJokers['time'] > 0) freeJokers['time']--;
    else { envanter.jokerler['time']--; ekonomiKaydet(); }

    kalanSure += 15;
    timerGuncelle();

    const btn = document.getElementById('jokerTime');
    if (jokerTimeHak <= 0) btn.classList.add('used');
    btn.querySelector('small').textContent = jokerTimeHak > 0 ? `${jokerTimeHak} hak kaldı` : 'Tükendi';
    toastGoster('⏳ +15 saniye eklendi!', true);

  } else if (tip === 'hint') {
    if (jokerHintHak <= 0) return;

    jokerHintHak--;
    if (freeJokers['hint'] > 0) freeJokers['hint']--;
    else { envanter.jokerler['hint']--; ekonomiKaydet(); }

    const soru = sorular[soruIndex];
    const dogruCevap = soru.o[soru.a];
    const ilkHarf = dogruCevap.charAt(0).toUpperCase();
    const uzunluk = dogruCevap.length;

    toastGoster(`💡 "${ilkHarf}" ile başlıyor · ${uzunluk} karakter`, true);
    const btn = document.getElementById('jokerHint');
    if (jokerHintHak <= 0) btn.classList.add('used');
    btn.querySelector('small').textContent = jokerHintHak > 0 ? `${jokerHintHak} hak kaldı` : 'Tükendi';
  }
}

// ═══════════════════════════
// CEVAP VER
// ═══════════════════════════
function cevapVer(idx, btn) {
  if (cevaplandi) return;
  cevaplandi = true;
  
  const soru = sorular[soruIndex];
  const dogru = idx === soru.a;
  
  document.querySelectorAll('.option-btn').forEach(b => b.classList.add('disabled'));
  document.querySelector(`.option-btn[data-idx="${soru.a}"]`)?.classList.add('correct');
  
  if (dogru) {
    streak++;
    if (streak > maxStreak) maxStreak = streak;
    btn.classList.add('correct');
    dogruSayisi++;
    merakLogKaydet(seciliKategori);
    const streakBonus = streak >= 4 ? 100 : streak >= 3 ? 60 : streak >= 2 ? 30 : 0;
    const carpan = hizMod ? 2 : 1;
    toplamPuan += (100 + Math.floor(kalanSure / (hizMod ? 5 : seciliSure) * 50) + streakBonus) * carpan;
    streakGuncelle();
    if (streak >= 2) {
      geriBildirim(`✅ DOĞRU! 🔥 ${streak} COMBO! +${streakBonus} bonus`, true);
      toastGoster(`🔥 ${streak} COMBO! +${streakBonus} bonus puan!`, true);
    } else {
      geriBildirim('✅ DOĞRU CEVAP!', true);
      toastGoster('✅ DOĞRU!', true);
    }
    sesOynat('dogru');
    if (yanlisMod) {
      let kutu = JSON.parse(localStorage.getItem('bm_yanlis_kutusu') || '[]');
      const onceki = kutu.length;
      kutu = kutu.filter(k => k.q !== sorular[soruIndex].q);
      localStorage.setItem('bm_yanlis_kutusu', JSON.stringify(kutu));
      if (kutu.length < onceki) {
        const cozulen = parseInt(localStorage.getItem('bm_yanlis_cozulen') || '0') + 1;
        localStorage.setItem('bm_yanlis_cozulen', cozulen);
      }
    }
  } else {
    streak = 0;
    canSayisi--;
    btn.classList.add('wrong');
    yanlisSayisi++;
    canGuncelle();
    streakGuncelle();
    geriBildirim('❌ YANLIŞ CEVAP!', false);
    sesOynat('yanlis');
    if (!yanlisMod) yanlisSakla(sorular[soruIndex], seciliKategori, seciliZorluk);
    if (canSayisi <= 0) {
      toastGoster('💔 Son canını da kaybettin!', false);
    } else {
      toastGoster(`❌ YANLIŞ! ❤️ ${canSayisi} can kaldı`, false);
    }
  }
  
  document.getElementById('nextBtn').classList.add('show');

  const aciklama = sorular[soruIndex]?.e;
  const acEl = document.getElementById('aciklamaBar');
  if (acEl) {
    if (aciklama) {
      acEl.textContent = '💡 ' + aciklama;
      acEl.classList.add('show');
    } else {
      acEl.classList.remove('show');
    }
  }
}

function geriBildirim(mesaj, dogru) {
  const fb = document.getElementById('feedbackBar');
  fb.className = 'feedback-bar show ' + (dogru ? 'correct' : 'wrong');
  fb.textContent = mesaj;
}

function sonrakiSoru() {
  quizMedyaDurdur();
  if (canSayisi <= 0 && MOD_BILGI[oyunModu]?.canVar) {
    yanlisSayisi += (sorular.length - soruIndex - 1);
    quizBitir();
    return;
  }
  soruIndex++;
  if (soruIndex >= sorular.length) { quizBitir(); return; }
  soruyuGoster();
  if (hizMod) hizSayacBaslat();
}

function streakGuncelle() {
  const el = document.getElementById('streakDisplay');
  if (!el) return;
  if (streak >= 2) {
    el.textContent = `🔥 x${streak}`;
    el.classList.add('active');
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  } else {
    el.textContent = '';
    el.classList.remove('active');
  }
}

function canGuncelle() {
  document.querySelectorAll('.can-icon').forEach((can, i) => {
    if (i < canSayisi) {
      can.textContent = '❤️';
      can.classList.remove('kayip');
    } else if (!can.classList.contains('kayip')) {
      can.textContent = '🖤';
      can.classList.add('kayip', 'can-shake');
      setTimeout(() => can.classList.remove('can-shake'), 400);
    }
  });
}

// ═══════════════════════════
// SÜRE
// ═══════════════════════════
function sayacBaslat() {
  clearInterval(timerInterval);
  kalanSure = seciliSure;
  document.getElementById('quizTimer').classList.remove('urgent');
  timerGuncelle();
  
  timerInterval = setInterval(() => {
    kalanSure--;
    timerGuncelle();
    if (kalanSure <= 20) document.getElementById('quizTimer').classList.add('urgent');
    if (kalanSure <= 5 && kalanSure > 0) sesOynat('tick');
    if (kalanSure <= 0) {
      clearInterval(timerInterval);
      yanlisSayisi += (sorular.length - soruIndex);
      quizBitir();
    }
  }, 1000);
}

function timerGuncelle() {
  const dk = Math.floor(kalanSure / 60);
  const sn = kalanSure % 60;
  document.getElementById('quizTimer').textContent = `⏱️ ${dk}:${sn.toString().padStart(2, '0')}`;
}

// ═══════════════════════════
// SONUÇ
// ═══════════════════════════
function quizBitir() {
  quizMedyaDurdur();
  clearInterval(timerInterval);
  sesOynat('bitis');
  const gecenSure = Math.floor((Date.now() - baslangicZamani) / 1000);

  beynPuaniGuncelle(toplamPuan);
  yanlisMod = false;

  kategoriStatGuncelle();
  unvanKontrolEt();
  const isChallenge = challengeMod;
  const rakipSkor = challengeSkor;
  const yeniRozetler = rozetleriKontrolEt(gecenSure);

  if (challengeMod) { challengeMod = false; }
  if (tarihteBugunMod) { tarihteBugunMod = false; }
  streakGuncelle();
  
  let kazanilanAltin = Math.floor(toplamPuan / 20);
  if (hizMod) kazanilanAltin = Math.floor(kazanilanAltin * 1.5);
  altinKazan(kazanilanAltin);
  const egEl = document.getElementById('earnedGold');
  if (egEl) egEl.textContent = '+' + kazanilanAltin;

  // GÖREV İLERLEMELERİ
  gorevIlerleme('oyun_' + oyunModu, 1);
  if (seciliKategori !== 'all') gorevIlerleme('dogru_' + seciliKategori, dogruSayisi);
  if (!oyundaJokerKullanildi && dogruSayisi >= 7) gorevIlerleme('jokersiz_oyun', 1);
  if (maxStreak >= 5) gorevIlerleme('oyun_streak', maxStreak, true);
  if (dogruSayisi >= 10) gorevIlerleme('oyun_10_dogru', 1);

  let emoji, text;
  if (dogruSayisi >= 9) { emoji = '🏆'; text = 'MÜKEMMEL! Sen bir dahisin!'; }
  else if (dogruSayisi >= 7) { emoji = '🌟'; text = 'Harika! Bilgine güveniyorsun!'; }
  else if (dogruSayisi >= 5) { emoji = '👍'; text = 'Fena değil, geliştirilebilir.'; }
  else if (dogruSayisi >= 3) { emoji = '📚'; text = 'Biraz daha çalışmalısın.'; }
  else { emoji = '😅'; text = 'Genel kültür şart! Pes etme!'; }

  const pct = sorular.length > 0 ? dogruSayisi / sorular.length : 0;
  const rankMap = pct >= 1 ? ['S','s'] : pct >= 0.8 ? ['A','a'] : pct >= 0.6 ? ['B','b'] : pct >= 0.4 ? ['C','c'] : ['D','d'];
  const rankEl = document.getElementById('resultRank');
  if (rankEl) { rankEl.textContent = rankMap[0]; rankEl.className = 'result-rank ' + rankMap[1]; }

  document.getElementById('resultEmoji').textContent = emoji;
  document.getElementById('resultScore').textContent = '0 PUAN';
  document.getElementById('resultText').textContent = text;
  document.getElementById('correctCount').textContent = dogruSayisi;
  document.getElementById('wrongCount').textContent = yanlisSayisi;
  document.getElementById('timeSpent').textContent = gecenSure + 'sn';

  // Challenge sonucu
  const challengeEl = document.getElementById('challengeResult');
  if (challengeEl) {
    if (isChallenge) {
      const fark = toplamPuan - rakipSkor;
      challengeEl.style.display = 'block';
      challengeEl.className = 'challenge-result ' + (fark >= 0 ? 'win' : 'lose');
      if (fark > 0) challengeEl.innerHTML = `🏆 Rakibini <strong>${fark} puanla</strong> geçtin!`;
      else if (fark === 0) challengeEl.innerHTML = `🤝 Berabere! İkiniz de <strong>${toplamPuan}</strong> puan!`;
      else challengeEl.innerHTML = `😤 Rakibin seni <strong>${Math.abs(fark)} puanla</strong> geçti!`;
    } else {
      challengeEl.style.display = 'none';
    }
  }

  // Yeni rozetler
  const rozetEl = document.getElementById('yeniRozetler');
  if (rozetEl) {
    if (yeniRozetler.length > 0) {
      rozetEl.style.display = 'block';
      rozetEl.innerHTML = '<div class="rozet-earned-title">🎉 Yeni Rozet Kazandın!</div>' +
        yeniRozetler.map(id => {
          const r = ROZETLER[id];
          return `<div class="rozet-earned-item"><span>${r.icon}</span><div><strong>${r.isim}</strong><small>${r.aciklama}</small></div></div>`;
        }).join('');
      rozetVitrinGuncelle();
    } else {
      rozetEl.style.display = 'none';
    }
  }

  // Leaderboard tab'ı sıfırla
  document.querySelectorAll('.lb-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  document.getElementById('leaderboardList').style.display = 'block';
  const globalEl = document.getElementById('onlineLiderboardList');
  if (globalEl) { globalEl.style.display = 'none'; globalEl.innerHTML = ''; }

  liderlikKaydet();
  liderlikGoster();
  ekranGoster('resultScreen');


  // Firebase'e kaydet (arka planda, hata olursa sessizce)
  firebaseEkle({
    isim: kullaniciAdi,
    puan: toplamPuan,
    dogru: dogruSayisi,
    toplam: sorular.length,
    zorluk: seciliZorluk,
    kategori: seciliKategori
  });
  sezonSkoru(toplamPuan, dogruSayisi, sorular.length);

  // Backend'in bildirimi kimlere atacağını bilmesi için son oyun tarihini kaydedelim
  if (currentUser && db) {
    db.collection('users').doc(currentUser.uid).set({ sonOyunTarihi: new Date().toDateString() }, { merge: true }).catch(()=>{});
  }

  setTimeout(() => {
    sayacAnimasyonu('resultScore', toplamPuan, 1200, ' PUAN');
    kategoriInsightGoster();
    if (dogruSayisi >= 7) konfeti();
  }, 250);
}

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
    let ikon = `#${i+1}`;
    if (i===0) ikon='🥇';
    else if (i===1) ikon='🥈';
    else if (i===2) ikon='🥉';

    return `<div class="lb-row">
      <span class="lb-rank">${ikon}</span>
      <div class="lb-info"><div class="lb-name">${htmlKacis(e.isim)}</div><div class="lb-meta">${parseInt(e.dogru)||0}/${parseInt(e.toplam)||0} · ${htmlKacis(e.zorluk)} · ${htmlKacis(e.tarih)}</div></div>
      <span class="lb-score">${parseInt(e.puan)||0} puan</span></div>`;
  }).join('') || '<div style="text-align:center;color:var(--text3);padding:10px;font-size:0.8rem">Henüz skor yok</div>';
}

// ═══════════════════════════
// YARDIMCILAR
// ═══════════════════════════
function anaSayfa() {
  quizMedyaDurdur();
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

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') modalKapat();
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
    for (const zorluk of ['kolay', 'orta', 'zor']) {
      if (SORU_HAVUZU[kat]?.[zorluk]) tumSorular.push(...SORU_HAVUZU[kat][zorluk]);
    }
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

  // Meta: "ÜYE · X AY" — kayıt tarihinden hesapla
  const prMeta = document.getElementById('prMeta');
  if (prMeta) {
    const kayitTarih = localStorage.getItem('bm_kayit_tarih');
    if (kayitTarih) {
      const ay = Math.max(1, Math.floor((Date.now() - parseInt(kayitTarih)) / (30 * 86400000)));
      prMeta.textContent = `ÜYE · ${ay} AY`;
    } else {
      localStorage.setItem('bm_kayit_tarih', Date.now());
      prMeta.textContent = 'ÜYE · 1 AY';
    }
  }

  // Alt bilgi
  const prSub = document.getElementById('prSub');
  if (prSub) {
    const streakData = JSON.parse(localStorage.getItem('bm_streak') || '{}');
    const seri = streakData.mevcut || 0;
    prSub.textContent = seri > 0 ? `🔥 ${seri} günlük seri aktif` : 'merak.io oyuncusu';
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
// KELİME BUL (WORDLE)
// ═══════════════════════════
const WORDLE_KLAVYE = [
  ['E','R','T','Y','U','İ','O','P','Ğ','Ü'],
  ['A','S','D','F','G','H','J','K','L','Ş','I'],
  ['GİR','Z','C','V','B','N','M','Ö','Ç','⌫']
];

let wKelime = '';
let wTahminler = [];
let wMevcut = '';
let wBitti = false;

function wordleGunNo() {
  return Math.floor((Date.now() - new Date('2024-01-01')) / 86400000);
}

function bugunkunKelime() {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const rand = mulberry32(seed);
  return KELIMELER[Math.floor(rand() * KELIMELER.length)];
}

function wordleBaslat() {
  wKelime = bugunkunKelime();
  const kayit = wordleKayitGetir();
  wTahminler = kayit ? [...kayit.tahminler] : [];
  wMevcut = '';
  wBitti = kayit ? kayit.bitti : false;

  document.getElementById('wordleGunNo').textContent = wordleGunNo();
  document.getElementById('wordleDurum').textContent = '5 harfli kelimeyi 6 denemede bul!';
  document.getElementById('wordleDurum').style.color = '';
  document.getElementById('wordlePaylas').style.display = 'none';

  // Daima inline editorial modda aç
  edWordleAc();

  wordleGridOlustur();
  wordleKlavyeOlustur();
  if ('ontouchstart' in window) {
    setTimeout(() => document.getElementById('wordleGizliInput')?.focus(), 350);
  }

  wTahminler.forEach((t, i) => wordleSatirGoster(t, i, true));
  if (wBitti) {
    const kazandi = wTahminler[wTahminler.length - 1] === wKelime;
    wordleBitisGoster(kazandi, true);
  }
  wordleBannerGuncelle();
}

function edWordleAc() {
  if (!document.getElementById('homeScreen').classList.contains('active')) {
    ekranGoster('homeScreen');
    edBaslat();
  }
  const bugunBtn = document.querySelector('.ed-tab-btn');
  edTabSec('bugun', bugunBtn);
  localStorage.setItem('bm_son_ekran', 'wordleScreen');

  const home = document.getElementById('edHomeContent');
  const panel = document.getElementById('edWordlePanel');

  home.classList.remove('ed-anim-in');
  home.classList.add('ed-anim-out');

  setTimeout(() => {
    home.style.display = 'none';
    home.classList.remove('ed-anim-out');

    panel.style.display = '';
    panel.classList.remove('ed-anim-in', 'ed-anim-out');
    panel.offsetHeight; // reflow — animasyonu başlangıç karesinden başlat
    panel.classList.add('ed-anim-in');
  }, 190);
}

function edWordleKapat() {
  localStorage.setItem('bm_son_ekran', 'homeScreen');
  const home = document.getElementById('edHomeContent');
  const panel = document.getElementById('edWordlePanel');

  panel.classList.remove('ed-anim-in');
  panel.classList.add('ed-anim-out');

  setTimeout(() => {
    panel.style.display = 'none';
    panel.classList.remove('ed-anim-out');

    home.style.display = '';
    home.classList.remove('ed-anim-in', 'ed-anim-out');
    home.offsetHeight; // reflow
    home.classList.add('ed-anim-in');

    edHeroGridDoldur();
    edStreakGuncelle();
  }, 190);
}

function wordleGridOlustur() {
  const grid = document.getElementById('wordleGrid');
  grid.innerHTML = Array.from({length: 6}, (_, i) =>
    `<div class="wordle-satir" id="wSatir${i}">${
      Array.from({length: 5}, (_, j) => `<div class="wordle-hucre" id="wH${i}${j}"></div>`).join('')
    }</div>`
  ).join('');
}

function wordleKlavyeOlustur() {
  document.getElementById('wordleKlavye').innerHTML = WORDLE_KLAVYE.map(satir =>
    `<div class="klavye-satir">${satir.map(t =>
      `<button class="klavye-tus${t==='GİR'||t==='⌫'?' klavye-tus-genis':''}" data-tus="${t}" onclick="wTus('${t}')">${t}</button>`
    ).join('')}</div>`
  ).join('');
}

function wTus(tus) {
  if (wBitti) return;
  if (tus === '⌫') { wMevcut = wMevcut.slice(0, -1); wGuncelle(); return; }
  if (tus === 'GİR') { wGonder(); return; }
  if (wMevcut.length < 5) { wMevcut += tus; wGuncelle(); }
}

function wGuncelle() {
  const satirIdx = wTahminler.length;
  for (let j = 0; j < 5; j++) {
    const h = document.getElementById(`wH${satirIdx}${j}`);
    if (!h) return;
    h.textContent = wMevcut[j] || '';
    h.classList.toggle('dolu', !!wMevcut[j]);
  }
}

function wGonder() {
  if (wMevcut.length !== 5) {
    const satir = document.getElementById(`wSatir${wTahminler.length}`);
    satir?.classList.add('salla');
    setTimeout(() => satir?.classList.remove('salla'), 450);
    toastGoster('5 harf girmelisin!', false);
    return;
  }
  const satirIdx = wTahminler.length;
  const tahmin = wMevcut;
  wTahminler.push(tahmin);
  wMevcut = '';

  wordleSatirGoster(tahmin, satirIdx, false);

  const kazandi = tahmin === wKelime;
  const bitti = kazandi || wTahminler.length >= 6;
  const animSure = 5 * 120 + 250;

  setTimeout(() => {
    if (bitti) {
      wBitti = true;
      wordleKaydet();
      wordleBitisGoster(kazandi, false);
      document.getElementById('wordlePaylas').style.display = 'flex';
      wordleBannerGuncelle();
    } else {
      wordleKaydet();
    }
  }, animSure);
}

function tahminRenkle(tahmin, cevap) {
  const sonuc = ['gri','gri','gri','gri','gri'];
  const cv = cevap.split(''), th = tahmin.split('');
  for (let i = 0; i < 5; i++) {
    if (th[i] === cv[i]) { sonuc[i] = 'yesil'; cv[i] = null; th[i] = null; }
  }
  for (let i = 0; i < 5; i++) {
    if (th[i] === null) continue;
    const idx = cv.indexOf(th[i]);
    if (idx !== -1) { sonuc[i] = 'sari'; cv[idx] = null; }
  }
  return sonuc;
}

function wordleSatirGoster(tahmin, satirIdx, anlik) {
  const renkler = tahminRenkle(tahmin, wKelime);
  const STAGGER = anlik ? 0 : 120;
  const FLIP = anlik ? 0 : 150;

  for (let j = 0; j < 5; j++) {
    const h = document.getElementById(`wH${satirIdx}${j}`);
    if (!h) continue;
    h.textContent = tahmin[j];
    h.classList.remove('dolu');

    if (anlik) {
      h.classList.add(`w-${renkler[j]}`);
      wKlavyeGuncelle(tahmin[j], renkler[j]);
    } else {
      setTimeout(() => {
        h.style.transition = `transform ${FLIP}ms ease-in`;
        h.style.transform = 'rotateX(-90deg)';
        setTimeout(() => {
          h.classList.add(`w-${renkler[j]}`);
          h.style.transition = `transform ${FLIP}ms ease-out`;
          h.style.transform = 'rotateX(0deg)';
          setTimeout(() => { h.style.transition = ''; h.style.transform = ''; }, FLIP);
          wKlavyeGuncelle(tahmin[j], renkler[j]);
        }, FLIP);
      }, j * STAGGER);
    }
  }
}

function wKlavyeGuncelle(harf, renk) {
  const el = document.querySelector(`.klavye-tus[data-tus="${harf}"]`);
  if (!el) return;
  const mevcut = el.dataset.durum;
  if (mevcut === 'yesil') return;
  if (mevcut === 'sari' && renk !== 'yesil') return;
  el.dataset.durum = renk;
}

function wordleBitisGoster(kazandi, anlik) {
  const durum = document.getElementById('wordleDurum');
  if (kazandi) {
    if (!anlik) gorevIlerleme('wordle_oyna', 1);
    const mesajlar = ['Olağanüstü! 🏆','Mükemmel! 🌟','Harika! 👏','Güzel! 😊','İyi iş! 👍','Sonuna kadar! 😅'];
    durum.textContent = mesajlar[Math.min(wTahminler.length - 1, 5)];
    durum.style.color = 'var(--correct)';
    if (!anlik && wTahminler.length <= 4) {
      setTimeout(() => konfeti(), 200);
      // Kazanma zıplama animasyonu
      setTimeout(() => {
        for (let j = 0; j < 5; j++) {
          setTimeout(() => {
            document.getElementById(`wH${wTahminler.length - 1}${j}`)?.classList.add('kazandi');
          }, j * 80);
        }
      }, 100);
    }
  } else {
    durum.textContent = `Kelime: ${wKelime}`;
    durum.style.color = 'var(--wrong)';
  }
}

function wordleKaydet() {
  const key = `bm_wordle_${new Date().toDateString()}`;
  localStorage.setItem(key, JSON.stringify({
    tahminler: wTahminler,
    bitti: wBitti,
    kazandi: wTahminler[wTahminler.length - 1] === wKelime
  }));
}

function wordleKayitGetir() {
  const raw = localStorage.getItem(`bm_wordle_${new Date().toDateString()}`);
  return raw ? JSON.parse(raw) : null;
}

function wordleBannerGuncelle() {
  const sub = document.getElementById('wordleSub');
  if (!sub) return;
  const kayit = wordleKayitGetir();
  if (kayit?.bitti) {
    sub.textContent = kayit.kazandi
      ? `✅ ${kayit.tahminler.length}/6 denemede buldun!`
      : `❌ Yarın tekrar dene (${wKelime || bugunkunKelime()})`;
  } else {
    sub.textContent = 'Bugünkü 5 harfli kelimeyi tahmin et!';
  }
}

function wordlePaylas() {
  const harita = { yesil: '🟩', sari: '🟨', gri: '⬛' };
  const satirlar = wTahminler.map(t =>
    tahminRenkle(t, wKelime).map(r => harita[r]).join('')
  ).join('\n');
  const kazandi = wTahminler[wTahminler.length - 1] === wKelime;
  const metin = `🟩 Merak Tahminle #${wordleGunNo()}\n${kazandi ? wTahminler.length : 'X'}/6\n\n${satirlar}\n\nhttps://merak.io`;
  if (navigator.share) {
    navigator.share({ text: metin }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(metin)
      .then(() => toastGoster('📋 Sonuç kopyalandı!', true))
      .catch(() => prompt('Kopyala:', metin));
  }
}

// ═══════════════════════════
// FLASHCARD EKRANI
// ═══════════════════════════
const FLASHCARD_HAVUZU = [
  {
    kategori: "Doğru Bilinen Yanlışlar",
    soru: "Bukalemunlar renklerini neden değiştirir?",
    cevap: "İletişim ve sıcaklık kontrolü için",
    aciklama: "Kamuflaj için renk değiştirdikleri büyük bir efsanedir. Asıl amaçları ruh hallerini yansıtmak, diğer bukalemunlarla iletişim kurmak ve güneş ışığını emerek veya yansıtarak vücut sıcaklıklarını ayarlamaktır."
  },
  {
    kategori: "Doğru Bilinen Yanlışlar",
    soru: "Boğalar kırmızı renge öfkelenir mi?",
    cevap: "Hayır, renk körüdürler",
    aciklama: "Boğalar kırmızıyı ayırt edemez. Onları öfkelendiren şey rengin kendisi değil, matadorun elindeki pelerinin (muleta) kışkırtıcı bir şekilde hareket etmesidir."
  },
  {
    kategori: "İnsan Anatomisi",
    soru: "İnsan beyninin yüzde kaçını kullanır?",
    cevap: "Tamamını (%100)",
    aciklama: "İnsanların beyninin sadece %10'unu kullandığı iddiası tamamen efsanedir. Modern beyin görüntüleme teknolojileri, basit eylemlerde bile beynin neredeyse tamamının aktif olduğunu göstermiştir."
  },
  {
    kategori: "Tarihi Yanılgılar",
    soru: "Napolyon Bonapart kısa boylu muydu?",
    cevap: "Hayır, dönemi için ortalama boydaydı",
    aciklama: "Napolyon yaklaşık 1.69 cm boyundaydı ve bu o dönemin Fransa'sında standart bir erkek boyuydu. İngiliz propagandası ve Fransız inç sisteminin yanlış çevrilmesi onu 'kısa' olarak tarihe geçirdi."
  },
  {
    kategori: "Etimoloji",
    soru: "Satrançtaki 'Şah Mat' kelimesi ne anlama gelir?",
    cevap: "Kral öldü / yenildi",
    aciklama: "Farsça 'Şah mât' kelimesinden gelir. Oyunun ve terimin kökeninin Doğu'ya dayandığının en büyük dilbilimsel kanıtlarından biridir."
  },
  {
    kategori: "Genel Kültür",
    soru: "Çin Seddi uzaydan çıplak gözle görülebilir mi?",
    cevap: "Hayır, görülemez",
    aciklama: "Dünya'nın yörüngesinden çıplak gözle hiçbir insan yapımı nesne (şehir ışıkları hariç) net olarak seçilemez. Çin Seddi'nin genişliği uzaydan fark edilmek için çok yetersizdir."
  },
  {
    kategori: "Bilim & Doğa",
    soru: "Dünya'daki oksijenin büyük kısmını kim üretir?",
    cevap: "Okyanuslardaki fitoplanktonlar",
    aciklama: "Ağaçların ürettiği oksijen çok önemli olsa da, soluduğumuz atmosferdeki oksijenin yaklaşık %50-80'i okyanuslardaki mikroskobik deniz canlıları olan fitoplanktonlar tarafından üretilir."
  },
  {
    kategori: "Teknoloji Tarihi",
    soru: "'Bluetooth' ismi nereden gelir?",
    cevap: "Viking Kralı Mavi Dişli Harald'dan",
    aciklama: "10. yüzyılda İskandinav kabilelerini birleştiren kralın adıdır. Teknoloji de farklı cihazları kablosuz olarak birleştirdiği için bu adı almıştır. Logosu da kralın rünik baş harfleridir."
  },
  {
    kategori: "Doğru Bilinen Yanlışlar",
    soru: "Ölümden sonra saç ve tırnaklar uzamaya devam eder mi?",
    cevap: "Hayır, uzamaz",
    aciklama: "Ölümden sonra vücut su kaybına uğrar. Deri kuruyup çekildiği ve büzüldüğü için deri altındaki tırnaklar ve saçlar dışarı çıkarak 'uzamış' gibi bir görsel yanılsama yaratır."
  },
  {
    kategori: "Bilim & Doğa",
    soru: "Ahtapotların kaç tane kalbi vardır?",
    cevap: "Üç (3) kalbi vardır",
    aciklama: "İkisi solungaçlara kan pompalamak için, üçüncüsü ise kanı vücudun geri kalanına dağıtmak için çalışır. Ayrıca kanları demir değil, bakır içerdiği için mavi renklidir."
  },
  {
    kategori: "Tarihi Yanılgılar",
    soru: "Viking miğferlerinde boynuz var mıydı?",
    cevap: "Hayır, tamamen kurgudur",
    aciklama: "Gerçek Viking miğferleri düz ve boynuzsuzdur. Boynuzlu miğfer imajı, savaşta kullanışsız olmasına rağmen 19. yüzyılda Richard Wagner'in operalarındaki kostüm tasarımcıları tarafından yaratılmış bir efsanedir."
  },
  {
    kategori: "Dil & Köken",
    soru: "Japonca'da 'Sushi' kelimesi ne anlama gelir?",
    cevap: "Ekşi pirinç",
    aciklama: "Sıklıkla 'çiğ balık' sanılsa da, sushi kelimesi sirke ile tatlandırılmış 'ekşi pirinç' anlamına gelir. Çiğ balık dilimlerinin tek başına sunulmasına ise 'Sashimi' denir."
  },
  {
    kategori: "Genel Kültür",
    soru: "Dünyada hiç bozulmayan tek doğal gıda nedir?",
    cevap: "Bal",
    aciklama: "Düşük nem oranı ve yüksek asitliği sayesinde balın içinde mikroorganizmalar yaşayamaz. Eski Mısır mezarlarında bulunan 3000 yıllık balların bile hâlâ yenebilir olduğu görülmüştür."
  },
  {
    kategori: "Doğru Bilinen Yanlışlar",
    soru: "Yarasalar kör müdür?",
    cevap: "Hayır, görebilirler",
    aciklama: "Tüm yarasa türleri görebilir. Hatta bazılarının gece görüşü insanlarınkinden çok daha iyidir. Ancak avlanmak ve karanlıkta uçmak için daha çok 'ekolokasyon' (yankı konumu) sistemine güvenirler."
  },
  {
    kategori: "İlginç Bilgiler",
    soru: "Eyfel Kulesi'nin boyu yaz aylarında neden değişir?",
    cevap: "Isı genleşmesi yüzünden 15 cm uzar",
    aciklama: "Eyfel Kulesi demirden yapıldığı için, yazın güneşin sıcaklığı metalin genleşmesine neden olur. Bu termal genleşme devasa kulenin boyunu 15 santimetreye kadar uzatabilir."
  },
  {
    kategori: "Tarihi Yanılgılar",
    soru: "Einstein ilkokulda matematikten kalmış mıdır?",
    cevap: "Hayır, daima çok başarılıydı",
    aciklama: "Bu efsane not sistemlerinin karıştırılmasından doğmuştur. Kendisi bu iddiayı 'Matematikten hiç kalmadım, 15 yaşından önce diferansiyel ve integral hesaplamada ustalaşmıştım' diyerek yalanlamıştır."
  },
  {
    kategori: "Bilim & Doğa",
    soru: "Develer hörgüçlerinde ne depolar?",
    cevap: "Yağ depolar",
    aciklama: "Hörgüçlerde su değil, 36 kilograma kadar yağ depolanır. Bu yağ enerjiye dönüştüğünde, yan ürün olarak su da açığa çıkar."
  },
  {
    kategori: "Hayvanlar Alemi",
    soru: "Japon balıklarının hafızası 3 saniye midir?",
    cevap: "Hayır, aylarca sürebilir",
    aciklama: "Bilimsel testler, Japon balıklarının karmaşık şekilleri ve sesleri aylarca hatırlayabildiğini kanıtlamıştır."
  },
  {
    kategori: "Doğru Bilinen Yanlışlar",
    soru: "Şeker yemek çocukları hiperaktif yapar mı?",
    cevap: "Hayır, bilimsel kanıtı yoktur",
    aciklama: "Birçok araştırma şeker tüketimi ile hiperaktivite arasında bağ bulamamıştır. Davranış değişikliği genellikle şekerin verildiği eğlenceli ve hareketli parti ortamlarından kaynaklanır."
  },
  {
    kategori: "Hayvanlar Alemi",
    soru: "Farelerin en sevdiği yiyecek peynir midir?",
    cevap: "Hayır, tatlıları ve tahılları tercih ederler",
    aciklama: "Fareler yüksek karbonhidratlı ve tatlı yiyecekleri (fıstık ezmesi, meyve, tahıl) severler. Güçlü kokulu peynirler aslında onları rahatsız bile edebilir."
  },
  {
    kategori: "Doğru Bilinen Yanlışlar",
    soru: "Gökdelenden atılan bir bozuk para insanı öldürebilir mi?",
    cevap: "Hayır, ölümcül değildir",
    aciklama: "Madeni paranın ağırlığı ve aerodinamik yapısı onun terminal hızını (maksimum düşüş hızını) sınırlar. Çarptığında acıtır ama kafatasını delemez."
  },
  {
    kategori: "İnsan Anatomisi",
    soru: "İnsan kanı damarların içindeyken mavi midir?",
    cevap: "Hayır, her zaman kırmızıdır",
    aciklama: "Kan her zaman kırmızıdır (oksijensizken koyu bordo olur). Damarların mavi görünmesinin nedeni, derinin ve dokuların ışığı yansıtma ve emme biçimidir (optik illüzyon)."
  },
  {
    kategori: "Hayvanlar Alemi",
    soru: "Devekuşları korkunca kafalarını kuma gömer mi?",
    cevap: "Hayır, yumurtalarını kontrol ederler",
    aciklama: "Devekuşları yuvalarını yere kazdıkları sığ çukurlara yaparlar. Kafalarını eğerek yumurtaları çevirmeleri, uzaktan 'kuma gömülmüş' gibi bir yanılsama yaratır."
  },
  {
    kategori: "Bilim & Doğa",
    soru: "Köpekler terler mi?",
    cevap: "Evet, ancak patilerinden terlerler",
    aciklama: "Köpeklerin derilerinde bizimki gibi ter bezleri yoktur. Sadece patilerinden terlerler ve asıl serinleme yöntemleri dillerini dışarı çıkararak hızlı nefes alıp vermektir."
  },
  {
    kategori: "Jeoloji & Doğa",
    soru: "Pırlanta (Elmas) kömürden mi oluşur?",
    cevap: "Hayır, saf karbondan oluşur",
    aciklama: "Elmasların çoğu yeryüzündeki bitkiler ve dolayısıyla kömür oluşmadan çok önce, milyarlarca yıl önce Dünya'nın derinliklerinde saf karbondan yüksek basınçla oluşmuştur."
  },
  {
    kategori: "Doğru Bilinen Yanlışlar",
    soru: "Şimşek aynı yere iki kez düşmez mi?",
    cevap: "Düşer, hem de sık sık",
    aciklama: "Özellikle yüksek binalara ve ağaçlara fırtına sırasında defalarca yıldırım düşebilir. Örneğin New York'taki Empire State binasına yılda ortalama 25 kez yıldırım düşer."
  },
  {
    kategori: "Uzay & Astronomi",
    soru: "Uzayda yerçekimi sıfır mıdır?",
    cevap: "Hayır, her yerde yerçekimi vardır",
    aciklama: "Uluslararası Uzay İstasyonu'nda (ISS) yerçekimi Dünya yüzeyindekinin yaklaşık %90'ı kadardır. Astronotlar 'sürekli serbest düşüş' halinde oldukları için ağırlıksız hissederler."
  },
  {
    kategori: "İnsan Vücudu",
    soru: "Yutulan sakızın sindirilmesi 7 yıl mı sürer?",
    cevap: "Hayır, normal şekilde atılır",
    aciklama: "Mide asidi sakızın lastik tabanını tam sindiremez, ancak sakız sindirim sisteminden diğer yiyecekler gibi birkaç gün içinde doğal yollarla dışarı atılır."
  },
  {
    kategori: "Kişisel Bakım",
    soru: "Tıraş edilen saç veya kıl daha gür mü çıkar?",
    cevap: "Hayır, aynı kalınlıkta çıkar",
    aciklama: "Tıraş bıçağı kılın ucunu küt keser. Küt uçlu kıl uzadığında daha kalın ve sertmiş gibi bir his verir, ancak kılın kök yapısı veya gerçek kalınlığı değişmez."
  },
  {
    kategori: "İnsan Vücudu",
    soru: "Soğuk havada alkol içmek vücudu ısıtır mı?",
    cevap: "Hayır, ısı kaybını artırır",
    aciklama: "Alkol, kan damarlarını genişleterek sıcak kanın cilt yüzeyine hücum etmesini sağlar. Bu, insana sıcaklık hissi verse de aslında vücudun merkez ısısının hızla düşmesine neden olur."
  },
  {
    kategori: "Sağlık & Efsaneler",
    soru: "Parmak çıtlatmak kireçlenmeye yol açar mı?",
    cevap: "Hayır, hiçbir zararı yoktur",
    aciklama: "Çıtlama sesi, eklem sıvısındaki nitrojen gazı baloncuklarının patlamasından gelir. Bilimsel araştırmalar parmak çıtlatma ile artrit (kireçlenme) arasında hiçbir bağlantı bulamamıştır."
  },
  {
    kategori: "Uyku ve Sağlık",
    soru: "Uyurgezer birini uyandırmak tehlikeli midir?",
    cevap: "Uyandırmamak daha tehlikelidir",
    aciklama: "Uyurgezeri uyandırmak onu sadece kısa süreliğine sersemletir ve kafasını karıştırır. Ancak onu uyandırmayıp yürümeye bırakmak, merdivenden düşme gibi ölümcül kazalara yol açabilir."
  },
  {
    kategori: "İnsan Anatomisi",
    soru: "İnsanın sadece 5 duyusu mu vardır?",
    cevap: "Hayır, en az 20 duyumuz vardır",
    aciklama: "Görme, duyma, koklama, tat alma ve dokunma dışında; denge, ısı algısı, ağrı, bedenin konumunu bilme (propriosepsiyon) ve zaman algısı gibi birçok gelişmiş duyumuz vardır."
  },
  {
    kategori: "Sağlık & Efsaneler",
    soru: "Çok fazla şeker yemek diyabet (şeker hastalığı) yapar mı?",
    cevap: "Doğrudan şeker yemek yapmaz",
    aciklama: "Tip 1 diyabet otoimmün bir hastalıktır. Tip 2 diyabet ise genetik, yaş, hareketsizlik ve aşırı kilo gibi faktörlere bağlıdır. Şeker tüketimi sadece kilo aldırdığı için dolaylı bir risktir."
  },
  {
    kategori: "Sağlık & Efsaneler",
    soru: "Paslı çivi batması tetanoz mu yapar?",
    cevap: "Pas değil, topraktaki bakteri yapar",
    aciklama: "Tetanoza 'Clostridium tetani' bakterisi neden olur. Bu bakteri pasın içinde değil, toprakta, hayvan dışkısında ve tozlarda bulunur. Çivinin paslı olması, sadece toprakta uzun süre kaldığını gösterir."
  },
  {
    kategori: "Tarih Öncesi",
    soru: "Pterodaktiller dinozor mudur?",
    cevap: "Hayır, uçan sürüngenlerdir",
    aciklama: "Dinozorlarla aynı dönemde yaşamış olsalar da, evrimsel olarak dinozor ağacında yer almazlar. Onlar 'Pterozor' (uçan sürüngen) olarak ayrı bir grupta sınıflandırılır."
  },
  {
    kategori: "Tarih Öncesi",
    soru: "T-Rex ile Stegosaurus aynı dönemde mi yaşadı?",
    cevap: "Aralarında 80 milyon yıl vardır",
    aciklama: "T-Rex'in yaşadığı Kretase dönemi, günümüze Stegosaurus'un yaşadığı döneme olduğundan daha yakındır. Jurassic Park filmleri bu algıyı biraz bozmuştur."
  },
  {
    kategori: "Coğrafya & Doğa",
    soru: "Dünyanın en yüksek dağı Everest midir?",
    cevap: "Tabanından zirvesine Mauna Kea'dır",
    aciklama: "Deniz seviyesinden ölçüldüğünde Everest en yüksektir. Ancak okyanus tabanından zirvesine ölçüldüğünde Hawaii'deki Mauna Kea 10.000 metreyi aşarak açık ara birinci olur."
  },
  {
    kategori: "Coğrafya & Doğa",
    soru: "Dünyanın en büyük çölü Sahra Çölü müdür?",
    cevap: "Hayır, Antarktika Çölü'dür",
    aciklama: "Çöl, yıllık yağış miktarının çok düşük olduğu kurak alan demektir. Sıcak olması gerekmez. Bu tanıma göre 14 milyon km² ile Antarktika dünyanın en büyük çölüdür."
  },
  {
    kategori: "Coğrafya",
    soru: "Avustralya'nın başkenti Sidney midir?",
    cevap: "Hayır, Canberra'dır",
    aciklama: "Sidney ve Melbourne arasındaki çekişmeyi çözmek için, her iki şehre de eşit uzaklıkta olan Canberra sıfırdan planlanarak inşa edilmiş ve başkent yapılmıştır."
  },
  {
    kategori: "Kültür & Köken",
    soru: "Şans kurabiyeleri Çin icadı mıdır?",
    cevap: "Hayır, Japon/Amerikan icadıdır",
    aciklama: "Şans kurabiyelerinin kökeni 19. yüzyıl Kyoto, Japonya'sına dayanır. Ancak günümüzdeki formatı 20. yüzyılın başlarında ABD'de (Kaliforniya) ortaya çıkmış ve Çin restoranlarında popüler olmuştur."
  },
  {
    kategori: "Kültür & Köken",
    soru: "Patates kızartması (French fries) Fransa'da mı icat edildi?",
    cevap: "Hayır, Belçika'da icat edildi",
    aciklama: "I. Dünya Savaşı'nda Amerikan askerleri Belçika'da patates kızartması yedi. Belçika ordusunun dili Fransızca olduğu için buna 'French fries' (Fransız kızartması) adını verdiler."
  },
  {
    kategori: "Kültür & Köken",
    soru: "Kruvasan Fransız icadı mıdır?",
    cevap: "Hayır, Avusturya kökenlidir",
    aciklama: "Kruvasanın atası 'Kipferl' adlı Avusturya çöreğidir. 1830'larda Viyanalı bir fırıncı Paris'te dükkân açıp bunu satmaya başlayınca zamanla Fransız kültürüne yerleşmiştir."
  },
  {
    kategori: "Coğrafya & Üretim",
    soru: "Panama şapkaları Panama'da mı üretilir?",
    cevap: "Hayır, Ekvador'da üretilir",
    aciklama: "Ekvador'da toquilla adlı özel bir hasırdan dokunan bu şapkalar, 19. yüzyılda Panama Kanalı işçileri tarafından takılıp dünyaya oradan ihraç edildiği için bu adı almıştır."
  },
  {
    kategori: "Tarihi Yanılgılar",
    soru: "Marie Antoinette 'Ekmek bulamıyorlarsa pasta yesinler' dedi mi?",
    cevap: "Hayır, bu söz ona ait değildir",
    aciklama: "Fransız Devrimi'nden yıllar önce Jean-Jacques Rousseau'nun 'İtiraflar' kitabında bu söz anonim bir prensese atfedilmiştir. Daha sonra kraliçeyi karalamak için kasıtlı olarak ona mal edilmiştir."
  },
  {
    kategori: "Tarihi Yanılgılar",
    soru: "Demir Bakire (Iron Maiden) bir Orta Çağ işkence aleti miydi?",
    cevap: "Hayır, 19. yüzyıl uydurmasıdır",
    aciklama: "İçi çivili bu korkunç demir dolap, Orta Çağ'da hiç var olmadı. Müzeleri gezmeye gelen turistleri etkilemek ve korkutmak için 19. yüzyılda kurgulanmış sahte bir alettir."
  },
  {
    kategori: "Tarihi Yanılgılar",
    soru: "Ninjalar her zaman siyah mı giyinirdi?",
    cevap: "Hayır, halkın arasına karışırlardı",
    aciklama: "Gerçek ninjalar (shinobi) yetenekli casuslardı ve dikkat çekmemek için çiftçi veya keşiş kıyafetleri giyerlerdi. Siyah giysi imajı, Japon tiyatrolarındaki sahne görevlilerinden gelir."
  },
  {
    kategori: "Tarihi Yanılgılar",
    soru: "Mısır piramitlerini köleler mi inşa etti?",
    cevap: "Hayır, maaşlı işçiler inşa etti",
    aciklama: "Arkeolojik kazılar, piramitleri inşa edenlerin iyi beslenen, vergiden muaf tutulan ve firavuna sadık saygın çiftçiler ile kalifiye zanaatkarlar olduğunu kanıtlamıştır."
  },
  {
    kategori: "Tarihi Yanılgılar",
    soru: "Gladyatör dövüşleri her zaman ölümle mi sonuçlanırdı?",
    cevap: "Hayır, ölüm oldukça nadirdi",
    aciklama: "Gladyatörlerin eğitimi, barınması ve bakımı devasa bir yatırımdı. Dövüşlerin çoğu sıkı kuralları olan bir spor müsabakası gibiydi ve genellikle kimse ölmeden biterdi."
  },
  {
    kategori: "Tarihi Yanılgılar",
    soru: "Van Gogh kendi kulağının tamamını mı kesti?",
    cevap: "Hayır, sadece kulak memesini kesti",
    aciklama: "Ressam Gauguin ile yaşadığı bir tartışmanın ardından ağır bir sinir krizi geçiren Van Gogh, kulağının sadece alt kısmındaki küçük bir parçayı kesmiştir."
  },
  {
    kategori: "Bilim Tarihi",
    soru: "Newton'un kafasına gerçekten elma düştü mü?",
    cevap: "Hayır, elmanın düştüğünü izledi",
    aciklama: "Newton yerçekimi teorisini, kafasına elma düşmesiyle değil; bir elmanın ağaçtan yere dik bir şekilde nasıl düştüğünü uzaktan gözlemleyerek ve üzerine düşünerek bulmuştur."
  },
  {
    kategori: "Bilim Tarihi",
    soru: "Teleskopu Galileo mu icat etti?",
    cevap: "Hayır, Hans Lippershey icat etti",
    aciklama: "Hollandalı bir gözlükçü olan Hans Lippershey ilk teleskopun patentini almıştır. Galileo ise bu tasarımı geliştirip ilk kez astronomi için gökyüzüne çeviren kişidir."
  },
  {
    kategori: "İcatlar & Mucitler",
    soru: "Ampulü Thomas Edison mu icat etti?",
    cevap: "Hayır, mevcut icadı geliştirdi",
    aciklama: "Edison'dan önce Joseph Swan gibi 20'den fazla mucit elektrikli lamba yapmıştı. Edison, uzun süre yanabilen ticari olarak pratik karbon flamanlı ampulü geliştirip patentlemiştir."
  },
  {
    kategori: "İcatlar & Mucitler",
    soru: "Otomobili Henry Ford mu icat etti?",
    cevap: "Hayır, Karl Benz icat etti",
    aciklama: "İlk modern benzinli otomobili 1886'da Alman mühendis Karl Benz yapmıştır. Henry Ford ise 1908'de 'hareketli seri üretim bandı' sistemini kurarak otomobili ucuzlaştıran kişidir."
  },
  {
    kategori: "Tarihi Yanılgılar",
    soru: "Kolomb dönemindeki insanlar dünyanın düz olduğuna mı inanıyordu?",
    cevap: "Hayır, yuvarlak olduğu biliniyordu",
    aciklama: "Eski Yunan'dan beri (Pisagor, Eratosthenes) eğitimli Avrupalıların çoğu dünyanın küre şeklinde olduğunu biliyordu. Kolomb'un gezisindeki tartışma dünyanın şekli değil, Asya'ya olan uzaklığıydı."
  },
  {
    kategori: "Edebiyat & Sinema",
    soru: "Frankenstein, yeşil renkli dev canavarın adı mıdır?",
    cevap: "Hayır, canavarı yaratan doktorun adıdır",
    aciklama: "Mary Shelley'nin kitabında 'Frankenstein', canavarı yaratan hırslı bilim insanı Dr. Victor Frankenstein'dır. Canavarın romanda belli bir ismi yoktur, ona sadece 'yaratık' denir."
  },
  {
    kategori: "Uzay & Astronomi",
    soru: "Kara delikler elektrik süpürgesi gibi her şeyi içine çeker mi?",
    cevap: "Hayır, sadece çok yoğun kütleçekimleri vardır",
    aciklama: "Eğer Güneş'in yerine tamamen aynı kütlede bir kara delik koysaydık, Dünya içine çekilmezdi. Tıpkı şimdi olduğu gibi kendi yörüngesinde dönmeye devam ederdi."
  },
  {
    kategori: "Uzay & Astronomi",
    soru: "Güneş sarı veya turuncu renkte midir?",
    cevap: "Hayır, Güneş aslında beyazdır",
    aciklama: "Güneş uzaydan bakıldığında saf beyaz görünür. Atmosferimizdeki gazlar kısa dalga boylu ışıkları (mavi) saçtığı için yeryüzünden sarımtırak veya kırmızımsı bir yanılsamayla görünür."
  },
  {
    kategori: "Bilim & Fizik",
    soru: "Su elektriği iletir mi?",
    cevap: "Saf su elektriği iletmez",
    aciklama: "Elektriği ileten şey suyun kendisi değil, içindeki çözünmüş mineraller, tuzlar ve iyonlardır. Laboratuvar ortamında damıtılmış %100 saf su mükemmel bir yalıtkandır."
  },
  {
    kategori: "Bilim & Fizik",
    soru: "Cam çok yavaş akan bir sıvı mıdır?",
    cevap: "Hayır, cam amorf bir katıdır",
    aciklama: "Eski kilise pencerelerinin alt kısmının kalın olmasının nedeni camın akması değil, o dönemdeki ilkel üretim teknolojisinin eşit kalınlık sağlayamaması ve ağır kısmın alta konmasıdır."
  },
  {
    kategori: "Evrim & Biyoloji",
    soru: "İnsanlar şempanzelerden mi evrimleşmiştir?",
    cevap: "Hayır, ortak bir atadan geliriz",
    aciklama: "İnsanlar şempanzelerden veya bugün yaşayan herhangi bir maymundan evrimleşmemiştir. Sadece milyonlarca yıl önce aynı 'ortak atayı' paylaşmış ve sonra iki farklı dala ayrılmışlardır."
  },
  {
    kategori: "Sağlık & Efsaneler",
    soru: "Soğuk hava insanı hasta eder mi?",
    cevap: "Hayır, virüsler hasta eder",
    aciklama: "Üşütmek doğrudan nezle yapmaz. Sadece soğuk havada insanlar kapalı alanlarda ve bir arada daha çok vakit geçirir, bu da virüslerin insandan insana bulaşmasını kolaylaştırır."
  },
  {
    kategori: "Sağlık & Efsaneler",
    soru: "Havuç yemek gece görüşünü artırır mı?",
    cevap: "Hayır, bu bir savaş propagandasıdır",
    aciklama: "II. Dünya Savaşı'nda İngilizler, icat ettikleri yeni radarlarını Almanlardan saklamak için pilotlarının 'çok havuç yediği için' gece mükemmel gördüğü yalanını yaymışlardır."
  },
  {
    kategori: "Gıda & Beslenme",
    soru: "Ispanak aşırı derecede demir içerdiği için kasları güçlendirir mi?",
    cevap: "Hayır, bu bir ondalık virgül hatasıdır",
    aciklama: "1870'lerde yapılan bir analizde ondalık virgül yanlış yere konduğu için ıspanağın demir oranı 10 kat fazla sanıldı. Temel Reis efsanesi bu matematiksel hataya dayanır."
  },
  {
    kategori: "Mutfak Gerçekleri",
    soru: "Az pişmiş biftekteki kırmızı sıvı kan mıdır?",
    cevap: "Hayır, kas proteini olan miyoglobindir",
    aciklama: "Et kesim işleminde kanın tamamı boşaltılır. Tabağınızdaki kırmızı sıvı, kaslara oksijen taşıyan ve suyla karışınca kırmızımsı olan 'miyoglobin' adlı bir proteindir."
  },
  {
    kategori: "Mutfak Gerçekleri",
    soru: "Eti yüksek ateşte mühürlemek (sear) etin suyunu içine hapseder mi?",
    cevap: "Hayır, sadece lezzet katar",
    aciklama: "Mühürleme işlemi etin gözeneklerini kapatıp suyu tutmaz; aksine ısıyla birlikte su kaybı devam eder. Amacı, Maillard reaksiyonu ile karamelize ve zengin bir lezzet katmaktır."
  },
  {
    kategori: "Hayvanlar Alemi",
    soru: "Köpekler dünyayı sadece siyah-beyaz mı görür?",
    cevap: "Hayır, sarı ve mavi tonlarını da görebilirler",
    aciklama: "Köpeklerin gözünde kırmızı ve yeşili algılayan koni hücreleri yoktur, ancak sarı, mavi ve grinin çeşitli tonlarını oldukça net algılarlar."
  },
  {
    kategori: "Doğru Bilinen Yanlışlar",
    soru: "İnsanlar dokunursa anne kuşlar yavrularını terk eder mi?",
    cevap: "Hayır, kuşların koku alma duyusu çok zayıftır",
    aciklama: "Kuşların çoğu yavrusuna dokunan insan kokusunu alamaz ve yuvasını terk etmez. Yine de vahşi doğaya müdahale edilmemesi tavsiye edilir."
  },
  {
    kategori: "Doğru Bilinen Yanlışlar",
    soru: "Ortadan ikiye bölünen solucan iki ayrı solucan olur mu?",
    cevap: "Hayır, sadece baş kısmı yaşayabilir",
    aciklama: "Toprak solucanı bölündüğünde kuyruk kısmı ölür. Sadece baş kısmında yeterince hayati organ kalmışsa, kesilen bölgesini iyileştirerek yaşamaya devam edebilir."
  },
  {
    kategori: "Hayvanlar Alemi",
    soru: "Köpekbalıkları asla kanser olmaz mı?",
    cevap: "Hayır, onlarda da kanser görülür",
    aciklama: "Köpekbalıklarında tümör oluşumu daha nadir olsa da kesinlikle kanser olurlar. Bu efsane, köpekbalığı kıkırdağı satmak isteyen sahte alternatif tıp sektörü tarafından uydurulmuştur."
  },
  {
    kategori: "Hayvanlar Alemi",
    soru: "Yunuslar her zaman zararsız ve dost canlısı mıdır?",
    cevap: "Hayır, oldukça agresif olabilirler",
    aciklama: "Yunuslar son derece zeki oldukları kadar diğer deniz canlılarına (ve hatta bazen yavrularına) karşı nedensiz yere şiddet uygulayabilen nadir hayvanlardandır."
  },
  {
    kategori: "Hayvanlar Alemi",
    soru: "Kurt sürülerinde liderlik kavgasıyla 'Alfa kurdu' mu seçilir?",
    cevap: "Hayır, vahşi doğada alfa yoktur",
    aciklama: "Sürü içindeki 'alfa' algısı, esaret altındaki birbirini tanımayan kurtlar üzerinde yapılan hatalı bir çalışmaya dayanır. Vahşi doğada kurt sürüsü, anne-baba ve yavrularından oluşan basit bir ailedir."
  },
  {
    kategori: "Hayvanlar Alemi",
    soru: "Ayılar kışın tam bir 'kış uykusuna' mı yatar?",
    cevap: "Hayır, 'torpor' denen hafif bir uykuya dalarlar",
    aciklama: "Gerçek kış uykusunda (örn: sincaplar) vücut ısısı sıfıra yaklaşır. Ayıların ise ısısı sadece birkaç derece düşer ve tehlike anında hemen uyanabilirler."
  },
  {
    kategori: "Bitki Bilimi",
    soru: "Muz ağaçta mı yetişir?",
    cevap: "Hayır, dev bir otsu bitkide yetişir",
    aciklama: "Muz bitkisinin odunsu bir gövdesi yoktur. Yaprakların üst üste sarılmasıyla oluşan yalancı bir gövdedir, bu nedenle teknik olarak dünyanın en büyük 'ot'udur."
  },
  {
    kategori: "Bitki Bilimi",
    soru: "Yer fıstığı ağaçta veya dalda mı yetişir?",
    cevap: "Hayır, toprak altında yetişir",
    aciklama: "Yer fıstığı, ceviz veya fındık gibi bir ağaç yemişi değil, baklagiller ailesindendir. Çiçek açtıktan sonra sapını toprağa gömer ve fıstıklar toprak altında olgunlaşır."
  },
  {
    kategori: "Bitki Bilimi",
    soru: "Çilek biyolojik olarak bir 'üzümsü meyve' (berry) midir?",
    cevap: "Hayır, bir yalancı meyvedir",
    aciklama: "Botanik bilimine göre çilek, ahududu ve böğürtlen 'berry' sınıfına girmez. İlginç bir şekilde, muz, karpuz, kivi ve patlıcan gerçek 'berry' (üzümsü meyve) sınıfındadır."
  },
  {
    kategori: "Tarih Öncesi",
    soru: "Brontosaurus adında bir dinozor gerçekten yaşamış mıdır?",
    cevap: "Evet ama adı yıllarca iptal edilmişti",
    aciklama: "Apatosaurus kemiklerinin yanlış başla birleştirilmesiyle yıllarca efsanevi 'Brontosaurus' dendi. Ancak 2015'teki yeni araştırmalarla onun gerçekten ayrı bir tür olduğu kanıtlanıp ismi bilim dünyasına geri verildi."
  },
  {
    kategori: "Coğrafya & Doğa",
    soru: "Penguenler ve kutup ayıları aynı coğrafyada mı yaşar?",
    cevap: "Hayır, dünyanın zıt kutuplarındadırlar",
    aciklama: "Kutup ayıları Kuzey Kutbu'nda (Arktik), penguenler ise Güney Kutbu'nda (Antarktika) yaşar. Doğal ortamlarında asla birbirleriyle karşılaşmazlar."
  },
  {
    kategori: "Uzay & Astronomi",
    soru: "Güneş sisteminin sınırı Plüton ile mi biter?",
    cevap: "Hayır, Oort Bulutu ile biter",
    aciklama: "Plüton, Güneş sisteminin sadece iç sınırındaki Kuiper Kuşağı'nda yer alır. Sistemin gerçek sınırı, Plüton'dan binlerce kat daha uzakta olan trilyonlarca buzlu cisimden oluşan Oort Bulutu'dur."
  },
  {
    kategori: "İnsan Anatomisi",
    soru: "Beyin ne kadar büyükse canlı o kadar zeki midir?",
    cevap: "Hayır, kıvrımlar ve bağlantılar önemlidir",
    aciklama: "Fil veya balina beyni insan beyninden çok daha büyüktür. Zekayı belirleyen şey ağırlık değil; beyin zarındaki kıvrım sayısı ve nöronlar arası sinaptik bağlantıların karmaşıklığıdır."
  },
  {
    kategori: "Hayvanlar Alemi",
    soru: "Tembel hayvanlar gerçekten sadece 'tembel' oldukları için mi yavaş hareket eder?",
    cevap: "Hayır, düşük kalorili diyetlerinin sonucudur",
    aciklama: "Yedikleri zehirli ve sert yaprakların sindirimi çok zor ve düşük enerjilidir. Metabolizmaları o kadar yavaştır ki hayatta kalabilmek için enerjilerini çok dikkatli harcamak zorundadırlar."
  },
  {
    kategori: "Evcil Hayvanlar",
    soru: "Kedilerin en sağlıklı içeceği inek sütü müdür?",
    cevap: "Hayır, kediler laktoz intoleransına sahiptir",
    aciklama: "Büyüdükten sonra kedilerin çoğu inek sütündeki laktozu sindiremez. Süt vermek onlara yarardan çok zarar verir, şiddetli ishal ve sindirim sorunlarına yol açar."
  },
  {
    kategori: "Hayvanlar Alemi",
    soru: "Kuşların kemiklerinin içi boş olduğu için mi hafiflerdir?",
    cevap: "Hayır, insan kemiğinden bile daha yoğundurlar",
    aciklama: "Uçabilmek için kemiklerinin içi havalı oyuklara (pnömatik) sahiptir ama kemik dokuları memelilerden daha yoğun ve güçlüdür. Toplam iskelet ağırlıkları da uçmayan hayvanlarla aynı orandadır."
  },
  {
    kategori: "Uzay & Astronomi",
    soru: "Dünya uzaydan bakıldığında mükemmel bir küre midir?",
    cevap: "Hayır, 'Geoid' adı verilen şekildedir",
    aciklama: "Dünya, kendi etrafında dönmesinin yarattığı merkezkaç kuvveti nedeniyle Ekvator'dan şişkin, kutuplardan basık, hafif yumurta veya patatesimsi bir şekle sahiptir."
  },
  {
    kategori: "Etimoloji",
    soru: "'Robot' kelimesi ne anlama gelir ve nereden türemiştir?",
    cevap: "Çekçe 'zorla çalıştırılan işçi / köle' demektir",
    aciklama: "İlk kez 1920 yılında Çek yazar Karel Čapek'in 'R.U.R.' adlı tiyatro oyununda kullanılmıştır. Çekçe 'robota' (angarya, zorunlu çalışma) kelimesinden gelir."
  },
  {
    kategori: "Etimoloji",
    soru: "'Karantina' kelimesi tarihsel olarak hangi anlama gelir?",
    cevap: "İtalyanca 'Kırk (40) Gün' demektir",
    aciklama: "14. yüzyılda Veba salgını sırasında Venedik'e gelen gemilerin hastalık taşımadığından emin olmak için limana girmeden önce denizde 'quaranta giorni' (40 gün) beklemesi kuralından doğmuştur."
  },
  {
    kategori: "Etimoloji",
    soru: "'Boykot' kelimesi nereden gelmektedir?",
    cevap: "Kötü şöhretli bir toprak ağasının soyadıdır",
    aciklama: "19. yüzyılda İrlanda'da çiftçilere acımasız davranan Kaptan Charles Boycott'a karşı halkın onu tamamen izole edip iş yapmayı reddetmesi olayından sonra bu soyadı küresel bir eylemin adı olmuştur."
  },
  {
    kategori: "İcatlar & Mucitler",
    soru: "Mikrodalga fırın nasıl icat edilmiştir?",
    cevap: "Cepteki bir çikolatanın erimesiyle tesadüfen",
    aciklama: "1945'te mühendis Percy Spencer, bir radar tüpü (magnetron) üzerinde çalışırken cebindeki çikolatanın eridiğini fark etti. Radyo dalgalarının suyu ısıttığını keşfederek mikrodalga fırını geliştirdi."
  },
  {
    kategori: "Uzay & Astronomi",
    soru: "Ay'ın 'karanlık yüzü' hiç güneş ışığı almaz mı?",
    cevap: "Alır, sadece bizim açımızdan 'görünmez' yüzüdür",
    aciklama: "Ay kendi etrafında ve Dünya etrafında aynı sürede döndüğü için bize hep aynı yüzünü gösterir. Ancak yeni ay evresinde (biz ayı karanlık görürken) diğer yüzü tamamen güneş ışığı alır."
  },
  {
    kategori: "Bilim & Fizik",
    soru: "Sifon veya lavabodan akan su Güney Yarımküre'de tersine mi döner?",
    cevap: "Hayır, bu bir şehir efsanesidir",
    aciklama: "Coriolis etkisi okyanus akıntıları ve kasırgalar gibi devasa sistemleri etkiler. Bir lavabodaki suyun dönüş yönünü lavabonun şekli ve suyun dökülüş açısı belirler."
  },
  {
    kategori: "Doğru Bilinen Yanlışlar",
    soru: "Arabalarımıza koyduğumuz petrol dinozor fosillerinden mi oluşur?",
    cevap: "Hayır, antik mikroskobik deniz canlılarından oluşur",
    aciklama: "Petrolün çok büyük bir kısmı dinozorlar yaşamadan milyonlarca yıl önce okyanuslarda ölüp deniz tabanına çöken fitoplankton ve alglerden oluşmuştur."
  },
  {
    kategori: "Tarihi Yanılgılar",
    soru: "Roma imparatorlarının arenada verdiği 'başparmak aşağı' işareti 'öldür' mü demekti?",
    cevap: "Muhtemelen tam tersiydi",
    aciklama: "Tarihçilere göre 'başparmağın yukarı/çekili' olması kılıcın çekilmesi (öldür), 'başparmağın aşağı (yumruk)' olması ise kılıcın kınına sokulması (bağışla) anlamına geliyordu. Hollywood bunu tersine çevirmiştir."
  },
  {
    kategori: "Uzay & Astronomi",
    soru: "Ay tutulmasında Ay neden kırmızı görünür?",
    cevap: "Dünya'nın atmosferinden kırılan ışık yüzünden",
    aciklama: "Dünya, Güneş ile Ay arasına girdiğinde Güneş ışınları Dünya'nın atmosferinden geçerken mavi ışıklar saçılır. Sadece kırmızı ışıklar kırılarak Ay'a yansır (Kanlı Ay)."
  },
  {
    kategori: "Sağlık & Efsaneler",
    soru: "C Vitamini soğuk algınlığını iyileştirir mi?",
    cevap: "İyileştirmez, sadece süresini kısaltabilir",
    aciklama: "C vitamini almak soğuk algınlığına yakalanmanızı engellemez veya sizi mucizevi şekilde iyileştirmez. Sadece hastalığın süresini çok hafif bir oranda kısaltabilir."
  },
  {
    kategori: "Doğru Bilinen Yanlışlar",
    soru: "Boğulan bir insan çırpınarak ve bağırarak mı yardım ister?",
    cevap: "Hayır, boğulma tamamen sessizdir",
    aciklama: "Boğulma anında vücudun solunum içgüdüsü her şeyin önüne geçer. Kişi bağıramaz ve ellerini su yüzeyinde tutmaya çalıştığı için çırpınamaz. Çoğu boğulma vakası etraftakiler fark etmeden sessizce gerçekleşir."
  },
  {
    kategori: "Sağlık & Efsaneler",
    soru: "Kadınlarda kalp krizi her zaman sol kol uyuşması ile mi belirti verir?",
    cevap: "Hayır, kadınlarda farklı belirtiler sık görülür",
    aciklama: "Kadınlarda kalp krizi sıklıkla aşırı yorgunluk, mide bulantısı, çene/sırt ağrısı veya nefes darlığı gibi atipik belirtilerle ortaya çıkar. Sol kol ağrısı erkeklerde daha belirgindir."
  },
  {
    kategori: "Doğa & İklim",
    soru: "Tayfun ve Kasırga (Hurricane) arasındaki fark nedir?",
    cevap: "Sadece oluştukları coğrafi bölge farklıdır",
    aciklama: "Her ikisi de tropikal siklondur. Kuzey Atlantik ve Kuzeydoğu Pasifik'te oluşanlara 'Kasırga', Kuzeybatı Pasifik'te oluşanlara ise 'Tayfun' denir."
  },
  {
    kategori: "Evcil Hayvanlar",
    soru: "Köpeklerin yaşını hesaplamak için insan yaşını 7 ile mi çarpmak gerekir?",
    cevap: "Hayır, bu çok kaba ve yanlış bir hesaptır",
    aciklama: "Köpekler ilk yıllarında insana göre çok daha hızlı yaşlanırlar (1 yaşındaki bir köpek 15 insan yaşındadır). Ayrıca büyük ırklar, küçük ırklara göre çok daha hızlı yaşlanır."
  },
  {
    kategori: "Genel Kültür",
    soru: "Olimpiyatlarda verilen altın madalyalar som altından mı yapılır?",
    cevap: "Hayır, büyük çoğunluğu gümüştür",
    aciklama: "Gerçek som altından yapılan son madalya 1912 Stockholm Olimpiyatları'nda verilmiştir. Günümüzdeki altın madalyalar en az %92.5 oranında gümüştür ve sadece dış yüzeyleri 6 gram altınla kaplanır."
  },
  {
    kategori: "Sağlık & Beslenme",
    soru: "Kahve ve çaydaki kafein vücudu ciddi şekilde susuz (dehidrate) bırakır mı?",
    cevap: "Hayır, sıvı alımına katkı sağlarlar",
    aciklama: "Kafein hafif bir idrar söktürücü (diüretik) olsa da, kahve ve çaydaki yüksek su miktarı bu etkiyi fazlasıyla dengeler. Günlük sıvı ihtiyacınızı karşılamaya yardımcı olurlar."
  }
];

let fcSorular = [];
let fcIndex = 0;
let fcCevrildi = false;
let fcBildiSayisi = 0;

function flashcardBaslat() {
  let duz = [...FLASHCARD_HAVUZU];

  for (let i = duz.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [duz[i], duz[j]] = [duz[j], duz[i]];
  }

  fcSorular = duz.slice(0, 10);
  fcIndex = 0;
  fcBildiSayisi = 0;
  fcCevrildi = false;

  const bitis = document.getElementById('fcBitisEkrani');
  if (bitis) { bitis.style.display = 'none'; bitis.classList.remove('show'); }
  const wrap = document.getElementById('fcWrapper');
  if (wrap) wrap.style.display = 'block';
  const prog = document.getElementById('fcProgressRow');
  if (prog) prog.style.display = 'flex';

  ekranGoster('flashcardScreen');
  fcKartGoster();
}

function fcKartGoster(gecikmeliArkaYuz = false) {
  const s = fcSorular[fcIndex];
  if (!s) return;

  document.getElementById('fcKategori').textContent = s.kategori || 'Genel Kültür';
  document.getElementById('fcSoru').textContent = s.soru;

  const pct = ((fcIndex + 1) / fcSorular.length) * 100;
  document.getElementById('fcProgressFill').style.width = pct + '%';
  document.getElementById('fcProgressText').textContent = (fcIndex + 1) + ' / ' + fcSorular.length;

  document.getElementById('fcWrapper').classList.remove('flipped');
  const btnRow = document.getElementById('fcBtnRow');
  if (btnRow) {
    btnRow.style.display = 'none';
    btnRow.classList.remove('show');
  }
  fcCevrildi = false;

  const arkaYuzGuncelle = () => {
    document.getElementById('fcCevap').textContent = s.cevap;
    const aciklamaEl = document.getElementById('fcAciklama');
    if (s.aciklama) {
      aciklamaEl.textContent = s.aciklama;
      aciklamaEl.style.display = 'block';
    } else {
      aciklamaEl.textContent = '';
      aciklamaEl.style.display = 'none';
    }
  };

  // Kart arkaya dönerken (kapanırken) yeni cevabın görünmemesi için güncellemeyi geciktiriyoruz
  if (gecikmeliArkaYuz) {
    setTimeout(arkaYuzGuncelle, 300);
  } else {
    arkaYuzGuncelle();
  }
}

function flashcardCevir() {
  if (fcIndex >= fcSorular.length) return;
  document.getElementById('fcWrapper').classList.toggle('flipped');
  fcCevrildi = !fcCevrildi;
  const btnRow = document.getElementById('fcBtnRow');
  if (fcCevrildi) {
    btnRow.style.display = 'flex';
    btnRow.classList.add('show');
  } else {
    btnRow.style.display = 'none';
    btnRow.classList.remove('show');
  }
}

function flashcardSonraki(bildi) {
  if (bildi) fcBildiSayisi++;
  fcIndex++;
  if (fcIndex >= fcSorular.length) {
    document.getElementById('fcWrapper').classList.remove('flipped');
    const btnRow = document.getElementById('fcBtnRow');
    if (btnRow) {
      btnRow.style.display = 'none';
      btnRow.classList.remove('show');
    }
    setTimeout(fcBitisGoster, 400);
  } else {
    fcKartGoster(true);
  }
}

function fcBitisGoster() {
  document.getElementById('fcWrapper').style.display = 'none';
  document.getElementById('fcProgressRow').style.display = 'none';
  const btnRow = document.getElementById('fcBtnRow');
  if (btnRow) {
    btnRow.style.display = 'none';
    btnRow.classList.remove('show');
  }
  
  document.getElementById('fcBitisB').textContent = fcBildiSayisi;
  document.getElementById('fcBitisT').textContent = fcSorular.length;
  
  const bitis = document.getElementById('fcBitisEkrani');
  bitis.style.display = 'flex';
  bitis.classList.add('show');
  
  if (fcBildiSayisi >= 8) konfeti();
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
  if (sonEkran || isMisafir) { yonlendirSonEkrana(); } 
  else { ekranGoster('authScreen'); }

  document.addEventListener('keydown', e => {
    if (!document.getElementById('wordleScreen')?.classList.contains('active')) return;
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
      if (wBitti || !document.getElementById('wordleScreen')?.classList.contains('active')) return;
      const val = gizliInput.value.toUpperCase();
      gizliInput.value = '';
      for (const ch of val) {
        if (/^[A-ZÇĞİÖŞÜ]$/.test(ch)) wTus(ch);
      }
    });
    gizliInput.addEventListener('keydown', e => {
      if (!document.getElementById('wordleScreen')?.classList.contains('active')) return;
      if (e.key === 'Enter') { wTus('GİR'); e.preventDefault(); }
      else if (e.key === 'Backspace') wTus('⌫');
    });
    document.getElementById('wordleGrid')?.addEventListener('click', () => {
      if ('ontouchstart' in window) gizliInput.focus();
    });
  }

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
  document.getElementById('edTabBugun').style.display    = tab === 'bugun'    ? '' : 'none';
  document.getElementById('edTabBolumler').style.display = tab === 'bolumler' ? '' : 'none';
  document.getElementById('edTabArsiv').style.display    = tab === 'arsiv'    ? '' : 'none';
  if (tab === 'bolumler') edBolumlerDoldur();
  if (tab === 'arsiv')    edArsivDoldur();
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
}

function edMastheadGuncelle() {
  const gunNo = wordleGunNo();
  const el = document.getElementById('edSayi');
  if (el) el.textContent = gunNo;
  const heroNo = document.getElementById('edHeroNo');
  if (heroNo) heroNo.textContent = gunNo;
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
    const ans = kayit.cevap || '';
    const n = kayit.tahminler.length;
    denemeStr = `${n} / 6 DENEME`;
    kayit.tahminler.slice(0, 6).forEach(tahmin => {
      html += '<div class="ed-wg-row">';
      for (let i = 0; i < 5; i++) {
        const ch = (tahmin[i] || '').toUpperCase();
        let cls = 'empty';
        if (ch) {
          if (ch === ans[i]) cls = 'correct';
          else if (ans.includes(ch)) cls = 'close';
          else cls = 'wrong';
        }
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
    tarih: 'Antik çağlardan günümüze önemli olaylar ve şahsiyetler.',
    sanat: 'Dünya sanatı, ressamlar, heykeller ve akımlar.',
    spor: 'Futbol, olimpiyat, dünya rekorları ve efsaneler.',
    cografya: 'Başkentler, nehirler, dağlar, ülkeler ve haritalar.',
    bilim: 'Fizik, kimya, biyoloji ve büyük keşifler.',
    sinema: 'Filmler, yönetmenler, Oscar ödülleri ve klasikler.',
    muzik: 'Rock, klasik, pop; besteciler ve efsane albümler.',
    teknoloji: 'İcat tarihçesi, yazılım, donanım ve innovasyon.',
    yemek: 'Dünya mutfakları, tarifler, lezzetler ve malzemeler.',
    edebiyat: 'Romanlar, şiirler, yazarlar ve Nobel ödülleri.',
    mitoloji: 'Yunan, Roma, Norse ve Anadolu efsaneleri.',
    astronomi: 'Gezegenler, yıldızlar, galaksiler ve uzay keşfi.',
    saglik: 'Tıp, beslenme, hastalıklar ve sağlıklı yaşam.',
    ekonomi: 'Piyasalar, ekonomik teoriler ve küresel finans.',
    hayvanlar: 'Memeli, sürüngen, kuş ve deniz canlıları.',
    bayrak: 'Dünya bayraklarını tanıyor musun?',
    logo: 'Marka amblemleri ve logolar hakkında ne biliyorsun?'
  };
  let html = '';
  let i = 1;
  for (const [kat, bilgi] of Object.entries(tümKats)) {
    const desc = aciklamalar[kat] || '';
    html += `<div class="ed-big-row" onclick="edBolumSecVeOyna('${kat}')">
      <span class="ed-big-num">${String(i).padStart(2,'0')}</span>
      <span class="ed-big-emoji">${bilgi.emoji}</span>
      <div class="ed-big-info">
        <div class="ed-big-name">${bilgi.isim}</div>
        <div class="ed-big-desc">${desc}</div>
      </div>
      <button class="ed-big-btn" onclick="event.stopPropagation();edBolumSecVeOyna('${kat}')">OYNA →</button>
    </div>`;
    i++;
  }
  const meta = document.getElementById('edBolumMeta');
  if (meta) meta.textContent = `${Object.keys(tümKats).length} BÖLÜM`;
  list.innerHTML = html;
}

function edBolumSecVeOyna(kat) {
  const bugunBtn = document.querySelector('.ed-tab-btn');
  edTabSec('bugun', bugunBtn);
  setTimeout(() => { edKategoriSec(kat); baslat(); }, 80);
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
}

function edBaslat() {
  edMastheadGuncelle();
  edHeroGridDoldur();
  edCatTblDoldur();
  mCatListDoldur();
  edStreakGuncelle();
}