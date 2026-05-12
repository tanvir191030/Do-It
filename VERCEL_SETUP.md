# 🚀 Vercel Setup Guide for Do-It App

## Step 1: Add Environment Variables in Vercel

1. Go to your project on **Vercel Dashboard**
2. Click **Settings** → **Environment Variables**
3. Click **Add New Variable** for each of the following:

### Required Variables:

| Variable Name | Value |
|--------------|-------|
| `VITE_SUPABASE_URL` | `your_supabase_project_url` |
| `VITE_SUPABASE_ANON_KEY` | `your_supabase_anon_key` |
| `VITE_OPENROUTER_API_KEY` | `your_openrouter_api_key` |

### Optional Variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `VITE_DEFAULT_THEME` | `dark` | Default theme (dark, light, midnight, forest, sunset, rose, ocean, nord) |
| `VITE_DEFAULT_LANGUAGE` | `en` | Default language (en, bn) |
| `VITE_APP_NAME` | `Do-It` | App name for notifications |

---

## Step 2: Redeploy

After adding the environment variables:

1. Go to **Deployments** tab
2. Click the **⋮** (three dots) on the latest deployment
3. Click **Redeploy**

Or push a new commit to trigger automatic deployment.

---

## Step 3: Verify

1. Open your deployed app
2. Open Browser DevTools → Console
3. You should see no errors related to environment variables
4. Test login/signup - it should work without asking repeatedly

---

## 📝 Notes

- **Environment variables are secret** - they are only available during build time and in the browser (prefixed with `VITE_`)
- **Never commit `.env.local`** to Git - it's in `.gitignore`
- **Production vs Preview** - You can set different values for Production and Preview environments in Vercel

---

## 🔧 Local Development

For local testing, create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then fill in your values in `.env.local`.

---

## ✅ Checklist

- [ ] All 3 required environment variables added in Vercel
- [ ] Redeployed the project
- [ ] Tested login - stays logged in after refresh
- [ ] Tested AI features - working without errors
- [ ] Tested notifications - permission granted

---

**Need Help?** Check Vercel docs: https://vercel.com/docs/environment-variables
