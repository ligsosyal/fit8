# FIT8 — Home Training

Türkçe, mobil uyumlu ev antrenmanı takip uygulaması. React + Vite + Firebase.

## Yerel önizleme

1. Node.js 20 veya üzerini kurun.
2. Bu klasörde terminal açın.
3. `npm install`
4. `npm run dev`

## Firebase bağlantısı

1. Firebase Console'da proje oluşturun.
2. Authentication > Sign-in method > Google ve E-posta/Şifre sağlayıcılarını etkinleştirin.
3. Firestore Database oluşturun.
4. Web uygulaması ekleyin ve Firebase web yapılandırma alanlarını alın.
5. Bu pakette Firebase web yapılandırmanız `.env.local` dosyasına eklenmiştir. Bu dosyayı GitHub’a yüklemeyin; `.gitignore` tarafından hariç tutulur. Vercel’de aynı altı `VITE_FIREBASE_` değişkenini Project Settings > Environment Variables alanına ekleyin.
6. Firestore Rules bölümüne `firestore.rules` içeriğini yayınlayın.
7. Authentication > Settings > Authorized domains alanına Vercel alan adınızı ekleyin.

Firebase yapılandırma değerleri gizli servis hesabı anahtarı değildir. Firestore güvenlik kuralları kullanıcı verisini yalnızca ilgili UID'ye sınırlar. Vercel'de aynı `VITE_FIREBASE_` değişkenlerini Project Settings > Environment Variables alanına girin.

## Özellikler

- Başlangıç düzeyine uygun 8 haftalık A/B tüm vücut programı
- Kardiyo ve aktif toparlanma takvimi
- Hareket adımları, teknik ipuçları ve sık hatalar
- Tamamlanan hareketleri ve vücut ağırlığını yerel olarak kaydetme
- Firebase yapılandırıldığında Google veya e-posta/şifre girişi ve kullanıcı UID'sine özel Firestore kaydı

## Animasyon notu

Bu başlangıç sürümündeki hareket figürü yalnızca şematik bir yer tutucudur; doğru biyomekanik 3D animasyon değildir. Üretim sürümünde hareket bazında lisans ve doğruluk kontrolü yapılmış 3D GLB animasyonları entegre edilmelidir. Aşağıdaki açık kaynak projeler değerlendirme adaylarıdır:
- Kimorel: https://github.com/alcazardaas/kimorel (proje yazılımı MIT, örnek içerik CC0; proje önizlemelerinin onay durumu ayrıca incelenmeli)
- Desk Break: https://github.com/shlomorsh/desk-break (MIT; egzersiz kapsamı FIT8 hareketleriyle birebir örtüşmeyebilir)
