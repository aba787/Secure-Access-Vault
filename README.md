# Secure Vault — نظام المصادقة الآمن

نظام تسجيل دخول متكامل مع إدارة المستخدمين، قفل الحسابات، الصلاحيات، وسجلات التدقيق.

---

## المميزات

- **تسجيل الدخول والتسجيل** — مع التحقق من المدخلات
- **قفل الحساب** — تلقائياً بعد 3 محاولات فاشلة
- **الصلاحيات (RBAC)** — مستوى Admin ومستوى User
- **تشفير كلمات المرور** — باستخدام bcrypt بـ 12 round
- **الجلسات الآمنة** — express-session مع cookie مشفّرة
- **الحماية من SQL Injection** — عبر Drizzle ORM (parameterized queries)
- **سجلات التدقيق** — كل عملية دخول، خروج، محاولة فاشلة، وقفل مُسجَّلة
- **لوحة تحكم Admin** — إدارة المستخدمين، فتح الحسابات، إحصاءات النظام

---

## البنية التقنية

```
monorepo/
├── artifacts/
│   ├── secure-auth/       ← الواجهة الأمامية (React + Vite + TailwindCSS)
│   └── api-server/        ← الخادم (Express 5 + TypeScript)
├── lib/
│   ├── db/                ← قاعدة البيانات (PostgreSQL + Drizzle ORM)
│   ├── api-spec/          ← مواصفة OpenAPI + codegen
│   ├── api-client-react/  ← React Query hooks (مُوَلَّدة تلقائياً)
│   └── api-zod/           ← Zod schemas (مُوَلَّدة تلقائياً)
```

---

## متطلبات التشغيل

- Node.js 20+
- pnpm
- PostgreSQL (أو استخدام قاعدة البيانات المضمَّنة في Replit)

---

## خطوات التشغيل

### 1. تثبيت الاعتماديات

```bash
pnpm install
```

### 2. إعداد متغيرات البيئة

أنشئ ملف `.env` في جذر المشروع أو عيّن هذه المتغيرات في بيئتك:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/secure_vault
SESSION_SECRET=your_super_secret_key_here
PORT=8080
```

> في Replit، هذه المتغيرات مُعيَّنة تلقائياً.

### 3. رفع مخطط قاعدة البيانات

```bash
pnpm --filter @workspace/db run push
```

### 4. تشغيل الخادم (API)

```bash
pnpm --filter @workspace/api-server run dev
```

الخادم يعمل على: `http://localhost:8080`

### 5. تشغيل الواجهة الأمامية

```bash
pnpm --filter @workspace/secure-auth run dev
```

الواجهة تعمل على: `http://localhost:5173`

---

## حسابات التجربة

| المستخدم | كلمة المرور | الدور  | الحالة          |
|----------|------------|--------|-----------------|
| `admin`  | `admin123` | Admin  | مفتوح           |
| `bob`    | `bob123`   | User   | مفتوح           |
| `alice`  | `alice123` | User   | مقفل (3 محاولات)|

---

## صفحات التطبيق

| المسار       | الوصف                                              | الصلاحية     |
|--------------|----------------------------------------------------|--------------|
| `/`          | صفحة تسجيل الدخول                                  | عام          |
| `/register`  | صفحة إنشاء حساب جديد                               | عام          |
| `/dashboard` | لوحة تحكم المستخدم (معلومات الحساب والجلسة)         | مستخدم مسجَّل |
| `/admin`     | لوحة تحكم المسؤول (إدارة المستخدمين + السجلات)      | Admin فقط    |

---

## نقاط الـ API

### المصادقة

| الطريقة | المسار              | الوصف                          |
|---------|--------------------|---------------------------------|
| POST    | `/api/auth/register` | إنشاء حساب جديد               |
| POST    | `/api/auth/login`    | تسجيل الدخول                  |
| POST    | `/api/auth/logout`   | تسجيل الخروج                  |
| GET     | `/api/auth/me`       | بيانات المستخدم الحالي        |

### الإدارة (Admin فقط)

| الطريقة | المسار                      | الوصف                   |
|---------|-----------------------------|--------------------------|
| GET     | `/api/admin/users`          | قائمة جميع المستخدمين   |
| POST    | `/api/admin/users/:id/unlock` | فتح حساب مقفل          |
| GET     | `/api/admin/logs`           | سجلات التدقيق           |
| GET     | `/api/admin/stats`          | إحصاءات النظام          |

---

## مخطط قاعدة البيانات

### جدول `users`

| العمود           | النوع    | الوصف                        |
|------------------|---------|-------------------------------|
| `id`             | integer | المعرّف الفريد (primary key)  |
| `username`       | text    | اسم المستخدم (فريد)           |
| `password_hash`  | text    | كلمة المرور مشفَّرة بـ bcrypt |
| `role`           | text    | `admin` أو `user`             |
| `failed_attempts`| integer | عدد محاولات الدخول الفاشلة   |
| `is_locked`      | boolean | هل الحساب مقفل؟               |
| `created_at`     | timestamp | تاريخ الإنشاء               |

### جدول `audit_logs`

| العمود       | النوع     | الوصف                          |
|--------------|----------|--------------------------------|
| `id`         | integer  | المعرّف الفريد                 |
| `user_id`    | integer  | مرجع للمستخدم (FK)             |
| `username`   | text     | اسم المستخدم وقت الحدث         |
| `action`     | text     | نوع الحدث (انظر جدول أدناه)    |
| `ip_address` | text     | عنوان IP للمستخدم              |
| `details`    | text     | تفاصيل إضافية                  |
| `created_at` | timestamp| وقت الحدث                      |

#### أنواع أحداث السجل

| الحدث           | الوصف                              |
|----------------|------------------------------------|
| `register`     | إنشاء حساب جديد                    |
| `login`        | دخول ناجح                          |
| `login_failed` | محاولة دخول فاشلة                  |
| `account_locked` | قفل الحساب تلقائياً              |
| `logout`       | تسجيل خروج                         |
| `admin_unlock` | فتح حساب من قِبَل المسؤول          |

---

## الأوامر المفيدة

```bash
# فحص أنواع TypeScript لجميع الحزم
pnpm run typecheck

# بناء المكتبات المشتركة
pnpm run typecheck:libs

# إعادة توليد الـ API hooks و Zod schemas (بعد تعديل openapi.yaml)
pnpm --filter @workspace/api-spec run codegen

# رفع تغييرات مخطط قاعدة البيانات
pnpm --filter @workspace/db run push

# بناء الخادم للإنتاج
pnpm --filter @workspace/api-server run build
```

---

## آلية الأمان

```
المستخدم يُدخل بيانات
        ↓
التحقق من المدخلات (Zod)
        ↓
البحث في قاعدة البيانات (parameterized query)
        ↓
هل الحساب مقفل؟ → نعم → رفض + تسجيل
        ↓ لا
مقارنة كلمة المرور (bcrypt.compare)
        ↓
صحيحة؟ → لا → زيادة failed_attempts + قفل عند 3 + تسجيل
        ↓ نعم
إعادة ضبط المحاولات + إنشاء جلسة + تسجيل
        ↓
توجيه حسب الدور: admin → /admin | user → /dashboard
```

---

## النشر (Deployment)

المشروع جاهز للنشر على Replit. اضغط **Deploy** من لوحة التحكم وسيعمل تلقائياً في بيئة الإنتاج مع نفس متغيرات البيئة.
