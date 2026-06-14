// Günlük Wordle cevap havuzu — yaygın, herkesin bileceği Türkçe 5 harfli kelimeler
const CEVAPLAR = [
  // Aile / İnsanlar
  'ÇOCUK','BEBEK','GELİN','YETİM','KADIN','ERKEK','KOMŞU','ASKER','ŞOFÖR',
  'TERZİ','KASAP','HEKİM','SAVCI','NOTER','KALFA','ŞAMAN',

  // Hayvanlar
  'ASLAN','KÖPEK','TAVUK','ÖRDEK','TİLKİ','TURNA','KUMRU','ŞAHİN','SERÇE',
  'ÇAKAL','HOROZ','SIĞIR','DOMUZ','KARGI','BALIK',

  // Yiyecek / İçecek
  'EKMEK','ÇORBA','PİLAV','KAHVE','ŞEKER','LİMON','KAVUN','MEYVE','BÖREK',
  'TURŞU','ÇEREZ','REÇEL','SALÇA','TUZLU','BİBER','DOLMA',
  'KAKAO','LOKMA','MARUL',

  // Doğa
  'BULUT','DALGA','DENİZ','GÜNEŞ','DUMAN','NEHİR','YAYLA','ÇAYIR','BORAN',
  'ŞAFAK','TOHUM','ÇİMEN',

  // Ev / Eşya
  'DUVAR','TAVAN','PERDE','MAKAS','KALEM','ÇANTA','KAPAK','TABLO','TEPSİ',
  'ÇUVAL','KÜMES','LAMBA','TARAK','KEMAN','DAVUL','TEKNE','FENER',

  // Şehir / Yer
  'SAHİL','BARAJ','TÜNEL','BÖLGE','SOKAK','ÇARŞI','PAZAR','SARAY','LİMAN',
  'YOLCU','SINIR','KANAL','KÖPRÜ','ÇEVRE',

  // Vücut
  'BOYUN','KARIN','BEYİN','BİLEK','BOĞAZ','DAMAR','KEMİK','DUDAK',

  // Duygular / Soyut
  'HAYAT','SEVGİ','SAVAŞ','BARIŞ','DEĞER','KORKU','HÜZÜN','MUTLU','GÜZEL',
  'ÖZLEM','HAYAL','KABUS','CESUR','GÜÇLÜ','ÖZGÜR','TENHA',

  // Meslekler / Toplum
  'DEVİR','DARBE','BASKI','KAVGA','KANUN','HAKİM','TARAF',

  // Madde / Malzeme
  'DEMİR','ALTIN','ÇELİK','ELMAS','KÜREK','KEMİK','TAHTA','HAMUR',
  'REÇEL','ÇAKIL','ZEMİN','KÜREK',

  // Sıfatlar
  'ALÇAK','DONUK','SOLUK','SOYUT','BOYUT','YOĞUN','KÜÇÜK','BÜYÜK',
  'KOLAY','ÇÖKÜK','GARİP','HAFİF','KESİN','KOPUK','BOZUK','NADİR','OLGUN',

  // Eylemden türeyenler / Genel
  'TUZAK','KAFES','KUZEY','ÇİZGİ','ÖNDER','FİLİZ','DEMET','REÇEL',
  'SİVRİ','YÜZEY','UZMAN','TEMEL','DOĞAL','YOLCU','SEFER','KURAL',
  'TABAN','NİŞAN','YIĞIN','ÇEYİZ','ÇIĞIR','BUDAK','KAVAK','KIRIŞ',
  'HASAT','GİYSİ','MİRAS','TESTİ','GÜVEY','DÜĞÜM','BİLGİ','YETKİ',
  'YATAY','DİKEY','SERVİ','ÇINAR','SÖĞÜT','ÇALIM','KEMER','BAŞAK',
  'YULAF','TAŞIT','KOŞUL','NESNE','SERAP','TOPUZ','YIKIM','KAVUK',
  'ZIRVA','ÖZGÜN','KÖYLÜ','SAÇAK','ŞAKAK','DAYAK','TAŞRA','BURGU',
  'ÇATMA','YUMAK','GÜBRE','KAYIN','YUMRU','SÜZME','SAKIN','GEÇİM',

  // Yaygın modern
  'ARABA','EKRAN','MOTOR','KAYAK','YORUM','SALON','ROBOT','MEDYA',
  'MODEL','FORUM','RAPOR','REKOR','RAKAM','RAKET','PARKA','ATLAS',
  'ALKOL','MÜZİK','FİZİK','FİKİR','MESAJ','MARKA','LİDER','LAZER',
  'HEDEF','HAVLU','HARAP','HALKA','HAMLE','HABER','POLİS','PİLAV',
  'POMPA','PAKET','PARÇA','PAPAZ','ÖLÇEK','ÖRNEK','NESİL','NAKİT',
  'NEDEN','MİRAS','MEŞRU','MAKUL','TABAK','TAKİP','TARİH','TENİS',
  'TETİK','TOKAT','TORBA','TÖREN','TÜFEK','TUTKU','ZAFER','SADİK',
  'SAKIZ','SANIK','SEBİL','SERGİ','ŞEHİT','ŞEHİR','ŞIRIN','ŞÜPHE',
  'TABUR','TANGO','TESİS','ORGAN','ORGAN','OYNAK','NAMUS','NİMET',
  'KONUT','KOVAN','LODOS','LÜTUF','LANET','KİLİM','KIRMA','KIYMA',
  'KIZIL','KÖPÜK','KÖKEN','LOKMA','MASAJ','MATEM','MECAZ','ÖLÇÜM',
  'POLAT','PUSAT','REŞİT',

  // Ek
  'SABAH','SABUN','DÜĞÜN','ÇÖZÜM','TOPLU','KAÇAK','TAVAN','ŞARAP',
  'DÜZEY','KÜTÜK','AKŞAM','KANAT','KAZAK','EVRİM','BURUK','TOPAK',
  'YAZAR','KAZAN','KAPAN','TAKAS','HAVAN','MERMİ','KARMA','KEPÇE',
  'KİBAR','KİREÇ','SORUN','SAMAN','ROMAN','RESİM','SAHİL','SAYGI',
  'SERİN','SİLAH','SİNİR','SOMUN','SEHER','SEKİZ','DÜŞÜK','FİTİL',
  'FİYAT','GÖREV','GÜLLE','İFADE','İKLİM','İLHAM','İNANÇ','İNFAZ',
  'İNKAR','İPLİK','İSPAT','İSTEM','İŞLEM','KAHİN','PANİK','UYSAL',
  'UĞRAŞ','URGAN','ÜSTAT','ZALIM','ZORBA','ZULÜM','TAKIM','SIFIR',
  'ABİDE','AKTİF','ANKET','AFYON','BEYAN','EMSAL','ENLEM','ERGİN',
  'ERZAK','EŞARP','GÖÇER','HUSUS','KELAM','LEHÇE','MAVNA','MAYIS',
  'MEBUS','MECAL','DOBRA','DİZİN','DİBEK','MOĞUL',

  // Çok bilinen ek kelimeler
  'KARAR','HAZIR','KAĞIT','VAKIT','ZIRVE','FİDAN','BETON','BIYIK',
  'HEKİM','DENGE','ÇOBAN','COŞKU','CEPHE','CEVAP','BOYUT','BOŞAL',
  'BELDE','BELGE','BELKI','İNSAN','KAĞIT','KALIN','KAŞIF','KAYIŞ',
  'KEPEK','KENAR','KABUL','KABAK','KÜFÜR','KOMŞU','LATİF',
  'MİZAH','MUSKA','PALET','TABLO','YARGI','YAVAŞ',
  'DIĞER','TARAF','HAKİM','ŞAHİN','ÇEVIK','ÇANAK','ÇEKİÇ','ÇOĞUL',
  'ÇORAP','DAMAR','DEFNE','DİKEN','FİLİZ','BARIŞ','KUZEY','ÖZLEM',
];

// 5 harfli olmayanları filtrele (güvenlik ağı)
const CEVAPLAR_TEMIZ = [...new Set(CEVAPLAR)].filter(k => [...k].length === 5);
