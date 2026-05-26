You are an expert Next.js developer. Build a complete, 
beautiful authentication system for ShortifyAI.

DESIGN STYLE:
- Split screen layout (50/50 on desktop)
- Left side: branding/visual panel
- Right side: auth forms
- Mobile: only show right side (form)
- Colors: Purple #534AB7, Blue #0284C7
- Font: Inter
- Dark mode support

═══════════════════════════════════
LEFT PANEL (branding side):
═══════════════════════════════════
Background: gradient purple #534AB7 → blue #0284C7

Top: ShortifyAI logo (white version)

Center content:
- Big headline: "Turn Videos into Viral Shorts"
- Subtext: "Join 10,000+ creators already using 
  ShortifyAI to grow their audience"

3 feature points with icons:
  ⚡ "Generate 5 clips in under 2 minutes"
  🎯 "AI finds your most viral moments"
  📱 "Ready for TikTok, Reels & Shorts"

Bottom: 3 user avatars overlapping + 
  "500+ creators joined this week"

Floating cards (decorative, animated):
  Card 1: "🔥 Viral Score: 94" floating top right
  Card 2: "✂️ 5 clips generated" floating bottom left
  Subtle floating animation (up/down, Framer Motion)

═══════════════════════════════════
RIGHT PANEL (auth forms):
═══════════════════════════════════
Top right: "Already have an account? Sign in" 
  (toggles between login/signup)

Logo (small, for mobile where left panel is hidden)

TABS: [ Sign Up ] [ Sign In ]
Active tab has purple underline

═══════════════════════
SIGN UP FORM:
═══════════════════════
Title: "Create your account"
Subtitle: "Start free, no credit card needed"

--- SOCIAL LOGIN BUTTONS ---

Button 1 — Google:
[G] Continue with Google
- White background, gray border
- Google G logo (colored)
- Full width button
- On click: supabase.auth.signInWithOAuth({ 
    provider: 'google',
    options: { redirectTo: '/dashboard' }
  })

Button 2 — GitHub (optional, for devs):
SKIP — not needed per requirements

--- DIVIDER ---
─────── or continue with ───────

--- EMAIL + PASSWORD FORM ---
Full Name input:
  - Icon: 👤 person icon inside input
  - Placeholder: "Girish Bhagli"
  - Validation: required, min 2 chars, letters only

Email input:
  - Icon: ✉️ mail icon inside input  
  - Placeholder: "girish@example.com"
  - Validation: valid email format

Password input:
  - Icon: 🔒 lock icon inside input
  - Eye toggle (show/hide password)
  - Placeholder: "Create a password"
  - Validation: min 8 chars
  - Password strength meter below input:
    Weak [█░░░] / Fair [██░░] / 
    Strong [███░] / Very Strong [████]
  - Requirements checklist (show live):
    ✓ At least 8 characters
    ✓ One uppercase letter  
    ✓ One number
    ✗ One special character

Confirm Password input:
  - Show ✓ green check when passwords match
  - Show ✗ red X when they don't match

Terms checkbox:
  "I agree to the Terms of Service 
   and Privacy Policy"
  (links open in new tab)

[Create Account] button:
  - Full width, purple gradient
  - Loading spinner when submitting
  - Disabled until form is valid

--- DIVIDER ---
─────── or use phone number ───────

--- PHONE OTP SECTION ---
Title: "Sign up with Phone"

Phone input:
  - Country code dropdown (default +91 🇮🇳)
  - Shows flag + code: [🇮🇳 +91 ▼]
  - Phone number input beside it
  - Common codes: +91 India, +1 USA, +44 UK
  - Searchable dropdown

[Send OTP] button:
  - Purple outline button
  - On click: supabase.auth.signInWithOtp({
      phone: '+91' + phoneNumber
    })
  - Button shows countdown after sending:
    "Resend OTP in 45s" (counts down to 0)
    Then "Resend OTP" becomes clickable again

OTP INPUT (appears after Send OTP clicked):
  - 6 separate single-digit input boxes
  - Auto-focus moves to next box as user types
  - Auto-paste support (if user copies OTP)
  - Backspace goes to previous box
  - Style: big boxes, purple border when focused
  - Below: "Sent to +91 98765 43210 ✓ Change"

[Verify OTP] button:
  - Appears after all 6 digits entered
  - Auto-submits when last digit typed
  - Loading state: "Verifying..."
  - On success: supabase.auth.verifyOtp({
      phone, token, type: 'sms'
    })
  - Redirect to /dashboard on success

═══════════════════════
SIGN IN FORM:
═══════════════════════
Title: "Welcome back 👋"
Subtitle: "Sign in to your ShortifyAI account"

--- GOOGLE BUTTON (same as signup) ---
[G] Continue with Google

--- DIVIDER ---

Email input (same style as signup)

Password input:
  - Eye toggle
  - "Forgot password?" link (right aligned, purple)

[Sign In] button (purple, full width)

--- DIVIDER ---

Phone OTP signin (same as signup phone section)
But title: "Sign in with Phone OTP"

═══════════════════════
FORGOT PASSWORD FLOW:
═══════════════════════
Click "Forgot password?" → show new mini form:

"Reset your password"
Email input
[Send Reset Link] button
On submit: supabase.auth.resetPasswordForEmail(email)

Success state:
✉️ big email icon
"Check your inbox!"
"We sent a reset link to girish@example.com"
"Didn't receive it? Check spam or resend"
[Resend Email] / [Back to Sign In]

═══════════════════════
AFTER SIGNUP — EMAIL VERIFY:
═══════════════════════
If email signup → show verify email screen:
✉️ animated envelope icon
"Verify your email"
"We sent a verification link to {email}"
"Click the link in the email to activate 
 your account"
[Resend verification email] button
[Change email address] link
Auto-redirect to dashboard once verified

═══════════════════════
ERROR HANDLING:
═══════════════════════
Show inline errors below each field:
- "Email already in use" → red text + red border
- "Wrong password" → red text, show 
  "Forgot password?" link highlighted
- "Invalid OTP" → shake animation on boxes + 
  red border + "Wrong code, try again"
- "OTP expired" → "Code expired. Request new one"
- "Too many attempts" → "Too many tries. 
  Wait 5 minutes before trying again"
- Network error → toast: "Connection error. 
  Check your internet"

All errors: red color #DC2626, 
small text below the field

═══════════════════════
SUCCESS ANIMATIONS:
═══════════════════════
On successful login:
- Button turns green with ✓ checkmark
- "Welcome back, Girish! 🎉" toast appears
- Smooth page transition to /dashboard
- Framer Motion slide animation

On successful signup:
- Confetti animation 🎉
- "Account created! Redirecting..." 
- Redirect to /dashboard/onboarding

═══════════════════════
ONBOARDING (after first signup):
═══════════════════════
3-step welcome flow BEFORE dashboard:

Step 1 — "Tell us about yourself":
  What best describes you?
  [🎬 YouTuber] [📸 Instagram Creator]
  [🎵 TikToker] [💼 Business/Brand]
  [🛠 Developer] [🎓 Student]

Step 2 — "What will you mainly create?":
  [YouTube → Shorts] [Podcast clips]
  [Course content] [Product videos]
  [Event highlights] [Other]

Step 3 — "You're all set! 🎉":
  Show personalised welcome based on answers
  Quick tour offer: [Take 2-min Tour] [Skip]

═══════════════════════
SUPABASE SETUP CODE:
═══════════════════════
Also give me:

lib/supabase.ts:
  createClient setup with env variables

lib/auth.ts:
  signInWithGoogle()
  signInWithPhone(phone)
  verifyPhoneOTP(phone, token)
  signInWithEmail(email, password)
  signUpWithEmail(name, email, password)
  signOut()
  getCurrentUser()
  resetPassword(email)

middleware.ts:
  Protect /dashboard routes
  Redirect to /login if not authenticated
  Redirect to /dashboard if already logged in 
  and trying to access /login

app/auth/callback/route.ts:
  Handle OAuth redirect from Google
  Handle email verification redirect
  Set session cookies

ENV variables needed:
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=

FILES TO CREATE:
  app/(auth)/login/page.tsx
  app/(auth)/signup/page.tsx  
  app/(auth)/forgot-password/page.tsx
  app/(auth)/verify-email/page.tsx
  app/(auth)/onboarding/page.tsx
  app/auth/callback/route.ts
  components/auth/GoogleButton.tsx
  components/auth/PhoneOTPInput.tsx
  components/auth/OTPBoxes.tsx
  components/auth/PasswordStrength.tsx
  lib/supabase.ts
  lib/auth.ts
  middleware.ts

USE THESE LIBRARIES:
  @supabase/supabase-js
  @supabase/ssr (for Next.js App Router)
  framer-motion (animations)
  react-hook-form (form handling)
  zod (validation)
  react-hot-toast (notifications)
  lucide-react (icons)

MOBILE RESPONSIVE:
  - Hide left panel on mobile
  - Full width form on mobile
  - Larger touch targets (min 44px height)
  - Phone OTP input works with mobile keyboard
  - Auto-fill OTP from SMS on Android/iOS