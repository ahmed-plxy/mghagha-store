# بناء تطبيق أندرويد تلقائيًا عبر GitHub Actions

هذا الملف يشرح خطوات الإعداد لمرة واحدة فقط. بعدها، كل مرة تضغط فيها "Run workflow" أو تعمل push على الفرع `main`، سيُبنى تطبيق أندرويد موقّع جاهز للتحميل تلقائيًا — بدون فتح Android Studio إطلاقًا.

## ⚠️ ملاحظة مهمة وصريحة قبل أي شيء

تحذير "تطبيقات غير معروفة" (Unknown Sources) الذي يظهر في أندرويد عند تثبيت ملف APK **لا علاقة له بكيفية بناء التطبيق أو توقيعه**. هذا تحذير من نظام أندرويد نفسه يظهر مع **أي** تطبيق يُثبَّت من خارج Google Play، بدون أي استثناء، حتى لو كان موقّعًا بشكل صحيح 100%. الطريقة الوحيدة لإزالة هذا التحذير نهائيًا هي نشر التطبيق على Google Play وتثبيته من هناك. لا يوجد إعداد في GitHub Actions أو في الكود يزيل هذا التحذير لتثبيت APK مباشر — وأي شخص يقول العكس غير دقيق.

ما يقدمه هذا الـ workflow فعليًا: بناء تلقائي، موقّع بشكل صحيح وحقيقي، وجاهز لإعادة الاستخدام لاحقًا في Google Play دون أي تعديل إضافي.

---

## الخطوة 1 — إنشاء مفتاح التوقيع (Keystore) على جهازك

نفّذ هذا الأمر على جهازك (يتطلب تثبيت Java/JDK):

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore release-keystore.jks -alias mghagha -keyalg RSA -keysize 2048 -validity 10000
```

سيُطلب منك تعيين كلمة مرور (Store Password) وبيانات أخرى (اسم، منظمة... يمكن تركها أو تعبئتها بأي قيمة). **احفظ ملف `release-keystore.jks` وكلمتي المرور في مكان آمن جدًا ولا تشاركهما مع أحد** — لو فقدتهما، لن تستطيع نشر أي تحديث لهذا التطبيق على Google Play مستقبلًا أبدًا تحت نفس الاسم.

## الخطوة 2 — تحويل الـ Keystore إلى نص Base64

**على Linux أو Mac:**
```bash
base64 -i release-keystore.jks | tr -d '\n' > release-keystore.b64.txt
```

**على Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release-keystore.jks")) | Out-File release-keystore.b64.txt
```

افتح ملف `release-keystore.b64.txt` وانسخ محتواه كاملًا (نص طويل بدون فراغات).

## الخطوة 3 — رفع المشروع على GitHub

1. أنشئ Repository جديد (يمكن أن يكون Private) على GitHub.
2. ارفع هذا المشروع كاملًا إليه (بما فيه مجلد `mobile-app/` و `.github/workflows/android-build.yml`):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

## الخطوة 4 — إضافة الأسرار (Secrets) في GitHub

في صفحة الـ Repository على GitHub: **Settings → Secrets and variables → Actions → New repository secret**، أضف الأسرار الخمسة التالية واحدًا تلو الآخر:

| اسم الـ Secret | القيمة |
|---|---|
| `APP_URL` | رابط موقعك المنشور الحقيقي بصيغة HTTPS، مثل `https://mghagha-store.your-domain.com` |
| `ANDROID_KEYSTORE_BASE64` | المحتوى الكامل لملف `release-keystore.b64.txt` من الخطوة 2 |
| `ANDROID_KEYSTORE_PASSWORD` | كلمة مرور الـ Keystore التي اخترتها في الخطوة 1 |
| `ANDROID_KEY_ALIAS` | `mghagha` (أو الاسم الذي اخترته بعد `-alias` في الخطوة 1) |
| `ANDROID_KEY_PASSWORD` | كلمة مرور المفتاح (غالبًا نفس كلمة مرور الـ Keystore إذا لم تُحدد غيرها) |

## الخطوة 5 — تشغيل البناء

اذهب إلى تبويب **Actions** في الـ Repository، اختر workflow باسم **"Android Build"** من القائمة الجانبية، ثم اضغط **"Run workflow"** (الزر الأخضر على اليمين) → **Run workflow** للتأكيد.

سيبدأ البناء تلقائيًا (يأخذ حوالي 3-6 دقائق). يمكنك أيضًا تشغيله تلقائيًا فقط بعمل `git push` على فرع `main` لاحقًا، بدون حاجة للضغط على أي زر.

## الخطوة 6 — تحميل التطبيق الجاهز

بعد انتهاء البناء بنجاح (علامة ✔ خضراء):

1. افتح الـ workflow run الذي اكتمل.
2. في أسفل الصفحة، ستجد قسم **Artifacts** يحتوي على:
   - `mghagha-store-release-apk` — ملف APK جاهز للتثبيت المباشر على أي هاتف أندرويد.
   - `mghagha-store-release-aab` — ملف AAB، تحتاجه فقط عند النشر على Google Play لاحقًا.
3. حمّل `mghagha-store-release-apk`، استخرج ملف `app-release.apk` من الأرشيف المضغوط، وانقله لهاتفك لتثبيته (أو شاركه مباشرة).

> عند التثبيت، سيظهر تحذير "السماح بتثبيت من مصدر غير معروف" لمرة واحدة — هذا متوقع تمامًا كما هو موضح في الملاحظة بالأعلى، وليس خطأ في الإعداد.

## (اختياري) إصدار رسمي عبر GitHub Releases

إذا أردت أن يُرفق ملف الـ APK تلقائيًا في صفحة "Releases" بدلًا من تحميله من Artifacts فقط، أنشئ Tag بصيغة إصدار عند الرفع:

```bash
git tag v1.0.0
git push origin v1.0.0
```

سيبني الـ workflow التطبيق ويُرفقه تلقائيًا كملف قابل للتحميل في صفحة Release جديدة باسم `v1.0.0`.

---

## إذا فشل البناء

افتح سجل (Log) الخطوة التي فشلت في تبويب Actions. الأخطاء الأكثر شيوعًا:
- **"Missing repository secret"** → لم تُضف أحد الأسرار الخمسة بشكل صحيح في الخطوة 4.
- فشل في خطوة **"Apply release signing configuration"** → قالب Capacitor الافتراضي لملف `build.gradle` تغيّر في إصدار أحدث؛ أخبرني بنص الخطأ كاملًا وسأعدّل سكريبت `mobile-app/scripts/configure-signing.js` ليتوافق معه.
- فشل في خطوة **gradlew** → غالبًا مشكلة في كلمات مرور الـ Keystore المُدخلة في الأسرار؛ تأكد من تطابقها حرفيًا مع ما أدخلته في الخطوة 1.
