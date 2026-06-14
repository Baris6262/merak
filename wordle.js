// ═══════════════════════════
// KELİME BUL (WORDLE) — State
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
  return CEVAPLAR_TEMIZ[Math.floor(rand() * CEVAPLAR_TEMIZ.length)];
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

  wlKalanGuncelle();
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

    document.body.classList.add('wl-open');
    window.scrollTo(0, 0);

    panel.style.display = '';
    panel.classList.remove('ed-anim-in', 'ed-anim-out');
    panel.offsetHeight; // reflow — animasyonu başlangıç karesinden başlat
    panel.classList.add('ed-anim-in');
  }, 190);
}

function edWordleKapat() {
  if (window.STANDALONE === 'wordle') { window.parent.postMessage('oyunKapat', '*'); return; }
  localStorage.setItem('bm_son_ekran', 'homeScreen');
  const home = document.getElementById('edHomeContent');
  const panel = document.getElementById('edWordlePanel');

  panel.classList.remove('ed-anim-in');
  panel.classList.add('ed-anim-out');

  setTimeout(() => {
    panel.style.display = 'none';
    panel.classList.remove('ed-anim-out');
    document.body.classList.remove('wl-open');

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
      `<button class="klavye-tus${t==='GİR'||t==='⌫'?' klavye-tus-genis':''}" data-tus="${t}" onclick="wTus('${t}')">${t==='GİR'?'↵':t}</button>`
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
  const tekrarHarf = [...wMevcut].some(h => wMevcut.split(h).length - 1 > 2);
  if (tekrarHarf) {
    const satir = document.getElementById(`wSatir${wTahminler.length}`);
    satir?.classList.add('salla');
    setTimeout(() => satir?.classList.remove('salla'), 450);
    toastGoster('Aynı harf en fazla 2 kez kullanılabilir!', false);
    return;
  }
  const satirIdx = wTahminler.length;
  const tahmin = wMevcut;
  wTahminler.push(tahmin);
  wMevcut = '';
  wlKalanGuncelle();

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
    kazandi: wTahminler[wTahminler.length - 1] === wKelime,
    kelime: wKelime
  }));
}

function wordleKayitGetir() {
  const raw = localStorage.getItem(`bm_wordle_${new Date().toDateString()}`);
  return raw ? JSON.parse(raw) : null;
}

function wlKalanGuncelle() {
  const el = document.getElementById('wlKalanEl');
  if (!el) return;
  const kalan = 6 - wTahminler.length;
  el.innerHTML = `${String(kalan).padStart(2,'0')}<span>/06</span>`;
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
  },

  // Batch 8 — 100 yeni kart
  { kategori: "Sağlık & Efsaneler", soru: "Yılan ısırıklarında zehri ağızla emerek çıkarmak işe yarar mı?", cevap: "Hayır, durumu çok daha kötüleştirir.", aciklama: "Zehri emmeye çalışmak, zehrin ağızdaki kılcal damarlardan kana karışmasına ve yaranın enfeksiyon kapmasına yol açar. Isırılan bölgeyi hareketsiz tutup hızla acil servise gitmek tek doğru yöntemdir." },
  { kategori: "Gıda & Beslenme", soru: "Detoks suları veya diyetleri vücuttaki toksinleri atar mı?", cevap: "Hayır, toksinleri atan organlar böbrek ve karaciğerdir.", aciklama: "Vücudumuz toksinleri temizlemek için muazzam bir sisteme sahiptir. Pahalı detoks suları sadece su içiminizi artırır; karaciğer ve böbreklerinizin işini sihirli bir şekilde hızlandırmaz." },
  { kategori: "İnsan Anatomisi", soru: "Sağ beyinliler yaratıcı, sol beyinliler mantıksal mıdır?", cevap: "Hayır, beynin iki yarısı her zaman birlikte çalışır.", aciklama: "Belirli yeteneklerin sadece sağ veya sol lobda bulunduğu fikri popüler psikoloji efsanesidir. Müzik çalmak veya matematik çözmek gibi eylemlerde beynin her iki yarımküresi eşzamanlı ve yoğun bir şekilde iletişim kurar." },
  { kategori: "Sağlık & Efsaneler", soru: "Antibiyotikler soğuk algınlığı veya gribi iyileştirir mi?", cevap: "Hayır, çünkü grip virüslerden kaynaklanır.", aciklama: "Antibiyotikler yalnızca bakterilere karşı etkilidir. Nezle veya grip gibi viral enfeksiyonlarda hiçbir işe yaramazlar, aksine gereksiz kullanım antibiyotik direncine yol açar." },
  { kategori: "Gıda & Beslenme", soru: "Gece geç saatte karbonhidrat yemek daha fazla mı kilo aldırır?", cevap: "Hayır, önemli olan gün boyu alınan toplam kaloridir.", aciklama: "Vücut saatin kaç olduğunu bilerek kalorileri farklı şekilde depolamaz. Kilo alımı gün içinde harcadığınızdan daha fazla kalori tüketmenizle ilgilidir, yemeğin saatiyle değil." },
  { kategori: "Sağlık & Efsaneler", soru: "İdrar rengi koyuysa vücut toksin mi atıyordur?", cevap: "Hayır, sadece yeterince su içmediğinizi gösterir.", aciklama: "Koyu sarı idrar, vücudun susuz kaldığının (dehidrasyon) en belirgin işaretidir. Yeterli su içildiğinde idrar açık sarı veya şeffaf bir renk alır." },
  { kategori: "Sağlık & Efsaneler", soru: "Şeker hastalığı olanlar hiç tatlı yiyemez mi?", cevap: "Hayır, porsiyon kontrolüyle yiyebilirler.", aciklama: "Diyabetliler de sağlıklı bir beslenme planı ve doğru porsiyonlama çerçevesinde tatlı veya karbonhidrat tüketebilirler. Yasak olan 'şeker' değil, kontrolsüz kan şekeri dalgalanmalarıdır." },
  { kategori: "İnsan Anatomisi", soru: "Kolesterol her zaman kötü bir şey midir?", cevap: "Hayır, kolesterol yaşamak için zorunludur.", aciklama: "Hücre zarlarının yapısı ve hormonların (D vitamini, testosteron vb.) üretimi için kolesterol şarttır. Sorun yaratan şey kolesterolün kendisi değil, LDL (kötü) kolesterolün kanda aşırı birikmesidir." },
  { kategori: "Gıda & Beslenme", soru: "Su içmek doğrudan zayıflatır mı?", cevap: "Hayır, suyun yağ yakıcı bir özelliği yoktur.", aciklama: "Su sıfır kaloridir ve metabolizmayı hafifçe hızlandırıp tokluk hissi vererek diyete yardımcı olur. Ancak tek başına su içerek yağ yakılamaz." },
  { kategori: "Sağlık & Efsaneler", soru: "Çok terlemek daha fazla yağ yaktırır mı?", cevap: "Hayır, sadece daha fazla su kaybedersiniz.", aciklama: "Terlemek vücudun soğuma mekanizmasıdır. Saunada veya kalın giyinip terleyerek verdiğiniz kilo yağ değil, sudur; su içtiğinizde o kiloyu anında geri alırsınız." },
  { kategori: "Sağlık & Efsaneler", soru: "Karanlıkta veya loş ışıkta kitap okumak gözü bozar mı?", cevap: "Hayır, sadece gözü geçici olarak yorar.", aciklama: "Loş ışıkta okumak kalıcı bir görme bozukluğuna veya miyopluğa neden olmaz. Göz kasları daha fazla çalıştığı için baş ağrısı ve göz yorgunluğu yapar, ancak dinlenince geçer." },
  { kategori: "Sağlık & Efsaneler", soru: "Sürekli gözlük takmak gözleri tembelleştirip numarayı büyütür mü?", cevap: "Hayır, gözlük sadece doğru odaklanmayı sağlar.", aciklama: "Gözlük takmak veya takmamak gözünüzün anatomik yapısındaki bozulmayı değiştirmez. Gözlük sadece bulanık görüntüyü düzeltir, gözü tedavi etmez veya bozmaz." },
  { kategori: "Sağlık & Efsaneler", soru: "Aşılar otizme neden olur mu?", cevap: "Hayır, bu tamamen çürütülmüş bir sahtekarlıktır.", aciklama: "1998'de Andrew Wakefield tarafından yazılan makale verileri sahteydi; Wakefield meslekten men edildi. Binlerce bağımsız araştırma aşılarla otizm arasında hiçbir bağ olmadığını kanıtladı." },
  { kategori: "Kişisel Bakım", soru: "Kırık saç uçları şampuan veya kremlerle onarılabilir mi?", cevap: "Hayır, kırık saç uçları asla onarılamaz.", aciklama: "Saç teli cansız bir dokudur. Çatlamış veya ikiye ayrılmış bir uç hiçbir kozmetik ürünle kalıcı olarak birleştirilemez; tek çözüm kırık kısmı kesmektir." },
  { kategori: "Kişisel Bakım", soru: "Saçın alışmaması için şampuanı sık sık değiştirmek gerekir mi?", cevap: "Hayır, saç ürünlere karşı 'bağışıklık' geliştirmez.", aciklama: "Saç cansızdır ve bir şampuana 'alışmaz'. Ancak mevsim, hava durumu, hormonlar veya boya işlemleri saçın ihtiyacını değiştirebilir." },
  { kategori: "Sağlık & Efsaneler", soru: "Açık yaralara oksijenli su veya tentürdiyot sürmek iyileşmeyi hızlandırır mı?", cevap: "Hayır, yara iyileşmesini geciktirir.", aciklama: "Bu güçlü kimyasallar bakterileri öldürürken, yarayı onaracak sağlıklı hücreleri de öldürür. Küçük kesikler için en iyi temizlik yöntemi bol sabun ve sudur." },
  { kategori: "Sağlık & Efsaneler", soru: "Sivilceleri sıkmak daha çabuk geçmelerini sağlar mı?", cevap: "Hayır, enfeksiyonu derine iter ve iz bırakır.", aciklama: "Sivilceyi sıkmak, içindeki iltihabın ve bakterilerin deri altındaki dokulara daha fazla yayılmasına neden olur. Bu iyileşmeyi geciktirir ve kalıcı çukurlar bırakır." },
  { kategori: "Gıda & Beslenme", soru: "Çikolata yemek sivilceye (akneye) yol açar mı?", cevap: "Doğrudan çikolata sivilce yapmaz.", aciklama: "Sivilcenin temel nedenleri genetik, hormonlar ve strestir. Saf kakao sivilceyle ilgisi yoktur; ancak çikolatanın içindeki yüksek şeker ve süt tozu bazı hassas kişilerde durumu tetikleyebilir." },
  { kategori: "Gıda & Beslenme", soru: "Esmer şeker, beyaz şekerden daha mı sağlıklıdır?", cevap: "Hayır, kalorileri ve etkileri neredeyse aynıdır.", aciklama: "Esmer şeker genellikle beyaz şekere melas eklenmesiyle elde edilir. Melas eser miktarda mineral içerse de sağlık açısından ikisi de saf şekerdir." },
  { kategori: "Gıda & Beslenme", soru: "Deniz tuzu, normal sofra tuzundan daha mı az sodyum içerir?", cevap: "Hayır, ikisinin de sodyum oranı aynıdır.", aciklama: "Hem deniz tuzu hem de rafine sofra tuzu ağırlıkça %40 sodyum içerir. Deniz tuzunun tek farkı iri taneli olması ve eser miktarda mineral barındırmasıdır." },
  { kategori: "Gıda & Beslenme", soru: "Mikrodalga fırınlar yemeğin besin değerini veya vitaminlerini yok eder mi?", cevap: "Hayır, aksine vitaminleri daha iyi korur.", aciklama: "Mikrodalga fırınlar yemeği çok hızlı ve az suyla pişirdiği için, C vitamini gibi besin öğelerinin korunmasında haşlama veya fırınlamaya göre çok daha başarılıdır." },
  { kategori: "Mutfak Gerçekleri", soru: "Yemek pişerken içine konan alkolün tamamı buharlaşıp uçar mı?", cevap: "Hayır, önemli bir kısmı yemekte kalır.", aciklama: "Pişirme süresine ve yöntemine bağlı olarak alkolün %5 ila %85'i yemekte kalmaya devam eder. Tamamen buharlaşması için saatlerce kaynatılması gerekir." },
  { kategori: "Mutfak Gerçekleri", soru: "Makarna suyuna yağ katmak makarnaların yapışmasını engeller mi?", cevap: "Hayır, sadece sosun makarnaya tutunmasını engeller.", aciklama: "Yağ suyun yüzeyinde kalır ve makarnanın yapışmasını önlemez. Süzdükten sonra yağ makarnayı kaplayarak, sonradan ekleyeceğiniz sosun kayıp gitmesine neden olur." },
  { kategori: "Mutfak Gerçekleri", soru: "Kaynayan suya tuz atmak suyun daha hızlı kaynamasını sağlar mı?", cevap: "Hayır, aksine kaynama noktasını yükseltir.", aciklama: "Tuz eklemek suyun kaynama derecesini çok ufak bir miktar yükseltir, yani teknik olarak su daha geç kaynar. Suya tuz atılmasının tek bilimsel nedeni yemeğe lezzet katmaktır." },
  { kategori: "Gıda & Beslenme", soru: "Beyaz çikolata gerçekten çikolata mıdır?", cevap: "Hayır, içinde hiç kakao tozu yoktur.", aciklama: "Gerçek çikolataya rengini ve tadını veren kakao kitlesi beyaz çikolatada bulunmaz. Beyaz çikolata sadece kakao yağı, şeker ve süt tozundan ibarettir." },
  { kategori: "Gıda & Beslenme", soru: "Süpermarketlerdeki 'bebek havuçlar' minyatür bir havuç türü müdür?", cevap: "Hayır, normal havuçların kesilmiş halidir.", aciklama: "Bebek havuçlar, şekli bozuk veya satılamayacak kadar çirkin olan büyük havuçların fabrikalarda küçük, pürüzsüz boyutlarda kesilip yontulmasıyla üretilir." },
  { kategori: "Gıda & Beslenme", soru: "Yumurta yemek kandaki kolesterolü tehlikeli şekilde yükseltir mi?", cevap: "Hayır, diyet kolesterolünün kana etkisi çok azdır.", aciklama: "Kan kolesterolünü asıl yükselten şeyler doymuş yağlar ve trans yağlardır. Yumurta besin değeri çok yüksek bir gıdadır ve sağlıklı insanlarda kolesterolü kötü etkilemez." },
  { kategori: "Gıda & Beslenme", soru: "Kahvaltı, metabolizmayı çalıştırmak için günün en önemli öğünü müdür?", cevap: "Hayır, bu bir kahvaltılık gevrek reklamı taktiğidir.", aciklama: "'Kahvaltı günün en önemli öğünüdür' sloganı, 1944 yılında mısır gevreği satışlarını artırmak isteyen bir şirket tarafından uydurulmuştur. Öğünlerin içeriği saatinden daha önemlidir." },
  { kategori: "Sağlık & Efsaneler", soru: "Acı yemek, baharat tüketmek veya stres mide ülseri yapar mı?", cevap: "Hayır, ülsere bir bakteri neden olur.", aciklama: "Mide ülserlerinin büyük çoğunluğu 'Helicobacter pylori' adlı bakteriden veya uzun süreli ağrı kesici kullanımından kaynaklanır. Acı yemek sadece var olan bir ülserin ağrısını artırır." },
  { kategori: "Sağlık & Efsaneler", soru: "Süt ürünleri tüketmek balgam ve mukusu artırır mı?", cevap: "Hayır, mukus miktarını artırmaz.", aciklama: "Süt içildiğinde ağız ve boğazdaki tükürükle karışarak geçici bir kıvamlılık hissi yaratır. Bu yüzden balgamı artırmış gibi hissedersiniz ancak bilimsel olarak böyle bir artış yoktur." },
  { kategori: "Gıda & Beslenme", soru: "Taze sıkılmış meyve suyu, bütün meyveyi yemek kadar sağlıklı mıdır?", cevap: "Hayır, meyve suyu içmek şeker şoku yaratır.", aciklama: "Meyveyi sıktığınızda şekeri dengeleyen posasını ve liflerini çöpe atmış olursunuz. Geriye kalan fruktoz, karaciğere doğrudan ve hızlı bir yük bindirir." },
  { kategori: "Gıda & Beslenme", soru: "Sağlıklı kalmak için günde kesinlikle 8 bardak su içmek zorunlu mudur?", cevap: "Hayır, su ihtiyacı kişiden kişiye değişir.", aciklama: "Herkesin su ihtiyacı yaşına, kilosuna, aktivitesine ve yediği gıdalara göre farklıdır. Ayrıca çay, kahve, çorba ve meyvelerden alınan sıvılar da günlük ihtiyaca sayılır." },
  { kategori: "Gıda & Beslenme", soru: "Balık ile yoğurt aynı anda yenirse zehirler mi?", cevap: "Hayır, balık taze ise hiçbir sorun olmaz.", aciklama: "Balık bayatladığında içinde histamin artar; yoğurtta da histamin vardır. İki bayat ürün birleşince reaksiyon olabilir, taze balıkla ise zehirlenme riski sıfırdır." },
  { kategori: "Tarih Öncesi", soru: "Tyrannosaurus Rex yaşamış en büyük etobur dinozor mudur?", cevap: "Hayır, Spinosaurus ondan daha büyüktür.", aciklama: "T-Rex popüler kültürün en tanınan dinozoru olsa da, sırtında yelkenimsi bir yüzgeci olan ve daha çok suda avlanan Spinosaurus, T-Rex'ten hem daha uzun hem de daha ağırdı." },
  { kategori: "Tarih Öncesi", soru: "Meteor çarpması sonucu tüm dinozorların nesli mi tükendi?", cevap: "Hayır, bir grup dinozor hayatta kalıp kuşlara evrimleşti.", aciklama: "Yaklaşık 66 milyon yıl önce sadece 'kuş olmayan dinozorların' soyu tükendi. Bugünkü tavuklar, kargalar ve diğer tüm kuşlar, hayatta kalan dinozorların doğrudan torunlarıdır." },
  { kategori: "Hayvanlar Alemi", soru: "Kuşlar memeli hayvanlar sınıfına mı girer?", cevap: "Hayır, kuşlar Aves (Kuşlar) sınıfındandır.", aciklama: "Kuşlar yumurtlayarak ürer ve vücutları tüylerle kaplıdır; yavrularını sütle beslemezler. Evrimsel olarak sürüngenlere, özellikle dinozorlara çok daha yakındırlar." },
  { kategori: "Hayvanlar Alemi", soru: "Uyurken farkında olmadan yılda ortalama 8 örümcek mi yutarız?", cevap: "Hayır, bu internetin uydurduğu bir yalandır.", aciklama: "Örümcekler karanlık ve sessiz yerleri severler; nefes alan, horlayan ve hareket eden bir insanın ağzı onlar için tehlike çanları çalan korkunç bir yerdir. Hiçbir örümcek oraya bilerek girmez." },
  { kategori: "Hayvanlar Alemi", soru: "Gergedan boynuzu kemikten mi oluşur?", cevap: "Hayır, keratinden oluşur.", aciklama: "Gergedanların boynuzu, saçlarımız ve tırnaklarımızı oluşturan keratin maddesinin çok sıkı bir şekilde birleşmesinden oluşur; içinde kemik veya fildişi benzeri bir yapı yoktur." },
  { kategori: "Hayvanlar Alemi", soru: "Kurbağalara veya karakurbağalarına dokunmak elde siğil çıkarır mı?", cevap: "Hayır, siğiller insan virüslerinden kaynaklanır.", aciklama: "Siğiller İnsan Papilloma Virüsü (HPV) nedeniyle oluşur. Kurbağaların sırtındaki siğile benzeyen kabartılar aslında yırtıcıları uzak tutmak için zehir salgılayan bezlerdir." },
  { kategori: "Hayvanlar Alemi", soru: "Lemmingler (bir kemirgen türü) sürüler halinde uçurumdan atlayarak toplu intihar mı eder?", cevap: "Hayır, bu bir Disney belgeseli uydurmasıdır.", aciklama: "1958 yapımı 'White Wilderness' adlı Disney belgeselinde yapımcılar dramatik bir sahne yaratmak için hayvanları kasıtlı olarak uçurumdan nehre doğru itmişlerdir. Lemmingler intihar etmez." },
  { kategori: "Hayvanlar Alemi", soru: "Uzunbacaklar (Daddy Longlegs) dünyanın en zehirli örümcekleri midir?", cevap: "Hayır, örümcek bile değillerdir ve zehirleri yoktur.", aciklama: "Evlerde köşelerde sallanan uzunbacaklar, örümceğimsiler sınıfından olan Opiliones takımıdır. İnsan derisini delecek dişleri yoktur ve zehir bezi taşımazlar." },
  { kategori: "Hayvanlar Alemi", soru: "Köpeklerin ağzı insan ağzından daha mı temizdir?", cevap: "Hayır, ikisi de farklı ve yoğun bakteriler barındırır.", aciklama: "Köpeklerin ağzı temiz değildir, sadece içlerindeki bakterilerin türü insanlardan farklıdır. Bir köpeğin ağzı çöp, dışkı ve diğer köpekleri yalamakla dolu; asla steril değildir." },
  { kategori: "Hayvanlar Alemi", soru: "Timsahlardan kurtulmak için zikzak çizerek kaçmak işe yarar mı?", cevap: "Hayır, timsahlar kısa mesafede oldukça hızlıdır.", aciklama: "Timsahlar kısa mesafede saatte 17 kilometre hıza kadar koşabilirler. Zikzak çizmek yerine dümdüz ve olabildiğince hızlı kaçmanız önerilir." },
  { kategori: "Hayvanlar Alemi", soru: "Yarasalar insanların saçına dolanır veya kanını mı emer?", cevap: "Hayır, çok gelişmiş sonarları sayesinde insanlara çarpmazlar.", aciklama: "Dünyadaki 1400'den fazla yarasa türünün sadece üçü kanla beslenir ve onlar da inek veya kuş gibi hayvanları tercih eder. Yarasalar insanlardan uzak durmayı seçerler." },
  { kategori: "Hayvanlar Alemi", soru: "Filler suyu doğrudan hortumlarından içeri çekerek mi içer?", cevap: "Hayır, hortumlarına çektikleri suyu ağızlarına boşaltarak içerler.", aciklama: "Eğer hortumdan doğrudan içselerdi sular ciğerlerine gider ve boğulurlardı. Hortumlarına çektikleri suyu, daha sonra kendi ağızlarına boşaltarak içerler." },
  { kategori: "Hayvanlar Alemi", soru: "Kirpiler tehlike anında oklarını (dikenlerini) fırlatabilir mi?", cevap: "Hayır, fırlatamazlar.", aciklama: "Kirpilerin dikenleri sadece onlara doğrudan dokunulduğunda derilerinden kopup avcının derisine saplanır. Silah gibi uzağa ateşleme yetenekleri yoktur." },
  { kategori: "Hayvanlar Alemi", soru: "Koalalar sevimli bir ayı türü müdür?", cevap: "Hayır, ayılarla hiçbir akrabalıkları yoktur.", aciklama: "'Koala ayısı' yanlış bir isimlendirmedir. Koalalar, kangurular gibi yavrularını keselerinde büyüten keseliler (marsupial) grubuna ait hayvanlardır." },
  { kategori: "Hayvanlar Alemi", soru: "Flamingolar yumurtadan çıktıklarında pembe midir?", cevap: "Hayır, gri ve beyaz renkte doğarlar.", aciklama: "Flamingoların tüyleri doğuştan soluk gridir. Büyüdükçe diyetlerindeki karides ve alglerden aldıkları beta-karoten sayesinde tüyleri pembeye döner." },
  { kategori: "Hayvanlar Alemi", soru: "Köpekbalıkları hayatta kalmak için hiç durmadan yüzmek zorunda mıdır?", cevap: "Sadece bazı türleri, hepsi değil.", aciklama: "Büyük beyaz veya Mako gibi bazı türler solungaçlarından su geçirmek için yüzmek zorundadır. Ancak pek çok köpekbalığı türü yanak kaslarını pompalayarak deniz dibinde hareketsiz dinlenebilir." },
  { kategori: "Hayvanlar Alemi", soru: "Kelebeklerin ömrü sadece 1 gün müdür?", cevap: "Hayır, türüne göre haftalarca veya aylarca yaşarlar.", aciklama: "Hiçbir kelebek sadece 1 gün yaşamaz. Örneğin Monark kelebeği kış uykusuna yattığında 8 aya kadar yaşayabilir. 1 gün yaşayan canlı, kelebek değil Mayıs sineğidir." },
  { kategori: "Hayvanlar Alemi", soru: "Arılar birini soktuktan sonra mutlaka ölür mü?", cevap: "Sadece işçi bal arıları ölür.", aciklama: "İşçi bal arılarının iğneleri kancalıdır ve insan derisine saplandığında geri çıkamaz. Yaban arıları, eşek arıları ve kraliçe arıların iğneleri düzdür, defalarca sokabilirler." },
  { kategori: "Hayvanlar Alemi", soru: "Solucanlar yağmur yağınca suda boğulmamak için mi toprak yüzeyine çıkar?", cevap: "Hayır, daha hızlı seyahat etmek için çıkarlar.", aciklama: "Toprak solucanları ciltleri aracılığıyla nefes alırlar ve suda boğulmadan günlerce yaşayabilirler. Islak zemin, kurumadan uzun mesafelere göç etmelerine olanak tanır." },
  { kategori: "Hayvanlar Alemi", soru: "Penguenler sadece Antarktika'da mı yaşar?", cevap: "Hayır, ekvatorda yaşayan türleri de vardır.", aciklama: "Penguen türlerinin çoğu Antarktika dışında (Güney Amerika, Afrika, Avustralya) yaşar. Hatta Galapagos Pengueni doğrudan sıcak ve tropik Ekvator çizgisi üzerinde yaşar." },
  { kategori: "Hayvanlar Alemi", soru: "Tuzlu su balıkları hiç su içer mi?", cevap: "Evet, hem de sürekli su içerler.", aciklama: "Tuzlu su balıkları, çevrelerindeki su kendilerinden daha tuzlu olduğu için ozmoz yoluyla sürekli su kaybederler. Kurumamak için sürekli deniz suyu içer ve fazla tuzu solungaçlarından atarlar." },
  { kategori: "Uzay & Astronomi", soru: "Evrenin fiziksel bir merkezi var mıdır?", cevap: "Hayır, evrenin bir merkezi yoktur.", aciklama: "Büyük Patlama (Big Bang) belirli bir noktada değil, her yerde aynı anda gerçekleşti. Evren her yöne doğru eşit şekilde genişler, bu yüzden hiçbir noktanın merkezi olma özelliği yoktur." },
  { kategori: "Uzay & Astronomi", soru: "Güneş yandığı için mi çok sıcak ve parlaktır?", cevap: "Hayır, Güneş'te herhangi bir ateş veya yanma yoktur.", aciklama: "Ateşin yanması için oksijen gerekir, uzayda oksijen yoktur. Güneş'in enerjisi nükleer füzyon ile hidrojenin helyuma dönüşmesi sonucu açığa çıkar; kimyasal bir ateş değildir." },
  { kategori: "Uzay & Astronomi", soru: "Mars ile Jüpiter arasındaki Asteroit Kuşağı, uzay gemileri için filmlerdeki gibi tehlikeli ve kalabalık mıdır?", cevap: "Hayır, asteroitler birbirinden milyonlarca kilometre uzaktadır.", aciklama: "Bilim kurgu filmlerinin aksine, asteroit kuşağı o kadar boştur ki oradan geçen bir uzay aracının herhangi bir kayaya çarpma ihtimali milyarda birdir." },
  { kategori: "Uzay & Astronomi", soru: "Yıldız kayması gökyüzünde gerçekten bir yıldızın düşmesi midir?", cevap: "Hayır, atmosfere girip yanan küçük uzay taşlarıdır.", aciklama: "Gökyüzünde hızla geçen ışık izleri, genellikle kum tanesi veya çakıl büyüklüğündeki göktaşlarının Dünya atmosferine büyük bir hızla girip sürtünmeden yanmasıdır." },
  { kategori: "Bilim & Fizik", soru: "Mevsimler, Dünya'nın yörüngesinde Güneş'e yaklaşıp uzaklaşmasıyla mı oluşur?", cevap: "Hayır, Dünya'nın eksen eğikliği nedeniyle oluşur.", aciklama: "Eğer uzaklıkla ilgili olsaydı, tüm dünyada aynı anda yaz olurdu. Dünya'nın 23,5 derecelik eksen eğikliği, yılın farklı zamanlarında yarımkürelerin farklı açılarla güneş ışığı almasını sağlar." },
  { kategori: "Bilim & Fizik", soru: "Bulutlar havada uçtuğu için ağırlıksız pamuk yığınları mıdır?", cevap: "Hayır, ortalama bir bulut yüzlerce ton ağırlığındadır.", aciklama: "Bulutlar su damlacıkları ve buz kristallerinden oluşur. Sıradan görünümlü bir kümülüs bulutunun içindeki suyun toplam ağırlığı 500.000 kilogramı (yaklaşık 100 fil ağırlığını) bulabilir." },
  { kategori: "Uzay & Astronomi", soru: "Uzayda hiçbir şekilde ses yayılamaz ve tamamen sessiz midir?", cevap: "Uzay vakumdur ama dev gaz bulutlarında ses vardır.", aciklama: "Sesin yayılması için atomların titreşeceği bir ortam gerekir. Uzay boşluğunda ses yoktur, ancak galaksiler arası gaz ve toz bulutlarının (nebula) içinde ses dalgaları yayılabilir." },
  { kategori: "Uzay & Astronomi", soru: "Kara delikler gerçekten uzay dokusunda açılmış birer 'delik' midir?", cevap: "Hayır, aşırı yoğunlaşmış kütleli nesnelerdir.", aciklama: "Kara delikler boşluk veya delik değildir. Ölen dev yıldızların kütlelerinin, yerçekimi kendi üzerine çökerek bir iğne ucu kadar küçük bir alana sıkışmasıyla oluşan süper yoğun nesnelerdir." },
  { kategori: "Bilim & Fizik", soru: "Yıldırımlar her zaman gökyüzünden yere doğru mu çakar?", cevap: "Hayır, en parlak kısımları yerden göğe doğru çıkar.", aciklama: "Önce buluttan yere zayıf, görünmez bir elektrik kanalı iner. Ancak gördüğümüz o devasa ve parlak şimşek (dönüş vuruşu), yerden buluta doğru çok büyük bir hızla tırmanır." },
  { kategori: "Coğrafya", soru: "Dünyadaki tüm çöller sıcaklık ve kumdan mı ibarettir?", cevap: "Hayır, çöl olması için sadece kurak olması yeterlidir.", aciklama: "Bir yerin çöl sayılması için yıllık yağış oranının 250 milimetrenin altında olması gerekir. Sıcaklık şart değildir; Antarktika ve Gobi Çölü buzul ve soğuk çöllerdir." },
  { kategori: "Coğrafya & Gizem", soru: "Bermuda Üçgeni'nde diğer bölgelere göre daha fazla mı gemi ve uçak kaybolur?", cevap: "Hayır, istatistiksel olarak tamamen normaldir.", aciklama: "Bermuda Üçgeni, dünyanın en yoğun deniz ve hava trafiğine sahip rotalarından biridir. Kayıp olaylarının trafiğe oranı, okyanusun herhangi bir yerindeki kayıp oranıyla aynıdır." },
  { kategori: "Bilim & Fizik", soru: "Pusulalar her zaman tam olarak Kuzey Kutbu'nu (Coğrafi Kuzeyi) mu gösterir?", cevap: "Hayır, Manyetik Kuzey'i gösterirler.", aciklama: "Pusula ibresi, dünyanın manyetik alan çizgilerini takip eder. Manyetik kuzey kutbu ile haritalardaki gerçek coğrafi kuzey kutbu aynı yer değildir ve manyetik kuzey her yıl yer değiştirir." },
  { kategori: "Tarihi Yanılgılar", soru: "Amerika kıtasını ilk keşfeden kişi Kristof Kolomb mudur?", cevap: "Hayır, ondan 500 yıl önce Vikingler ulaşmıştır.", aciklama: "Kolomb'dan beş yüzyıl önce, Leif Erikson liderliğindeki Vikingler Kanada'nın doğu kıyılarına ulaşmış ve yerleşim kurmuştur. Zaten kıtada binlerce yıldır yerli halklar yaşıyordu." },
  { kategori: "Tarihi Yanılgılar", soru: "Salem Cadı Mahkemeleri'nde suçlanan kadınlar direklere bağlanıp yakılarak mı öldürüldü?", cevap: "Hayır, Amerika'da hiç kimse cadı diye yakılmadı.", aciklama: "Avrupa'da cadı yakma yaygındı, ancak Salem olaylarında suçlu bulunan 20 kişinin 19'u asılarak, 1 kişi ise üzerine ağır taşlar konularak ezilmek suretiyle idam edilmiştir." },
  { kategori: "Kültür & Köken", soru: "Beyzbol sporunu Amerikalı Abner Doubleday mı icat etmiştir?", cevap: "Hayır, bu İngiliz kökenli bir oyundur.", aciklama: "Doubleday'in beyzbolu icat ettiği efsanesi, sporu tamamen Amerikan yapmak için uydurulmuştur. Beyzbol, İngiltere'de çok eskiden beri oynanan 'rounders' ve 'cricket' benzeri oyunlardan evrilmiştir." },
  { kategori: "Kültür & Köken", soru: "Amerika'daki ilk Şükran Günü yemeğinde ana menü hindi miydi?", cevap: "Büyük ihtimalle hayır.", aciklama: "1621'deki kutlamada ana et kaynağı geyik eti, ördek, kaz ve ıstakoz gibi deniz ürünleriydi. Hindi çok sonraları sembol haline gelmiştir." },
  { kategori: "Tarihi Yanılgılar", soru: "Paul Revere atıyla 'İngilizler geliyor!' diye bağırarak mı uyarmıştır?", cevap: "Hayır, görev gizliydi ve bağırmamıştır.", aciklama: "Görevleri gizli olduğu için köy köy bağırarak dolaşmak yerine yerel milis liderlerini sessizce uyararak ilerlemişlerdir. Ayrıca yola çıkan tek kişi de değildi." },
  { kategori: "Tarihi Yanılgılar", soru: "Amerikan Bağımsızlık Bildirgesi 4 Temmuz 1776'da mı imzalanmıştır?", cevap: "Hayır, 4 Temmuz'da sadece onaylanmıştır.", aciklama: "Bildirge metni 4 Temmuz'da kabul edildi, ancak resmi kopyasının hazırlanıp delegelerin büyük çoğunluğunun imza atması 2 Ağustos 1776'yı bulmuştur." },
  { kategori: "Tarihi Yanılgılar", soru: "Abraham Lincoln'ün Özgürlük Bildirgesi Amerika'daki tüm köleleri mi serbest bırakmıştır?", cevap: "Hayır, sadece güneydeki isyancı eyaletleri kapsıyordu.", aciklama: "1863 tarihli bildirge yalnızca Konfedere eyaletlerindeki köleleri özgür ilan etmiştir. Birliğe sadık kalan bazı eyaletlerde kölelik savaş sonrasına kadar devam etmiştir." },
  { kategori: "Tarihi Yanılgılar", soru: "ABD'nin ilk başkanı George Washington'ın takma dişleri tahtadan mı yapılmıştı?", cevap: "Hayır, fildişi ve insan dişlerinden yapılmıştı.", aciklama: "Washington'ın diş protezleri tahtadan değil; altın tellerle tutturulmuş hipopotam dişi, fildişi ve insan dişlerinden yapılmıştı. Şarap lekeleri protezi tahta gibi gösteriyordu." },
  { kategori: "Tarihi Yanılgılar", soru: "Jül Sezar suikaste uğrayıp ölürken son sözleri 'Sen de mi, Brütüs?' mü olmuştur?", cevap: "Büyük ihtimalle sessizce ölmüştür.", aciklama: "'Et tu, Brute?' sözü, Shakespeare'in tiyatro oyununda yarattığı bir repliktir. Tarihi kaynaklar Sezar'ın cübbesini yüzüne çekerek direnmeyi bıraktığını söyler." },
  { kategori: "Tarihi Yanılgılar", soru: "Mısır Kraliçesi Kleopatra etnik olarak Mısırlı mıydı?", cevap: "Hayır, kökeni Antik Yunan'a dayanır.", aciklama: "Kleopatra, Büyük İskender'in generallerinden I. Ptolemaios'un kurduğu Makedon-Yunan hanedanına mensuptu. Mısır kültürünü benimsese de kan bağı Yunan'dı." },
  { kategori: "Tarihi Yanılgılar", soru: "Roma büyük bir yangınla kül olurken İmparator Neron keman mı çalıyordu?", cevap: "Keman henüz icat edilmemişti ve o Roma'da değildi.", aciklama: "Büyük Roma yangını (MS 64) sırasında keman icat edilmemişti. Neron yangın başladığında Antium'daydı ve haberi alınca kurtarma çalışmaları için hızla Roma'ya dönmüştür." },
  { kategori: "Tarihi Yanılgılar", soru: "Makarnayı İtalya'ya Çin seyahatinden dönen Marco Polo mu getirmiştir?", cevap: "Hayır, İtalyanlar makarnayı çok daha önceden biliyordu.", aciklama: "Marco Polo'nun Asya'dan makarnayı getirdiği efsanesi bir Amerikan ticaret dergisi tarafından uydurulmuştur. Marco Polo doğmadan önce de Sicilya ve İtalya'da makarna benzeri yiyecekler tüketiliyordu." },
  { kategori: "Tarihi Yanılgılar", soru: "Ferdinand Magellan, dünyanın etrafını tam tur dolaşan ilk kişi midir?", cevap: "Hayır, yolculuğu tamamlayamadan ölmüştür.", aciklama: "Magellan seferi başlatsa da Filipinler'deki bir savaşta öldürülmüştür. Dünyanın etrafındaki ilk tam turu tamamlayan kişi, yardımcısı Juan Sebastián Elcano'dur." },
  { kategori: "Tarihi Yanılgılar", soru: "Termopylae Savaşı'nda 300 Spartalı, Pers ordusuna tamamen tek başlarına mı savaştı?", cevap: "Hayır, yanlarında binlerce başka asker vardı.", aciklama: "300 Spartalı en seçkin gruptu ancak yanlarında Thespialılar, Thebaililer ve diğer Yunan şehir devletlerinden gelen yaklaşık 6.000-7.000 kişilik müttefik ordusu da bulunuyordu." },
  { kategori: "Tarihi Yanılgılar", soru: "Mussolini faşist İtalya'da en azından 'trenlerin zamanında kalkmasını' mı sağladı?", cevap: "Hayır, bu sadece bir faşist propagandasıydı.", aciklama: "Ulaşım sistemini düzelten yatırımlar Mussolini'den önce yapılmıştı. Onun döneminde trenler yine sık sık gecikiyordu ancak sıkı sansür sistemi kusursuzmuş gibi yansıtılmasını sağladı." },
  { kategori: "Sanat & Efsaneler", soru: "Mona Lisa tablosu çizildiği günden beri dünyanın en meşhur eseri miydi?", cevap: "Hayır, 1911'de çalınana kadar sıradan bir tabloydu.", aciklama: "Mona Lisa, sanat eleştirmenleri dışında pek bilinmiyordu. 1911'de Louvre'dan çalınıp iki yıl boyunca gazetelerin manşetlerini süsleyince küresel bir ikon haline gelmiştir." },
  { kategori: "İnsan Anatomisi", soru: "Yetişkinlerde ölen beyin hücreleri (nöronlar) bir daha asla yenilenmez mi?", cevap: "Hayır, beyin yeni hücreler üretebilir.", aciklama: "Günümüzde 'Nörogenez' adlı süreç sayesinde beynin hipokampus gibi belirli bölgelerinin yaşam boyu yeni sinir hücreleri ürettiği kanıtlanmıştır." },
  { kategori: "Sağlık & Efsaneler", soru: "Yaraları havaya bırakmak veya kabuğunu koparmak daha hızlı mı iyileştirir?", cevap: "Hayır, yaralar nemli ortamda daha hızlı iyileşir.", aciklama: "Kabuk bir yara bandı görevi görür. Onu koparmak iyileşen hücreleri yırtar ve iz bırakır. Yarayı hafif nemli tutup örtmek, kurutup kabuklaştırmaktan çok daha etkilidir." },
  { kategori: "Sağlık & Efsaneler", soru: "Günde 10.000 adım atmak, bilimsel bir sağlık zorunluluğu mudur?", cevap: "Hayır, tamamen bir pazarlama kampanyasıdır.", aciklama: "1964 Tokyo Olimpiyatları öncesinde, bir Japon firması '10.000 Adım Ölçer' adlı bir pedometre satmak için bu rakamı uydurmuştur. Bilimsel bir sınırı olmasa da hareket etmek elbette faydalıdır." },
  { kategori: "Sağlık & Efsaneler", soru: "Şizofreni hastaları, çift karakterli (bölünmüş çoklu kişilik) insanlar mıdır?", cevap: "Hayır, şizofreni gerçeklikten kopuştur, kişilik bölünmesi değildir.", aciklama: "Şizofreni, halüsinasyonlar ve sanrılarla seyreden gerçeklik algısının bozulmasıdır. Birden fazla karaktere sahip olma durumu 'Dissosiyatif Kimlik Bozukluğu'dur." },
  { kategori: "Gıda & Beslenme", soru: "C vitamini en çok portakal ve mandalinada mı bulunur?", cevap: "Hayır, kırmızı biber ve kuşburnunda çok daha fazladır.", aciklama: "C vitamini denince akla portakal gelse de; kırmızı kapya biber, brokoli, kuşburnu ve kivi, porsiyon başına portakaldan çok daha yüksek oranda C vitamini içerir." },
  { kategori: "Etimoloji", soru: "'Eskimo' kelimesi 'çiğ et yiyenler' anlamına gelen aşağılayıcı bir terim midir?", cevap: "Büyük ihtimalle hayır, anlamı 'kar ayakkabısı ören' demektir.", aciklama: "Dilbilimciler Eskimo kelimesinin yerel Algonkin dillerinden geldiğini ve büyük ihtimalle 'kar ayakkabısı ağı ören kişi' veya 'farklı dil konuşan kişi' anlamına geldiğini düşünmektedir." },
  { kategori: "Dil & Kültür", soru: "İnuitlerin dillerinde 'kar' için 100'den fazla farklı kelime mi vardır?", cevap: "Hayır, dillerinin dilbilgisi yapısından kaynaklanan bir yanılsamadır.", aciklama: "İnuit dilleri kelime köklerine sürekli ekler getirerek tek ve çok uzun kelimeler oluşturur. İngilizce veya Türkçedeki kelime mantığıyla bakıldığı için böyle bir efsane doğmuştur." },
  { kategori: "İcatlar & Teknolojiler", soru: "QWERTY klavye dizilimi, insanların daha hızlı yazmasını sağlamak için mi icat edilmiştir?", cevap: "Hayır, tam tersine daktiloyu yavaşlatmak için tasarlanmıştır.", aciklama: "Eski mekanik daktilolarda hızlı yazıldığında harf çubukları birbirine çarpıp sıkışıyordu. QWERTY, sık kullanılan harfleri birbirinden uzağa yerleştirerek yazım hızını yavaşlatmak için yapılmıştır." },
  { kategori: "Etimoloji", soru: "Denizcilikteki acil durum sinyali 'SOS', 'Save Our Souls' anlamına mı gelir?", cevap: "Hayır, hiçbir şeyin kısaltması değildir.", aciklama: "SOS harfleri, Mors alfabesinde hatırlanması ve ayırt edilmesi en kolay ritim olduğu için (3 kısa, 3 uzun, 3 kısa sinyal) rastgele seçilmiştir. Sonradan anlam uydurulmuştur." },
  { kategori: "Kültür & Köken", soru: "Uzak Doğu dövüş sanatlarında siyah kuşak almak 'en üst düzey ustalık' mı demektir?", cevap: "Hayır, sadece 'temel seviyeyi bitirdiniz' anlamına gelir.", aciklama: "Siyah kuşak (Shodan), öğrencinin temel tekniklerde uzmanlaştığını gösterir. Yani bir son değil, asıl eğitimin başlangıcıdır." },
  { kategori: "Tarihi Yanılgılar", soru: "Restoranlarda gördüğümüz şişman, göbekli ve neşeli heykel Buda mıdır?", cevap: "Hayır, o heykel gerçek Buda değildir.", aciklama: "Asıl Buda, Hindistan'da yaşamış zayıf ve çilekeş bir bilgendi. Restoranlardaki o şişman ve kel figür, 'Budai' veya 'Hotei' adındaki Çinli bir halk kahramanı ve rahiptir." },
  { kategori: "Tarih & Din", soru: "Kutsal kitaplara göre Adem ile Havva'nın Cennet'te yediği yasak meyve kesinlikle bir elma mıydı?", cevap: "Kutsal kitaplarda meyvenin türü asla belirtilmez.", aciklama: "Kutsal metinlerde sadece 'meyve' veya 'ağaç' denir. Elma efsanesi, Latince'de kötülük anlamına gelen 'malum' kelimesinin aynı zamanda 'elma' anlamına gelmesinden doğan sanatsal çevirilerden kaynaklanır." },
  { kategori: "Tarih & Din", soru: "Kutsal kitaplarda bebek İsa'yı ziyaret eden tam 'üç' bilge adam olduğu mu yazar?", cevap: "Hayır, bilge adamların sayısı asla belirtilmemiştir.", aciklama: "Metinlerde sadece altın, günnük ve mürden oluşan 'üç hediye' verildiği yazar. Hediyelerin üç tane olmasından yola çıkılarak geleneksel olarak üç bilge adam oldukları varsayılmıştır." },
  { kategori: "Hukuk & Efsaneler", soru: "Kayıp kişi ihbarı için üzerinden en az 24 saat geçmesini beklemek şart mıdır?", cevap: "Hayır, anında polise başvurulmalıdır.", aciklama: "Filmlerde sıkça işlenen bu '24 saat bekleme' kuralı tamamen bir kurgudur. Gerçekte çocuk, yaşlı veya tehlike altındaki kişilerin kayıplarında ilk 24 saat en kritik zamandır." },
  { kategori: "Hukuk & Efsaneler", soru: "Gizli görevdeki bir polise 'Polis misin?' diye sorarsanız yasalar gereği doğruyu söylemek zorunda mıdır?", cevap: "Hayır, kimliğini saklamak için yalan söyleyebilir.", aciklama: "Gizli polisler sorulduğunda kimliklerini açıklamak zorunda olsalardı, hiçbir suç çetesine veya gizli operasyona sızamazlardı. Yasal olarak böyle bir mecburiyetleri yoktur." },
  { kategori: "Hukuk & Efsaneler", soru: "Polis sorgusunda 'susma hakkını' kullanmak, yasal olarak suçu kabul ettiği anlamına mı gelir?", cevap: "Hayır, sessizlik suç itirafı veya kanıtı olamaz.", aciklama: "Modern hukuk sistemlerinde kişinin kendi aleyhine tanıklık etmeme ve susma hakkı anayasal bir güvencedir. Konuşmayı reddetmek mahkemede suçlu olduğuna dair delil olarak kullanılamaz." },
  { kategori: "Sağlık & Efsaneler", soru: "Güneş yanıklarına veya sıcak yanıklarına diş macunu sürmek acıyı alır mı?", cevap: "Hayır, yaranın ısıyı hapsetmesine ve tahriş olmasına yol açar.", aciklama: "Diş macunundaki nane anlık bir serinlik hissi verse de, içindeki kimyasallar hasarlı deriyi daha çok yakar ve macun tabakası ısının dışarı çıkmasını engelleyerek yanığı derinleştirir." },
  { kategori: "İnsan Anatomisi", soru: "Spor bırakıldığında kaslar yağa mı dönüşür?", cevap: "Hayır, kas ve yağ tamamen farklı iki doku türüdür.", aciklama: "Kas hücreleri yağ hücrelerine dönüşemez. Spor bırakıldığında kaslar küçülür (atrofi) ve hareketsizlik yüzünden alınan kaloriler yağ hücrelerini şişirir." },

  // Batch 9 — 50 yeni kart
  { kategori: "Gıda & Beslenme", soru: "Mikrodalga fırınlar yemeği içten dışa doğru mu pişirir?", cevap: "Hayır, tam tersine dıştan içe doğru pişirir.", aciklama: "Mikrodalga ışınları yemeğin sadece dışındaki 1-2 santimetrelik kısmına nüfuz eder. İç kısımlar, dıştaki bu sıcaklığın içeriye iletilmesiyle (kondüksiyon yoluyla) yavaşça pişer." },
  { kategori: "Bilim & Fizik", soru: "Okyanuslar, gökyüzünün mavi rengini yansıttığı için mi mavidir?", cevap: "Hayır, suyun kendisi devasa kütlelerde mavidir.", aciklama: "Su molekülleri, güneş ışığındaki kırmızı ve turuncu gibi uzun dalga boylu renkleri emer. Geriye kalan mavi ışığı yansıttığı için büyük su kütleleri gözümüze mavi görünür." },
  { kategori: "İnsan Anatomisi", soru: "Körbağırsağın (apandis) vücudumuzda hiçbir işlevi yok mudur?", cevap: "Hayır, bağışıklık sistemimiz için önemlidir.", aciklama: "Uzun süre evrimsel bir artık sanılsa da, körbağırsağın faydalı bağırsak bakterileri için bir 'sığınak' görevi gördüğü keşfedilmiştir. İshal gibi durumlarda bağırsağı yeniden faydalı bakterilerle doldurur." },
  { kategori: "Tarihi Yanılgılar", soru: "Romalıların ziyafetlerde kullandığı 'Vomitorium' adında özel odalar var mıydı?", cevap: "Hayır, 'Vomitorium' sadece stadyum koridorlarına verilen bir isimdi.", aciklama: "Latince 'hızla boşaltmak' kökünden gelen bu kelime, binlerce izleyicinin amfitiyatroları hızla terk etmesini sağlayan geniş çıkış kapıları ve tahliye koridorları için kullanılırdı." },
  { kategori: "Tarihi Yanılgılar", soru: "Vahşi Batı'da kovboylar sık sık sokak ortasında silah çekip düello mu yapardı?", cevap: "Hayır, bu tamamen Hollywood filmlerinin bir uydurmasıdır.", aciklama: "Gerçek Vahşi Batı kasabalarının çoğunda sivillerin silah taşıması kesinlikle yasaktı. Silahlı çatışmalar son derece nadir olaylardı ve kanunlar tarafından sertçe cezalandırılırdı." },
  { kategori: "Hayvanlar Alemi", soru: "Tüm kutup ayıları solak mıdır?", cevap: "Hayır, böyle bir tercihleri yoktur.", aciklama: "Bu popüler bir efsane olsa da, kutup ayılarını gözlemleyen bilim insanları onların avlanırken veya yürürken her iki patilerini de eşit şekilde kullandıklarını kanıtlamıştır." },
  { kategori: "Hayvanlar Alemi", soru: "Fillerin farelerden korktuğu doğru mudur?", cevap: "Hayır, fillerin farelere özel bir fobisi yoktur.", aciklama: "Filler sadece görüş alanlarına aniden giren küçük ve hızlı hareket eden her türlü nesneden irkilirler. Farelerden korktukları efsanesi çizgi filmlerin bir yansımasıdır." },
  { kategori: "Evcil Hayvanlar", soru: "Kediler sadece mutlu ve huzurlu olduklarında mı mırıldar?", cevap: "Hayır, stresliyken veya acı çekerken de mırıldarlar.", aciklama: "Mırıldanmak kediler için bir iletişim ve kendini sakinleştirme yöntemidir. Korktuklarında, yaralandıklarında veya doğum yaparken de kendilerini rahatlatmak için mırıldandıkları bilinmektedir." },
  { kategori: "Gıda & Beslenme", soru: "Organik tarımla üretilen gıdalarda hiçbir şekilde tarım ilacı kullanılmaz mı?", cevap: "Hayır, organik tarımda da ilaçlama yapılır.", aciklama: "Organik tarım sadece 'sentetik' kimyasalları yasaklar. Bunun yerine bazen çevreye sentetiklerden daha çok zarar verebilen doğal kaynaklı tarım ilaçları (örneğin bakır sülfat) kullanılır." },
  { kategori: "Sağlık & Efsaneler", soru: "Ayak tabanına yapıştırılan 'detoks bantları' gece boyunca toksinleri mi emer?", cevap: "Hayır, banttaki renk değişimi basit bir kimyasal reaksiyondur.", aciklama: "Bantların içindeki odun sirkesi gibi maddeler, ayağın gece salgıladığı terle ve ısıyla temas ettiğinde reaksiyona girerek koyu bir renk alır. Toksinle ilgisi yoktur." },
  { kategori: "Gıda & Beslenme", soru: "Çiğ yumurta içmek, pişmiş yumurtaya göre kaslar için daha fazla protein sağlar mı?", cevap: "Hayır, vücudumuz pişmiş yumurtadan çok daha fazla protein alır.", aciklama: "Çiğ yumurta içildiğinde vücudumuz proteinin sadece %50'sini sentezleyebilir. Yumurta pişirildiğinde protein yapısı değişir ve vücut proteinin %90'ından fazlasını kolayca emer." },
  { kategori: "Kültür & Köken", soru: "Fransız tostu (French toast) Fransa'da mı icat edilmiştir?", cevap: "Hayır, kökeni Fransa'dan çok daha eskidir.", aciklama: "Bayat ekmeği yumurtaya bulayıp kızartma fikri, M.S. 4. yüzyıla, Roma İmparatorluğu'na kadar uzanır. Fransa'dan çok önce Avrupa'nın her yerinde yapılan bir tarifti." },
  { kategori: "Bilim & Fizik", soru: "Radyoaktif maddeler filmlerdeki gibi etrafa yeşil fosforlu bir ışık mı saçar?", cevap: "Hayır, radyasyon tamamen görünmezdir.", aciklama: "Gerçek dünyada radyoaktif elementler karanlıkta parlamazlar. Geçmişte saat kadranlarının parlaması için radyuma fosforlu boyalar eklenirdi; parlayan şey radyasyon değil, boyanın kendisiydi." },
  { kategori: "Uzay & Astronomi", soru: "Uzayda bir astronot kalem fırlattığında kalem sonsuza dek dümdüz mü gider?", cevap: "Hayır, kalem de tıpkı astronotlar gibi yörüngede kalır.", aciklama: "ISS, Dünya'nın yerçekimi etkisindedir. Fırlatılan bir kalem gemiyle birlikte Dünya'nın etrafında dönmeye devam eder; dümdüz gitmez." },
  { kategori: "İcatlar & Mucitler", soru: "Matbaayı ilk kez Alman mucit Johann Gutenberg mi icat etmiştir?", cevap: "Hayır, hareketli harflerle baskıyı ilk Asyalılar bulmuştur.", aciklama: "Çinliler ve Koreliler, Gutenberg'den yüzlerce yıl önce kil, ahşap ve metal hareketli harflerle baskı yapıyorlardı. Gutenberg'in başarısı bu sistemi Avrupa'ya uyarlayan bir pres makinesi icat etmesidir." },
  { kategori: "Tarihi Yanılgılar", soru: "Spartalı savaşçılar zayıf doğan bebekleri uçurumdan aşağı mı atardı?", cevap: "Hayır, bu bir Antik Yunan abartısıdır.", aciklama: "Modern arkeolojik kazılar, o meşhur Kaiadas uçurumunun dibinde tek bir bebek kemiği bile bulamamıştır. Sadece yetişkin savaş esirlerinin ve vatan hainlerinin oraya atıldığı kanıtlanmıştır." },
  { kategori: "Tarihi Yanılgılar", soru: "Kleopatra efsanevi, baş döndürücü bir güzelliğe mi sahipti?", cevap: "Hayır, güzelliğiyle değil zekasıyla ünlüydü.", aciklama: "Dönemine ait madeni paralar ve büstler, Kleopatra'nın sıradan bir yüze sahip olduğunu gösterir. Onu Roma generallerine aşık eden şey muazzam karizması, sesi ve politik zekasıydı." },
  { kategori: "İnsan Anatomisi", soru: "Tek yumurta ikizlerinin parmak izleri tamamen aynı mıdır?", cevap: "Hayır, dünyadaki herkesin parmak izi benzersizdir.", aciklama: "İkizlerin DNA'ları %100 aynı olsa da parmak izleri genetik değildir. Bebek anne karnındayken amniyotik sıvının hareketleri ve rahim duvarına temasıyla rastgele şekillenir." },
  { kategori: "Gıda & Beslenme", soru: "Yemekten hemen sonra su içmek mide asidini seyreltip sindirimi bozar mı?", cevap: "Hayır, tam tersine sindirime yardımcı olur.", aciklama: "Su, mide asidinin pH değerini sindirimi engelleyecek kadar değiştiremez. Aksine, yemek sırasında veya sonrasında su içmek yiyeceklerin parçalanmasına ve besinlerin emilimine yardımcı olur." },
  { kategori: "Uzay & Astronomi", soru: "Gökyüzünden düşen göktaşları yere çarptıklarında alev alev yanıyor mu olurlar?", cevap: "Hayır, genellikle buz gibidirler.", aciklama: "Meteor atmosfere girerken dış yüzeyi yanar, ancak bu çok hızlı bir süreçtir. Uzayın dondurucu soğuğunda milyonlarca yıl kalmış iç kısım o kadar soğuktur ki yere çarptığında dışını da hızla soğutur." },
  { kategori: "Hayvanlar Alemi", soru: "Köpekbalıkları okyanus içinde bir damla kanın kokusunu kilometrelerce öteden alabilir mi?", cevap: "Hayır, bu bir Hollywood abartısıdır.", aciklama: "Köpekbalıklarının koku alma duyusu mükemmeldir ancak kokunun onlara ulaşması için okyanus akıntılarıyla taşınması gerekir; bu kilometrelerce mesafede saatler sürer." },
  { kategori: "Hayvanlar Alemi", soru: "Fillerin hafızası o kadar güçlüdür ki hiçbir şeyi asla unutmazlar mı?", cevap: "Hafızaları çok iyidir ancak 'hiç unutmazlar' bir efsanedir.", aciklama: "Filler su kaynaklarını veya sürülerindeki bireyleri uzun yıllar hatırlayabilir. Ancak diğer tüm canlılar gibi onlar da zamanla unutabilir veya hata yapabilirler." },
  { kategori: "Hayvanlar Alemi", soru: "Yılanlar müziği duyup flüt sesine göre mi dans ederler?", cevap: "Hayır, yılanlar havadaki müziği duyamazlar.", aciklama: "Yılanların dış kulakları yoktur. Dans ediyormuş gibi görünmelerinin nedeni, flütü çalan yılan terbiyecisinin el ve enstrüman hareketlerini gözleriyle takip etmeleridir." },
  { kategori: "Bitki Bilimi", soru: "Sinek kapan gibi etobur bitkiler enerjilerini tamamen yuttukları böceklerden mi alırlar?", cevap: "Hayır, asıl enerjilerini güneşten alırlar.", aciklama: "Etobur bitkiler de fotosentez yaparak hayatta kalırlar. Sadece yaşadıkları bataklık topraklar azot ve mineral açısından fakir olduğu için eksik besinleri böcekleri sindirerek tamamlarlar." },
  { kategori: "Gıda & Beslenme", soru: "Her sabah içtiğimiz kahve aslında bir meyvenin çekirdeği midir?", cevap: "Evet, kahve çekirdeği kiraz benzeri kırmızı bir meyvenin tohumudur.", aciklama: "Kahve ağacında kırmızı, kiraza benzeyen tatlı meyveler yetişir. Kahve çekirdeği dediğimiz şey, bu kırmızı meyvelerin tam ortasındaki gerçek meyve çekirdeğidir." },
  { kategori: "Bilim & Teknoloji", soru: "Yolcu uçaklarında kabin basıncı düştüğünde açılan maskeler oksijen tüplerine mi bağlıdır?", cevap: "Hayır, uçaklarda ağır oksijen tüpleri kullanılmaz.", aciklama: "Maskeyi kendinize çektiğinizde küçük bir kimyasal jeneratör devreye girer. Sodyum klorat ve demir tozu kimyasal bir reaksiyona girerek anında saf oksijen üretmeye başlar; bu süreç yaklaşık 15 dakika sürer." },
  { kategori: "Sanat & Efsaneler", soru: "Mona Lisa'nın kaşları, o dönemin modası olduğu için bilerek mi çizilmemiştir?", cevap: "Hayır, aslında kaşları ve kirpikleri vardı.", aciklama: "2007'de yapılan yüksek çözünürlüklü dijital taramalar, Da Vinci'nin Mona Lisa'ya kaş ve kirpik çizdiğini kanıtladı. Yüzyıllar boyunca yapılan temizlik ve restorasyonlar sırasında silinerek yok olmuştur." },
  { kategori: "İcatlar & Teknolojiler", soru: "Apple Mac bilgisayarlara asla virüs bulaşmaz mı?", cevap: "Hayır, onlara da gayet tabii virüs bulaşabilir.", aciklama: "MacOS mimarisi güvenliklidir ancak virüs geçirmez değildir. Mac'lerin virüssüz sanılmasının nedeni, hacker'ların %80 pazar payına sahip Windows kullanıcılarını hedef almayı daha kârlı bulmalarıydı." },
  { kategori: "Bilim & Fizik", soru: "Dünyaya düşen kar tanelerinin her birinin şekli tamamen benzersiz midir?", cevap: "Hayır, tamamen birbirinin aynısı olan kar taneleri vardır.", aciklama: "Kar tanelerinin şekli düşerken karşılaştıkları nem ve sıcaklığa göre değişir. Bilim insanları hem doğada hem laboratuvarda mikroskobik düzeyde tıpatıp aynı ikiz kar taneleri bulmuşlardır." },
  { kategori: "Sağlık & Efsaneler", soru: "Kusursuz bembeyaz dişler her zaman daha sağlıklı olduklarını gösterir mi?", cevap: "Hayır, dişin doğal ve sağlıklı rengi hafif sarımsıdır.", aciklama: "Dişlerin iç kısmındaki 'dentin' tabakası doğal olarak sarıdır ve üzerindeki beyaz mine şeffaflaştıkça bu sarılık görünür. Aşırı beyazlatma işlemleri mineyi zayıflatarak dişi daha sağlıksız hale getirebilir." },
  { kategori: "Hayvanlar Alemi", soru: "Karıncayiyenler sadece karınca yiyerek mi hayatta kalırlar?", cevap: "Hayır, ana diyetlerinde başka canlılar da vardır.", aciklama: "Karıncayiyenler karıncaları sevse de diyetlerinin büyük kısmını termitler (beyaz karıncalar) ve diğer küçük, yumuşak gövdeli böcekler oluşturur." },
  { kategori: "Mutfak Gerçekleri", soru: "Istakozlar kaynar suya atıldıklarında acı çektikleri için mi çığlık sesi çıkarırlar?", cevap: "Hayır, ıstakozların ses telleri veya akciğerleri yoktur.", aciklama: "Duyulan tiz ses, ıstakozun kabuğunun altında hapsolmuş havanın sıcak suyla genleşip kabuktaki deliklerden hızla dışarı kaçarken çıkardığı fiziksel bir sestir." },
  { kategori: "İnsan Anatomisi", soru: "Suda uzun süre kalınca parmakların buruşmasının sebebi derimizin su emmesi midir?", cevap: "Hayır, bu sinir sistemimizin aktif bir tepkisidir.", aciklama: "Beyin ıslak ortamı algılayınca parmak uçlarındaki kan damarlarını daraltır. Bu buruşma, atalarımızın ıslak taşları ve nesneleri kaymadan daha iyi kavramasını sağlamak için evrimleşmiştir." },
  { kategori: "Tarihi Yanılgılar", soru: "Vikingler savaşta öldürdükleri düşmanlarının kafataslarından mı şarap içerlerdi?", cevap: "Hayır, bu korkunç bir çeviri hatasıdır.", aciklama: "17. yüzyılda eski bir İskandinav şiiri Latinceye çevrilirken, 'krani' (boynuzdan yapılan kadeh) kelimesi Latince 'cranium' (kafatası) ile karıştırıldı. Vikingler boynuzdan içerlerdi." },
  { kategori: "Tarih Öncesi", soru: "T-Rex'in görüşü sadece hareket eden nesnelere duyarlıydı, hareketsiz kalırsanız sizi göremez miydi?", cevap: "Hayır, bu sadece Jurassic Park filminin uydurmasıdır.", aciklama: "Fosil analizleri, T-Rex'in devasa göz yuvaları sayesinde günümüzdeki kartallara benzeyen, derinlik algısı mükemmel ve son derece keskin bir görüşe sahip olduğunu kanıtlamıştır." },
  { kategori: "Sağlık & Efsaneler", soru: "Alkol içmek beyin hücrelerini kalıcı olarak öldürüp beyni küçültür mü?", cevap: "Hayır, alkol beyin hücrelerini öldürmez.", aciklama: "Alkol hücreleri öldürmez, ancak nöronların iletişim uzantılarına (dendrit) zarar vererek mesajlaşmayı yavaşlatır. Alkol bırakıldığında bu hasarın büyük kısmı iyileşir." },
  { kategori: "Gıda & Beslenme", soru: "Çikolata yemek bilimsel olarak cinsel isteği (afrodizyak etkisi) artırır mı?", cevap: "Hayır, böyle bir tıbbi kanıt bulunmamaktadır.", aciklama: "Çikolatanın içinde mutluluk hormonu salgılatan maddeler vardır. Ancak bu maddelerin miktarı cinsel dürtüleri fiziksel olarak artıracak veya afrodizyak etkisi yaratacak düzeyde değildir." },
  { kategori: "Bilim & Fizik", soru: "Uçan balonların içindeki helyum gazı yanıcı ve patlayıcı mıdır?", cevap: "Hayır, helyum tamamen reaksiyonsuz ve güvenli bir gazdır.", aciklama: "Hindenburg faciası nedeniyle uçan balon gazlarının patlayıcı olduğu sanılır, ancak o zeplinde helyum değil, yüksek derecede yanıcı olan hidrojen gazı kullanılmıştı." },
  { kategori: "İnsan Anatomisi", soru: "Doğuştan görme engelli olan insanlar sürekli siyah bir karanlık mı görürler?", cevap: "Hayır, siyah renk dahil hiçbir şey görmezler.", aciklama: "Görebilen insanlar gözlerini kapattığında 'siyah' görür, çünkü göz beyne sinyal yollar. Doğuştan görme engellilerde beyne hiçbir görsel veri gitmez; bu durumu anlatmanın en iyi yolu dirseğinizin 'ne gördüğünü' düşünmektir." },
  { kategori: "Coğrafya & Evrim", soru: "Develer evrimsel olarak ilk defa Ortadoğu'nun sıcak çöllerinde mi ortaya çıkmıştır?", cevap: "Hayır, aslında Kuzey Amerika'da ortaya çıkmışlardır.", aciklama: "Devegiller familyasının ilk ataları Kuzey Amerika'da evrimleşti. Milyonlarca yıl önce Bering Boğazı üzerinden Asya ve Afrika'ya, bir kolu da Güney Amerika'ya (Lamalar) göç ederek yayıldılar." },
  { kategori: "Evcil Hayvanlar", soru: "Köpeklerin kendi yaralarını yalamaları tükürükleri sayesinde yarayı iyileştirir mi?", cevap: "Hayır, yarayı çok daha kötü hale getirebilir.", aciklama: "Bir köpeğin ağzında tehlikeli enfeksiyonlara yol açabilecek milyonlarca zararlı bakteri bulunur. Yara yalandıkça nemli kalır ve iyileşmesi gecikir." },
  { kategori: "Bitki Bilimi", soru: "Doğadaki 'zehirli sarmaşık' dokunanlara doğrudan zehir mi enjekte eder?", cevap: "Hayır, sarmaşığın kendisi zehirli değildir.", aciklama: "Bu bitki 'Urushiol' adlı bir yağ salgılar. İnsanların %85'inin bağışıklık sistemi bu masum yağa karşı aşırı alerjik reaksiyon gösterdiği için deride kabarma ve yanmalar meydana gelir." },
  { kategori: "Bilim & Fizik", soru: "Yıldırım düştüğünde arabada güvende olmamızın sebebi lastiklerin kauçuk olması mıdır?", cevap: "Hayır, kauçuk lastiklerin sizi korumada hiçbir rolü yoktur.", aciklama: "Sizi koruyan şey arabanın metal gövdesidir. 'Faraday Kafesi' prensibine göre, yıldırım metal dış kaporta üzerinden akıp toprağa geçer, iç kısımdaki yolculara dokunmaz." },
  { kategori: "İnsan Anatomisi", soru: "Kilo verince yaktığımız yağlar enerjiye veya kasa mı dönüşür?", cevap: "Hayır, yaktığımız yağları aslında nefes vererek atarız.", aciklama: "Vücuttaki yağ parçalandığında karbondioksit ve suya dönüşür. Verdiğiniz kilonun yaklaşık %84'ünü ciğerlerinizden karbondioksit olarak üfleyerek atarsınız, kalanı ter ve idrarla atılır." },
  { kategori: "Tarihi Yanılgılar", soru: "Amerika kıtasına ismini Kristof Kolomb mu vermiştir?", cevap: "Hayır, kıtanın adı Amerigo Vespucci'den gelir.", aciklama: "Kolomb yeni bir kıta keşfettiğini anlayamadı, Hindistan'a ulaştığını sanıyordu. Buranın yepyeni bir kıta olduğunu fark eden İtalyan denizci Amerigo Vespucci olduğu için Alman haritacılar kıtaya onun adını verdi." },
  { kategori: "Bilim & Fizik", soru: "Lazer ışınları boşlukta veya havada filmlerdeki gibi parlayarak mı ilerler?", cevap: "Hayır, lazer ışınları yandan bakıldığında tamamen görünmezdir.", aciklama: "Bir lazer ışığını görebilmeniz için o ışığın duman, toz veya su buharı gibi parçacıklara çarpıp gözünüze geri yansıması gerekir. Temiz havada veya uzay boşluğunda ışın rotası asla görünmez." },
  { kategori: "Gıda & Beslenme", soru: "Çay, kahveye göre her zaman daha mı az kafein içerir?", cevap: "Kuru yaprak bazında çay, kahveden çok daha fazla kafein barındırır.", aciklama: "Ancak demlenme sürecinde bir fincan kahve yapmak için kullanılan çekirdek miktarı, çay yaprağına göre çok daha fazladır. Bu yüzden içtiğimiz bir fincan kahvede daha fazla kafein bulunur." },
  { kategori: "İnsan Anatomisi", soru: "Kör insanların diğer duyuları (örneğin işitme) fiziksel olarak daha mı güçlüdür?", cevap: "Hayır, duyuları fiziksel olarak diğer insanlardan üstün değildir.", aciklama: "Görme engelli bireylerin kulakları daha iyi duymaz. Ancak beyinleri (nöroplastisite sayesinde) görsel verilere harcayacağı enerjiyi sesleri analiz etmeye yönlendirdiği için bilgiyi daha iyi işlerler." },
  { kategori: "Coğrafya & Tarih", soru: "İngiltere'deki Stonehenge anıtını Kelt rahipleri (Druidler) mi inşa etmiştir?", cevap: "Hayır, anıt Keltlerden binlerce yıl önce yapılmıştır.", aciklama: "Stonehenge M.Ö. 3000 ile 2000 yılları arasında Neolitik çağ insanları tarafından inşa edilmiştir. Keltler ise İngiltere'ye çok sonraları, M.Ö. 500 civarında gelmişlerdir." },
  { kategori: "Kültür & Köken", soru: "Ninjaların kullandığı nunçaku aslen ölümcül bir suikast silahı olarak mı icat edilmiştir?", cevap: "Hayır, sadece basit bir tarım aletiydi.", aciklama: "Nunçaku, feodal Japonya'da (Okinawa) çiftçilerin pirinç ve buğday dövmek için kullandığı bir harman aletiydi. Köylülerin kılıç taşıması yasaklanınca tarım aletlerini savunma amacıyla kullanmaya başladılar." },
  { kategori: "Diş Sağlığı", soru: "Dişleri sert fırçalamak daha iyi temizlik mi sağlar?", cevap: "Hayır, sert fırçalamak mineyi aşındırır ve diş etlerini geri çeker.", aciklama: "Dişçiler yumuşak kıllı fırçayla, nazik ve dairesel hareketlerle iki dakika fırçalamayı önerir. Baskı arttıkça temizlik artmaz; aksine mine tabakası zarar görür ve diş eti çekilmesi başlar." },
  { kategori: "Diş Sağlığı", soru: "Şeker yemek dişleri doğrudan çürütür mü?", cevap: "Hayır, asıl suçlu şekeri tüketen ağız bakterileridir.", aciklama: "Ağızdaki Streptococcus mutans bakterileri şekeri metabolize ederek asit üretir ve bu asit mineyi eritir. Şeker doğrudan diş dokusunu değil, bakterileri besler; dişi çürüten asit bakterilerin ürettiğidir." },
  { kategori: "Diş Sağlığı", soru: "Beyazlatıcı diş macunları dişin iç rengini açar mı?", cevap: "Hayır, yalnızca yüzeydeki lekeleri giderir; iç rengi değiştirmez.", aciklama: "Beyazlatıcı macunlardaki aşındırıcılar ve enzimler dişin dış yüzeyindeki (mine) lekeleri temizler. Dentin adı verilen iç tabakanın rengini açmak için diş hekiminin uygulayacağı peroksit bazlı ağartma işlemi gerekir." },
  { kategori: "Diş Sağlığı", soru: "Ağrı yapmayan gömülü yirmilik dişler mutlaka çekilmeli midir?", cevap: "Hayır, sorun yaratmayan gömülü dişler çekilmek zorunda değildir.", aciklama: "Güncel kılavuzlar, ağrı, enfeksiyon veya komşu dişlere zarar verme gibi belirtiler göstermeyen gömülü yirmilik dişlerin rutin olarak çekilmesini önermemektedir. Gereksiz müdahale sinir ve çene hasarı riski taşır." },
  { kategori: "Diş Sağlığı", soru: "Diş taşı temizliği (detartraj) mineyi çizer mi?", cevap: "Hayır, profesyonel aletler mineye zarar verecek sertlikte değildir.", aciklama: "Mine, vücudun en sert dokusu olup diş hekiminin ultrasonik veya el aletlerine karşı son derece dirençlidir. İşlem sonrası hassasiyet, çıkarılan taşın altındaki açıkta kalan dentinden kaynaklanır; mineye verilen hasardan değil." },
  { kategori: "Spor & Fitness", soru: "Antrenmandan sonraki kas ağrısının (DOMS) sebebi laktik asit birikmesi midir?", cevap: "Hayır, laktik asit egzersiz bittikten saatler sonra vücuttan atılmış olur.", aciklama: "24-72 saat sonra hissedilen DOMS (Gecikmiş Başlangıçlı Kas Ağrısı), kasların olağandışı gerilme stresi sonucu oluşan küçük mikro yırtıklarından ve buna bağlı inflamasyon sürecinden kaynaklanır; birikmiş laktik asitten değil." },
  { kategori: "Spor & Fitness", soru: "Genç yaşta ağırlık kaldırmak boy uzamasını durdurur mu?", cevap: "Hayır, bu inanışın bilimsel bir dayanağı yoktur.", aciklama: "Uygun teknik ve ağırlıklarla yapılan antrenmanın genç sporcularda kemik yoğunluğunu artırdığı, boy uzamasını engellemediği araştırmalarla kanıtlanmıştır. Büyüme plaklarına zarar verme riski ancak aşırı ve hatalı yüklemelerde söz konusudur." },
  { kategori: "Spor & Fitness", soru: "Sürekli mekik çekmek sadece göbek yağlarını mı eritir?", cevap: "Hayır, 'bölgesel yağ yakma' diye bir şey yoktur.", aciklama: "Vücut, egzersiz sırasında enerjiyi tüm yağ depolarından eşit oranlarda alır; hangi kasın çalıştığına göre seçim yapamaz. Karın bölgesindeki yağı eritmek için tüm vücutta kalori açığı yaratmak gerekir." },
  { kategori: "Teknoloji", soru: "RAM miktarını artırmak oyunlarda performansı her zaman artırır mı?", cevap: "Hayır, belirli bir eşiğin üzerinde RAM'in oyun performansına katkısı yok denecek kadar azdır.", aciklama: "Çoğu modern oyun 16 GB RAM ile verimli çalışır. Grafik performansını asıl belirleyen ekran kartıdır (GPU). Darboğaz RAM'de değil GPU'daysa daha fazla RAM almak oyunu hiç hızlandırmaz." },
  { kategori: "Teknoloji", soru: "Dizüstü bilgisayarları şarjı %100 olduktan sonra prizde bırakmak bataryayı öldürür mü?", cevap: "Hayır, modern cihazlar bunu zaten otomatik olarak önler.", aciklama: "Günümüz dizüstü bilgisayarları, batarya dolunca şarjı otomatik keserek gücü doğrudan adaptörden alan akıllı sistemlere sahiptir. Bataryanın asıl düşmanları ısı ve tam şarj/tam boşalma döngülerinin tekrarlanmasıdır." },
  { kategori: "Teknoloji", soru: "Gizli Sekme (Incognito Mode) tam anonimlik mi sağlar?", cevap: "Hayır, gizli mod yalnızca cihazınızdaki tarama geçmişini temizler.", aciklama: "İnternet servis sağlayıcınız, bağlandığınız ağ yöneticileri ve ziyaret ettiğiniz web siteleri sizi hâlâ görebilir. Gizli mod sadece aynı cihazı kullanan başka kişilerin geçmişinizi görmesini engeller; gerçek bir anonimlik sağlamaz." },
  { kategori: "Teknoloji", soru: "USB belleği 'Güvenle Kaldır' basmadan çekmek cihazı fiziksel olarak bozar mı?", cevap: "Hayır, fiziksel zarar vermez; aktif yazma işlemi varsa veri kaybına yol açar.", aciklama: "Bu özellik, USB'ye veri yazılırken ani çekimi önlemek için vardır. Aktif yazma yoksa güvenle çekebilirsiniz. Modern işletim sistemleri bu riski en aza indirmek için 'hızlı kaldırma' modunu varsayılan olarak etkinleştirir." },
  { kategori: "Psikoloji", soru: "Yalan makineleri (Poligraf) yalanı güvenilir şekilde tespit edebilir mi?", cevap: "Hayır, poligraflar bilimsel olarak güvenilmez kabul edilmektedir.", aciklama: "Poligraf kalp atışı, nefes ve terleme gibi stres belirtilerini ölçer; yalanı değil. Sakin bir yalancı testi geçerken, gergin bir dürüst insan başarısız olabilir. Bu yüzden pek çok ülkede mahkemede delil olarak kabul edilmez." },
  { kategori: "Psikoloji", soru: "Öfkelendiğinizde yastığa vurmak öfkeyi dindirir mi?", cevap: "Hayır, araştırmalar bunun öfkeyi pekiştirdiğini ortaya koymaktadır.", aciklama: "'Öfkeyi dışa vurma' (catharsis) teorisi psikoloji tarafından çürütülmüştür. Yastığa vurmak gibi saldırgan eylemler beyindeki saldırganlık devrelerini uyararak öfkeyi azaltmak yerine daha da artırır." },
  { kategori: "Psikoloji", soru: "Dolunay evresinde suç oranları artar mı?", cevap: "Hayır, binlerce vakayı inceleyen araştırmalar bu bağlantıyı doğrulayamamıştır.", aciklama: "Kapsamlı çalışmalar, dolunay ile suç, kaza veya acil servis başvuruları arasında istatistiksel olarak anlamlı bir ilişki bulamamıştır. Biz olumsuz olayları dolunaya yakın gecelerde daha çok hatırlarız; bu 'doğrulama yanlılığı' adı verilen bilişsel bir yanılsamadır." },
  { kategori: "Sağlık & Efsaneler", soru: "Yemek yedikten hemen sonra denize girmek krampa yol açar mı?", cevap: "Hayır, bu inanışın klinik bir dayanağı yoktur.", aciklama: "Sindirim sırasında kan mideye yönelir, ancak bu durum kaslardaki kramp riskini klinik olarak artırmaz. Yüzme yorgunluk yaratabilir ve hazımsızlık hissi verebilir, fakat bilimsel olarak kramp ile sindirim arasında doğrudan bir bağlantı kanıtlanamamıştır." },
  { kategori: "Evrim & Biyoloji", soru: "Doğal seçilimde 'fittest' en güçlü ve vahşi olandır mı?", cevap: "Hayır, 'fittest' sözcüğü 'en güçlü' değil 'en uyumlu' anlamına gelir.", aciklama: "Darwin'in 'survival of the fittest' ifadesindeki 'fit', fiziksel güç değil içinde bulunulan çevreye en iyi uyum sağlayan anlamındadır. Ortam değişirse en uyumlu olanın tanımı da değişir; bazen en küçük ve sakin organizma hayatta kalır." },
  { kategori: "Evrim & Biyoloji", soru: "Kurbağalar yavaşça kaynatılan suda tehlikeyi fark etmez mi?", cevap: "Hayır, gerçek deneyler kurbağaların kaçtığını göstermiştir.", aciklama: "Bu mit, yavaş değişen tehlikelere karşı duyarsızlaşmayı anlatmak için kullanılan güçlü bir mecazdır; ama biyolojik olarak yanlıştır. Kurbağalar soğukkanlı olmalarına karşın su ısınınca sıçrayıp kaçar." },
  { kategori: "Tarihi Yanılgılar", soru: "Büyük Sfenks'in burnunu Napolyon'un askerleri top atışıyla kırmıştır mı?", cevap: "Hayır, burun Napolyon'dan yüzyıllarca önce zaten yoktu.", aciklama: "15. yüzyılda yaşayan Arap tarihçi Maqrizi, burnun bir Müslüman aziz tarafından tahrip edildiğini kaydetmiştir. Napolyon Mısır'a 1798'de geldiğinde burun çoktan kaybolmuştu; bu mit Napolyon'u karalama amacıyla yayılmıştır." },
  { kategori: "Sanat & Tarih", soru: "Antik Yunan ve Roma heykelleri beyaz mermer rengiyle mi tasarlanmıştır?", cevap: "Hayır, bu heykeller başlangıçta canlı renklerle boyanmıştı.", aciklama: "Ultraviyole ışık ve pigment analizleriyle bu heykellerin üzerindeki boya izleri ortaya çıkarılmıştır. Beyaz tenler, kırmızı dudaklar ve renkli giysilerle bezenmiş bu eserler, yüzyıllar içinde boyaları döküldükçe biz onları 'doğal mermer' rengiyle klasik kabul etmişizdir." },
  { kategori: "Astronomi", soru: "Gece gökyüzündeki en parlak yıldız Kutup Yıldızı (Polaris) mıdır?", cevap: "Hayır, Polaris parlaklık sıralamasında yaklaşık 50. sıradadır.", aciklama: "Gece gökyüzünün en parlak yıldızı Büyük Köpek takımyıldızındaki Sirius'tur. Polaris'in önemi parlaklığından değil, Dünya ekseninin neredeyse tam üzerine denk gelerek sabit bir yön noktası oluşturmasından kaynaklanır." },
  { kategori: "Ekonomi", soru: "Bir devlet yoksulluğu bitirmek için sınırsız para basabilir mi?", cevap: "Hayır, bu enflasyon ve ekonomik çöküşe yol açar.", aciklama: "Para, ekonomideki mal ve hizmetlere karşılık gelen bir değer belgesidir. Üretimi artırmadan para arzını şişirmek paranın değerini düşürür (enflasyon). Weimar Almanyası ve Zimbabwe bu sürecin yıkıcı sonuçlarının en çarpıcı tarihi örnekleridir." },
  { kategori: "Tarih Öncesi", soru: "Neandertaller küçük beyinli, kambur ve vahşi yaratıklar mıydı?", cevap: "Hayır, bu 100 yıllık hatalı bir yorumun kalıntısıdır.", aciklama: "İlk Neandertal iskeleti yanlış yorumlandı; o birey şiddetli artrit hastasıydı. Gerçekte Neandertallerin beyin hacimleri modern insanlarınkine eşit, hatta bazen daha büyüktü. Ölülerini gömdüler, sanat yaptılar ve Homo Sapiens ile melezleştiler; bugün Avrupalıların DNA'sında Neandertal genleri bulunur." },
  { kategori: "Bilim & Fizik", soru: "Paslanmaz çelik (Stainless Steel) hiçbir koşulda paslanmaz mı?", cevap: "Hayır, yeterince zorlu koşullarda paslanmaz çelik de paslanır.", aciklama: "Paslanmaz çeliğin korozyon direnci, krom oksit adı verilen ince bir koruyucu tabakadan gelir. Bu tabaka çizilir, uzun süre klora (deniz suyu, havuz suyu) maruz kalır veya yanlış temizlik ürünleriyle hasar görürse altındaki demir okside başlar, yani pas tutar." },
  { kategori: "Tıp & Farmakoloji", soru: "Grip aşısı olmak insanı hafif de olsa grip yapar mı?", cevap: "Hayır, grip aşısındaki virüsler tamamen inaktif (ölü) olduğundan enfeksiyon oluşturamaz.", aciklama: "Ölü bir virüs biyolojik olarak hastalığa neden olamaz. Aşıdan sonra görülen hafif ateş veya kol ağrısı, bağışıklık sisteminin antikor üretirken verdiği doğal tepkidir; gripten değil aşıya verilen immün yanıttan kaynaklanır." },
  { kategori: "Tıp & İlk Yardım", soru: "Kalp masajı (CPR) uygulanan hastaların çoğu hayatta kalır mı?", cevap: "Hayır, CPR'ın amacı kalbi yeniden çalıştırmak değil, beyin ölümünü geciktirmektir.", aciklama: "Dizilerde gösterilenin aksine, tek başına CPR'ın hastayı hayata döndürme oranı tek haneli yüzdelerdedir. CPR; ambulans ve defibrilatör gelene kadar beyne ve hayati organlara oksijenli kan pompalamak için yapılır, mucizevi bir canlandırma yöntemi değildir." },
  { kategori: "Tıp & Teknoloji", soru: "Filmlerden tanıdığımız elektroşok cihazları (Defibrilatör), düz çizgi gösteren durmuş kalbi yeniden çalıştırır mı?", cevap: "Hayır, durmuş kalbe şok verilmez; şok yalnızca kaotik ritmi olan kalbe uygulanır.", aciklama: "Defibrilatör, kalbin düzensiz titreştiği (ventriküler fibrilasyon) durumlarda kaotik elektriksel aktiviteyi sıfırlamak için kullanılır. Tüm elektriksel aktivitesi durmuş kalbe şok uygulamak biyolojik olarak işe yaramaz." },
  { kategori: "Jeoloji & Dünya", soru: "Magma, yeraltında fokurdayan devasa ateş denizleri veya sıvı lav okyanusları şeklinde mi bulunur?", cevap: "Hayır, magma katı kayaların gözenek ve çatlaklarında bulunur.", aciklama: "Yeraltında devasa sıvı boşluklarda akan lav nehirleri fantastik filmlerin uydurmasıdır. Magma, aşırı basınç altındaki katı görünümlü kayaların içindeki mikro çatlaklarda ve boşluklarda sızan erimiş silikatlardan oluşur." },
  { kategori: "Coğrafya & Haritalar", soru: "Grönland adası ile Afrika kıtası yüzölçümü bakımından birbirine yakın mıdır?", cevap: "Hayır, Afrika, Grönland'dan yaklaşık 14 kat daha büyüktür.", aciklama: "Sınıflarda kullanılan 'Mercator Projeksiyonu' haritaları, denizciliği kolaylaştırmak için kutup bölgelerini devasa gösterir. Gerçekte Afrika kıtası, içine Çin, ABD ve Avrupa'yı aynı anda sığdırabilecek kadar büyüktür." },
  { kategori: "Hayvanlar Alemi", soru: "Timsahlar avlarını yerken üzüntüden dolayı ağlarlar mı?", cevap: "Hayır, gözyaşlarının duygularla hiçbir ilgisi yoktur.", aciklama: "Timsahlar avı parçalarken çenelerini aşırı güçle sıkıştırır. Bu mekanik kas baskısı, gözyaşı bezlerine fiziksel baskı uygulayarak sıvı taşmasına neden olur. 'Timsah gözyaşları' deyimi bu anatomik refleksten doğmuştur." },
  { kategori: "Kimya & Malzeme", soru: "Tüm asit türleri temas ettiği her şeyi anında eritir mi?", cevap: "Hayır, bir maddenin asit olması onu tehlikeli yapmaz.", aciklama: "Asitlik, bir molekülün hidrojen iyonu verebilme kapasitesini ifade eder. DNA bir asittir; limon suyu da, sirke de asittir. Tehlikeli asitler yalnızca sülfürik asit gibi güçlü mineral asitlerdir; tüm asitler metal veya et eritmez." },
  { kategori: "Psikoloji & Sosyoloji", soru: "Grup halinde yapılan 'Beyin Fırtınası' (Brainstorming), bireysel düşünmekten daha fazla yaratıcı fikir üretir mi?", cevap: "Hayır, araştırmalar tek başına düşünen bireylerin daha fazla özgün fikir ürettiğini göstermektedir.", aciklama: "Grup ortamında bireyler farkında olmadan diğerlerinden etkilenir, eleştirilme korkusuyla otosansür uygular ve baskın karakterler süreci yönlendirir. Bireysel çalışma seansları istatistiksel olarak grup brainstorming'inden her zaman daha verimlidir." },
  { kategori: "Kültür & Dilbilim", soru: "İnuitlerin (Eskimoların) dilinde 'kar' için yüzlerce farklı sözcük var mıdır?", cevap: "Hayır, bu dilbilimsel bir abartıdır.", aciklama: "İnuit dilleri Türkçe gibi sondan eklemeli yapıya sahiptir. 'Islak kar' veya 'yürünebilen kar' gibi ifadeler tek bir uzun sözcük olarak yazılır. Bağımsız kök sözcük sayısı İngilizce veya Türkçeden belirgin biçimde fazla değildir." },
  { kategori: "Gıda & Beslenme", soru: "'Yağsız' veya 'Diyet' etiketli ürünler kilo kontrolü için her zaman daha mı sağlıklıdır?", cevap: "Hayır, yağsız ürünlere lezzet kazandırmak için genellikle ekstra şeker ve nişasta eklenir.", aciklama: "Gıdadan yağ çıkarıldığında tat ve doku bozulur. Üreticiler bu kaybı yüksek fruktozlu mısır şurubu veya yapay tatlandırıcılarla telafi eder. Sonuç olarak ürünün kalori değeri normal versiyonuna denk, bazen daha yüksek olabilir." },
  { kategori: "Gıda & Beslenme", soru: "Çin tuzu olarak bilinen MSG (Monosodyum Glutamat) baş ağrısına ve nörolojik hasarına yol açan zehirli bir kimyasal mıdır?", cevap: "Hayır, MSG bilimsel olarak güvenli kabul edilen doğal bir lezzet artırıcıdır.", aciklama: "MSG, domates, parmesan peyniri ve mantar gibi gıdalarda doğal olarak bulunan glutamik asidin sodyum tuzudur. Çift kör klinik çalışmalar, 'Çin Restoranı Sendromu' iddialarını (baş ağrısı, çarpıntı) hiçbir zaman bilimsel olarak doğrulayamamıştır." },
  { kategori: "Hukuk & Emniyet", soru: "Polisler bir şüpheliyi tutukladığı anda Miranda haklarını okumak zorunda mıdır?", cevap: "Hayır, Miranda uyarısı yalnızca resmi sorgu başlayacaksa okunması gerekir.", aciklama: "Filmlerdeki dramatik sahnelerin aksine, tutuklama anında bu metni okuma zorunluluğu yoktur. Miranda uyarısı, polisin şüpheliye resmi sorular sormaya başlayacağı durumda ifadenin mahkemede delil olarak kullanılabilmesi için okunur." },
  { kategori: "Tarih & Kültür", soru: "Korsanlar isyancı mürettebatı denize uzanan tahtada yürüterek mı öldürürdü?", cevap: "Hayır, 'tahtada yürütme' neredeyse tamamen kurgusal bir efsanedir.", aciklama: "Gerçek korsan cezaları çok daha basitti: doğrudan denize atmak, geminin altından halatla sürüklemek (keelhauling) veya ıssız adaya bırakmak (marooning). Tahta miti 19. yüzyıl macera romanlarında popülerleşmiştir." },
  { kategori: "Evcil Hayvanlar", soru: "Köpeklerin burnunun kuru ve sıcak olması hastalandıklarının kesin bir işareti midir?", cevap: "Hayır, köpeğin burun nemi ve sıcaklığı gün içinde sürekli değişir.", aciklama: "Güneşte yatan bir köpeğin burnu kuruyup ısınabilir, su içtikten sonra ıslanıp soğuyabilir. Hastalık veya ateşi güvenilir biçimde teşhis etmenin tek yolu veteriner hekimin termometre kullanmasıdır." },
  { kategori: "Teknoloji & Yazılım", soru: "Akıllı telefonlarda arka planda açık uygulamaları kaydırarak kapatmak pil ömrünü uzatır mı?", cevap: "Hayır, aksine bu işlem daha fazla şarj tüketilmesine neden olur.", aciklama: "Modern iOS ve Android sistemleri arka plandaki uygulamaları dondurarak RAM'de hazır bekletir; bu uygulamalar enerji harcamaz. Bir uygulamayı zorla kapattığınızda, tekrar açılışta işlemci onu sıfırdan yükler ve bu çok daha fazla enerji tüketir." },
  { kategori: "Teknoloji & Donanım", soru: "Kameranın veya telefonun megapiksel sayısı ne kadar yüksekse fotoğraf o kadar kaliteli olur mu?", cevap: "Hayır, kaliteyi piksel sayısı değil sensör boyutu ve lens kalitesi belirler.", aciklama: "Megapiksel yalnızca görüntünün çözünürlüğünü (boyutunu) ifade eder. Küçük bir sensöre ve zayıf lense sahip 100 MP'lik bir telefon, büyük sensörlü ve kaliteli lensli 12 MP'lik profesyonel bir kameranın yanına yaklaşamaz." },
  { kategori: "Teknoloji & Donanım", soru: "SSD disklerin performansını korumak için periyodik disk birleştirme (Defrag) yapılmalı mıdır?", cevap: "Hayır, defrag işlemi SSD'lerin yazma ömrünü gereksiz yere tüketir.", aciklama: "Disk birleştirme, mekanik sabit disklerde (HDD) okuma kafasının fiziksel hareketini azaltmak için verileri yan yana dizer. SSD'lerde mekanik parça yoktur ve veriye her noktadan mikrosaniyede ulaşılır; defrag sadece disk ömrünü (TBW limitini) boşa harcatır." },
  { kategori: "Tarih & Medeniyet", soru: "İskenderiye Kütüphanesi devasa tek bir yangınla bir gecede yok olmuş mudur?", cevap: "Hayır, kütüphane yüzyıllara yayılan yavaş bir çöküşle yok olmuştur.", aciklama: "Sezar döneminde bir bölümü hasar görse de kütüphane uzun süre ayakta kaldı. Asıl yok oluş nedenleri; imparatorluk bütçesinin kesilmesi, akademisyenlerin şehri terk etmesi ve parşömenlerin bakımsızlıktan çürümesidir." },
  { kategori: "Kültür & Mitoloji", soru: "Yunan mitolojisindeki Hades, şeytani ve kötü niyetli bir tanrı mıdır?", cevap: "Hayır, Hades yalnızca ölüler diyarının adil bir yöneticisidir.", aciklama: "Popüler kültür ve filmler Hades'i Hristiyan inancındaki Şeytan imgesiyle birleştirerek yanlış yansıtır. Antik Yunan inancında Hades şeytani değildir; görevi ölülerin ruhlarını barındıran kasvetli krallığı yönetmektir." },
  { kategori: "Biyoloji & Evrim", soru: "GDO'lu gıdalar yenildiğinde içlerindeki değiştirilmiş DNA insan genlerine karışır mı?", cevap: "Hayır, yenilen hiçbir besininin DNA'sı insan genetiğine doğrudan geçemez.", aciklama: "GDO'lu mısırın da organik elmanın da içinde DNA vardır. Yenildiğinde mide asidi ve enzimler bu DNA'ları nükleotid yapıtaşlarına kadar parçalar; vücut bu parçaları enerji ve hücre yapımı için sıradan malzeme olarak kullanır." },
  { kategori: "Psikoloji & Beyin", soru: "Tourette sendromlu kişilerin tamamı istemsizce küfür eder mi?", cevap: "Hayır, küfretme tiki (koprolali) hastaların yalnızca yaklaşık %10'unda görülür.", aciklama: "Medyada dramatize edilen koprolali aslında oldukça nadirdir. Tourette sendromunun en yaygın belirtileri göz kırpma, omuz silkme, boğaz temizleme ve basit sesler çıkarma gibi motor tiklerdir." },
  { kategori: "Tıp & Psikiyatri", soru: "Antidepresan ilaçlar insanları uyuşturur, zombi gibi yapar ve kişiliklerini değiştirir mi?", cevap: "Hayır, doğru dozda kullanılan antidepresanlar kişiliği değiştirmez.", aciklama: "Antidepresanlar (özellikle SSRI'lar) beyindeki serotonin gibi kimyasalların düzeyini dengeler. Amaç uyuşturmak değil, depresyonun bozduğu nörokimyasal dengeyi kişinin sağlıklı haline geri döndürmektir." },
  { kategori: "Teknoloji & Otomotiv", soru: "Soğuk havada motoru dakikalarca rölantide ısıtmak gerekir mi?", cevap: "Hayır, modern araçlarda birkaç saniye yeterlidir.", aciklama: "Eski karbüratörlü motorlarda rölantide bekleme gerekliydi, ancak günümüz elektronik yakıt enjeksiyonlu motorlarda bu yakıt israfıdır. Araç çalıştırılır çalıştırılmaz hafif devirle sürmeye başlamak motorun daha hızlı ve sağlıklı ısınmasını sağlar." },
  { kategori: "Teknoloji & Otomotiv", soru: "Soğuk sabah saatlerinde benzin almak yakıt genleşmesi sayesinde depoya daha fazla benzin dolmasını sağlar mı?", cevap: "Hayır, hava sıcaklığı pompalanan yakıt miktarını değiştirmez.", aciklama: "İstasyon yakıt tankları yerin metrelerce altında, sabit sıcaklıklı odalarda bulunur. Toprak altı sıcaklığı gece-gündüz ve yaz-kış neredeyse değişmez; dolayısıyla yüzey hava sıcaklığının pompadan çıkan yakıt hacmine etkisi yoktur." },
  { kategori: "Ağız ve Diş Sağlığı", soru: "Karbonat ve limon suyu karışımı dişleri beyazlatmak için güvenli bir doğal yöntem midir?", cevap: "Hayır, bu karışım diş minesinde kalıcı hasara yol açar.", aciklama: "Limon suyu pH 2 civarında güçlü bir asittir ve mineyi hızla yumuşatır; karbonat ise aşındırıcı bir partiküldür. İkisi birlikte yumuşamış mineyi zımparalar, geri dönüşü olmayan aşınmalara ve altındaki sarı dentin tabakasının ortaya çıkmasına neden olur." },
  { kategori: "Ağız ve Diş Sağlığı", soru: "Süt dişleri nasıl olsa döküleceği için çürüklerinin tedavi edilmesi gerekmez mi?", cevap: "Hayır, süt dişleri çene gelişimi ve kalıcı dişler için hayati öneme sahiptir.", aciklama: "Süt dişleri alttan çıkacak kalıcı dişler için yer tutucu görevi görür. Erken çekilirse komşu dişler boşluğa kayar, kalıcı diş için yer kalmaz ve ileride ciddi ortodontik bozukluklar ortaya çıkar." },
  { kategori: "Sağlık & Fizyoloji", soru: "Terlemek veya saunada kalmak vücuttan toksin atmanın en iyi yolu mudur?", cevap: "Hayır, terin yaklaşık %99'u su ve tuzdan oluşur; toksin atımıyla ilgisi yoktur.", aciklama: "Ter bezlerinin görevi ısı düzenlemesidir (termoregülasyon), kanı filtrelemek değil. Ağır metaller veya alkol gibi toksinler büyük oranda karaciğer ve böbrekler tarafından idrar ve dışkı yoluyla atılır." },
  { kategori: "Coğrafya & Siyaset", soru: "Hollanda'nın başkenti Amsterdam olduğundan parlamentosu ve hükümeti de orada mıdır?", cevap: "Hayır, Hollanda'nın tüm siyasi ve idari merkezi Lahey'dir (Den Haag).", aciklama: "Hollanda anayasasına göre başkent resmi olarak Amsterdam'dır. Ancak ülkenin parlamentosu, hükümeti, kraliyet ailesi ve yabancı büyükelçilikler tarihsel nedenlerden dolayı Lahey'de bulunmaktadır." },
  { kategori: "Fizik & Bilim", soru: "Maddeyi oluşturan atomlar içi dolu katı parçacıklar mıdır?", cevap: "Hayır, bir atomun kütlesinin %99.99'u boşluktan ibarettir.", aciklama: "Bir atomun çekirdeğini futbol sahası ortasındaki bir bezelye büyüklüğüne getirirsek, elektronlar stadyumun en üst tribünlerinde uçuşan sinekler boyutunda kalır. Her şeyin katı hissettirmesinin nedeni atomlar arası elektromanyetik itme kuvvetidir." },
  { kategori: "Uzay & Astronomi", soru: "Kuyrukluyıldızların kuyruğu her zaman hareket ettikleri yönün gerisine mi uzanır?", cevap: "Hayır, kuyruklar her zaman Güneş'in zıt yönüne uzanır.", aciklama: "Kuyruk aerodinamik bir sürtünmeden değil, Güneş'in solar rüzgar ve radyasyonunun buharlaşan gazları itmesinden oluşur. Bu nedenle Güneş'e yaklaşırken kuyruk arkada, Güneş'ten uzaklaşırken 'önde' gider." },
  { kategori: "İnsan Anatomisi", soru: "Renk körlüğü yalnızca erkeklerde görülür mü?", cevap: "Hayır, nadir de olsa kadınlar da renk körü olabilir.", aciklama: "Renk körlüğü geni X kromozomu üzerinden taşınır. Tek X kromozomuna sahip erkekler (XY) bu geni bir kez alınca etkilenir. Kadınların iki X kromozomu (XX) olduğundan her ikisinin de kusurlu olması gerekir; bu olasılık düşüktür ama imkansız değildir." },
  { kategori: "Kültür & Tarih", soru: "Ninjaların kullandığı fırlatma yıldızları (Shuriken) düşmanları öldürmek için mi tasarlanmıştır?", cevap: "Hayır, Shurikenler oyalama ve dikkat dağıtma aracıdır, öldürücü değildir.", aciklama: "Ağırlıkları ve bıçak yapıları gereği Shurikenler ölümcül hasar veremez. Çoğunlukla kaçış sırasında düşmanı yavaşlatmak, şaşırtmak veya açık verdirmek amacıyla fırlatılan taktiksel araçlardır." },
  { kategori: "Uzay & Astrofizik", soru: "Güneş sisteminde Güneş'e en yakın gezegen olan Merkür aynı zamanda en sıcak gezegen midir?", cevap: "Hayır, sistemimizdeki en sıcak gezegen Venüs'tür.", aciklama: "Merkür'ün atmosferi olmadığı için ısıyı tutamaz; geceleri -180°C'ye düşer. İkinci sıradaki Venüs'ün ise yoğun karbondioksit atmosferi kontrolden çıkmış bir sera etkisi yaratır ve yüzey sıcaklığını sürekli 470°C'de tutar." },
  { kategori: "Fizik & Meteoroloji", soru: "Gökkuşakları gökyüzünde her zaman yarım bir yay şeklinde mi oluşur?", cevap: "Hayır, gökkuşakları aslında 360 derecelik tam bir çemberdir.", aciklama: "Işığın su damlacıklarında kırılması tam bir dairesel halka yaratır. Ufuk çizgisi bu halkanın alt yarısını gizler. Yüksek bir dağ zirvesinden veya uçaktan bakıldığında gökkuşağı tam bir yuvarlak olarak görünür." },
  { kategori: "Biyoloji & Botanik", soru: "Mantarlar (Fungi), fotosentez yapamayan birer bitki türü müdür?", cevap: "Hayır, mantarlar bitki değildir; genetik olarak hayvanlara daha yakındırlar.", aciklama: "Mantarlar kendi besinlerini üretemez ve hücre duvarları bitkilerinkinin aksine selülozdan değil, böcek iskeletlerinde de bulunan 'kitin' adlı maddeden yapılmıştır. Biyolojik sınıflandırmada kendilerine ait ayrı bir canlılar alemine aittirler." },
  { kategori: "Mitoloji & Tarih", soru: "Truva Atı, içine askerlerin saklandığı devasa ahşap bir at heykeli miydi?", cevap: "Hayır, tarihçilere göre bu efsanevi at muhtemelen bir koçbaşı veya deprem metaforudur.", aciklama: "Homeros'un İlyada'sındaki atın, şehre girmek için kullanılan at başlı bir kuşatma aleti (koçbaşı) olduğu ya da Truva surlarını yıkan bir depremi (Poseidon'un simgesi attır) anlatan edebi bir metafor olduğu düşünülmektedir." },
  { kategori: "Kültür & Köken", soru: "Gladyatör dövüşlerinde imparatorun başparmağını aşağı indirmesi 'ölüm' emri miydi?", cevap: "Hayır, başparmağı aşağı veya kapalı tutmak 'kılıcı kınına sok, bağışla' anlamına geliyordu.", aciklama: "Antik Roma'da yana veya yukarı doğru açıkça uzatılan başparmak, kılıcın çekilmesi ve infaz anlamına gelirdi. 19. yüzyılda çizilen 'Pollice Verso' adlı hatalı bir tablo bu el hareketinin anlamını popüler kültürde tersine çevirmiştir." },
  { kategori: "Tarih & Askeri", soru: "Orta Çağ şövalyeleri çok ağır zırhları yüzünden atlarına vinçle mi bindirilirdi?", cevap: "Hayır, tam takım çelik zırh sadece 20-25 kg civarındaydı ve son derece esnekti.", aciklama: "Günümüz asker sırt çantasından veya itfaiyeci teçhizatından daha hafif olan bu ağırlık vücuda eşit yayılırdı. Şövalyeler zırh içindeyken koşabilir, takla atabilir ve atlarına rahatlıkla sıçrayarak binebilirlerdi." },
  { kategori: "Tarih & Metalurji", soru: "Japon Samuray kılıçları (Katana) dünyanın en üstün ve saf çeliğinden mi yapılırdı?", cevap: "Hayır, tam aksine Japon demiri safsızlıklarla dolu olduğu için bu kadar çok dövülmek zorunda kalınırdı.", aciklama: "Japonya'nın yerel 'tamahagane' demir cevheri kalite açısından oldukça düşüktü ve kırılganlık yaratan elementler içeriyordu. Demirciler bu zayıf malzemeyi kullanılabilir hale getirmek için çeliği defalarca katlamak zorunda kaldı; bu zorunluluk zamanla efsanevi bir ustalık mitine dönüştü." },
  { kategori: "Biyoloji & Zooloji", soru: "Zebraların siyah-beyaz çizgileri, onları aslanlardan saklamak için evrimleşmiş bir kamuflaj mıdır?", cevap: "Hayır, asıl işlevleri ölümcül hastalık taşıyan sinekleri uzak tutmaktır.", aciklama: "Araştırmalar, at sineklerinin polarize ışığı algılama biçiminin zebraların çizgili deseni tarafından bozulduğunu ve bu nedenle sineklerin zebralar üzerine konamadığını göstermiştir. Sürü halinde koşarken oluşan optik gürültü de yırtıcıların hedef seçmesini zorlaştırır." },
  { kategori: "Zooloji & Anatomi", soru: "Anatomik olarak zıplayamayan tek memeli hayvan filler midir?", cevap: "Hayır, gergedanlar ve suaygırları da zıplayamaz.", aciklama: "Filler 4 ayaklarını aynı anda yerden kesemezler ancak tek tür değildir. Gergedan ve suaygırı gibi devasa vücut kütlesini yukarı itecek bacak biyomekaniğine sahip olmayan diğer büyük memeliler de bu hareketi gerçekleştiremez." },
  { kategori: "İnsan Anatomisi", soru: "Mide asidimiz jilet eritebilecek kadar güçlüyken mideyi eritmemesi, duvarın aside dayanıklı olmasından mı kaynaklanır?", cevap: "Hayır, mide sürekli kendini yenileyen kalın bir mukus tabakası salgılar.", aciklama: "Mide duvarının kendisi aside dayanıklı değildir. Mide, iç yüzeyini korumak için kalın ve alkali bir mukus tabakası üretir. Bu savunma hattı devamlı yenilenir; yüzeydeki mide hücreleri her 3-4 günde bir tamamen değişir." },
  { kategori: "Sağlık & Biyoloji", soru: "İnsanlar yaşlandıkça kulakları ve burunları kıkırdak büyümesiyle fizyolojik olarak büyür mü?", cevap: "Hayır, kıkırdak büyümesi çoktan durmuştur; bu organlar sadece sarkar.", aciklama: "Yaşla birlikte ciltteki kolajen ve elastin parçalanır. Yıllar süren yerçekimi etkisiyle yapısal desteğini kaybeden kulak memesi ve burun ucu, sarkmaya başlar. Bu sarkma organın büyüdüğü şeklinde bir optik yanılsama yaratır." },
  { kategori: "İnsan Anatomisi", soru: "Karaciğerin bir bölümü bağışlandığında eksilen kısım eski anatomik şeklini birebir yeniden kazanır mı?", cevap: "Hayır, hacim olarak büyür ama asla eski anatomik biçimini almaz.", aciklama: "Karaciğer rejenerasyon yeteneğine sahip ender organlardan biridir ancak kopan bir kertenkele kuyruğu gibi eksilen lobu aynı şekilde çıkarmaz. Kalan doku, vücudun gerektirdiği filtreleme kapasitesine ulaşana kadar şişer." },
  { kategori: "Gıda & Beslenme", soru: "Kan grubuna göre belirlenmiş diyet listeleri bilimsel olarak geçerli midir?", cevap: "Hayır, kan grubuna göre diyetin hiçbir tıbbi geçerliliği yoktur.", aciklama: "Kan grupları, kırmızı kan hücresi yüzeyindeki antijenlerle ilgilidir ve sindirim sistemiyle hiçbir bağlantısı yoktur. Binlerce kişi üzerinde yapılan beslenme araştırmalarında diyetin başarısıyla kan grubu arasında hiçbir istatistiksel bağ bulunamamıştır." },
  { kategori: "Sağlık & Onkoloji", soru: "Kanser, bir gün tek bir ilaç veya aşıyla kökten çözülebilecek tekil bir hastalık mıdır?", cevap: "Hayır, kanser 200'den fazla farklı hastalığın ortak adıdır.", aciklama: "Hücrelerin kontrolsüz bölünmesini tanımlayan 'kanser' bir şemsiye kavramdır. Beyin kanseri ile lösemi ya da meme kanseri ile kemik kanseri tamamen farklı mutasyonlara ve mekanizmalara sahiptir; bu yüzden tümünü çözecek tek bir 'kanser ilacı' biyolojik olarak imkansızdır." },
  { kategori: "Fizik & Havacılık", soru: "Uçakların havada kalmasını sağlayan temel kuvvet Bernoulli prensibiyle oluşan alçak basınç mıdır?", cevap: "Hayır, asıl kaldırma kuvveti Newton'un 3. Yasası (etki-tepki) ile oluşur.", aciklama: "Bernoulli etkisi kaldırma kuvvetinin yalnızca küçük bir bölümünü oluşturur. Asıl güç; kanatların hücum açısı sayesinde havayı aşağı doğru iterek tepki kuvveti kazanmasından gelir. Bu, Newton'un 3. Yasası'nın havacılıktaki doğrudan uygulamasıdır." },
  { kategori: "Teknoloji & İnternet", soru: "'İnternet' ile 'World Wide Web' (WWW) aynı şeyin iki farklı adı mıdır?", cevap: "Hayır, İnternet fiziksel altyapıdır; Web ise bu altyapı üzerinde çalışan bir hizmettir.", aciklama: "İnternet; dünyadaki milyarlarca cihazı birbirine bağlayan kablolar, sunucular ve yönlendiricilerden oluşan fiziksel ağdır. Web (WWW) ise bu ağ üzerinden tarayıcıyla erişilen web sitelerinin oluşturduğu bir bilgi paylaşım sistemidir; tıpkı yollar ve üzerindeki araçlar gibi." },
  { kategori: "Havacılık & Teknoloji", soru: "Uçak kazalarında aranan 'Kara Kutu' isminden de anlaşılacağı üzere siyah renkte midir?", cevap: "Hayır, kara kutular parlak fosforlu turuncu renktedir.", aciklama: "Kayıt cihazları, kaza enkazında, ormanlık alanda veya okyanus dibinde arama kurtarma ekiplerince kolayca fark edilebilmesi için uluslararası standart 'havacılık turuncusu' rengine boyanır. 'Kara kutu' ifadesi gizliliği çağrıştıran mecazi bir addır." },
  { kategori: "Fizik & Optik", soru: "Çölde sıcaktan susuz kalan insanların gördüğü 'Serap' psikolojik bir halüsinasyon mudur?", cevap: "Hayır, serap kamerayla bile fotoğraflanabilen gerçek bir optik yansımadır.", aciklama: "Kavurucu sıcakta zemin üstündeki hava aşırı ısınır. Gökyüzünden gelen ışık bu farklı yoğunluktaki hava katmanlarından geçerken kırılır ve U çizerek gözümüze ulaşır. Yerde gördüğümüz 'su' aslında gökyüzünün optik yansımasıdır; beyin bunu uydurmaz." },
  { kategori: "İcatlar & Mucitler", soru: "Telefonu ilk olarak icat eden kişi Alexander Graham Bell midir?", cevap: "Hayır, Bell'den yıllar önce telefonu İtalyan mucit Antonio Meucci icat etmiştir.", aciklama: "Meucci çalışan bir prototipi çok daha önce yapmış ancak patent başvurusunu yenileyecek parası olmadığından hakkını kaybetmiştir. Bell bu teknolojinin patentini alıp ticarileştirdi. 2002'de ABD Kongresi Meucci'nin önceliğini resmi olarak teslim etmiştir." },
  { kategori: "Coğrafya & Fizik", soru: "Gündüz gökyüzünün mavi görünmesinin nedeni okyanusların ve denizlerin mavisini yansıtması mıdır?", cevap: "Hayır, gökyüzünün mavisi Rayleigh saçılması adlı bir atmosferik ışık olayından kaynaklanır.", aciklama: "Güneş ışığı atmosfere girdiğinde, kısa dalga boyuna sahip mavi ışık gaz moleküllerine çarparak tüm diğer renklerden çok daha fazla her yöne saçılır. Denizler ise gökyüzünü yansıttığı için değil, suyun kendisi uzun dalga boylarını emdiği için mavidir." },
  { kategori: "Uzay & Astronomi", soru: "Ay'ın evrelerini (hilal, yarım ay, dolunay) oluşturan şey Dünya'nın Ay üzerine düşürdüğü gölge midir?", cevap: "Hayır, evreler Ay'ın aydınlık kısmının bize dönük açısının değişmesinden ibarettir.", aciklama: "Dünya'nın gölgesinin Ay'ı kapattığı nadir olaylar 'Ay tutulması' olarak adlandırılır. Günlük hilal veya yarım ay evreleri ise Ay Dünya etrafında dönerken Güneş'in aydınlattığı tarafın bize dönük açısının değişmesinden kaynaklanır." },
  { kategori: "Psikoloji & Müzik", soru: "Bebeklere klasik müzik (Mozart) dinletmek onların IQ'sunu kalıcı olarak artırır mı?", cevap: "Hayır, 'Mozart Etkisi' bilimsel olarak doğrulanamamış abartılı bir efsanedir.", aciklama: "Klasik müzik bebeklerde kısa süreli (10-15 dakika) bir bilişsel uyanıklık sağlayabilir ancak zeka seviyesine ya da beyin nöronlarına kalıcı bir etki yaptığına dair hiçbir çalışma doğrulanamamıştır. Efsane, 1993 yılında yanlış yorumlanan küçük bir araştırmadan yayıldı." },
  { kategori: "Hukuk & Teknoloji", soru: "Polis acil hatları, arayan kişinin cep telefonundan saniyeler içinde kesin GPS konumunu tespit edebilir mi?", cevap: "Hayır, filmlerin aksine konum tespiti genellikle yavaş ve sapmalıdır.", aciklama: "Operatör üzerinden anlık konum tespiti kırsal alanda kilometrelerce sapma verebilir; dikey konumu (hangi katta olduğunu) asla söyleyemez. Hassas konum genellikle yasal prosedürler ve zaman gerektirir." },
  { kategori: "Gıda & Mutfak", soru: "Çiğ tavuk etini pişirmeden önce suyla yıkamak üzerindeki bakterileri temizler mi?", cevap: "Hayır, aksine Salmonella ve Campylobacter bakterilerini tüm mutfağa saçar.", aciklama: "Su çiğ etteki bakterileri öldürmez. Musluk altında yıkamak, mikroskobik su sıçramaları aracılığıyla tezgaha, bulaşığa ve diğer gıdalara bakteri yayar (çapraz kontaminasyon). Tavuğu güvenli hale getiren tek yol yeterli sıcaklıkta pişirmektir." },
  { kategori: "Gıda & Tarım", soru: "Kahverengi kabuklu yumurtalar beyaz kabuklu yumurtalardan daha organik veya daha besleyici midir?", cevap: "Hayır, yumurta kabuğunun rengi tamamen tavuğun ırkıyla belirlenir.", aciklama: "Genel kural olarak kulak memeleri beyaz tavuklar beyaz, kahverengi/kırmızı tavuklar ise kahverengi yumurtlar. Her iki rengin protein, yağ ve vitamin içeriği arasında bilimsel olarak hiçbir fark yoktur; renk algısı tamamen pazarlama stratejisidir." },
  { kategori: "Gıda & Kimya", soru: "Margarin kimyasal olarak 'plastiğe bir molekül uzaklıkta' olan bir zehir midir?", cevap: "Hayır, kimyada 'bir molekül uzaklık' hiçbir anlam ifade etmez.", aciklama: "İçme suyu (H2O) ile zehirli hidrojen peroksit (H2O2) de yalnızca bir oksijen atomu kadar birbirinden uzaktır. Margarin, sıvı bitkisel yağların hidrojen gazıyla doyurularak katı hale getirilmiş yenilebilir bir formdur; plastikle kimyasal olarak ortak bir yanı yoktur." },
  { kategori: "Gıda & Diyet", soru: "Beyaz ekmek esmer (tam buğday) ekmeğe kıyasla çok daha fazla kalori içerdiği için mi kilo aldırır?", cevap: "Hayır, her ikisinin kalori değerleri gram başına neredeyse eşittir.", aciklama: "Tam buğday ekmeğini sağlıklı yapan şey düşük kalori değil, içerdiği lif, vitamin ve minerallerdir. Bu lifler sindirim sürecini yavaşlatarak kan şekerini daha dengeli tutar ve daha uzun süre tokluk hissi sağlar." },
  { kategori: "Sanat Tarihi", soru: "Louvre'daki Mona Lisa tablosu görkemli ve büyük boyutlu bir eser midir?", cevap: "Hayır, Mona Lisa yalnızca 77 × 53 cm boyutlarında oldukça küçük bir tablodur.", aciklama: "Tablonun şöhreti insanların onu devasa hayal etmesine yol açar. Louvre'u ziyaret eden turistlerin en büyük şaşkınlığı, kurşun geçirmez cam arkasındaki bu dünyaca ünlü eserin aslında küçücük bir tahta pano olduğunu görmektir." },
  { kategori: "Biyoloji & Evrim", soru: "Zürafaların boyunları, yüksek yaprakları yemek için boyunlarını esnetip bu uzunluğu yavrularına aktarmasıyla mı uzamıştır?", cevap: "Hayır, bu çürütülmüş Lamarckçı evrim anlayışıdır.", aciklama: "Modern evrim (Darwinizm) böyle işlemez. Eski çağlarda hem kısa hem uzun boyunlu zürafalar bir arada yaşıyordu. Kıtlık dönemlerinde yerdeki otlar kuruyunca yalnızca genetik olarak uzun doğanlar yüksek yapraklara ulaşıp hayatta kaldı ve üredi." },
  { kategori: "Sağlık & Veterinerlik", soru: "Köpeklerin ağzı antiseptik özelliklere sahip olduğu için bir insanın ağzından daha mı temizdir?", cevap: "Hayır, köpek ağzında insanlarınkinden sayıca fazla ve tehlikeli bakteriler bulunur.", aciklama: "Köpekler tüm yüzeyleri ağızlarıyla temizler; ağızları Capnocytophaga ve Pasteurella gibi ciddi enfeksiyonlara yol açabilecek bakterilerle doludur. Sadece bu bakterilerin çoğu insanlara kolayca bulaşmadığı için böyle bir temizlik efsanesi oluşmuştur." },
  { kategori: "Teknoloji & Sağlık", soru: "5G baz istasyonları ve radyo dalgaları Covid-19 gibi virüsleri havadan insanlara yayabilir mi?", cevap: "Hayır, virüsler radyo dalgaları üzerinden taşınamaz.", aciklama: "Virüsler yaşamak ve yayılmak için kan veya tükürük gibi fiziksel bir ortama ihtiyaç duyan biyolojik yapılardır. 5G yalnızca bir radyo frekansıdır; Wi-Fi veya TV yayını gibi biyolojik materyal ışınlaması imkansızdır." },
  { kategori: "Spor & Egzersiz", soru: "Spora başlamadan önce kasları sabit tutarak germek (statik esneme) sakatlıkları önler mi?", cevap: "Hayır, soğuk kaslara yapılan statik esneme güç kaybına yol açar ve sakatlık riskini artırır.", aciklama: "Kaslar ısınmamışken zorla gerilmek mikro yırtıklara zemin hazırlar. Antrenman öncesi kalp atışını yavaşça yükselten dinamik ısınma hareketleri yapılmalıdır; statik esneme yalnızca antrenman sonrasında kaslar sıcakken uygulanmalıdır." },
  { kategori: "Tıp & İlk Yardım", soru: "Bacağa kramp girdiğinde o bölgeye iğne batırmak krampı geçirir mi?", cevap: "Hayır, iğne batırmanın fizyolojik hiçbir faydası yoktur ve cilt dokusuna zarar verir.", aciklama: "Kramp, kas liflerinin yorgunluk veya elektrolit dengesizliğiyle istemsiz kasılı kalmasıdır. İğnelemek bu sinirsel kasılmayı durdurmaz. Doğru tedavi, kası nazikçe ters yönde germek (stretching) ve hafifçe masaj yapmaktır." },
  { kategori: "Psikoloji & Beyin", soru: "Bir sayfayı kamera gibi zihnine kayıt eden 'fotografik hafızalı' yetişkin insanlar var mıdır?", cevap: "Hayır, gerçek anlamda fotografik hafızanın varlığına dair hiçbir klinik kanıt yoktur.", aciklama: "Çok nadir bazı çocuklarda geçici görsel hafıza üstünlüğü görülse de yetişkinliğe taşınmaz. Binlerce rakam veya iskambil destesi ezberleyen hafıza şampiyonları doğuştan özel değildir; 'Hafıza Sarayı' (Loci Metodu) gibi zihinsel kodlama tekniklerini uygularlar." },
  { kategori: "Biyoloji & Evrim", soru: "Evrim teorisine göre canlılar nesiller geçtikçe daha gelişmiş ve mükemmel canlılara mı dönüşürler?", cevap: "Hayır, evrimin belirli bir son hedefi veya 'mükemmelleşme' gayesi yoktur.", aciklama: "Evrim yalnızca organizmaların bulundukları çevreye 'uyum sağlamasını' ödüllendirir. Gerektiğinde canlılar özellik kaybederek de evrimleşebilir; örneğin karanlık mağaralarda yaşayan balıklar enerji tasarrufu için nesiller içinde gözlerini tamamen yitirebilir." },
  { kategori: "Tıp & Hemşirelik", soru: "Damar yolundan (IV) giren minik bir hava kabarcığı insanı anında öldürür mü?", cevap: "Hayır, küçük hava kabarcıkları kan dolaşımında çözülür veya akciğerlerde emilir.", aciklama: "Ölümcül hava embolisi için damar içine tek seferde yaklaşık 50-100 ml havanın hızla girmesi gerekir. Serumdaki ufak bir kabarcık tamamen zararsızdır; akciğerler bu küçük miktarı kolaylıkla elimine eder." },
  { kategori: "Ağız ve Diş Sağlığı", soru: "Diş fırçalamadan önce fırçayı ve macunu suyla ıslatmak daha iyi temizlik sağlar mı?", cevap: "Hayır, fırçayı ıslatmak macunun aşındırıcı ve temizleyici etkisini zayıflatır.", aciklama: "Diş macunu, diş yüzeyindeki plağı mekanik olarak sökmek için formüle edilmiştir. Önceden suyla ıslatmak macunu seyreltir, gereksiz fazla köpürtür ve sürtünme etkisini azaltarak temizliği verimsizleştirir." },
  { kategori: "Yazılım & Kodlama", soru: "HTML ve CSS, Python veya C++ gibi birer programlama dili midir?", cevap: "Hayır, bunlar programlama değil işaretleme (markup) ve biçimlendirme dilleridir.", aciklama: "Programlama dili olabilmek için değişkenler, döngüler ve mantıksal karar yapıları (if/else) gerekir. HTML sayfanın iskeletini çizer, CSS ise biçimlendirir; tek başlarına hesaplama veya mantık yürütemezler." },
  { kategori: "Teknoloji & Donanım", soru: "Oyun oynarken işlemcinin (CPU) ya da ekran kartının (GPU) 80-85 dereceye çıkması donanımı yakar mı?", cevap: "Hayır, modern donanımlar bu sıcaklıklarda güvenle tam performans verecek şekilde tasarlanmıştır.", aciklama: "Güncel işlemciler ve ekran kartları 80-90 derece aralığını normal çalışma sıcaklığı kabul eder. Gerçekten tehlikeli bir sınıra (genellikle 95-105°C) ulaşırlarsa otomatik olarak hızlarını düşürürler (Thermal Throttling) — yanmadan önce kendilerini korurlar." },
  { kategori: "Spor & Boks", soru: "Boks eldivenleri rakibin aldığı hasarı azaltmak ve onu korumak için mi icat edilmiştir?", cevap: "Hayır, asıl amaç vuran boksörün el kemiklerinin kırılmasını önlemektir.", aciklama: "İnsan kafatası çok serttir; eldeki ince metakarpal kemikler ise kolayca kırılır. Eldiven, boksörün yumruğunu koruyarak rakibin kafasına tam güçle tekrar tekrar vurabilmesini mümkün kılar. Paradoks olarak eldiven, sporu rakip için daha tehlikeli hale getirmiştir." },
  { kategori: "Spor & Futbol", soru: "Penaltıda top direkten dönerse, vuruşu yapan oyuncu direkten gelen topa tekrar vurabilir mi?", cevap: "Hayır, top başka bir oyuncuya temas etmeden aynı oyuncu üst üste iki kez vuramaz.", aciklama: "FIFA kurallarına göre penaltı atışından sonra top direğe ya da kaleciye çarparak dönse de, vuran oyuncu ikinci kez topa dokunamazsa bu faul kabul edilir. Topun oyuna girmesi için başka bir oyuncuya temas etmesi gerekir." },
  { kategori: "Tıp & Ateş", soru: "Hastalıkta ateş çıktığında titremek, dışarının soğuk olmasından mı kaynaklanır?", cevap: "Hayır, titreme bedenin ısısını yükseltmek için kasları kasıp iş yaptırdığı bir mekanizmadır.", aciklama: "Bağışıklık sistemi enfeksiyona karşı savaşmak için vücut sıcaklığını yükseltmek ister. Titreme kasların hızlı kasılıp gevşemesiyle ısı üretme yoludur. Ortam sıcaklığıyla değil, beynin hedeflediği vücut sıcaklığıyla ilgilidir." },
  { kategori: "Ağız ve Diş Sağlığı", soru: "Diş ipi kullanırken dişetleri kanaması, diş ipinin zararlı olduğunun işareti midir?", cevap: "Hayır, kanama genellikle diş ipini hiç kullanmamaktan kaynaklanan iltihaplanmanın belirtisidir.", aciklama: "Plak birikimi dişetlerinde iltihaplanmaya neden olur ve bu iltihaplanmış dokular diş ipi dokunuşunda kolayca kanar. Düzenli diş ipi kullanımıyla iltihap geçtikçe kanama da azalır ve durur. Kanama diş ipini bırakmak için değil, daha düzenli kullanmak için bir işarettir." },
  { kategori: "Tıp & İlk Yardım", soru: "Yaraya oksijenli su (hidrojen peroksit) dökmek yara iyileşmesini hızlandırır mı?", cevap: "Hayır, oksijenli su sağlıklı dokuları da tahrip ederek iyileşmeyi yavaşlatır.", aciklama: "Hidrojen peroksitin köpürmesi etkileyici görünse de köpük, bakterilerin yanı sıra yaranın iyileşmesi için gerekli olan fibroblast ve beyaz kan hücrelerini de öldürür. Modern tıp yara bakımında oksijenli su kullanımını önermez; serum fizyolojik ile yıkama yeterlidir." },
  { kategori: "Yazılım & Kodlama", soru: "Açık kaynak kodlu (open source) yazılımlar her zaman ücretsiz olmak zorunda mıdır?", cevap: "Hayır, açık kaynak lisans türüne göre ücretli de olabilir; 'açık kaynak' kaynak kodunun erişilebilir olması demektir.", aciklama: "Open Source Initiative'in tanımına göre açık kaynak, kaynak kodunun incelenebilir, değiştirilebilir ve dağıtılabilir olması anlamına gelir. Ücretsizlik ise ayrı bir kavramdır. Red Hat Enterprise Linux gibi pek çok açık kaynak ürün ücretli destek ve lisansla satılır." },
  { kategori: "Tarih", soru: "Çin Seddi, Moğol istilalarını durdurmak amacıyla inşa edilip bu işlevi başarıyla yerine getirmiş midir?", cevap: "Hayır, Moğollar Seddi defalarca aşmış; hatta bazı bölümleri anlaşma yoluyla geçmiştir.", aciklama: "Çin Seddi farklı dönemlerde farklı hanedanlar tarafından kısmen inşa edilmiştir. Cengiz Han'ın orduları Seddi birden fazla kez aştı. Asıl işlevi düşmanı durdurmak değil, küçük çaplı akınları yavaşlatmak, sinyalleşme ve sınır gözetimiydi." },
  { kategori: "Uzay & Havacılık", soru: "Uzay araçları atmosfere girerken sürtünme nedeniyle ateş topuna mı dönüşür?", cevap: "Hayır, ısının asıl kaynağı sürtünme değil, aracın önünde sıkışan havanın sıkıştırılarak ısınmasıdır.", aciklama: "Atmosfere giren uzay aracı hava moleküllerini o kadar hızlı iter ki önündeki hava sıkışıp adyabatik olarak ısınır. Bu 'havayı sıkıştırma' etkisi, sürtünme ısısının çok üzerinde sıcaklıklara ulaşır. NASA'nın ısı kalkanları bu sıkıştırma ısısına karşı tasarlanmıştır." },
  { kategori: "Afet & Güvenlik", soru: "Deprem sırasında kapı eşiğinde durmak en güvenli korunma yöntemi midir?", cevap: "Hayır, modern yapılarda kapı çerçeveleri özellikle güçlü değildir ve bu yöntem tehlikelidir.", aciklama: "Bu inanç, kapı söveleri diğer duvarlardan daha sağlam olan eski adobe (kerpiç) yapılardan kalmadır. Modern binalarda kapı çerçevesinin özel bir direnci yoktur. FEMA ve deprem uzmanları 'Eğil-Kapan-Tutun' yöntemini (sağlam masa altı gibi) önermektedir." },
  { kategori: "Tarih & Arkeoloji", soru: "Mısır piramitlerinin içi, definecilerden korumak için ölümcül zehirli tuzaklarla dolu mudur?", cevap: "Hayır, arkeolojik kazılarda böyle tuzak mekanizmalarına dair hiçbir kanıt bulunamamıştır.", aciklama: "Firavun mezarlarındaki ölümler genellikle Aspergillus gibi küfler, bozulmuş hava koşulları veya kötü şansa bağlıdır. 'Tutankhamun'un laneti' de 1920'lerin medyasının yarattığı bir mittir; Howard Carter ekibinin çoğu üyesi uzun yıllar yaşadı." },
  { kategori: "Gıda & Bilim", soru: "Çekirdeksiz üzüm ve portakal gibi meyveler genetiği değiştirilmiş organizmalar (GDO) mıdır?", cevap: "Hayır, çekirdeksiz meyveler yüzyıllardır bilinen geleneksel ıslah ve aşılama yöntemleriyle üretilir.", aciklama: "Çekirdeksizlik (partenokarpi) doğada da oluşabilen bir özelliktir. İnsanlık bu özelliği taşıyan bitkileri binlerce yıldır çelik ve aşılama yoluyla çoğaltmaktadır. GDO ise laboratuvarda belirli genlerin kasıtlı olarak eklenmesi veya çıkarılmasını gerektirir; bu meyvelerde böyle bir işlem yapılmamıştır." },
  { kategori: "Astronomi", soru: "Uzayda gerçekleşen süpernova patlamaları korkunç bir gürültü çıkarır mı?", cevap: "Hayır, uzay neredeyse tam bir vakumdur; ses dalgasını iletecek yeterli madde yoktur.", aciklama: "Ses, titreşim iletmek için yoğun bir ortama ihtiyaç duyar. Uzayın neredeyse tam vakum olan ortamında bu iletim gerçekleşemez. Yıldızlararası gaz bulutlarında teknik olarak çok düşük frekanslı ses dalgaları oluşabilse de insan kulağının duyabileceği bir ses yoktur." },
  { kategori: "Malzeme Bilimi", soru: "Cam üretimi için yalnızca kumun eritilmesi yeterli midir?", cevap: "Hayır, saf silis kumunun erime noktası yaklaşık 1700°C olup cam üretimi için ek kimyasallar gereklidir.", aciklama: "Soda-kireç camı üretiminde silis kumuna soda külü ve kireçtaşı eklenerek erime noktası yaklaşık 1100-1200°C'ye düşürülür. Renk, dayanıklılık ve özellik için demir oksit, bor ve kurşun gibi katkılar da kullanılır." },
  { kategori: "Hayvanlar & Biyoloji", soru: "Bukalemunlar çevrenin rengini taklit etmek için kamuflaj amacıyla mı renk değiştirirler?", cevap: "Hayır, renk değişimlerinin asıl amacı duygusal durum, iletişim ve vücut ısısını düzenlemektir.", aciklama: "Bukalemunun derisi altında nano kristal yapılar bulunur; bu kristaller genişleyip daralarak farklı ışık dalgaboylarını yansıtır. Renk değişimi ağırlıklı olarak diğer bukalemunlara mesaj verme (tehdit, çiftleşme isteği) ve güneş ışığını emme-yansıtma ile ilgilidir. Kamuflaj ikincil bir yan etkidir." },
  { kategori: "Tıp & Farmakoloji", soru: "Baş ağrısı için aldığımız ağrı kesici, ilacı sadece ağrıyan başa mı gönderir?", cevap: "Hayır, ağrı kesiciler tüm kan dolaşımına karışır; vücudun belirli bir noktasını hedef alamazlar.", aciklama: "İbuprofen veya parasetamol gibi ilaçlar, mide-bağırsak sisteminden emilerek kan yoluyla tüm vücuda dağılır. Ağrıyı, prostaglandin sentezini engelleyerek veya merkezi sinir sisteminde ağrı sinyallerini azaltarak giderir. Sadece ağrıyan yere gitme kavramı biyolojik olarak mümkün değildir." },
  { kategori: "Teknoloji & Elektronik", soru: "Pilleri buzdolabında saklamak onların ömrünü uzatır mı?", cevap: "Hayır, modern alkalin ve lityum pilleri için soğuk depolama gereksiz, hatta zararlı olabilir.", aciklama: "Eski karbon-çinko piller için hafif bir fayda sağlasa da günümüzün alkalin pilleri oda sıcaklığında (yaklaşık 15-25°C) en iyi saklanır. Buzdolabındaki nem yüzey oksidasyonuna ve terminallerde korozyona yol açabilir. Pilleri dolaba koyduğunuzda kullanmadan önce oda sıcaklığına getirirken yoğuşma da sorun yaratır." },
  { kategori: "Astronomi & Fizik", soru: "Güneş'in ışığı sarı renkli midir?", cevap: "Hayır, Güneş beyaz ışık yayar; sarı renk atmosferin kısa dalga boylarını dağıtmasından kaynaklanır.", aciklama: "Uzaydan bakıldığında Güneş neredeyse mükemmel beyaz görünür. Atmosferden geçerken kısa dalga boylu mavi ışık dağıldığı (Rayleigh saçılması) için gökyüzü mavi, Güneş ise sarımsı görünür. Öğle vakti dik açıyla geçtiğinde Güneş en az dağılımla en beyaz görünür." },
  { kategori: "Sağlık & Göz", soru: "Televizyonu çok yakından izlemek miyop (kısa görürlük) gelişimine yol açar mı?", cevap: "Hayır, yakından TV izlemek göz yorgunluğu yaratır ancak miyop gelişiminin doğrudan nedeni değildir.", aciklama: "Miyopi genetik yatkınlık ve uzun süreli yakın mesafe çalışmasıyla ilişkilidir, ancak TV'yi yakından izlemek başlı başına kalıcı görme hasarı yaratmaz. Çocukların TV'ye yakın oturması, onların zaten kısa görüşlü olduğuna işaret edebilir — neden değil, semptom olabilir." },
  { kategori: "Fizik & Kimya", soru: "Su her koşulda 100°C'de kaynar mı?", cevap: "Hayır, suyun kaynama noktası basınca göre değişir; yüksek rakımlarda 100°C'nin altında kaynar.", aciklama: "Kaynama noktası, suyun buhar basıncının atmosfer basıncına eşit olduğu sıcaklıktır. Everest zirvesinde su yaklaşık 70°C'de kaynar; bu yüzden dağda yemek pişirmek çok daha uzun sürer. Düdüklü tencere tam tersi şekilde basıncı artırarak suyu 100°C'nin üzerinde kaynatır." },
  { kategori: "Teknoloji & İnternet", soru: "Dark Web, internetin yüzde 90'ından fazlasını oluşturan kısmın adı mıdır?", cevap: "Hayır, internetin büyük kısmını Deep Web oluşturur; Dark Web onun çok küçük bir alt kümesidir.", aciklama: "Deep Web, arama motorlarının indexlemediği her türlü içeriktir (e-posta, banka hesapları, özel veritabanları). Dark Web ise yalnızca Tor gibi özel yazılımlarla erişilebilen çok daha küçük bir bölümdür. İkisi sık sık karıştırılır ama Dark Web yasadışı içeriklerin tamamı değil, çok daha küçük bir katmandır." },
  { kategori: "Havacılık", soru: "Uçak yolcu koltuğu camlarındaki küçük delik bir üretim hatası mıdır?", cevap: "Hayır, bu delik kasıtlı tasarlanmıştır; basınç dengeleme ve nem kontrolü işlevi görür.", aciklama: "Uçak camları üç katmandan oluşur; ortadaki katmandaki bu delik ('breather hole') kabin ile dış ortam arasındaki basınç farkını orta katmana taşır, böylece basınç yükü en dıştaki sağlam kata biner. Aynı zamanda katmanlar arasındaki nemi dışarı atarak camın buğulanmasını önler." },
  { kategori: "Sağlık & Mitler", soru: "Parmakları kütletmek eklemlerde kireçlenmeye (artrit) yol açar mı?", cevap: "Hayır, onlarca yıllık araştırmalar parmak kütletme ile artrit arasında hiçbir bağlantı olmadığını göstermiştir.", aciklama: "Eklem sıvısındaki gaz kabarcıklarının patlamasından kaynaklanan bu ses tamamen zararsızdır. Bir doktor yıllarca bir elinin parmaklarını kütletip diğerini kütletmeyerek öz-deney yapmış ve iki el arasında artrit açısından hiçbir fark bulamamıştır." },
  { kategori: "Astronomi", soru: "Mevsimler, Dünya'nın yılın farklı dönemlerinde Güneş'e yakın ya da uzak olmasından mı kaynaklanır?", cevap: "Hayır, mevsimler Dünya'nın 23,5 derecelik eksen eğiminden kaynaklanır.", aciklama: "Kuzey Yarımküre'nin kışında Dünya aslında Güneş'e daha yakındır. Mevsimi belirleyen mesafe değil, eksen eğimi nedeniyle güneş ışınlarının yüzeye çarpma açısıdır. Yaz aylarında güneş ışınları dik açıyla gelir ve birim alana daha fazla enerji aktarır." },
  { kategori: "Gıda & Sağlık", soru: "Havuç yemek gece görmeyi artırır mı?", cevap: "Hayır, normal bir diyetle A vitamini ihtiyacını karşılayan biri için havuç ekstra bir fayda sağlamaz.", aciklama: "A vitamini eksikliği gerçekten gece körlüğüne yol açar ve havuç bu vitaminin karotinden zengin bir kaynağıdır. Ancak bu bilginin yayılması kısmen İkinci Dünya Savaşı'nda İngiltere'nin radar teknolojisini gizlemek için yaydığı propagandayla ilişkilidir. Yeterli A vitaminine sahip birinin havuç yemesi görme keskinliğini artırmaz." },
  { kategori: "Genetik", soru: "İki mavi gözlü ebeveynin kahverengi gözlü çocuğu olması genetik açıdan imkânsız mıdır?", cevap: "Hayır, nadir de olsa mümkündür; göz rengi birden fazla gen tarafından belirlenir.", aciklama: "Göz rengi okul kitaplarında anlatıldığı gibi tek bir genin basit baskın/çekinik meselesi değildir; OCA2, HERC2 ve daha pek çok gen rol oynar. İki mavi gözlü ebeveynin, dormant kahverengi gen kombinasyonları taşıması durumunda kahverengi gözlü çocuğu olabilir." },
  { kategori: "Teknoloji & Ses", soru: "Mikrofon üzerindeki sünger kılıf, P ve B gibi patlama seslerini önleyen bir pop filter mıdır?", cevap: "Hayır, sünger kılıflar rüzgar gürültüsüne karşı koruma sağlar; stüdyo pop filtreleri ise ayrı bir ekipmandır.", aciklama: "Mikrofonlardaki sünger kılıf (windscreen), açık alanda rüzgarın neden olduğu gürültüyü azaltmak için tasarlanmıştır ve patlama sesleri için yeterli değildir. Stüdyo kayıtlarında mikrofon önüne yerleştirilen ayrı pop filter (metal ya da naylon ağ), nefes ve patlama seslerini etkili şekilde filtreler." },
  { kategori: "Hayvanlar", soru: "Köpekler ter bezi olmadığı için dillerini çıkararak serinler mi?", cevap: "Hayır, köpeklerin pençe tabanlarında ter bezleri vardır; dil çıkarma ısı düzenlemenin ana yoludur ama ter bezi yokluğu nedeniyle değildir.", aciklama: "Köpeklerin merokrin ter bezleri pençe altlarında bulunur. Ağızlarını açık tutarak (panting) buharlaşmayla soğumaları ise terlemeye ek olan başlıca termoregülasyon yöntemidir. Yani ter bezleri var, ancak insan gibi tüm vücut yüzeyinde değil." },
  { kategori: "Tarih", soru: "Titanik, White Star Line tarafından 'asla batmaz' sloganıyla pazarlanmış mıdır?", cevap: "Hayır, bu ifade Titanik için resmi olarak hiçbir zaman kullanılmamış; bir dergi haberiyle başlayan bir efsanedir.", aciklama: "1911 tarihli The Shipbuilder dergisi, Titanik'in su geçirmez bölmelerini 'neredeyse batmaz' olarak nitelendirmiştir. 'Asla batmaz' ifadesi ise felaketten sonra yayılan ve White Star Line'a atfedilen asılsız bir söylemdir." },
  { kategori: "Meteoroloji", soru: "Yıldırım aynı yere iki kez düşmez mi?", cevap: "Hayır, yıldırım yüksek ve iletken yapılara tekrar tekrar düşebilir; Empire State Building yılda onlarca kez çarpar.", aciklama: "Yıldırım her zaman en kısa ve en iletken yolu izler. Yüksek bir bina ya da ağaç bu koşulları her fırtınada tekrar sağlar. New York'taki Empire State Building yılda ortalama 20-25 kez yıldırım darbesi alır. Paratoner sistemleri de bu gerçeklik üzerine kurulu mühendislik çözümleridir." },
  { kategori: "Coğrafya", soru: "Dünyanın en yüksek dağı her ölçütte Everest midir?", cevap: "Hayır, deniz seviyesinden en yüksek zirve Everest'tir; ancak tabanından en yüksek dağ Mauna Kea, Dünya merkezinden en uzak zirve ise Chimborazo'dur.", aciklama: "Everest 8848 m ile deniz seviyesinden en yüksek noktadır. Mauna Kea ise tabanı okyanusun derinliklerinde olduğu için toplam yüksekliği yaklaşık 10.210 m ile Everest'i geçer. Chimborazo, Ekvador'daki konumu sayesinde Dünya'nın şişkin merkezine en uzak noktadır." },
  { kategori: "Teknoloji & Araçlar", soru: "Arabanın gösterge panelindeki hız saatinin gösterdiği en yüksek değer, aracın gerçek maksimum hızı mıdır?", cevap: "Hayır, hız göstergesi kadranı yasal sorumluluk veya pazarlama nedeniyle gerçek maksimumun üzerinde gösterilebilir.", aciklama: "Üreticiler hız göstergelerini çoğunlukla aracın gerçek mekanik limitinin üzerinde tasarlar. Bunun yanı sıra birçok ülkede araçlara elektronik hız sınırı (limiter) uygulanır: Almanya'daki pek çok araç 250 km/s'de elektronik olarak sınırlanır, gösterge ise 300'ü gösterebilir." },
  { kategori: "Tarih", soru: "Giyotin, Fransız Devrimi dönemine ait tarihi bir idam aleti olup çok önceden kullanım dışı bırakılmış mıdır?", cevap: "Hayır, Fransa giyotini resmi idam yöntemi olarak 1977 yılına kadar kullandı.", aciklama: "Son giyotin infazı 10 Eylül 1977'de gerçekleşti — bu Star Wars'ın vizyona girdiği yıldır. Fransa idam cezasını ancak 1981'de kaldırdı. Giyotin, devrimden yaklaşık 185 yıl sonrasına kadar yürürlükte kaldı." },
  { kategori: "Havacılık", soru: "Havada uçuş sırasında yolculardan biri uçak kapısını açabilir mi?", cevap: "Hayır, uçuş yüksekliğinde iç ve dış basınç farkı nedeniyle kapıyı açmak fiziksel olarak imkânsızdır.", aciklama: "Uçuş irtifasında kabin içi ve dış basınç arasındaki fark, kapıya binlerce kilogram ağırlığına eşdeğer kuvvet uygular. Kapılar ayrıca içe açılan veya önce içe çekilerek döndürülen mekanizmalarla tasarlanmıştır. Tek bir insanın bu kuvvete karşı kapıyı açması fiziksel olarak mümkün değildir." },
  { kategori: "Biyoloji & Adli Bilimler", soru: "Parmak izi her insanda yüzde yüz benzersiz olduğu bilimsel olarak kesin biçimde kanıtlanmış mıdır?", cevap: "Hayır, her parmak izinin benzersiz olduğu bilimsel bir aksiyom değil, deneysel bir varsayımdır; henüz tam olarak kanıtlanmamıştır.", aciklama: "Bugüne kadar iki kişide tamamen aynı parmak izi bulunamamıştır. Ancak 8 milyar insanın parmak izinin karşılaştırıldığı kapsamlı bir çalışma mevcut değildir. 2024'te yapılan bir yapay zeka çalışması, aynı kişinin farklı parmak izlerinin daha önce sanıldığından çok daha benzer olduğunu gösterdi." },
  { kategori: "Hayvanlar", soru: "Kara sinekler (Musca domestica) yalnızca 24 saat yaşar mı?", cevap: "Hayır, ortalama ev sineğinin ömrü yaklaşık 28 gündür.", aciklama: "Bu yanlış inanç mayıs sineği (Ephemeroptera takımından) ile ev sineğinin karıştırılmasından kaynaklanır. Mayıs sineklerinin erişkin dönemi gerçekten birkaç saat ila birkaç gün sürer. Ev sineği ise sıcaklık ve besin kaynağına bağlı olarak 15-30 gün arasında yaşar." },
  { kategori: "Tarih", soru: "Kristof Kolomb, Dünya'nın yuvarlak olduğunu ispatlamak amacıyla yolculuğa çıkmış mıdır?", cevap: "Hayır, Kolomb'un amacı Asya'ya batıdan deniz yolu bulmaktı; Dünya'nın yuvarlak olduğu zaten biliniyordu.", aciklama: "Eratosthenes, MÖ 240'ta Dünya'nın yuvarlak olduğunu hesaplamış ve çevresini şaşırtıcı bir doğrulukla ölçmüştü. Kolomb döneminde eğitimli her Avrupalı Dünya'nın küresel olduğunu biliyordu. Asıl tartışma boyutuydu; Kolomb boyutu küçümsemişti ve Amerika kıtasına rastlamasaydı açlıktan ölecekti." },
  { kategori: "Müzik & Tarih", soru: "Beethoven doğuştan sağır olduğu için müziği hissederek bestelemiş midir?", cevap: "Hayır, Beethoven doğuştan sağır değildi; işitme kaybı yaklaşık 26-28 yaşında başladı ve giderek ilerledi.", aciklama: "Beethoven hayatının ilk yarısını tamamen işiten biri olarak geçirdi. İşitme kaybı muhtemelen tifüs, kurşun zehirlenmesi veya otoimmün hastalıktan kaynaklandı. 9. Senfoniyi bestelediğinde tamamen sağırdı ancak piyanoyu titreşimlerle hissederek ve müzikal hafızasını kullanarak çalışıyordu." },
  { kategori: "Biyoloji & Sağlık", soru: "Vücuttaki tüm bakteriler hastalığa yol açan zararlı mikroorganizmalar mıdır?", cevap: "Hayır, insan mikrobiyomu trilyonlarca bakteri içerir ve büyük çoğunluğu sağlık için yararlı ya da nötrdür.", aciklama: "İnsan vücudunda bakteri hücresi sayısı insan hücresi sayısına yaklaşık eşittir. Bağırsak mikrobiyomu sindirime yardımcı olur, B ve K vitaminleri üretir, bağışıklık sistemini düzenler ve patojen bakterilere karşı rekabet ederek koruma sağlar. Antibiyotikler bu dengeyi bozduğu için dikkatli kullanılmalıdır." },
  { kategori: "Teknoloji & Bilişim", soru: "Bir dosyayı çöp kutusundan da sildikten sonra bilgisayardan tamamen yok olur mu?", cevap: "Hayır, dosya içeriği diskte kalmaya devam eder; yalnızca o alanın 'boş' olarak işaretlendiği dosya sistemi kaydı silinir.", aciklama: "İşletim sistemi dosyayı silerken disk üzerindeki veriyi değil, yalnızca dizin girişini kaldırır ve alanı kullanılabilir olarak işaretler. Üzerine yeni veri yazılana kadar eski veri kurtarılabilir. Bu yüzden adli bilişim uzmanları 'silinen' dosyaları geri getirebilir; hassas verilerin güvenli silinmesi için özel yazılımlar kullanmak gerekir." },
  { kategori: "Astronomi", soru: "Gezegenler Güneş'in etrafında mükemmel daireler çizerek döner mi?", cevap: "Hayır, tüm gezegenlerin yörüngeleri elips şeklindedir; bu Kepler'in birinci yasasıdır.", aciklama: "Kepler, 17. yüzyılda gezegen yörüngelerinin eliptik olduğunu kanıtladı; Güneş ise elipsin bir odak noktasında yer alır. Dünya'nın Güneş'e en yakın olduğu nokta ile en uzak noktası arasında yaklaşık 5 milyon km fark vardır. Venüs neredeyse dairesel, Merkür ve Mars ise daha belirgin elips çizer." },
  { kategori: "Tıp & İlk Yardım", soru: "Yara üzerine alkol ya da kolonya dökmek yarayı sterilize ederek iyileşmesini hızlandırır mı?", cevap: "Hayır, alkol sağlıklı dokuları da tahrip eder ve yara iyileşmesini geciktirir.", aciklama: "Alkol, yara bölgesindeki hem bakterileri hem de doku onarımı için hayati önem taşıyan fibroblastları ve beyaz kan hücrelerini öldürür. Dünya Sağlık Örgütü ve modern tıp yara bakımında alkol kullanımını önermez. Temiz akan su veya serum fizyolojik ile yıkamak yeterli ve çok daha az tahriş edicidir." },
  { kategori: "Coğrafya & Siyaset", soru: "Büyük Britanya ile Birleşik Krallık aynı anlama mı gelir?", cevap: "Hayır, Büyük Britanya bir ada (İngiltere, Galler, İskoçya); Birleşik Krallık ise buna Kuzey İrlanda'nın da eklendiği siyasi devlettir.", aciklama: "Büyük Britanya coğrafi bir terimdir ve Avrupa'nın dokuzuncu büyük adasını ifade eder. Birleşik Krallık (UK) ise dört ülkeden oluşan bir devlettir: İngiltere, Galler, İskoçya ve Kuzey İrlanda. 'İngiliz Adaları' terimi ise İrlanda Cumhuriyeti'ni de kapsar." },
  { kategori: "Psikoloji & Eğitim", soru: "İnsanların görsel, işitsel ya da kinestetik gibi belirli öğrenme stillerine sahip olduğu ve buna göre öğretim yapılması gerektiği bilimsel bir gerçek midir?", cevap: "Hayır, öğrenme stilleri teorisi onlarca yıllık araştırmada bilimsel destek bulamamıştır.", aciklama: "VAK (Görsel-İşitsel-Kinestetik) modeli ve benzerleri eğitimde popülerdir ancak kontrollü çalışmalar insanların tercih ettikleri stile göre öğretim yapıldığında öğrenmenin anlamlı biçimde iyileşmediğini göstermiştir. Öğrencilere çok modlu ve zengin içerik sunmak, onları tek bir stile göre kategorize etmekten çok daha etkilidir." },
  { kategori: "Biyoloji & Anatomi", soru: "Kemikler, vücudu destekleyen cansız ve statik kalsiyum sütunları mıdır?", cevap: "Hayır, kemikler sürekli yenilenen canlı dokulardır ve çok sayıda hayati işlev yerine getirir.", aciklama: "Kemik, osteoblast (yapıcı) ve osteoklast (yıkıcı) hücrelerinin sürekli çalışmasıyla her 10 yılda bir tamamen yenilenir. Bunun yanı sıra kemikler kan hücreleri üretir, kalsiyum ve fosfor depolar, yağ dokusu barındırır ve endokrin sistem için hormon salgılar. Kırılan kemikler de bu canlılık sayesinde iyileşebilir." }
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

function flashcardGeri() {
  if (window.STANDALONE === 'kartlar') { window.parent.postMessage('oyunKapat', '*'); return; }
  ekranGoster('homeScreen', true);
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
