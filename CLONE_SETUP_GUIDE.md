# សៀវភៅណែនាំផ្លូវកាត់៖ BLUEPRINT SETUP GUIDE (វិធីសាស្ត្រទី ២)
## ការដំឡើង និងដាក់ឱ្យដំណើរការប្រព័ន្ធ "AI SALE STUDIO" ក្នុងរយៈពេល ២០ នាទី
*(ឯកសារសម្រាប់ Team Leader យកកូដស្រាប់ទៅប្រើប្រាស់ភ្លាមៗ)*

---

### 🌟 អត្ថប្រយោជន៍នៃវិធីសាស្ត្រទី ២ (Clone Blueprint)
* មិនបាច់សរសេរកូដពីដំបូងឡើងវិញឡើយ
* ទទួលបានមុខងារពេញលេញ ១០០% (CRM, Pipeline, Follow-up, Inbox, Ask AI, Recents, Content Studio...)
* កូដត្រូវបានតេស្តរួចរាល់ គ្មាន Error និងមានសុវត្ថិភាពខ្ពស់។

---

## 🚀 ៣ ជំហានងាយៗក្នុងការដំឡើងប្រព័ន្ធ

### ជំហានទី ១៖ ទាញយកកូដ និងបើកក្នុង Antigravity
1. **ទាញយកកូដ៖**
   - ជម្រើស A (តាម GitHub): `git clone https://github.com/sethavann-lang/vannsitha-ai-sale.git MySaleStudio`
   - ជម្រើស B (តាម File ZIP): ពន្លា (Extract) File `vannsitha-ai-sale-starter.zip` ចូលទៅកាន់ Folder មួយលើកុំព្យូទ័រ។
2. បើកកម្មវិធី **Antigravity** រួចជ្រើសរើសបើក Folder នោះ។

---

### ជំហានទី ២៖ បញ្ជា Antigravity ឱ្យដំឡើងប្រព័ន្ធដោយស្វ័យប្រវត្តិ
> 📋 **ចម្លង (Copy) អត្ថបទខាងក្រោមនេះ ដាក់ចូល Antigravity៖**

```text
សួស្តី Antigravity! នេះជាកូដប្រព័ន្ធ "AI Sale Studio" ដែលខ្ញុំទើបតែ Clone មក។ ខ្ញុំមិនចេះកូដទេ សូមជួយខ្ញុំរៀបចំ Setup ប្រព័ន្ធនេះឱ្យដំណើរការដូចខាងក្រោម៖

១. សូមជួយដំឡើង packages ទាំងអស់ (pnpm install ឬ npm install)។
២. បង្កើតឯកសារ .env ដោយចម្លងពី .env.example ហើយជួយសួរខ្ញុំនូវ Keys សំខាន់ៗចំនួន ៣៖
   - Database URL របស់ Supabase (https://supabase.com)
   - Gemini API Key (https://aistudio.google.com)
   - Facebook Page ID និង Page Access Token របស់ផេកខ្ញុំ
៣. ពេលខ្ញុំផ្តល់ Keys រួច សូមជួយដំណើរការ prisma db push ដើម្បីបង្កើត Tables ក្នុង Database ដោយស្វ័យប្រវត្តិ។
៤. បង្កើតគណនី Admin ដំបូងឱ្យខ្ញុំ ដើម្បីអាច Login បាន។
៥. ចាប់ផ្តើមដំណើរការ server (pnpm dev) ដើម្បីឱ្យខ្ញុំបើកមើលគេហទំព័រលើកុំព្យូទ័ររបស់ខ្ញុំ!

សូមណែនាំខ្ញុំជាភាសាខ្មែរមួយជំហានៗយ៉ាងងាយយល់!
```

---

### ជំហានទី ៣៖ ការបង្ហោះឡើងលើ Internet (Deploy ទៅ Vercel)
ដើម្បីឱ្យកូនក្រុមទាំងអស់អាច Login ចូលប្រើតាមទូរស័ព្ទដៃ ឬកុំព្យូទ័របានគ្រប់ទីកន្លែង៖
1. ចូលទៅកាន់គេហទំព័រ [https://vercel.com](https://vercel.com) (ចុះឈ្មោះ Free)
2. ចុច **Add New Project** ➔ រើសយក Repository នៃកូដនេះ
3. នៅត្រង់កន្លែង **Environment Variables** សូមចម្លងរាល់ Keys ក្នុង `.env` មកដាក់ចូល
4. ចុចប៊ូតុង **Deploy** ➔ រង់ចាំប្រហែល ២ នាទី បងប្អូននឹងទទួលបាន Link គេហទំព័រផ្ទាល់ខ្លួន (ឧ. `https://my-team-sale.vercel.app`) សម្រាប់ចែករំលែកឱ្យកូនក្រុមចូលប្រើបានភ្លាមៗ!

---

## 🔑 របៀបយក KEYS ទាំង ៣ ដោយឥតគិតថ្លៃ (FREE)

### ១. Database Supabase (Free 100%)
* ចូលទៅកាន់ [https://supabase.com](https://supabase.com) ➔ ចុច **New Project**
* ដាក់ឈ្មោះ Project និងកំណត់ Password
* ចូលទៅកាន់ **Project Settings** ➔ **Database** ➔ រមូរចុះក្រោមរកមើល **Connection string (URI)** រួចចម្លងយកមកដាក់ក្នុង `.env` (ត្រង់ `DATABASE_URL` និង `DIRECT_URL`)។

### ២. Google Gemini API Key (Free 100%)
* ចូលទៅកាន់ [https://aistudio.google.com](https://aistudio.google.com)
* ចុចលើ **Get API key** ➔ ចុច **Create API key**
* ចម្លង Key (ចាប់ផ្តើមដោយ `AIzaSy...`) មកដាក់ក្នុង `.env` ត្រង់ `GEMINI_API_KEY`។

### ៣. Facebook Page Token & Page ID
* យក **Page ID** ពី About នៃ Facebook Page របស់បងប្អូន
* យក **Page Access Token** ពី [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/) ដោយជ្រើសរើសផេករបស់បងប្អូន និងផ្តល់សិទ្ធិ `pages_messaging`, `pages_manage_posts`, `pages_read_engagement`។

---
*ឯកសារផ្លូវការសម្រាប់ប្រព័ន្ធ VANN SITHA AI Sale Studio — រក្សាសិទ្ធិគ្រប់យ៉ាង ២០២៦*
