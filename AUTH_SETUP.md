# Reevu Supabase authentication setup

The existing Reevu login and signup UI is connected to Supabase Auth. Complete
the steps below once for email OTP, Google login, profiles, ratings, and reviews.

## 1. Create the Supabase project and add environment variables

1. Create or open a project at https://supabase.com/dashboard.
2. Open the project's **Connect** dialog (or **Project Settings -> API**).
3. Copy the **Project URL** and browser-safe **anon/public key**.
4. Fill in Reevu's `.env` file:

```env
TMDB_TOKEN=your_tmdb_read_access_token
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
SUPABASE_SECRET_KEY=your_server_only_supabase_secret_key
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

`SUPABASE_SECRET_KEY` is used only by the server-side Reevu catalog function.
Never prefix it with `VITE_` and never expose it to browser code.

## 2. Create the Reevu platform tables

In **Supabase Dashboard -> SQL Editor**, run these files in this order:

1. `SUPABASE_PROFILES.sql`
2. `SUPABASE_REVIEWS.sql`
3. `SUPABASE_REEVU_PLATFORM.sql`

The first script creates `profiles`, automatically syncs new and updated Auth
users, backfills existing users, and enables row-level security. The second
creates Reevu's first-party ratings and reviews table. The platform script
creates the server-owned catalog cache and account-synced favorites/watchlists.
Users can only write their own library and review records. Browser clients can
read the public catalog cache but cannot modify it.

## 3. Configure email OTP

1. Open **Authentication -> Sign In / Providers -> Email**.
2. Enable the Email provider and allow new users to sign up.
3. Open **Authentication -> Email Templates**.
4. Select the passwordless **Magic Link / OTP** template and make sure its body
   contains the six-digit token variable:

```html
<h2>Your Reevu verification code</h2>
<p>Enter this code in Reevu:</p>
<p style="font-size: 28px; font-weight: 700; letter-spacing: 8px;">
  {{ .Token }}
</p>
<p>This code expires shortly. If you did not request it, ignore this email.</p>
```

5. If your project sends the separate **Confirm signup** template for first-time
   users, use the same `{{ .Token }}` code block in that template as well.
6. For production delivery, configure **Authentication -> SMTP Settings** with
   your email provider. Supabase's default sender is suitable only for limited
   testing and is rate-limited.

The frontend calls `signInWithOtp`, displays the existing code-entry UI, then
calls `verifyOtp` with `type: "email"`. Sign-in mode does not silently create a
new user; signup mode does.

## 4. Configure allowed website redirects

Open **Authentication -> URL Configuration**.

- During local development, set **Site URL** to:
  `http://127.0.0.1:5173`
- Add these **Redirect URLs**:
  - `http://127.0.0.1:5173/**`
  - `http://localhost:5173/**`
  - `http://127.0.0.1:5174/**`
  - `http://localhost:5174/**`
  - `https://YOUR-PRODUCTION-DOMAIN/**`
- At launch, change **Site URL** to the exact production origin, for example:
  `https://reevu.example`

Use an exact production URL rather than a broad wildcard whenever possible.
Add deployment-preview patterns separately only if you use preview deployments.

## 5. Configure Google OAuth

1. In **Supabase -> Authentication -> Sign In / Providers -> Google**, copy the
   callback URL. For hosted Supabase it normally is:
   `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
2. Open **Google Cloud Console -> Google Auth Platform**.
3. Configure the OAuth consent screen/branding, audience, and scopes. Supabase
   needs `openid`, email, and profile.
4. Create an OAuth client of type **Web application**.
5. Add these **Authorized JavaScript origins**:
   - `http://127.0.0.1:5173`
   - `http://localhost:5173`
   - `http://127.0.0.1:5174`
   - `http://localhost:5174`
   - `https://YOUR-PRODUCTION-DOMAIN`
6. Add the Supabase callback URL from step 1 under
   **Authorized redirect URIs**. Do not put the Vite localhost URL in this
   Google callback field.
7. Copy the Google Client ID and Client Secret into
   **Supabase -> Authentication -> Sign In / Providers -> Google**, enable the
   provider, and save.
8. If the Google app is in testing mode, add the Gmail accounts you will test
   with under **Audience -> Test users**.

After OAuth, Supabase redirects to the Reevu origin. The Auth provider restores
the session, syncs `full_name`, `email`, and `avatar_url`, and shows them in the
existing header account UI.

## 6. Run and test

```powershell
npm install
npm run dev
```

Open the exact URL printed by Vite.

### Test email OTP

1. Open `/auth`, select **Create account**, enter a full name and a real email,
   then click **Send signup code**.
2. Confirm that the existing OTP screen appears and the email contains a
   six-digit code rather than only a magic link.
3. Enter an incorrect code to confirm the error state, then enter the real code.
4. Refresh the page and confirm the session remains active.
5. Sign out, select **Sign in**, and request a login code for the same address.
6. Confirm that resend stays disabled for 60 seconds and sends a new code after
   the countdown.

### Test Google login

1. Sign out and click **Continue with Google**.
2. Complete the Google consent screen.
3. Confirm you return to Reevu and the header shows the Google name/avatar.
4. Refresh, then verify the user remains signed in.
5. Open Supabase **Authentication -> Users** and **Table Editor -> profiles** to
   confirm the Auth user and matching profile row.

### Test route protection

1. Sign out or use a fresh private browser window.
2. Open `/library` directly and confirm Reevu redirects to `/auth`.
3. Sign in and confirm `/library` becomes available.
4. While signed in, open `/auth` and confirm Reevu redirects back into the app.
