// ═══════════════════════════
// YANLIŞ KUTUSU — BAŞLAT
// ═══════════════════════════
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
  // Update qz mod label
  const modLbl0 = document.getElementById('qzModLbl');
  if (modLbl0) modLbl0.textContent = 'YANLIŞ KUTUSU · KLASİK';
  soruyuGoster();
  sayacBaslat();
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
  // Update qz mod label
  const modLblCh = document.getElementById('qzModLbl');
  if (modLblCh) modLblCh.textContent = 'DÜELLO · KLASİK';
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

function challengeSezon() { /* placeholder — sezon entegrasyonu */ }

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
    // Update qz mod label
    const modLblTB = document.getElementById('qzModLbl');
    if (modLblTB) modLblTB.textContent = 'KLASİK · TARİHTE BUGÜN · ORTA';
    soruyuGoster();
    sayacBaslat();
  });
}

// ═══════════════════════════
// CAN / GERİBİLDİRİM / SONRAKİ SORU
// ═══════════════════════════
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

function geriBildirim(mesaj, dogru) {}

function nextBtnTikla() {
  if (!cevaplandi) { cevabiOnayla(); }
  else { sonrakiSoru(); }
}

function sonrakiSoru() {
  seciliCevapIdx = -1;
  const nb = document.getElementById('nextBtn');
  nb.textContent = 'ONAYLA →';
  nb?.classList.remove('show');
  soruIndex++;
  if (soruIndex >= sorular.length) {
    quizBitir();
  } else {
    soruyuGoster();
    if (hizMod) hizSayacBaslat();
    else if (!sonsuzMod) sayacBaslat();
  }
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
    const sm = el.querySelector('small'); if (sm) sm.textContent = jokerAktif ? `${hak} hak kaldı` : 'Kapalı';
    el.disabled = !jokerAktif;
    el.style.opacity = jokerAktif ? '1' : '0.4';
  });
}

const _geriSayimSes = new Audio('sounds/geri-sayim.mp3');

function geriSayimBaslat(kategoriAdi, callback) {
  const overlay = document.getElementById('countdownOverlay');
  const numEl   = document.getElementById('countdownNum');
  const katEl   = document.getElementById('countdownKategori');
  if (!overlay) { callback(); return; }
  if (katEl) katEl.textContent = kategoriAdi;
  overlay.classList.add('show');
  const fab = document.getElementById('fabWrap');
  if (fab) fab.style.display = 'none';
  let sayac = 3;
  numEl.className = 'countdown-num';
  numEl.textContent = sayac;
  _geriSayimSesOynat();

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
      _geriSayimSesOynat();
      numEl.textContent = sayac;
    }
  }, 800);
}

function _geriSayimSesOynat() {
  _geriSayimSes.currentTime = 0;
  _geriSayimSes.play().catch(() => {});
}

function baslat() {
  sonsuzMod = (oyunModu === 'sonsuz');
  hizMod    = (oyunModu === 'hiz');
  sinavMod  = (oyunModu === 'sinav');

  const modBilgi = MOD_BILGI[oyunModu];
  const hedefSayi = modBilgi.soruSayisi;

  let havuz = [];
  if (seciliKategori === 'all') {
    for (const kat of Object.keys(SORU_HAVUZU)) {
      if (SORU_HAVUZU[kat]?.hepsi) havuz.push(...SORU_HAVUZU[kat].hepsi);
    }
  } else {
    havuz = [...(SORU_HAVUZU[seciliKategori]?.hepsi || [])];
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
    // Update qz mod label
    const modLbl = document.getElementById('qzModLbl');
    if (modLbl) {
      const katAdiUst = seciliKategori === 'all' ? 'KARISIK' : (KATEGORI_BILGI?.[seciliKategori]?.isim || seciliKategori).toUpperCase();
      modLbl.textContent = `${(oyunModu||'klasik').toUpperCase()} · ${katAdiUst}`;
    }
    soruyuGoster();
    quizMuzikBaslat();
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
        setTimeout(() => document.getElementById('nextBtn').classList.add('show'), 300);
        const acEl = document.getElementById('aciklamaBar');
        const aciklama = sorular[soruIndex]?.e;
        if (acEl && aciklama) { acEl.textContent = '💡 ' + aciklama; acEl.classList.add('show'); }
        document.querySelector(`.option-btn[data-idx="${sorular[soruIndex].a}"]`)?.classList.add('correct');
        document.querySelectorAll('.option-btn').forEach(b => b.classList.add('disabled'));
      }
    }
  }, 1000);
}

function timerGuncelle() {
  const dk = Math.floor(kalanSure / 60);
  const sn = kalanSure % 60;
  const timerEl = document.getElementById('quizTimer');
  if (timerEl) timerEl.textContent = `${String(dk).padStart(2,'0')}:${String(sn).padStart(2,'0')}`;
  const maxSure = hizMod ? 5 : seciliSure;
  const fill = document.getElementById('qzTFill');
  if (fill) fill.style.width = `${Math.max(0, (kalanSure / maxSure) * 100)}%`;
  // Ring timer
  const ringFill = document.getElementById('qzRingFill');
  const timerNum = document.getElementById('qzTimerNum');
  if (ringFill) {
    const circ = 251;
    const pct = Math.max(0, kalanSure / maxSure);
    ringFill.setAttribute('stroke-dashoffset', String(Math.round(circ * (1 - pct))));
    const clr = pct <= 0.25 ? '#B33A3A' : pct <= 0.5 ? '#f59e0b' : null;
    if (clr) ringFill.setAttribute('stroke', clr);
    else ringFill.removeAttribute('stroke');
  }
  if (timerNum) timerNum.textContent = String(kalanSure);
}

function qzSegsGuncelle(index, total) {
  const el = document.getElementById('qzSegs');
  if (!el) return;
  let html = '';
  for (let i = 0; i < total; i++) {
    if (i < index) html += '<div class="qz-seg done"></div>';
    else if (i === index) html += '<div class="qz-seg current"></div>';
    else html += '<div class="qz-seg"></div>';
  }
  el.innerHTML = html;
}

// ═══════════════════════════
// SORU GÖSTER
// ═══════════════════════════
function soruyuGoster() {
  if (soruIndex >= sorular.length) { quizBitir(); return; }

  cevaplandi = false;
  buSoruda5050Kullanildi = false;
  klavyeSeciliIdx = -1;
  const soru = sorular[soruIndex];
  const harfler = ['A', 'B', 'C', 'D'];

  document.getElementById('questionNumber').textContent = `${String(soruIndex + 1).padStart(2,'0')} / ${String(sorular.length).padStart(2,'0')}`;
  document.getElementById('progressFill').style.width = `${((soruIndex + 1) / sorular.length) * 100}%`;
  const soruLbl = document.getElementById('qzSoruLbl');
  if (soruLbl) soruLbl.textContent = `SORU ${String(soruIndex + 1).padStart(2,'0')} · ${(soruIndex + 1) * 100} PUAN`;
  qzSegsGuncelle(soruIndex, sorular.length);
  const puanEl = document.getElementById('qzPuanLbl');
  if (puanEl) puanEl.textContent = `${toplamPuan} puan`;
  const badgeEl = document.getElementById('qzQPuanBadge');
  if (badgeEl) badgeEl.textContent = `☐ ${(soruIndex + 1) * 100} puan`;

  const qEl = document.getElementById('questionText');
  const oEl = document.getElementById('optionsList');
  qEl.classList.remove('question-enter');
  oEl.classList.remove('question-enter');
  void qEl.offsetWidth;

  qEl.textContent = soru.q;
  qEl.classList.add('question-enter');

  oEl.innerHTML = soru.o.map((opt, i) => `
    <button class="option-btn" onclick="cevapVer(${i}, this)" data-idx="${i}">
      <span class="opt-letter">${harfler[i]}</span>
      <span class="opt-text">${opt}</span>
      <span class="opt-check"></span>
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
    const j5050sm = j5050.querySelector('small'); if (j5050sm) j5050sm.textContent = `${joker5050Hak} hak kaldı`;
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
// CEVAP VER — iki adımlı
// ═══════════════════════════
let seciliCevapIdx = -1;

function cevapVer(idx, btn) {
  if (cevaplandi) return;

  // Adım 1: sadece seç, henüz değerlendirme yapma
  document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  seciliCevapIdx = idx;

  const nb = document.getElementById('nextBtn');
  nb.textContent = 'ONAYLA →';
  nb.classList.add('show');
}

function cevabiOnayla() {
  if (cevaplandi || seciliCevapIdx < 0) return;
  cevaplandi = true;

  const soru = sorular[soruIndex];
  const idx = seciliCevapIdx;
  const dogru = idx === soru.a;
  const btn = document.querySelector(`.option-btn[data-idx="${idx}"]`);

  clearInterval(timerInterval);
  document.querySelectorAll('.option-btn').forEach(b => b.classList.add('disabled'));
  document.querySelector(`.option-btn[data-idx="${soru.a}"]`)?.classList.add('correct');

  if (dogru) {
    streak++;
    if (streak > maxStreak) maxStreak = streak;
    btn?.classList.add('correct');
    dogruSayisi++;
    merakLogKaydet(seciliKategori);
    const streakBonus = streak >= 4 ? 100 : streak >= 3 ? 60 : streak >= 2 ? 30 : 0;
    const carpan = hizMod ? 2 : 1;
    toplamPuan += (100 + Math.floor(kalanSure / (hizMod ? 5 : seciliSure) * 50) + streakBonus) * carpan;
    const _pe = document.getElementById('qzPuanLbl');
    if (_pe) _pe.textContent = `${toplamPuan} puan`;
    streakGuncelle();
    sesOynat('dogru');
    if (yanlisMod) {
      let kutu = JSON.parse(localStorage.getItem('bm_yanlis_kutusu') || '[]');
      const onceki = kutu.length;
      kutu = kutu.filter(k => k.q !== soru.q);
      localStorage.setItem('bm_yanlis_kutusu', JSON.stringify(kutu));
      if (kutu.length < onceki) {
        const cozulen = parseInt(localStorage.getItem('bm_yanlis_cozulen') || '0') + 1;
        localStorage.setItem('bm_yanlis_cozulen', cozulen);
      }
    }
  } else {
    btn?.classList.add('wrong');
    streak = 0;
    canSayisi--;
    yanlisSayisi++;
    canGuncelle();
    streakGuncelle();
    sesOynat('yanlis');
    if (!yanlisMod) yanlisSakla(soru, seciliKategori, seciliZorluk);
    if (canSayisi <= 0) {
      toastGoster('💔 Son canını da kaybettin!', false);
      setTimeout(() => quizBitir(), 1500);
      return;
    }
  }

  const aciklama = soru?.e;
  const acEl = document.getElementById('aciklamaBar');
  if (acEl) {
    if (aciklama) { acEl.textContent = '💡 ' + aciklama; acEl.classList.add('show'); }
    else acEl.classList.remove('show');
  }

  const nb = document.getElementById('nextBtn');
  nb.textContent = 'İLERİ →';
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

// ═══════════════════════════
// SONUÇ
// ═══════════════════════════
function quizBitir() {
  quizMuzikDurdur();
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

  let emoji, text, rsTitle, rsQuote;
  if (dogruSayisi >= 9) { emoji = '🏆'; text = 'MÜKEMMEL! Sen bir dahisin!'; rsTitle = 'Mükemmel! Gerçek Bir Dahi'; rsQuote = '"Bilgelik zirvede — sen oraya ulaştın."'; }
  else if (dogruSayisi >= 7) { emoji = '🌟'; text = 'Harika! Bilgine güveniyorsun!'; rsTitle = 'Harika! Bilgine Güveniyorsun'; rsQuote = '"İlim, en büyük güçtür."'; }
  else if (dogruSayisi >= 5) { emoji = '👍'; text = 'Fena değil, geliştirilebilir.'; rsTitle = 'Fena Değil, Geliştirilebilir'; rsQuote = '"Her denemede bir adım daha ileri."'; }
  else if (dogruSayisi >= 3) { emoji = '📚'; text = 'Biraz daha çalışmalısın.'; rsTitle = 'Biraz Daha Çalışmalısın'; rsQuote = '"Öğrenmek, ömür boyu süren bir yolculuktur."'; }
  else { emoji = '😅'; text = 'Genel kültür şart! Pes etme!'; rsTitle = 'Genel Kültür Şart'; rsQuote = '"Pes etme — her soru bir adım."'; }

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

  // Yeni result ekran elementleri
  const _rsMod = document.getElementById('rsModLbl');
  if (_rsMod) {
    const _katIsim = seciliKategori === 'all' ? 'KARIŞIK' : (KATEGORI_BILGI?.[seciliKategori]?.isim || seciliKategori).toUpperCase();
    _rsMod.textContent = `□ ${(oyunModu || 'KLASİK').toUpperCase()} · ${_katIsim}`;
  }
  const _rsTitleEl = document.getElementById('rsGradeTitle');
  if (_rsTitleEl) _rsTitleEl.textContent = rsTitle;
  const _rsQuoteEl = document.getElementById('rsGradeQuote');
  if (_rsQuoteEl) _rsQuoteEl.textContent = rsQuote;


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
    sayacAnimasyonu('rsRingScore', toplamPuan, 1200, '');
    const _ringFill = document.getElementById('rsRingFill');
    if (_ringFill) {
      const _circ = 490;
      const _pct = sorular.length > 0 ? dogruSayisi / sorular.length : 0;
      _ringFill.style.transition = 'stroke-dashoffset 1.3s ease-out';
      _ringFill.setAttribute('stroke-dashoffset', String(Math.round(_circ * (1 - _pct))));
    }
    kategoriInsightGoster();
    if (dogruSayisi >= 7) konfeti();
  }, 250);
}

function quizMedyaDurdur() {
  document.querySelectorAll('audio.quiz-audio').forEach(a => {
    try { a.pause(); a.currentTime = 0; } catch(e) {}
  });
}
