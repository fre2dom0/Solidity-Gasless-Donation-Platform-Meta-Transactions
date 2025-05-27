# Bağış Platformu Frontend

Bu, Solidity tabanlı bağış platformunun modern ve kullanıcı dostu web arayüzüdür.

## 🌟 Özellikler

- **Modern ve Duyarlı Tasarım**: Glassmorphism efektleri ve gradient arka planlar
- **MetaMask Entegrasyonu**: Cüzdan bağlama ve hesap yönetimi
- **Gerçek Zamanlı Veriler**: Bakiyeler, bağış geçmişi ve token bilgileri
- **Meta-Transaction Desteği**: Gassız işlem hazırlığı (demo)
- **Admin Paneli**: Token ve alıcı yönetimi (sadece contract owner için)
- **Türkçe Arayüz**: Tamamen Türkçe kullanıcı deneyimi

## 🚀 Hızlı Başlangıç

### Ön Gereksinimler

1. **MetaMask**: Tarayıcınızda MetaMask eklentisi yüklü olmalı
2. **Hardhat Ağı**: Local Hardhat node çalışıyor olmalı
3. **Contract Deployment**: Contract'lar deploy edilmiş olmalı

### 1. Hardhat Node'u Başlatın

```bash
# Ana proje dizininde
npx hardhat node
```

### 2. Contract'ları Deploy Edin

```bash
# Deploy script'ini çalıştırın (ayrı terminal'de)
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Frontend'i Açın

```bash
# Frontend dizinine gidin
cd frontend

# Basit HTTP server başlatın (Python)
python3 -m http.server 8080

# Veya Node.js ile
npx http-server -p 8080

# Veya VS Code Live Server eklentisi kullanın
```

### 4. Tarayıcıda Açın

`http://localhost:8080` adresine gidin.

## 📝 Kullanım Kılavuzu

### İlk Kurulum

1. **MetaMask'ı Bağlayın**: "Cüzdan Bağla" butonuna tıklayın
2. **Ağı Kontrol Edin**: Hardhat Localhost (31337) ağında olduğunuzdan emin olun
3. **Test Tokenlarını İçe Aktarın**: Deploy edilen DONATE token'ını MetaMask'a ekleyin

### Bağış Yapma

1. **Alıcı Seçin**: Dropdown'dan bir alıcı seçin
2. **Token Seçin**: Bağış yapmak istediğiniz token'ı seçin
3. **Miktar Girin**: Bağış miktarını yazın
4. **Token Onaylayın**: "Token Onaylama" butonuna tıklayın
5. **Bağış Yapın**: "Bağış Yap" butonuna tıklayın

### Admin Paneli (Sadece Owner)

Contract owner'ısanız aşağıdaki işlemleri yapabilirsiniz:

- **Token Ekleme**: Yeni ERC20 tokenları platforma ekleyin
- **Alıcı Ekleme**: Yeni bağış alıcılarını sisteme ekleyin

### Meta-Transaction (Demo)

"Gassız Bağış" özelliği meta-transaction imzası oluşturur ancak gerçek bir relayer olmadığı için demo amaçlıdır.

## 🔧 Contract Adresleri

```javascript
// Hardhat Localhost (Chain ID: 31337)
FORWARDER: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
DONATION_PLATFORM: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
TEST_TOKEN: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
```

## 📁 Dosya Yapısı

```
frontend/
├── index.html          # Ana HTML dosyası
├── style.css           # CSS stilleri
├── contracts.js        # Contract adresleri ve ABI'lar
├── app.js             # Ana JavaScript dosyası
└── README.md          # Bu dosya
```

## 🛠️ Geliştirme

### CSS Düzenlemeleri

`style.css` dosyasında aşağıdaki özellikler bulunur:

- **Glassmorphism**: Şeffaf arka planlar ve blur efektler
- **Gradient**: Renk geçişleri ve modern görünüm
- **Responsive**: Mobil uyumlu tasarım
- **Animasyonlar**: Hover efektleri ve sayfa yükleme animasyonları

### JavaScript Modülleri

- **app.js**: Ana uygulama mantığı
- **contracts.js**: Blockchain entegrasyonu
- **Ethers.js v5**: Ethereum etkileşimleri

## 🐛 Sorun Giderme

### MetaMask Bağlanamıyor

1. MetaMask'ın yüklü olduğundan emin olun
2. Doğru ağda (Hardhat Localhost) olduğunuzu kontrol edin
3. Tarayıcı konsolunu kontrol edin

### Contract Çağrıları Başarısız

1. Hardhat node'unun çalıştığından emin olun
2. Contract'ların deploy edildiğini kontrol edin
3. Doğru contract adreslerini kullandığınızdan emin olun

### Token Onaylanamıyor

1. Yeterli token bakiyeniz olduğundan emin olun
2. MetaMask'ta işlemi onaylayın
3. Gas limitini artırmayı deneyin

## 🔐 Güvenlik

- Bu frontend sadece localhost için tasarlanmıştır
- Production için HTTPS kullanın
- Contract adreslerini doğrulayın
- Meta-transaction'lar için güvenilir relayer kullanın

## 📞 Destek

Herhangi bir sorunla karşılaştığınızda:

1. Tarayıcı konsolunu kontrol edin
2. MetaMask bağlantısını kontrol edin
3. Hardhat node loglarını inceleyin

---

**Not**: Bu frontend demo amaçlıdır. Production kullanımı için ek güvenlik önlemleri alın.