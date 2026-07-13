# Ayet / Şiir Ezber Uygulaması — Gereksinim Dokümanı

## 1. Amaç

Kullanıcının (Salih) sınav öncesi Arapça şiir ve ayet ezberini kendi kendine test edebilmesi için, konu bazlı klasörlenmiş, backend destekli bir web uygulaması. Sınavda soru soran kişi metnin başını söyler, kullanıcı gerisini ezberden tamamlar; ardından metnin "nüktesini" (neye misal olduğunu) söyler. Uygulama bu senaryoyu simüle eder, kullanıcı kendi kendini değerlendirir ve sonuçlar kalıcı olarak takip edilir.

## 2. Yapı / Hiyerarşi

```
Klasör (örn: "1. Hafta")
 ├─ Sınav (örn: "Şiirler")
 │    ├─ Soru 1
 │    ├─ Soru 2
 │    └─ ...
 └─ Sınav (örn: "Ayetler")
      ├─ Soru 1
      └─ ...
```

- **Klasör**: bir haftaya / konuya karşılık gelir (örn. "1. Hafta").
- **Sınav**: klasör içinde ayrı bir soru kümesi (örn. "Şiirler", "Ayetler").
- **Soru**: parçalanmış metin + nükte.

### Test Başlatma Modları
1. **Tekil sınav**: sadece bir sınavdaki sorular (örn. yalnızca "Şiirler").
2. **Klasörün tamamı (karışık)**: o klasördeki tüm sınavların soru havuzundan rastgele.

Her iki modda da sorular **her zaman rastgele havuzdan** gelir — test başında havuz karıştırılır, sorular sırayla değil, karışık sırayla ve testte bir kez sorulacak şekilde sunulur.

## 3. Yan Panel (Sidebar)

Claude arayüzündeki sohbet listesine benzer bir sol panel:
- Klasörler listelenir.
- Bir klasöre tıklanınca altında o klasöre ait sınavlar açılır/genişler.
- Her sınavın yanında test başlatma seçeneği bulunur.
- Klasörün altında (veya üstünde) "Bu klasörün tamamından karışık test" seçeneği bulunur.
- "Yeni klasör ekle" / "Yeni sınav ekle" butonları.

## 4. Veri Modeli (Supabase / PostgreSQL)

```sql
folders   (id, name, created_at)
exams     (id, folder_id -> folders.id, name, created_at)
questions (id, exam_id -> exams.id, parcalar jsonb, nukte text, created_at)
attempts  (id, question_id -> questions.id, session_id, 
           metin_sonuc text,   -- 'bildim' | 'bilemedim'
           nukte_sonuc text,   -- 'bildim' | 'bilemedim'
           created_at)
```

- `parcalar`: kullanıcının elle girdiği, sıralı metin parçaları (dizi).
- `attempts`: her test denemesinde, her soru için ayrı bir kayıt — geçmişe dönük takip bu tablo üzerinden yapılır.

## 5. Backend Seçimi: Supabase

Firebase yerine **Supabase** seçildi:
- PostgreSQL tabanlı olduğu için ilişkisel yapı (klasör → sınav → soru → deneme) doğal şekilde kurulabiliyor.
- Salih'in CheckFit AI projesinde zaten Supabase deneyimi var, entegrasyon daha hızlı olur.
- Basit REST/JS client ile kolayca bağlanılabiliyor, backend kodu yazmaya gerek kalmıyor.

*Varsayım: v1'de kullanıcı girişi (auth) yok — tek kullanıcı için basit, açık tablolar kullanılacak. İstersen ileride e-posta/parola auth eklenebilir.*

## 6. Soru Ekleme

- Soru eklerken önce **klasör** ve **sınav** seçilir (veya yeni klasör/sınav oluşturulur).
- "Parça Ekle" butonu ile dinamik olarak yeni parça kutusu (textarea) eklenir (Parça 1, Parça 2, …) — parçalama otomatik değil, kullanıcı elle yapar.
- Ayrı bir "Nükte" metin kutusu (tek parça).
- "Kaydet" → Supabase'e yazılır.
- Mevcut soruları görme / düzenleme / silme ekranı.
- Arapça metin girişi için `dir="rtl"` ve Arapça destekleyen bir font (örn. Amiri / Scheherazade New) kullanılır; harekeli (diacritics) metin sorunsuz girilebilir olmalı.

## 7. Quiz Ekranı

**Üst şerit (metin):**
- Soruya ait N parçaya bölünmüş bir şerit. Başlangıçta sadece 1. parça görünür.
- Şeridin **altında** "Sonraki Parçayı Göster" butonu bulunur. Butona her basıldığında bir sonraki parça açılır (kümülatif, önceki parçalar kapanmaz). Şimdilik animasyonsuz, basit aç/kapa; ileride animasyon eklenebilir.
- Yanında yeşil ✓ (bildim) / kırmızı ✗ (bilemedim) butonları.

**Alt şerit (nükte):**
- Tek parça, başta kapalı. Tıklanınca nükte metni açılır.
- Kendine ait ayrı yeşil ✓ / kırmızı ✗ butonları.

**Sonraki Soru butonu:**
- **Pasif** (tıklanamaz) durumda başlar.
- Hem üstteki (metin) hem alttaki (nükte) için bir seçim (bildim ya da bilemedim) yapılana kadar pasif kalır.
- İkisi de seçildiğinde otomatik olarak **aktifleşir** ve tıklanabilir hale gelir.

**Test bitişi (havuzdaki tüm sorular bitince):**
- Özet ekranı: toplam doğru/yanlış sayısı.
- İki seçenek:
  - **"Yalnızca yanlışları tekrar dene"** — bu oturumda metin veya nükteden en az biri "bilemedim" işaretlenen sorular yeniden (rastgele sırayla) sorulur.
  - **"Tümünü tekrar dene"** — aynı havuzun tamamı yeniden karıştırılıp sorulur.

## 8. Geçmişe Dönük Takip

- Her deneme `attempts` tablosuna kaydedilir (hangi soru, ne zaman, metin/nükte sonucu).
- v1'de basit bir özet görünümü: sınav / klasör bazında toplam deneme sayısı ve başarı oranı (% bildim).
- *Varsayım: Bu sürümde detaylı bir istatistik/dashboard sayfası yok, sadece "yanlışları tekrar dene" özelliğini besleyen ve genel başarı oranını gösteren basit bir görünüm var. İstersen ileride soru bazlı ("bu soruyu kaç kere yanlış yaptım") detaylı bir geçmiş sayfası ekleriz.*

## 9. Teknik Notlar

- Frontend: tek sayfa uygulama (React önerilir — Supabase JS client ile entegrasyonu kolay).
- Backend: Supabase (PostgreSQL + otomatik REST API).
- Auth yok (v1), tek kullanıcı varsayımı.
- Sorular ve deneme geçmişi kalıcı (Supabase'de saklanır); oturum içi state (aktif test, hangi parçaların açık olduğu vb.) sadece frontend'de tutulur.

## 10. Kapsam Dışı (Bu Sürümde Yok)

- Kullanıcı girişi / çoklu kullanıcı desteği.
- Spaced repetition algoritması (soru önceliklendirme) — şimdilik sadece "yanlışları tekrar dene" var.
- Soru dosyası import/export (JSON vb.).
- Şerit parçası açılışında animasyon.
- Detaylı soru bazlı istatistik/dashboard sayfası.

## 11. Varsayımlar Özeti

- Backend: Supabase, auth yok, tek kullanıcı.
- "Yanlış" kriteri: metin VEYA nükteden en az biri "bilemedim" ise soru o testte yanlış sayılır.
- Sorular her testte karıştırılmış sırayla, tekrar çekilmeden bir kez sorulur.
- Şerit parçaları ayrı bir "Sonraki Parçayı Göster" butonuyla açılır (şeridin kendisine tıklama yok).
- Sonraki Soru butonu, hem metin hem nükte için seçim yapılmadan aktifleşmez.
