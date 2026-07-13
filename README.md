# Ayet / Şiir Ezber Uygulaması

Arapça şiir ve ayet ezberini sınav senaryosuyla test etmek için web uygulaması.
Detaylı gereksinimler: [ayet_siir_ezber_app_spec.md](./ayet_siir_ezber_app_spec.md)

**Stack:** Vite + React + TypeScript + Tailwind CSS · Supabase (PostgreSQL) · Netlify (deploy)

## Kurulum

### 1. Supabase projesi

1. [supabase.com](https://supabase.com) üzerinde yeni bir proje oluştur.
2. Dashboard → **SQL Editor**'e gir, [supabase/migrations/001_init.sql](./supabase/migrations/001_init.sql)
   dosyasının tamamını yapıştırıp çalıştır (`folders`, `exams`, `questions`, `attempts`
   tabloları + açık RLS politikaları oluşur).

### 2. .env doldur

Proje kökündeki `.env` dosyasını (yoksa `.env.example`'dan kopyala) doldur:

```
VITE_SUPABASE_URL=      ← Dashboard → Project Settings → API → Project URL
VITE_SUPABASE_ANON_KEY= ← Dashboard → Project Settings → API → anon public key
GITHUB_REPO_URL=        ← push edilecek GitHub repo adresi (uygulama değil, git için)
```

### 3. Çalıştır

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` açılır.

## Kullanım

- **Sol panel:** klasörler → sınavlar. Sınav yanındaki **Test** butonu tekil test,
  klasör altındaki **"Tamamından karışık test"** klasördeki tüm soruları karıştırıp sorar.
- **Soru Yönetimi:** klasör/sınav seç (veya yeni oluştur), "Parça Ekle" ile metni elle
  parçala (Arapça, sağdan sola), nükteyi yaz, kaydet. Mevcut soruları düzenle/sil.
- **Quiz:** ilk parça açık gelir, "Sonraki Parçayı Göster" ile kümülatif açılır.
  Metin ve nükte için ayrı ✓/✗ seçilmeden "Sonraki Soru" aktifleşmez.
- **Test sonu:** doğru/yanlış özeti + "Yalnızca yanlışları tekrar dene" / "Tümünü tekrar dene".
- **Geçmiş:** sınav/klasör bazında deneme sayısı ve metin/nükte başarı yüzdeleri.

## Deploy (Netlify)

`netlify.toml` hazır. Netlify'da repoyu bağla, build ayarları otomatik gelir
(`npm run build` → `dist`). Environment variables kısmına `VITE_SUPABASE_URL` ve
`VITE_SUPABASE_ANON_KEY` değerlerini ekle.
