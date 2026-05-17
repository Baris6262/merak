const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Her gün Türkiye saatiyle 20:00'de çalışacak görev (Cron Job)
exports.gunlukhatirlatici = onSchedule({
  schedule: '0 20 * * *',
  timeZone: 'Europe/Istanbul',
  region: 'europe-west1'
}, async (event) => {
    const bugun = new Date().toDateString();
    const tokens = [];

    try {
      // Tüm kullanıcıları getir
      const snapshot = await db.collection('users').get();

      snapshot.forEach(doc => {
        const user = doc.data();
        // Eğer kullanıcının FCM token'ı varsa ve bugün GİRMEDİYSE listeye ekle
        if (user.fcmToken && user.sonOyunTarihi !== bugun) {
          tokens.push(user.fcmToken);
        }
      });

      if (tokens.length > 0) {
        const message = {
          notification: {
            title: 'Ateşin sönmek üzere! 🔥',
            body: 'Bugün yeni bir şey öğrenmedin. Serini kaybetmemek için hemen bir quiz tamamla! 🧠'
          },
          tokens: tokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`${response.successCount} bildirim başarıyla gönderildi, ${response.failureCount} hata.`);
      } else {
        console.log('Bugün oynamayan ve token sahibi kullanıcı bulunamadı.');
      }
    } catch (error) {
      console.error('Bildirimler gönderilirken kritik bir hata oluştu:', error);
    }
  });
