# 🔍 Katil Kim? - Dedektif Oyunu

Gerçek zamanlı çok oyunculu katil bulma oyunu. Node.js + Express + Socket.io ile yapıldı.

## 🚀 Kurulum

1. **Node.js'in yüklü olduğundan emin olun** (https://nodejs.org)

2. **Proje klasörüne gidin:**
   ```bash
   cd katil-oyunu
   ```

3. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

4. **Sunucuyu başlatın:**
   ```bash
   npm start
   ```

5. **Tarayıcıda açın:**
   ```
   http://localhost:3000
   ```

## 📱 Kullanım

### Oyuncular için:
- Ana sayfadan **"Yeni Takım Oluştur"** ile takım kurabilirler
- Veya **"Takıma Giriş Yap"** ile mevcut takıma katılabilirler
- Takım sayfasında sadece **ipucu girebilirler**
- Puanları göremezler (sadece admin görür)

### Yönetici için:
- **"Yönetici Paneli"** butonuna tıklayın
- Şifre: **260678**
- Tüm takımları ve puanları görürsünüz
- **+10, +5, -5, -10** butonları ile puan verin
- **✕ Sil** ile takım silin
- **"TÜM TAKIMLARI SİL"** ile oyunu sıfırlayın

## ✨ Özellikler

- ✅ Gerçek zamanlı senkronizasyon (Socket.io)
- ✅ Tüm cihazlar anında güncellenir
- ✅ Şifreli yönetici paneli
- ✅ Mobil uyumlu tasarım
- ✅ Takımlar puan eklenince otomatik sıralanır
- ✅ İpuçları zaman damgalı kaydedilir

## 📁 Dosya Yapısı

```
katil-oyunu/
├── server.js          # Ana sunucu dosyası
├── package.json       # Proje ayarları
├── README.md          # Bu dosya
└── public/
    └── index.html     # Frontend (HTML + CSS + JS)
```

## 🌐 Ağda Paylaşım

Aynı WiFi ağındaki diğer cihazların bağlanması için:

1. Bilgisayarınızın IP adresini öğrenin:
   - Windows: `ipconfig` komutu
   - Mac/Linux: `ifconfig` komutu

2. Diğer cihazlardan şu adrese bağlanın:
   ```
   http://BILGISAYAR_IP:3000
   ```
   Örnek: `http://192.168.1.100:3000`

## 🔧 Sorun Giderme

**Port 3000 kullanılıyorsa:**
```bash
PORT=3001 npm start
```

**Bağlantı sorunu:**
- Firewall ayarlarını kontrol edin
- Aynı ağda olduğunuzdan emin olun

---
Eğlenceli oyunlar! 🎭
