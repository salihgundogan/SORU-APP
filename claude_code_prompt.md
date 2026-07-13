# Claude Code — Ana Prompt

Aşağıdaki metni Claude Code'a birebir yapıştırabilirsin. `ayet_siir_ezber_app_spec.md` dosyasını da proje klasörüne koy / aynı sohbete ekle, prompt içinde ona referans veriliyor.

---

Bu klasörde `ayet_siir_ezber_app_spec.md` adında bir gereksinim dokümanı var. Önce bu dokümanı oku ve tamamını baz alarak bir web uygulaması geliştir.

**Tech stack:**
- Frontend: Vite + React + TypeScript, stil için Tailwind CSS.
- Backend: Supabase (PostgreSQL + otomatik REST API), `@supabase/supabase-js` client.
- Auth yok, tek kullanıcı için basit açık tablolar (spec'teki 4. ve 5. bölüme bak).
- Deploy hedefi: Netlify (şimdilik sadece local çalışsın yeterli, deploy konfigürasyonunu hazır bırak).

**Yapılacaklar sırası:**

1. Proje iskeletini kur (Vite + React + TS + Tailwind).
2. Supabase için SQL migration dosyası oluştur: spec'teki 4. bölümdeki `folders`, `exams`, `questions`, `attempts` tablolarını birebir uygula. `.env.example` dosyasına `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` alanlarını ekle, kodda `import.meta.env` üzerinden oku.
3. Sol yan panel (sidebar) bileşenini yap: klasörleri listele, bir klasöre tıklanınca altındaki sınavlar açılsın, her sınavın yanında test başlatma seçeneği, klasörün altında "Bu klasörün tamamından karışık test" seçeneği, yeni klasör/yeni sınav ekleme butonları.
4. Soru ekleme ekranını yap: klasör + sınav seçimi (veya yeni oluşturma), dinamik "Parça Ekle" ile çoklu textarea, ayrı bir nükte kutusu, kaydet butonu. Metin kutularında `dir="rtl"` ve Arapça destekleyen bir web fontu kullan (örn. Google Fonts üzerinden Amiri veya Scheherazade New).
5. Quiz ekranını spec'in 7. bölümüne birebir uyacak şekilde yap:
   - Üst şerit: N parçaya bölünmüş, başta sadece ilk parça açık.
   - Şeridin altında "Sonraki Parçayı Göster" butonu — her basışta bir sonraki parçayı kümülatif olarak açar (şimdilik animasyonsuz).
   - Üst şeridin yanında yeşil (bildim) / kırmızı (bilemedim) butonları.
   - Alt şerit (nükte): başta kapalı, tıklanınca açılır, kendi yeşil/kırmızı butonları var.
   - "Sonraki Soru" butonu: hem metin hem nükte için bir seçim yapılana kadar disabled, ikisi de seçilince aktifleşir.
   - Sorular her zaman karıştırılmış (shuffled) sırayla, testte tekrar çekilmeden bir kez gelir.
6. Test bitiş ekranını yap: toplam doğru/yanlış özeti + "Yalnızca yanlışları tekrar dene" (bu oturumda metin veya nükteden en az biri bilemedim işaretlenen sorular) / "Tümünü tekrar dene" butonları. "Yanlış" tanımı: metin VEYA nükteden en az biri "bilemedim".
7. Her deneme sonucunu `attempts` tablosuna yaz (question_id, session_id, metin_sonuc, nukte_sonuc, created_at).
8. Basit bir geçmiş/özet görünümü ekle: sınav/klasör bazında toplam deneme sayısı ve başarı oranı (% bildim). Detaylı soru bazlı istatistik gerekmiyor (spec 8. bölüm).
9. Kapsam dışı olanlara dokunma: auth, spaced repetition, dosya import/export, animasyon, detaylı dashboard (spec 10. bölüm).

Kod boyunca TypeScript tiplerini spec'teki veri modeliyle (folders, exams, questions, attempts) birebir eşleştir. İş bitince kısa bir "nasıl çalıştırılır" (Supabase proje kurulumu, `.env` doldurma, `npm install && npm run dev`) talimatı da ekle.
