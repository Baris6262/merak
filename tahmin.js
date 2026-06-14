// ═══════════════════════════
// TAHMİN ET — Oyun Mantığı
// ═══════════════════════════

const TH_SORU_SAYISI = 10;
const TH_MAKS_PUAN   = TH_SORU_SAYISI * 1000;

let thSorular    = [];
let thIndex      = 0;
let thToplamPuan = 0;
let thCevaplandi = false;

function tahminBaslat() {
  thSorular    = [...TAHMIN_SORULAR].sort(() => Math.random() - 0.5).slice(0, TH_SORU_SAYISI);
  thIndex      = 0;
  thToplamPuan = 0;
  thCevaplandi = false;
  ekranGoster('tahminScreen');
  _thSoruGoster();
}

function tahminCik() {
  if (window.STANDALONE === 'tahmin') { window.parent.postMessage('oyunKapat', '*'); return; }
  ekranGoster('homeScreen');
}

function _thSoruGoster() {
  const soru = thSorular[thIndex];

  // Progress
  document.getElementById('thProgIc').style.width = `${(thIndex / TH_SORU_SAYISI) * 100}%`;
  document.getElementById('thProgLbl').textContent = `${String(thIndex + 1).padStart(2, '0')} / ${TH_SORU_SAYISI}`;
  document.getElementById('thSkorEl').textContent  = thToplamPuan.toLocaleString('tr') + ' PTS';

  // Soru
  document.getElementById('thSoruEl').textContent = soru.s;
  document.getElementById('thBirimEl').textContent = `Birim: ${soru.b}`;

  // Input sıfırla
  const inp = document.getElementById('thInput');
  inp.value = '';
  inp.style.borderColor = '';

  // Paneller
  document.getElementById('thInputAlan').style.display = '';
  document.getElementById('thSonuc').style.display     = 'none';
  document.getElementById('thFinal').style.display     = 'none';

  thCevaplandi = false;
  setTimeout(() => inp.focus(), 150);
}

function thDegistir(delta) {
  const inp = document.getElementById('thInput');
  const val = parseFloat(inp.value) || 0;
  const adim = val === 0 ? 1 : Math.max(1, Math.round(Math.abs(val) * 0.05));
  inp.value  = Math.max(0, val + delta * adim);
}

function thTahminEt() {
  if (thCevaplandi) return;
  const inp    = document.getElementById('thInput');
  const tahmin = parseFloat(inp.value);

  if (isNaN(tahmin) || inp.value.trim() === '') {
    inp.style.borderColor = 'var(--wrong)';
    inp.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 300 });
    return;
  }

  thCevaplandi = true;

  const soru = thSorular[thIndex];
  const puan = _thPuanHesapla(tahmin, soru.a);
  thToplamPuan += puan;

  // Paneller
  document.getElementById('thInputAlan').style.display = 'none';
  document.getElementById('thSonuc').style.display     = '';

  const etiket = _thEtiket(puan);
  const dogruEl   = document.getElementById('thDogruEl');
  const tahminEl  = document.getElementById('thTahminEl');
  const etiketEl  = document.getElementById('thEtiketEl');
  const puanEl    = document.getElementById('thPuanEl');
  const barEl     = document.getElementById('thBarEl');
  const sonrakiEl = document.getElementById('thSonrakiBtn');

  etiketEl.textContent  = etiket.metin;
  etiketEl.style.color  = `var(--${etiket.renk})`;
  dogruEl.textContent   = `${soru.a.toLocaleString('tr')} ${soru.b}`;
  tahminEl.textContent  = `${tahmin.toLocaleString('tr')} ${soru.b}`;
  puanEl.textContent    = `+${puan.toLocaleString('tr')} PUAN`;
  puanEl.style.color    = `var(--${etiket.renk})`;
  document.getElementById('thSkorEl').textContent = thToplamPuan.toLocaleString('tr') + ' PTS';

  // Bar animasyonu
  const oran     = soru.a !== 0 ? Math.abs(tahmin - soru.a) / Math.abs(soru.a) : 1;
  const barW     = Math.max(4, Math.min(100, Math.round((1 - Math.min(oran, 1)) * 100)));
  barEl.style.width      = '0%';
  barEl.style.background = puan >= 600 ? 'var(--correct)' : puan >= 200 ? 'var(--gold)' : 'var(--wrong)';
  setTimeout(() => { barEl.style.width = barW + '%'; }, 50);

  sonrakiEl.textContent = thIndex === TH_SORU_SAYISI - 1 ? 'SONUCU GÖR →' : 'SONRAKI →';
}

function thSonraki() {
  thIndex++;
  if (thIndex >= TH_SORU_SAYISI) {
    _thFinalGoster();
  } else {
    _thSoruGoster();
  }
}

function _thFinalGoster() {
  document.getElementById('thInputAlan').style.display = 'none';
  document.getElementById('thSonuc').style.display     = 'none';
  document.getElementById('thFinal').style.display     = '';
  document.getElementById('thProgIc').style.width      = '100%';
  document.getElementById('thSkorEl').textContent      = thToplamPuan.toLocaleString('tr') + ' PTS';

  document.getElementById('thFinalSkor').textContent = thToplamPuan.toLocaleString('tr');
  document.getElementById('thFinalMaks').textContent = `/ ${TH_MAKS_PUAN.toLocaleString('tr')} PUAN`;

  const oran = thToplamPuan / TH_MAKS_PUAN;
  let emoji, yorum;
  if (oran >= 0.9) { emoji = '🎯'; yorum = 'Olağanüstü! Gerçek bir bilge.'; }
  else if (oran >= 0.7) { emoji = '🔥'; yorum = 'Çok iyi! Tahminlerin yerinde.'; }
  else if (oran >= 0.5) { emoji = '👍'; yorum = 'Fena değil, ama daha iyisi mümkün!'; }
  else if (oran >= 0.3) { emoji = '🤔'; yorum = 'Biraz daha çalışman lazım.'; }
  else { emoji = '😅'; yorum = 'Hiç yaklaşamadın, ama umut var!'; }

  document.getElementById('thFinalEmoji').textContent = emoji;
  document.getElementById('thFinalYorum').textContent = yorum;
}

function _thPuanHesapla(tahmin, dogru) {
  if (tahmin === dogru) return 1000;
  if (dogru === 0) return 0;
  const oran = Math.abs(tahmin - dogru) / Math.abs(dogru);
  if (oran <= 0.02) return 800;
  if (oran <= 0.05) return 600;
  if (oran <= 0.10) return 400;
  if (oran <= 0.20) return 200;
  if (oran <= 0.50) return 100;
  return 0;
}

function _thEtiket(puan) {
  if (puan === 1000) return { metin: '🎯 TAM İSABET!',      renk: 'accent' };
  if (puan >= 800)  return { metin: '🔥 NEREDEYSE!',        renk: 'correct' };
  if (puan >= 600)  return { metin: '✓ YAKINSIN',           renk: 'correct' };
  if (puan >= 400)  return { metin: 'İDARE EDER',           renk: 'gold' };
  if (puan >= 200)  return { metin: 'UZAKSIN',              renk: 'wrong' };
  if (puan >= 100)  return { metin: 'ÇOK UZAK',             renk: 'wrong' };
  return              { metin: 'HİÇ YAKLAŞMADIN',           renk: 'wrong' };
}

// Enter tuşu ile tahmin gönder
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const screen = document.getElementById('tahminScreen');
    if (!screen || !screen.classList.contains('active')) return;
    if (!thCevaplandi) thTahminEt();
    else if (document.getElementById('thSonuc').style.display !== 'none') thSonraki();
  }
});
