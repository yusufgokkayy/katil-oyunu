# Katil Kim? 🔍

**Profesyonel Gizem Oyunu - Etkinlikler için Tam Özellikli Dedektif Oyunu**

## 🎭 Oyun Hakkında

"Katil Kim?" şirket etkinlikleri, parti geceler ve eğitici aktiviteler için tasarlanmış profesyonel bir gizem çözme oyunudur. Takımlar dedektif rolüne bürünerek ipuçlarını keşfeder, şüphelileri sorgular ve katili bulmaya çalışır.

### Ana Senaryo: Konakta Cinayet

Ünlü işadamı Mehmet Konak'ın villasında verilen yemekte bir cinayet işlendi. Kurban: İş ortağı Ayşe Demir. Takımınız bu cinayeti çözmeye çalışan dedektiflerdir.

**5 Şüpheli:**
- Mehmet Konak (Ev Sahibi)
- Zeynep Yıldız (Avukat)
- Can Arslan (İş Ortağı)
- Elif Kaya (Aşçı)
- Ali Şen (Güvenlik)

**6 Lokasyon:**
- Yemek Salonu, Mutfak, Bahçe, Oturma Salonu, Üst Kat, Garaj

## ✨ Özellikler

### 🎮 Oyun Mekanikleri

- **Faz Sistemi**: Oyun 4 faza bölünmüş, her faz farklı ipuçları sunar
  - Faz 1: Olay Yeri İncelemesi (5 dakika)
  - Faz 2: Tanık İfadeleri (5 dakika)
  - Faz 3: Derinlemesine Araştırma (5 dakika)
  - Faz 4: Final Dedüksiyonu (3 dakika)

- **İpucu Keşif Sistemi**: 10 farklı ipucu, fazlara göre kademeli açılır
  - Temel ipuçları (0 puan)
  - Olay yeri ve tanık ifadeleri (10-15 puan)
  - İlişki ve motiv bilgileri (15-20 puan)
  - Kritik kanıtlar (25-30 puan)

- **Suçlama Mekanizması**: Takımlar katili, silahı ve motifi belirler
  - Doğru suçlama: +100 puan (ilk doğru: +150 puan)
  - Yanlış suçlama: -20 puan
  - Her takım sadece bir kez suçlama yapabilir

- **Canlı Zamanlayıcı**: Her faz için geri sayım sayacı
- **Gerçek Zamanlı Güncelleme**: Socket.IO ile anlık bildirimler
- **Otomatik Puanlama**: İpucu keşifleri ve suçlamalar otomatik puanlanır

### 👥 Takım Yönetimi

- Çoklu takım desteği
- Her takım kendi keşiflerini görür
- Takımlar arası rekabet ve lider tablosu
- Takım durumu kalıcı (sayfa yenilenince devam eder)

### 🎯 Yönetici Paneli

- Oyunu başlatma/durdurma
- Fazlar arası geçiş kontrolü
- Takım puanlarını manuel düzenleme (+10, +5, -5, -10)
- Takım silme ve oyun sıfırlama
- Gerçek zamanlı istatistikler
- Oyun bitiminde çözümü gösterme

### 📱 Arayüz

- Modern, karanlık tema tasarım
- Mobil uyumlu responsive tasarım
- Sorunsuz animasyonlar ve geçişler
- Sezgisel kullanıcı deneyimi
- Emoji ile zenginleştirilmiş içerik

## 🚀 Kurulum

### Gereksinimler
- Node.js 18 veya üzeri

### Yerel Çalıştırma

```bash
# Bağımlılıkları yükle
npm install

# Sunucuyu başlat
npm start
```

Tarayıcıda: http://localhost:3000

### Admin Şifresi

Varsayılan: `260678`

Değiştirmek için environment variable kullanın:
```bash
ADMIN_PASSWORD=yeni_sifre npm start
```

## 🌐 Deployment

### Render.com

1. [render.com](https://render.com) adresine git
2. GitHub ile giriş yap
3. "New" > "Web Service" tıkla
4. Bu repo'yu seç
5. Ayarlar:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables (opsiyonel):**
     - `ADMIN_PASSWORD` = şifreniz

### Railway.app

1. [railway.app](https://railway.app) adresine git
2. "New Project" > "Deploy from GitHub repo"
3. Repo'yu seç, otomatik deploy edilir

### Diğer Platformlar

Node.js destekleyen herhangi bir platform (Heroku, Vercel, DigitalOcean App Platform, vb.)

## 🎲 Nasıl Oynanır?

### Oyuncular İçin

1. **Takım Oluştur/Katıl**: Ana ekrandan takımınızı oluşturun veya mevcut takıma katılın
2. **Senaryoyu İncele**: "Oyun Senaryosu" bölümünden karakterleri ve lokasyonları öğrenin
3. **Oyun Başlasın**: Yönetici oyunu başlattığında ipuçları keşfetmeye başlayabilirsiniz
4. **İpuçları Keşfet**: Her fazda açılan ipuçlarına tıklayarak detayları görün
5. **Suçlama Yap**: Yeterli kanıt topladığınızda katili suçlayın
6. **Kazanın**: En yüksek puanı toplayın veya ilk doğru suçlamayı yapın!

### Yönetici İçin

1. **Giriş Yap**: "Yönetici Paneli"nden şifre ile giriş yapın
2. **Oyunu Başlat**: Takımlar hazır olunca oyunu başlatın
3. **Fazları Yönet**: Her fazın süresini izleyin ve gerekirse manuel geçiş yapın
4. **Takımları İzle**: Hangi takımın ne kadar ipucu keşfettiğini görün
5. **Oyunu Bitir**: Son fazda oyunu bitirin ve çözümü açıklayın

## 🎨 Özelleştirme

### Yeni Senaryo Ekleme

`server.js` dosyasındaki `GAME_SCENARIO` objesini düzenleyin:

```javascript
const GAME_SCENARIO = {
    title: "Senaryonuzun Başlığı",
    description: "Senaryo açıklaması",
    characters: [ /* karakterler */ ],
    locations: [ /* lokasyonlar */ ],
    clues: [ /* ipuçları */ ],
    solution: { /* çözüm */ }
};
```

### Faz Sürelerini Ayarlama

`GAME_SCENARIO.phases` dizisindeki `duration` değerlerini saniye cinsinden değiştirin.

## 🔒 Güvenlik

- Admin paneli şifre korumalı
- Socket.IO bağlantıları güvenli
- XSS koruması mevcut
- Veri localStorage ve server tarafında saklanır

## 📊 Teknik Detaylar

**Backend:**
- Node.js + Express.js
- Socket.IO (gerçek zamanlı iletişim)
- JSON dosya tabanlı veri saklama

**Frontend:**
- Vanilla JavaScript (framework yok)
- Socket.IO Client
- CSS Grid ve Flexbox
- Modern ES6+ syntax

## 🤝 Katkıda Bulunma

Pull request'ler memnuniyetle karşılanır. Büyük değişiklikler için lütfen önce bir issue açın.

## 📝 Lisans

MIT License - İsterseniz kullanın, değiştirin, paylaşın!

## 🎉 Demo & Screenshots

Oyun çalışır durumda ve aşağıdaki özelliklere sahiptir:
- ✅ Takım oluşturma ve katılma
- ✅ Gerçek zamanlı skor tablosu  
- ✅ Fazlı ipucu keşif sistemi
- ✅ Suçlama mekanizması
- ✅ Yönetici kontrol paneli
- ✅ Canlı zamanlayıcı
- ✅ Mobil uyumlu tasarım

---

**İyi Eğlenceler! 🕵️‍♂️🔍**
