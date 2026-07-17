![Karşıyaka Destek](./assets/afis.png)

# Karşıyaka Destek

Karşıyaka Destek, belediye personellerinin teknik sorunlarını bildirebildiği, taleplerin ilgili teknik personele atanabildiği ve süreçlerin takip edilebildiği web tabanlı bir teknik destek sistemidir.

## Projenin Amacı

Bu proje, kurum içindeki teknik destek taleplerinin düzenli, hızlı ve takip edilebilir şekilde yönetilmesi amacıyla geliştirilmiştir.

Personeller sistem üzerinden yeni talep oluşturabilir, teknik personeller kendilerine atanan talepleri görüntüleyebilir ve yöneticiler tüm süreci kontrol edebilir.

## Kullanıcı Rolleri

### Personel

- Sisteme kayıt olabilir ve giriş yapabilir.
- Teknik destek talebi oluşturabilir.
- Kendi oluşturduğu talepleri görüntüleyebilir.
- Talebin durumunu ve yapılan işlemleri takip edebilir.
- Talebe fotoğraf ekleyebilir.
- Profil bilgilerini ve şifresini güncelleyebilir.

### Teknik Personel

- Kendisine atanan talepleri görüntüleyebilir.
- Talepleri durum, öncelik ve kategoriye göre filtreleyebilir.
- Talep durumunu güncelleyebilir.
- Açıklama ve çözüm bilgisi ekleyebilir.
- Uzmanlık alanına göre talepler alabilir.

### Yönetici

- Tüm talepleri görüntüleyebilir.
- Talepleri teknik personele atayabilir.
- Kullanıcıları ve kullanıcı rollerini yönetebilir.
- Müdürlük, kategori ve uzmanlık alanlarını yönetebilir.
- Talep durumlarını ve çözüm bilgilerini güncelleyebilir.
- Sistem raporlarını ve personel performansını görüntüleyebilir.

## Otomatik Talep Atama

Talepler, seçilen kategorinin bağlı olduğu uzmanlık alanına göre uygun teknik personele otomatik olarak atanır.

Aynı uzmanlık alanındaki teknik personeller arasından aktif talep sayısı en az olan personel tercih edilir.

## Kullanılan Teknolojiler

### Frontend

- React
- Vite
- React Router
- Axios
- CSS

### Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT
- bcryptjs
- Multer

### Yayınlama

- Render
- GitHub

## Temel Özellikler

- Kayıt ve giriş sistemi
- Rol tabanlı yetkilendirme
- Talep oluşturma ve takip etme
- Fotoğraf yükleme
- Otomatik teknik personel atama
- Durum ve öncelik yönetimi
- Müdürlük yönetimi
- Kategori yönetimi
- Uzmanlık alanı yönetimi
- Kullanıcı yönetimi
- Raporlama ve performans takibi
- Şifre değiştirme
- Profil güncelleme

## Talep Durumları

- Yeni
- Atandı
- İşlemde
- Beklemede
- Çözüldü
- İptal Edildi

## Talep Öncelikleri

- Düşük
- Normal
- Yüksek
- Acil

## Proje Yapısı

```text
project/
├── frontend/
├── backend/
└── README.md