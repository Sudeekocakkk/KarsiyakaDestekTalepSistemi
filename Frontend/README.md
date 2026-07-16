# Karşıyaka Destek — Frontend

Bu klasör, `Backend/` altındaki Express + Prisma API'sine bağlanan React (Vite) tabanlı web arayüzünü içerir. Rol bazlı üç panel sunar: **Yönetici (ADMIN)**, **Teknik Personel (TEKNIK_PERSONEL)** ve **Personel (PERSONEL — normal kullanıcı)**.

## Kurulum

```bash
cd Frontend
npm install
cp .env.example .env
npm run dev
```

Uygulama varsayılan olarak `http://localhost:5173` adresinde açılır.

> Not: Bu proje bu ortamda (sandbox) `npm install` çalıştırılamadığı için derlenip test edilemedi — sandbox'ın ağ erişimi npm registry'sine kapalı. Kod elle gözden geçirildi (tüm import yolları ve parantez/süslü parantez dengeleri betikle doğrulandı) ama gerçek `npm run build` / `npm run dev` çalıştırmasını kendi bilgisayarınızda yapmanız gerekiyor. Bir sorunla karşılaşırsanız hata mesajını paylaşın, birlikte çözelim.

## .env Yapılandırması

`.env.example` dosyasını `.env` olarak kopyalayıp gerekirse değiştirin:

```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_FILE_BASE_URL=http://localhost:5000
```

- `VITE_API_BASE_URL`: Backend API kök adresi (Backend `.env` dosyasındaki `PORT` değeriyle uyumlu olmalı; varsayılan 5000).
- `VITE_FILE_BASE_URL`: Talep fotoğraflarının (`/uploads/...`) sunulduğu adres — genelde `VITE_API_BASE_URL`'in `/api` olmadan hali.

Backend adresini değiştirmek için **yalnızca bu iki değeri** güncellemeniz yeterli; kod içinde sabit (hardcoded) adres yoktur.

## Backend'i çalıştırma (özet)

```bash
cd Backend
npm install
npx prisma migrate deploy   # veya migrate dev
npm run dev
```

Backend `.env` dosyasında `DATABASE_URL`, `PORT`, `JWT_SECRET` tanımlı olmalı (mevcut).

## İlk kullanıcıyı oluşturma ve test akışı

Sistemde hiç kullanıcı yoksa:

1. `http://localhost:5173/ilk-kurulum` sayfasından ilk **ADMIN** hesabını oluşturun (`POST /api/auth/setup`).
2. Admin ile giriş yapın → **Kullanıcılar** sayfasından müdürlük/uzmanlık/kategori tanımlayın, `TEKNIK_PERSONEL` hesapları açın ve uzmanlık atayın.
3. `http://localhost:5173/kayit` üzerinden yeni bir **Personel (normal kullanıcı)** hesabı açılabilir (`POST /api/auth/register`, her zaman `PERSONEL` rolüyle oluşturulur). Kayıt formu aktif müdürlükleri (`GET /api/departments/public/active`, oturumsuz) bir seçim listesinde gösterir — müdürlük seçimi zorunludur. E-posta yalnızca gmail.com, hotmail.com, outlook.com, live.com, icloud.com, yahoo.com, yandex.com veya yandex.com.tr domainleriyle kabul edilir; bu kontrol hem frontend'de hem backend'de yapılır.

Alternatif olarak `Backend/prisma/seed.js` çalıştırılırsa (`node prisma/seed.js`), örnek uzmanlıklar/kategoriler ve 4 teknik personel hesabı (`teknik.donanim@karsiyaka.local` vb., şifre: `teknik123`) otomatik oluşur. Bu seed artık `prisma migrate dev`/`migrate reset` ile otomatik tetiklenmez, yalnızca elle çalıştırılır.

## Veritabanını sıfırlama

`Backend/scripts/resetDatabase.js` tüm uygulama verilerini (kullanıcılar, talepler, müdürlükler, uzmanlıklar, kategoriler vb.) siler ve ID sayaçlarını sıfırlar; tabloları veya migration geçmişini etkilemez. Production'da ve güvenlik onayı olmadan çalışmaz:

```bash
cd Backend
CONFIRM_DATABASE_RESET=true npm run reset-database
```

## Hangi rolle hangi ekranlar test edilir

| Rol | Giriş sonrası yönlendirme | Test edilecek ekranlar |
|---|---|---|
| ADMIN | `/admin` | Dashboard, Talepler (liste/filtre/detay/atama/durum/çözüm), Kullanıcılar (CRUD + pasifleştirme + uzmanlık atama), Müdürlükler, Uzmanlık Alanları, Kategoriler, Raporlar, Profil |
| TEKNIK_PERSONEL | `/teknik` | Dashboard (özet), Bana Atanan Talepler (liste/filtre), Talep Detay (yalnızca mesaj/açıklama ekleme), Profil |
| PERSONEL | `/personel` | Ana Sayfa (özet), Yeni Talep Oluştur (fotoğraflı), Taleplerim (liste/filtre), Talep Detay, Profil |

Kayıt ol / ilk kurulum ekranları herkese açıktır (`/login`, `/kayit`, `/ilk-kurulum`).

## Backend kısıtları nedeniyle eksik kalan / çalışmayan özellikler

Bunlar backend'de karşılık gelen bir endpoint bulunmadığı için frontend'de **kasıtlı olarak** eklenmedi (uydurulmadı):

- **Teknik personel talep durumu değiştiremiyor / çözüm giremiyor**: `PATCH /tickets/:id/status` ve `/:id/solution` yalnızca `ADMIN` rolüne açık. Teknik personel talep detayında yalnızca mesaj/açıklama ekleyebiliyor; durum ve çözüm alanlarını sadece admin güncelleyebiliyor.
- **Kategori düzenlemede uzmanlık alanı değiştirilemiyor**: `PATCH /categories/:id` yalnızca `name` ve `isActive` alanlarını kabul ediyor; `specializationId` oluşturma sonrası sabit.
- **Müdürlük "pasifleştirme" özelliği yok**: `Department.isActive` şemada var ama hiçbir controller onu set etmiyor; müdürlük yönetimi yalnızca ekle/yeniden adlandır/sil (bağlı kullanıcısı varsa silinemiyor) içeriyor.
- **Profil sayfası salt okunur**: Kullanıcının kendi profilini (ad, e-posta, şifre) güncelleyebileceği bir endpoint (`PATCH /users/me` gibi) yok. Profil sayfası yalnızca `GET /api/auth/me` verisini gösterir ve çıkış yapma imkânı sunar.
- **Şifre sıfırlama / e-posta doğrulama yok**: Backend'de bu endpointler bulunmuyor.
- **Raporlar sayfası pratikte yalnızca ADMIN'e açık**: `reports/tickets` ve `reports/categories` rotaları `authorize("BILGI_ISLEM", "ADMIN")` kullanıyor, ancak şemada `BILGI_ISLEM` diye bir rol tanımlı değil; bu yüzden sadece `ADMIN` bu endpointlere erişebiliyor.
- **Müdürlük raporunda "Bekleyen Talep" sayısı her zaman 0 dönebilir**: `getDepartmentReport` controller'ı, şemada karşılığı olmayan `"BEKLIYOR"` durumuna göre filtreliyor (gerçek durum değerleri `YENI`/`ATANDI`/`BEKLEMEDE`). Bu backend'deki bir hata; frontend veriyi olduğu gibi gösteriyor ve raporlar ekranında bu konuda bir not bırakıldı.
- **Sayfalama (pagination) yok**: Tüm liste endpointleri kayıtların tamamını tek seferde döndürüyor; büyük veri setlerinde bu backend tarafında ele alınmalı.

Bunların dışında formlar, dosya yükleme, JWT ile korumalı istekler, rol bazlı route koruması ve backend hata mesajlarının arayüzde gösterilmesi uçtan uca çalışacak şekilde bağlandı.
