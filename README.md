# 🚀 VANN SITHA AI SALE STUDIO - ប្រព័ន្ធ AI គ្រប់គ្រងការលក់ និង CRM

ប្រព័ន្ធគ្រប់គ្រងការឆ្លើយតបអតិថិជនស្វ័យប្រវត្តិតាម Facebook (Comments & Messenger), ប្រព័ន្ធ CRM Pipeline, Live Inbox, Follow-up ស្វ័យប្រវត្តិ, និង AI Analytics Dashboard សម្រាប់អាជីវកម្ម។

---

## 📋 តម្រូវការបច្ចេកវិទ្យាជាមូលដ្ឋាន (Prerequisites)

មុនពេលដំណើរការគម្រោង សូមប្រាកដថាម៉ាស៊ីនកុំព្យូទ័ររបស់អ្នកមានដំឡើងរួចរាល់នូវ៖
* **Node.js**: កំណែ `v18.18.0` ឬថ្មីជាងនេះ (ទាញយកពី [nodejs.org](https://nodejs.org/))
* **pnpm**: កម្មវិធីគ្រប់គ្រង Package ល្បឿនលឿន (ដំឡើងតាមរយៈ `npm install -g pnpm`)

---

## ⚡ ជំហានដំឡើង និងដំណើរការរហ័ស (Quick Start - ៤ ជំហាន)

### ជំហានទី ១៖ ដំឡើង Packages
បើកផ្ទាំង Terminal / Command Prompt ក្នុង Folder នេះ រួចវាយបញ្ជា៖
```bash
pnpm install
```

### ជំហានទី ២៖ រៀបចំ Environment Variables (.env)
ចម្លងឯកសារគំរូ `.env.example` ទៅជា `.env`៖
```bash
cp .env.example .env
```
បន្ទាប់មកបើកឯកសារ `.env` រួចបំពេញព័ត៌មានគន្លឹះចំនួន ២ យ៉ាងតិច៖
1. `DATABASE_URL` & `DIRECT_URL`: យកពីគណនី Supabase ឥតគិតថ្លៃ ([supabase.com](https://supabase.com))
2. `GEMINI_API_KEY`: យកពី Google AI Studio ឥតគិតថ្លៃ ([aistudio.google.com](https://aistudio.google.com))

### ជំហានទី ៣៖ បង្កើតតារាង Database (Prisma Sync)
បញ្ជូនទម្រង់តារាង Database (Tables & Schema) ទៅកាន់ Supabase៖
```bash
pnpm prisma db push
```

### ជំហានទី ៤៖ ចាប់ផ្តើមដំណើរការប្រព័ន្ធ (Run Dev Server)
```bash
pnpm dev
```
បើក Browser (Google Chrome) ចូលទៅកាន់អាសយដ្ឋាន៖
👉 **`http://localhost:3000`**

---

## 📚 ឯកសារជំនួយ និងសៀវភៅណែនាំលម្អិត

ក្នុងកញ្ចប់នេះមានភ្ជាប់ជូននូវសៀវភៅណែនាំជាភាសាខ្មែរយ៉ាងក្បោះក្បាយ៖
* **`CLONE_SETUP_GUIDE.pdf` / `.docx`:** សៀវភៅណែនាំរបៀប Setup គម្រោងមួយជំហានម្តងៗពីដើមដល់ចប់ (Supabase, Vercel, Facebook App)។
* **`MASTER_PROMPT_GUIDE.pdf` / `.docx`:** ឯកសារ Prompt ទាំង ៦ ដំណាក់កាលសម្រាប់យកទៅប្រើប្រាស់ និងរៀនសរសេរកូដជាមួយ AI Antigravity។

---

## 🛠️ បច្ចេកវិទ្យាស្នូល (Tech Stack)
* **Framework:** Next.js 14 (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS & Lucide Icons
* **Database & ORM:** PostgreSQL (Supabase) + Prisma ORM
* **AI Engine:** Google Gemini Pro 1.5
* **Deployment Ready:** Vercel
