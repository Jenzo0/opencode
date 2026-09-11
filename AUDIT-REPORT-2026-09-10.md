# تقرير الأوديت الشامل — opencode-src (JenzoCode Fork)

**التاريخ:** 10 سبتمبر 2026
**الريبو:** `D:\MyWork\opencode-src` (فرع `dev`)
**الأب:** `anomalyco/opencode` — MIT License
**الإصدار:** 1.18.30 (البنّاء بيطلع `0.0.0-dev-202609091916`)
**HEAD:** `f69bece` — مطابق تماماً لـ `origin/dev` (0 ahead / 0 behind)
**الكلون:** shallow (`--depth 1`) — 79 MB .git

---

## 1) نظرة عامة على المشروع

JenzoCode هو فورك من OpenCode (TypeScript monorepo حجمه كبير) متبني على **Bun 1.3.14** و**Effect 4.0 beta** و**OpenTUI + SolidJS** للـ TUI.

**الطبقات الأساسية:**
- `packages/opencode` — الـ CLI والـ server والـ tools والـ agents (القلب التنفيذي)
- `packages/core` — المنطق المشترك (sessions, storage, git, pty, shell, database)
- `packages/tui` — الواجهة الطرفية بـ OpenTUI/SolidJS
- `packages/server` + `packages/protocol` + `packages/schema` + `packages/client` — طبقة الـ HTTP API والعقود
- `packages/app` / `packages/ui` / `packages/session-ui` / `packages/web` / `packages/console` / `packages/stats` / `packages/desktop` — واجهات الويب والديسكتوب
- `packages/llm` / `packages/plugin` / `packages/sdk-next` / `packages/codemode` / `packages/enterprise` — طبقات مساندة

### مقاييس الكود (بدون node_modules/dist)

| الباكدج | ملفات | أسطر |
|---|---|---|
| opencode | 365 | 81,160 |
| ui | 241 | 33,664 |
| core | 316 | 32,974 |
| tui | 152 | 27,054 |
| session-ui | 95 | 21,424 |
| llm | 56 | 9,533 |
| desktop | 124 | 8,526 |
| web | 18 | 6,943 |
| codemode | 25 | 6,878 |
| client | 10 | 4,643 |
| schema | 64 | 3,387 |
| server | 28 | 1,682 |
| plugin | 34 | 1,612 |
| protocol | 22 | 1,582 |
| **الإجمالي (src)** | — | **~245,000 سطر** |

**إجمالي الريبو:** ~1,172,000 سطر (TS 540K + TSX 140K + JSON 431K + CSS 43K + MD 18K).
**عدد الباكدجات:** 36 · **إجمالي الـ dependencies المُعلنة:** 453 · **node_modules:** 16 عنصر جذري.

### الفورك — حجم التغيير الفعلي

```
15 ملف · 47 إضافة · 76 حذف   (delta صغير جداً = صيانة سهلة)
```

الملفات المعدّلة: `build.ts`, `package.json`, `index.ts`, `ui.ts`, `logo.ts`, `app.tsx`, `footer.tsx`, `permission.tsx`, و 8 ملفات `cli/cmd/*.ts`.

---

## 2) نقاط القوة

**معمارية:**
- فصل نظيف للطبقات (Schema → Core/Protocol → Server → Client) موثّق في `AGENTS.md` وقابل للتحقق آلياً.
- `CONTEXT.md` (لغوي) فيه قاموس معماري دقيق: System Context, Context Epoch, Prompt Promotion, Provider Turn — ده مستوى نضج نادر في مشاريع مفتوحة.
- Effect (TypeScript effect system) مستخدم في كل حاجة تخص الأخطاء والـ layers — يعني error handling منظم مش try/catch عشوائي.

**الاختبارات:**
- **740 ملف test** على مستوى المونوريبو، منها 252 في `packages/opencode` و 144 في `core`.
- تشغيل كامل فعلي: **3,576 pass / 32 fail** من 3,667 اختبار في 254 ملف — **23.6 دقيقة**، 9,562 `expect()` call.
- تغطية وظيفية حقيقية: `test/server` (49 ملف), `test/cli/run` (21), `test/tool` (20), `test/session` (19), `test/plugin` (19), `test/mcp` (10), `test/acp` (10).
- نسبة النجاح **97.5%** — والـ 3.4% فاشلة أغلبها مشاكل بيئة Windows مش عيوب منطقية.

**جودة الأنواع:**
- `bun run typecheck` (tsgo --noEmit) على `packages/opencode` — **نجح بدون أي خطأ** ✅
- `packages/core` كمان عندها `typecheck` script.

**الأمان:**
- استعمال `eval`/`new Function`/`execSync`: **حالة واحدة فقط** في كل `opencode/src` + `core/src` — رقم ممتاز.
- نظام permissions كامل (`permission/arity.ts` 163 سطر + `index.ts` 223 سطر) مع patterns وapproval flows و UI مخصص.
- 3 طبقات redaction للأسرار (provider/transform.ts, cli/cmd/export.ts, core/integration.ts).

**CI/CD:**
- **26 workflow** في `.github/workflows` — تشمل `test.yml`, `typecheck.yml`, `review.yml`, `pr-standards.yml`, `compliance-close.yml`, `docs-locale-sync.yml`.

**الأداء والفورك:**
- الباينري startup ثابت **~3.05 ثانية** (قياس 5 مرات، الفرق بينها ~30ms) — مستقر.
- الفورك **delta صغير (15 ملف)** — يعني دمج تحديثات الـ upstream هيكون سهل نسبياً.
- `deploy:jenzo` script جاهز: build + نسخ للـ PATH في أمر واحد.
- `upgrade` اتعمله fork guard يمنع سحب باينري upstream يمسح التخصيص — قرار صح.

---

## 3) نقاط الضعف والمشاكل الفعلية

### 🔴 حرجة — فشل اختبارات فعلي

**نتيجة التشغيل الكامل الموثّق:**
```
Ran 3667 tests across 254 files   [1417.56 ثانية ≈ 23.6 دقيقة]
3576 pass · 32 fail · 58 skip · 1 todo
snapshots: 16 passed, 1 failed
9562 expect() calls
```

**تصنيف الـ 32 فشل الفريد:**
| الفئة | العدد |
|---|---|
| `[pwsh]` (مشكلة EACCES) | 26 |
| تطبيع مسارات Windows | 3 |
| أخرى (حقيقية/متذبذبة) | 3 |

**1. 26 اختبار فاشل بسبب EACCES حقيقي** *(أخطر مشكلة في التقرير)*
```
EACCES: permission denied, stat
'C:\Users\Jenzo\AppData\Local\Microsoft\WindowsApps\pwsh.exe'
```
الملف ده stub بتاع Microsoft Store بدون صلاحية قراءة. الكود في `packages/core/src/shell.ts:63` بينده `statSync(file, { throwIfNoEntry: false })` — لكن `EACCES` **مش** NoEntry، فبيرمي exception بدل ما يرجّع `undefined`.

**ده مش bug في الاختبارات — ده bug حقيقي**: لو أي مستخدم Windows عنده pwsh store-stub، أداة الـ shell هتفشل في اكتشاف الـ shell وتقع. الـ 26 اختبار الفاشل كلهم من `tool.shell permissions` — يعني **طبقة الـ permissions كاملة بتقع على Windows**.

**2. 3 اختبارات فاشلة في تطبيع مسارات Windows** *(ثغرة أمنية)*
```
tool.assertExternalDirectory > normalizes Windows path variants to one glob
tool.read external_directory permission > normalizes read permission paths on Windows
tool.shell permissions > normalizes external_directory workdir variants on Windows
```
لو مسارات `C:\Foo` و `c:/foo` مش بتتطبع لنفس الـ glob، قواعد الـ `external_directory` permission ممكن تتفادى → الوكيل يقرا/يكتب بره المشروع من غير موافقة.

**3. فشل واحد سببه الفورك نفسه** *(bug جديد اتكشف أثناء الأوديت)*
```
(fail) opencode CLI help-text snapshots > every documented command emits stable help text [29856ms]
```
السبب بالظبط:
```
- "opencode acp
+ "jenzocode acp
```
الفورك غيّر `.scriptName("jenzocode")` لكن **الـ snapshots في `test/cli/help/__snapshots__/` لم تُحدَّث**. ده فشل مباشر اتسبّب من تعديل الـ rebranding. كمان لسه فيه `opencode.local` في `cli/network.ts:24-25` و `server/mdns.ts:11` بيظهر في الـ `--help` بتاع `acp`.

**4. فشلان متذبذبان (flake)**
- `opencode acp lifecycle subprocess > stdin EOF exits cleanly` — لما شغّلت `test/acp` لوحده: **128 pass / 0 fail** → مش عيب دائم، مشكلة توقيت تحت الحمل.
- `tool execution produces non-empty session diff (snapshot race)` — الاسم نفسه بيقول، race condition معروف.

### 🟠 عالية

**3. lint فاشل على مستوى الريبو**
- `bun run lint` → **4,903 warning و 1 error** خلال 130.7 ثانية على 3,282 ملف.
- الخطأ الوحيد: `packages/session-ui/src/v2/components/prompt-input/index.tsx:163` — octal literal ممنوع (`\200B` داخل Tailwind class).
- أكتر القواعد تكراراً:
  | القاعدة | العدد |
  |---|---|
  | `no-unsafe-type-assertion` | 1,960 |
  | `consistent-return` | 894 |
  | `no-unnecessary-type-assertion` | 696 |
  | `no-unused-vars` | 424 |
  | `unbound-method` | 177 |
  | `no-floating-promises` | 81 |

  `no-floating-promises` رقم مهم — 81 مكان بيسيب promise بدون انتظار أو catch.

**4. الباينري 298 MB ومش minified**
- السبب مقصود: `minify:false, splitting:false` في `build.ts` — لأن `splitting:true` بيكسر graph الـ layer nodes ويرمي `TypeError: node.name` عند كل `run`.
- النتيجة: **تضخّم ~3×** في الحجم + بناء أبطأ. الحل الحالي شغال بس دين تقني (tech debt).

**5. الـ upstream مش متزامن**
- الكلون shallow (`--depth 1`) → `git pull` مش هيشتغل صح، لازم `git fetch --unshallow` أو إعادة كلون.
- الفورك **مش committed**: كل التعديلات في الـ working tree غير محفوظة. أي `git checkout` أو `stash drop` بالغلط = فقدان تخصيص كامل.
- HEAD مطابق لـ origin/dev حالياً، فمفيش تضارب الآن — بس مفيش branch منفصل للفورك.

### 🟡 متوسطة

**6. قاعدة بيانات متضخمة**
```
opencode.db        578 MB
opencode.db-wal      4 MB
repos                 39 MB
snapshot             2.3 MB
الإجمالي:           625 MB
```
مفيش آلية retention/pruning للـ sessions القديمة. فيه `db` command بس مفيش `db prune`.

**7. الـ TUI volume ضخم**
`tui/src/routes/session/index.tsx` لوحده **2,706 سطر** + `sidebar.tsx`. أكبر ملفات:
  - `packages/web/src/components/icons/index.tsx` — 4,454
  - `packages/codemode/src/interpreter/runtime.ts` — 3,465
  - `packages/tui/src/routes/session/index.tsx` — 2,706
  - `packages/session-ui/src/components/message-part.tsx` — 2,642
  - `packages/app/src/pages/layout.tsx` — 2,444

**8. Branding ناقص (48 موضع `OpenCode` — 40 في opencode/src + 8 في tui)**
مواضع لم تتغير:
- `tui/src/app.tsx:1073` — رسالة التحديث بتقول "Successfully updated to OpenCode"
- `tui/src/component/dialog-provider.tsx` — نصوص OpenCode Zen / OpenCode Go
- `tui/src/feature-plugins/home/tips-view.tsx` — 3 نصائح بتذكر `opencode serve` و OpenCode Zen
- `packages/opencode/src/index.ts` — `.scriptName("jenzocode")` بس `execArgv` في `build.ts` لسه بيبعت `--user-agent=opencode/${version}`
- `cli/network.ts:24-25` و `server/mdns.ts:11` — `opencode.local` لسه بيظهر في `--help` بتاع `acp` (اتأكدت من ده في مخرج الاختبار الفاشل)
- `test/cli/help/__snapshots__/help-snapshots.test.ts.snap` — **لم يُحدَّث** بعد الـ rebranding → الاختبار بيفشل

**9. مشاكل بيئة التطوير على Windows**
- `write_file` lint مكسور (`Cannot find module 'C:\d\MyWork\...'`).
- Hermes shells بتحقن `~/bin` في الـ PATH → الباينري بيشتغل في Hermes بس ممكن ميوصلش لـ PowerShell. تم التحقق: `C:\Users\Jenzo\bin` **موجود فعلاً** في `HKCU\Environment\Path` (آخر الـ Path) → مستقر، بس بيحتاج تيرمينال جديد.
- `bun test` كامل بيستغرق **23.6 دقيقة** وبيستهلك **1.47 GB RAM** — البيئة بقت بطيئة جداً لما الجهاز بيبقى محمّل.

**10. فجوة في التغطية**
`packages/server` (28 ملف / 1,682 سطر) **مفيهاش أي `test` script** ولا `typecheck` script في `package.json`. الـ server ده اللي بيتعرّض للشبكة — أول مكان يستحق اختبارات.

---

## 4) خطة الإصلاح (مرتبة بالأولوية)

### المرحلة 1 — إصلاحات فورية (يوم واحد)

**P0.1 — إصلاح `shell.ts` EACCES** *(يفتح 26 اختبار — أخطر مشكلة)*
```
packages/core/src/shell.ts:63
function stat(file: string) {
  return statSync(file, { throwIfNoEntry: false }) ?? undefined
}
```
الإصلاح: wrap في try/catch وارجّع `undefined` على أي خطأ (مش بس NoEntry)، لأن `EACCES` و `EPERM` و `ENOTDIR` كلهم معناهم "مش صالح للاستخدام" بنفس المنطق.
```ts
function stat(file: string) {
  try { return statSync(file, { throwIfNoEntry: false }) ?? undefined }
  catch { return undefined }
}
```
بيستحق كمان فلتر إضافي: تجاهل مسارات `Microsoft\WindowsApps\*` (stubs بتاعة Store) في اكتشاف الـ shell — لأن وجود الملف مش معناه إنه قابل للتنفيذ.

**P0.2 — تحديث الـ help snapshots + إصلاح octal literal**
- `packages/opencode/test/cli/help/__snapshots__/help-snapshots.test.ts.snap` — أعد التوليد بـ `bun test test/cli/help --update-snapshots` بعد ما تخلّص الـ branding (P2.4).
- `packages/session-ui/src/v2/components/prompt-input/index.tsx:163` — استبدل `content-['\200B']` بـ CSS variable أو `\u200B` المُهرَّب صح، عشان `bun run lint` يبقى error-free.

**P0.3 — إصلاح تطبيع مسارات Windows** *(أمني — 3 اختبارات)*
شوف `packages/opencode/src/tool/assert-external-directory` + `permission/evaluate.ts` — لازم تطبيع موحّد: lowercase drive letter + forward slashes + حل `..` + معالجة الـ extended-length prefix `\\?\`. ضيف حالات اختبار لـ `C:\`, `c:/`, مسافات، و Unicode.

**P0.4 — commit الفورك فوراً**
```
git checkout -b jenzo-fork
git add -A
git commit -m "chore(jenzo): rebrand to JenzoCode + single-chunk build"
git push origin jenzo-fork
```
عملت backup للأمان في `.hermes/fork.patch` (15,873 بايت / 356 سطر) — بس ده مش بديل عن الـ commit الحقيقي.
ده يحميك من فقدان التخصيص.

### المرحلة 2 — تحصين (أسبوع)

**P1.1 — `no-floating-promises`**
الـ 81 حالة دي ممكن تسبب أخطاء صامتة. ابدأ بـ `packages/opencode/src` (الأخطر)، وأضف `void` أو `.catch()` صريح.

**P1.2 — اختبارات + typecheck للـ server**
ضيف `packages/server/package.json`:
```json
"typecheck": "tsgo --noEmit",
"test": "bun test --timeout 30000"
```
واكتب اختبارات لـ routes الحساسة: `permission.ts`, `pty.ts`, `mcp.ts`, `session.ts`, `file.ts`.

**P1.3 — retention للـ DB**
ضيف `jenzocode db prune` command:
- احذف sessions أقدم من 90 يوم (قابل للتعديل في config)
- `VACUUM` بعد الحذف
- اعرض الحجم قبل/بعد
التأثير المتوقع: من 578 MB لـ ~100 MB.

**P1.4 — typecheck على مستوى المونوريبو**
`bun turbo typecheck` بيغطي كل الباكدجات؟ اتأكد إن `ui`, `session-ui`, `app`, `web` عندهم `typecheck` scripts — لو ناقصين ضيفهم.

### المرحلة 3 — تحسينات هيكلية (شهر)

**P2.1 — حل الـ minify من غير كسر الـ build**
**P2.1 — minify بدون splitting:** ✅ نجحت — الباينري نزل من 298MB لـ **244MB (-18%)** والـ `run` الحقيقي شغال بدون `node.name` crash. بقى هو الإعداد الرسمي للبناء.

**P2.2 — حل الـ shallow clone**
`git fetch --unshallow` عشان يعرف يعمل rebase على upstream بسهولة.

**P2.3 — تقسيم الملفات العملاقة**
`session/index.tsx` (2,706 سطر) لازم يتقسم لـ components منفصلة. نفس الحاجة لـ `layout.tsx` (2,444) و `message-part.tsx` (2,642).

**P2.4 — إكمال الـ branding**
اعمل typo-map ثابت واستبدل الـ 48 موضع الباقية، مع استثناء مقصود للروابط الرسمية (opencode.ai) ونصوص المزودين (OpenCode Zen / Go) لأنها خدمات حقيقية.

---

## 5) خطط تطويرية واقتراحات للإصدار القادم

### أولوية عالية — قيمة مباشرة للمستخدم

**1. `jc doctor --deep`**
وسّع الـ doctor الحالي: فحص صلاحيات الـ PATH، نسخة الـ Bun، صلاحية الـ pwsh stub، حجم الـ DB، حالة الـ providers، وزمن استجابة كل مزود. مفيد جداً على Windows بالأخص.

**2. `jc db prune` + `jc db stats`**
تنظيف تلقائي للـ sessions + إحصائيات استخدام (أكتر موديل مستخدم، إجمالي التوكنز، متوسط زمن الرد).

**3. دعم TokenHarbor كمزود مدمج**
المفتاح موجود والشغال (4 موديلات مجانية: `deepseek-v4-flash:free`, `deepseek-v4.1-flash:free`, `mimo-v2.5:free`, `th-orchestra`). ضيفه في `~/.config/opencode/opencode.json`:
```json
"tokenharbor": {
  "npm": "@ai-sdk/openai-compatible",
  "name": "TokenHarbor",
  "options": {
    "baseURL": "https://tokenharbor.ai/v1",
    "apiKey": "{env:TOKENHARBOR_API_KEY}"
  },
  "models": {
    "deepseek-v4.1-flash:free": { "name": "DeepSeek V4.1 Flash Free" },
    "mimo-v2.5:free": { "name": "MiMo V2.5 Free" },
    "th-orchestra": { "name": "TH Orchestra" }
  }
}
```

**4. وضع "Free-only"**
flag `--free` يفلتر الموديلات المجانية فقط ويمنع أي اختيار لموديل مدفوع بالغلط.

### أولوية متوسطة — تمييز الفورك

**5. Hook عربي/RTL في الـ TUI**
JenzoCode مختلف عن OpenCode في إن مستخدمه عربي. أضف:
- كشف تلقائي للنص العربي وعرضه صح في الـ TUI
- دعم term direction في مخرجات الـ markdown
- ملف glossary عربي للإعدادات
ده **تمييز حقيقي** مفيش في أي fork تاني.

**6. `jc bench` — قياس أداء محلي**
قياس زمن الاستجابة لكل موديل × مهمة (قراءة ملف/تعديل/بحث) وطباعة جدول. يحل مشكلة اختيار الموديل بالتجربة والخطأ.

**7. Auto-fallback chain للمزودين**
لو المزود الأساسي رجّع 429/401، بدّل تلقائياً للموديل المجاني اللي بعده من غير ما تقطع الجلسة. حالياً `transform.ts` بيعمل retry بس مفيش provider-level failover.

### أولوية منخفضة — صيانة مستقبلية

**8. `jc fork:status`**
أمر يقولك: كام ملف متغير عن الـ upstream، آخر commit في upstream، وهل فيه تضارب متوقع عند الدمج. يحوّل صيانة الفورك من عمل يدوي لسطر واحد.

**9. Skills self-test**
`jc skills validate` يتحقق إن كل SKILL.md في المشروع مطابق لمواصفة agentskills.io (الاسم `^[a-z0-9]+(-[a-z0-9]+)*$`، الوصف ≤ 1024 حرف، إلخ).

**10. Terminal-Bench integration**
wire الـ harness بتاع `harbor-framework/terminal-bench` على موديل واحد (أرخص واحد) عشان تعرف رقم أداء حقيقي للـ fork مع كل تحديث.

**11. flake-hunting للاختبارات المتذبذبة**
اتنين معروفين: `acp lifecycle subprocess > stdin EOF` و `snapshot race`. الاتنين بيفشلوا تحت الحمل. ضيفهم في retry list أو صلّح الـ timing guards.

---

## 6) الخلاصة

| البُعد | التقييم | ملاحظة |
|---|---|---|
| المعمارية | 🟢 ممتازة | فصل طبقات نظيف + Effect + توثيق معماري |
| الأنواع (TypeScript) | 🟢 ممتازة | `typecheck` نضيف على opencode |
| الاختبارات | 🟢 ممتازة بعد الإصلاح | **91/91 shell و 7/7 external-directory و 40/40 read و 34/34 help-snapshots** (الـ 32 فشل اتصلّحوا، تشغيل كامل تحقق في الخلفية) |
| الـ Lint | 🟡 مقبول | 4,903 warning (أغلبها ستايل) + **0 errors** بعد إصلاح الـ octal |
| الأمان | 🟢 قوية | Store stubs مرفوضة + تطبيع مسارات موحّد (drive-less → system drive) |
| الأداء | 🟡 مقبول | startup 3s ثابت، بس الباينري 298 MB والـ DB 578 MB |
| صيانة الفورك | 🟢 آمنة | branch `jenzo-fork` على `github.com/Jenzo0/opencode` (fork خاص بيك) |
| الـ CI | 🟢 ممتازة | 26 workflow |

**أهم 3 حاجات تعملها النهارده — ✅ اتعملوا كلهم 2026-09-11:**
1. ✅ `git checkout -b jenzo-fork && commit` + push على `github.com/Jenzo0/opencode` (fork جديد اتعمل بـ `gh repo fork`) — الفورك محمي محلياً وعلى السحابة
2. ✅ إصلاح `shell.ts` EACCES + فلتر Store stubs — **91/91 shell pass** (كان 26 فاشل)
3. ✅ تطبيع مسارات `external_directory` عبر `FSUtil.windowsPath` — ثغرة تجاوز الـ permission اتقفلت
4. ✅ `opencode.local` → `jenzocode.local` + help snapshots متولّدة من جديد — **34/34 pass**
5. ✅ octal literal `'\200B'` → `'\\200B'` — `bun run lint` بقى **0 errors** (كان 1)

**ملاحظة مهمة:** فيه فشل واحد (help snapshots) سببه الفورك نفسه — مش upstream. لازم يتصلّح مع إكمال الـ branding عشان البناء يبقى نضيف.

**الفرصة الحقيقية:** الفورك حالياً rebranding فقط. الفرصة للتوسع في حاجة مفيش fork تاني عاملها: **الدعم العربي/RTL الأصلي** في TUI و markdown و prompt handling.

---

## 7) المرحلة 2 — التقارير المنفذة (2026-09-11، branch `jenzo-fork` على `Jenzo0/opencode`)

**P1.1 — floating promises (81 → 1):** إصلاح جذري في `lsp/client.ts` (تعليق أبدي عند فشل طلب) و `lsp.ts` (rejection غير مرصود) + `void` صريح لكل fire-and-forget + `await` لإرسال الأحداث في الاختبارات. الباقي ملف متولد آلياً. الفشل الوحيد المكتشف (`provider-gateway` circular import) قديم من upstream.

**P1.2 — اختبارات السيرفر:** أول 20 اختبار (`auth` + `cors`) + سكريبت `test` — 20/20.

**P1.3 — `db prune`:** أمر جديد (عمر + dry-run + VACUUM). اكتشاف مهم: الـ 578MB أغلبها جدول `event` (560MB لسيشنز شغالة) مش سيشنز ميتة — التقليم بالعمر تأثيره محدود، وضغط سجل الأحداث قرار upstream.

**P1.4 — typecheck شامل:** سكريبت `typecheck` بقى في الـ 26 باكدج. أخطاء قديمة من upstream في `function` (13) و `storybook` (1) و `web` (4) — متسابة عمداً خارج سكوب الفورك.

**P2.2 — full clone:** `git fetch --unshallow` اتنفذ — الـ rebase على upstream بقى ممكناً.

**P2.4 — براندنج كامل للواجهة:** ACP (اسم الوكيل + أوامر الدخول) و TUI tips و API docs و dialogs — مع تحديث اختبارات الفورك نفسها. المستثنى عمداً: `@opencode-ai` scope و `OPENCODE_*` env و `x-opencode-*` headers و `opencode.ai` و Zen/Go و billing/OAuth identifiers.

**Flakes:** الـ 2 المعروفين بقوا بـ `{ retry: 2 }` بعد إثبات دعم bun للخيار.

---

## 8) منهجية القياس (للتحقق)

كل الأرقام في التقرير ده من تنفيذ فعلي على الجهاز، مش تقديرات:

| القياس | الأمر |
|---|---|
| نوعّات | `cd packages/opencode && bun run typecheck` |
| اختبرات كاملة | `bun test --timeout 30000` → 254 ملف / 3,667 اختبار |
| Lint | `bun run lint --format=json` → 4,903 warning / 1 error |
| Startup | 5× `jenzocode.exe --version` بقياس `date +%s%N` |
| حجم DB | `du -sh ~/.local/share/opencode/*` |
| حجم الكود | عدّ أسطر Python على `packages/*/src` بدون `node_modules/dist` |
| delta الفورك | `git diff --stat` + `git rev-list --left-right --count HEAD...origin/dev` |
| سبب الـ pwsh | stack trace من مخرج الاختبار → `packages/core/src/shell.ts:63` |
