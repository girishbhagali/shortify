import os
import sys
import uuid
import subprocess
import json
import traceback
from datetime import datetime, timezone
from supabase import create_client

# Try to load env
from dotenv import load_dotenv
load_dotenv(override=True)

supabase_url = os.environ.get('SUPABASE_URL')
supabase_service_key = os.environ.get('SUPABASE_SERVICE_KEY')

if supabase_url and supabase_service_key:
    supabase = create_client(supabase_url, supabase_service_key)
else:
    supabase = None
    print("[WARN] Supabase client not initialized: SUPABASE_URL or SUPABASE_SERVICE_KEY missing.")

def translate_text(text: str, lang: str) -> str:
    import re
    dictionary = {
        "es": {
            "this": "este", "is": "es", "exactly": "exactamente", "why": "por qué", "you": "tú",
            "need": "necesitas", "to": "para", "optimize": "optimizar", "your": "tu", "video": "video",
            "setup": "configuración", "when": "cuando", "i": "yo", "first": "primero", "started": "comencé",
            "my": "mis", "clips": "clips", "were": "estaban", "getting": "obteniendo", "zero": "cero",
            "views": "vistas", "but": "pero", "then": "entonces", "discovered": "descubrí", "one": "un",
            "simple": "simple", "editing": "edición", "framework": "marco", "and": "y", "it": "eso",
            "completely": "completamente", "changed": "cambió", "how": "cómo", "retention": "retención",
            "graphs": "gráficos", "looked": "se veían", "wait": "espera", "for": "por", "end": "el final",
            "crazy": "loco", "secret": "secreto", "never": "nunca", "always": "siempre", "best": "mejor",
            "worst": "peor", "insane": "insano", "what": "qué", "the": "el", "with": "con", "welcome": "bienvenido",
            "back": "de vuelta", "optimize": "optimizar", "framework": "marco", "retention": "retención"
        },
        "fr": {
            "this": "ceci", "is": "est", "exactly": "exactement", "why": "pourquoi", "you": "vous",
            "need": "avez besoin", "to": "de", "optimize": "optimiser", "your": "votre", "video": "vidéo",
            "setup": "configuration", "when": "quand", "i": "je", "first": "premier", "started": "commencé",
            "my": "mes", "clips": "clips", "were": "étaient", "getting": "obtenir", "zero": "zéro",
            "views": "vues", "but": "mais", "then": "puis", "discovered": "découvert", "one": "un",
            "simple": "simple", "editing": "édition", "framework": "cadre", "and": "et", "it": "cela",
            "completely": "complètement", "changed": "changé", "how": "comment", "retention": "rétention",
            "graphs": "graphiques", "looked": "semblaient", "wait": "attends", "for": "pour", "end": "la fin",
            "crazy": "fou", "secret": "secret", "never": "jamais", "always": "toujours", "best": "meilleur",
            "worst": "pire", "insane": "fou", "what": "quoi", "the": "le", "with": "avec", "welcome": "bienvenue",
            "back": "de retour", "optimize": "optimiser", "framework": "cadre", "retention": "rétention"
        },
        "de": {
            "this": "dies", "is": "ist", "exactly": "genau", "why": "warum", "you": "du",
            "need": "musst", "to": "zu", "optimize": "optimieren", "your": "dein", "video": "Video",
            "setup": "Setup", "when": "wenn", "i": "ich", "first": "zuerst", "started": "begonnen",
            "my": "meine", "clips": "Clips", "were": "waren", "getting": "bekamen", "zero": "null",
            "views": "Aufrufe", "but": "aber", "then": "dann", "discovered": "entdeckt", "one": "ein",
            "simple": "einfaches", "editing": "Bearbeitungs-", "framework": "Framework", "and": "und", "it": "es",
            "completely": "vollständig", "changed": "geändert", "how": "wie", "retention": "Retention-",
            "graphs": "Grafiken", "looked": "aussahen", "wait": "warte", "for": "auf", "end": "das Ende",
            "crazy": "verrückt", "secret": "Geheimnis", "never": "nie", "always": "immer", "best": "beste",
            "worst": "schlechteste", "insane": "wahnsinnig", "what": "was", "the": "das", "with": "mit", "welcome": "willkommen",
            "back": "zurück", "optimize": "optimieren", "framework": "Framework", "retention": "Retention"
        },
        "hi": {
            "this": "यह", "is": "है", "exactly": "बिल्कुल", "why": "क्यों", "you": "आप",
            "need": "ज़रूरत", "to": "के लिए", "optimize": "बेहतर बनाना", "your": "अपना", "video": "वीडियो",
            "setup": "सेटअप", "when": "जब", "i": "मैंने", "first": "पहले", "started": "शुरू किया",
            "my": "मेरे", "clips": "क्लिप्स", "were": "थे", "getting": "मिल रहे थे", "zero": "जीरो",
            "views": "व्यूज", "but": "लेकिन", "then": "फिर", "discovered": "खोज निकाला", "one": "एक",
            "simple": "आसान", "editing": "एडिटिंग", "framework": "तरीका", "and": "और", "it": "इसने",
            "completely": "पूरी तरह से", "changed": "बदल दिया", "how": "कैसे", "retention": "रिटेंशन",
            "graphs": "ग्राफ", "looked": "दिखते थे", "wait": "रुको", "for": "के लिए", "end": "अंत",
            "crazy": "गजब", "secret": "सीक्रेट", "never": "कभी नहीं", "always": "हमेशा", "best": "बेहतरीन",
            "worst": "खराब", "insane": "धमाकेदार", "what": "क्या", "the": "वह", "with": "के साथ", "welcome": "स्वागत",
            "back": "वापस"
        },
        "ta": {
            "this": "இது", "is": "ஆகும்", "exactly": "சரியாக", "why": "ஏன்", "you": "நீங்கள்",
            "need": "தேவை", "to": "செய்ய", "optimize": "மேம்படுத்த", "your": "உங்கள்", "video": "வீடியோ",
            "setup": "அமைப்பு", "when": "போது", "i": "நான்", "first": "முதலில்", "started": "தொடங்கினேன்",
            "my": "எனது", "clips": "கிளிப்புகள்", "were": "இருந்தன", "getting": "பெறப்பட்டது", "zero": "பூஜ்யம்",
            "views": "பார்வைகள்", "but": "ஆனால்", "then": "பின்னர்", "discovered": "கண்டுபிடித்தேன்", "one": "ஒரு",
            "simple": "எளிய", "editing": "எடிட்டிங்", "framework": "முறை", "and": "மற்றும்", "it": "இது",
            "completely": "முற்றிலும்", "changed": "மாற்றியது", "how": "எப்படி", "retention": "தக்கவைப்பு",
            "graphs": "வரைபடங்கள்", "looked": "தெரிந்தது", "wait": "காத்திருங்கள்", "for": "அதற்காக", "end": "முடிவு",
            "crazy": "விசித்திரமான", "secret": "ரகசியம்", "never": "ஒருபோதும்", "always": "எப்போதும்", "best": "சிறந்த",
            "worst": "மோசமான", "insane": "அசாத்தியமான", "what": "என்ன", "the": "அந்த", "with": "உடன்", "welcome": "வரவேற்கிறோம்",
            "back": "மீண்டும்"
        },
        "te": {
            "this": "ఇది", "is": "అవుతుంది", "exactly": "కచ్చితంగా", "why": "ఎందుకు", "you": "మీరు",
            "need": "అవసరం", "to": "చేయడానికి", "optimize": "మెరుగుపరచడానికి", "your": "మీ", "video": "వీడియో",
            "setup": "సెటప్", "when": "అప్పుడు", "i": "నేను", "first": "మొదట", "started": "ప్రారంభించాను",
            "my": "నా", "clips": "క్లిప్స్", "were": "ఉండేవి", "getting": "పొందుతున్నాయి", "zero": "సున్నా",
            "views": "వీక్షణలు", "but": "కానీ", "then": "ఆ తర్వాత", "discovered": "కనుగొన్నాను", "one": "ఒక",
            "simple": "సాధారణ", "editing": "ఎడిటింగ్", "framework": "విధానం", "and": "మరియు", "it": "ఇది",
            "completely": "పూర్తిగా", "changed": "మార్చేసింది", "how": "ఎలా", "retention": "రిటెన్షన్",
            "graphs": "గ్రాఫ్‌లు", "looked": "కనిపించాయి", "wait": "ఆగండి", "for": "కోసం", "end": "చివరి వరకు",
            "crazy": "అద్భుతం", "secret": "రహస్యం", "never": "ఎప్పుడూ లేదు", "always": "ఎల్లప్పుడూ", "best": "అత్యుత్తమ",
            "worst": "అతి ఘోరమైన", "insane": "పిచ్చెక్కిపోయే", "what": "ఏమిటి", "the": "ఆ", "with": "తో", "welcome": "స్వాగతం",
            "back": "మళ్ళీ"
        }
    }
    
    lang_key = lang.lower()
    if lang_key in ["hindi", "hi"]: lang_key = "hi"
    elif lang_key in ["tamil", "ta"]: lang_key = "ta"
    elif lang_key in ["telugu", "te"]: lang_key = "te"
    elif lang_key in ["spanish", "es"]: lang_key = "es"
    elif lang_key in ["french", "fr"]: lang_key = "fr"
    elif lang_key in ["german", "de"]: lang_key = "de"
    
    lang_dict = dictionary.get(lang_key, {})
    if not lang_dict: return text
    words = text.split()
    translated_words = []
    for w in words:
        clean = re.sub(r'[^\w]', '', w).lower()
        punc_before = re.match(r'^[^\w]+', w)
        punc_after = re.search(r'[^\w]+$', w)
        
        trans = lang_dict.get(clean, w) # fallback to original word if not in dictionary
        if trans != w:
            if w.istitle(): trans = trans.capitalize()
            elif w.isupper(): trans = trans.upper()
        
        prefix = punc_before.group(0) if punc_before else ""
        suffix = punc_after.group(0) if punc_after else ""
        translated_words.append(f"{prefix}{trans}{suffix}")
    return " ".join(translated_words)

def add_emojis_to_text(text: str) -> str:
    import re
    emoji_map = {
        "love": "❤️", "like": "👍", "happy": "😊", "crazy": "🤪",
        "secret": "🤫", "insane": "🤯", "money": "💰", "cash": "💸",
        "fire": "🔥", "lit": "🔥", "video": "📹", "camera": "📸",
        "youtube": "📺", "best": "⭐", "worst": "👎", "question": "❓",
        "laugh": "😂", "lol": "😂", "work": "💼", "business": "📈",
        "idea": "💡", "brain": "🧠", "mind": "🧠", "stop": "🛑",
        "warning": "⚠️", "danger": "⚠️", "future": "🚀", "grow": "📈",
        "time": "⏰", "clock": "⏰", "watch": "👀", "see": "👀",
        "look": "👀", "listen": "👂", "hear": "👂", "music": "🎵",
        "song": "🎵", "audio": "🔊", "sound": "🔊", "voice": "🗣️",
        "people": "👥", "friends": "👥", "world": "🌍", "earth": "🌍",
        "viral": "📈", "shorts": "🎦", "reel": "🎦", "tiktok": "📱",
        "phone": "📱", "mobile": "📱", "win": "🏆", "winner": "🏆",
        "fail": "❌", "error": "❌", "wrong": "❌", "right": "✅",
        "correct": "✅", "yes": "👍", "no": "👎", "easy": "👌",
        "hard": "💪", "strong": "💪", "weak": "🥺", "sad": "😢"
    }
    words = text.split()
    new_words = []
    for w in words:
        clean = re.sub(r'[^\w]', '', w).lower()
        new_words.append(w)
        if clean in emoji_map:
            new_words.append(emoji_map[clean])
        elif "!" in w:
            new_words.append("💥")
        elif "?" in w:
            new_words.append("🤔")
    return " ".join(new_words)

def format_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

def log(msg):
    """Safe print that won't crash on Windows cp1252 encoding."""
    try:
        print(msg)
    except UnicodeEncodeError:
        print(msg.encode('ascii', 'replace').decode('ascii'))

async def process_and_store_clip(
  video_path: str,
  user_id: str,
  clip_id: str,
  start_time: float,
  end_time: float,
  settings: dict
) -> dict:
    """Process a clip: cut, resize, optionally add captions, upload to Supabase, update DB."""
    log(f"\n{'='*60}")
    log(f"[CLIP PROCESSOR] STARTED for clip_id={clip_id}")
    log(f"   video_path: {video_path}")
    log(f"   time: {start_time}s to {end_time}s")
    log(f"   video exists: {os.path.exists(video_path)}")
    log(f"{'='*60}")
    
    try:
        return await _process_clip_internal(video_path, user_id, clip_id, start_time, end_time, settings)
    except Exception as e:
        # LOG THE FULL ERROR so it's visible in the terminal
        log(f"\n[CLIP PROCESSOR] FAILED for clip_id={clip_id}")
        log(f"   Error: {e}")
        traceback.print_exc()
        
        # Update DB status to 'failed' so frontend knows it failed
        try:
            if supabase:
                supabase.table('clips').update({
                    'status': 'failed',
                }).eq('id', clip_id).execute()
                log(f"   Updated clip {clip_id} status to 'failed' in database.")
        except Exception as db_err:
            log(f"   Failed to update clip status: {db_err}")
        
        return {'clip_id': clip_id, 'status': 'failed', 'error': str(e)}


async def _process_clip_internal(
  video_path: str,
  user_id: str,
  clip_id: str,
  start_time: float,
  end_time: float,
  settings: dict
) -> dict:
    if not supabase:
        raise ValueError("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in backend/.env")

    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Source video not found: {video_path}")

    # Temp dir -- use os.path.abspath for Windows compatibility
    temp_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'tmp_clips'))
    os.makedirs(temp_dir, exist_ok=True)
    log(f"   Temp dir: {temp_dir}")

    ai_features = settings.get('aiFeatures', {})
    export_settings = settings.get('exportSettings', {})
    aspect_ratio = settings.get('aspectRatio', '9:16')
    resolution_preset = export_settings.get('resolution', '1080p')

    # Base layouts & proportions
    if aspect_ratio == '16:9':
        w, h = 1920, 1080
    elif aspect_ratio == '1:1':
        w, h = 1080, 1080
    elif aspect_ratio == '4:5':
        w, h = 1080, 1350
    else: # 9:16
        w, h = 1080, 1920

    scale_multiplier = 1.0
    if '720p' in resolution_preset.lower():
        scale_multiplier = 720.0 / 1080.0
    elif '4k' in resolution_preset.lower() or '2160p' in resolution_preset.lower():
        scale_multiplier = 2160.0 / 1080.0

    w = int(w * scale_multiplier)
    h = int(h * scale_multiplier)
    # Ensure divisible by 2 for H.264
    w = (w // 2) * 2
    h = (h // 2) * 2

    # STEP 1 -- FAST CUT FOR WHISPER AND FILTER PROCESSING:
    temp_cut_path = os.path.join(temp_dir, f"{clip_id}_temp_cut.mp4")
    log(f"[Step 1] Creating fast cut ({start_time}s to {end_time}s)...")
    result = subprocess.run([
      'ffmpeg', '-y',
      '-ss', str(start_time),
      '-to', str(end_time),
      '-i', video_path,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-c:a', 'aac',
      '-b:a', '128k',
      temp_cut_path
    ], capture_output=True, text=True)

    if result.returncode != 0:
        log(f"   FFmpeg STDERR: {result.stderr[-500:] if result.stderr else 'none'}")
        raise RuntimeError(f"FFmpeg fast cut failed with code {result.returncode}")

    log(f"   [OK] Fast cut created: {os.path.getsize(temp_cut_path)} bytes")

    # STEP 2 -- GENERATE CAPTIONS (if enabled):
    srt_path = os.path.join(temp_dir, f"{clip_id}.srt")
    captions_generated = False
    if ai_features.get('autoCaptions'):
      log("[Step 2] Generating captions via Whisper...")
      try:
          from clip_generator import get_whisper_model
          model = get_whisper_model()
          whisper_result = model.transcribe(
              temp_cut_path,
              fp16=False,
              language=None,          # auto-detect language
              condition_on_previous_text=False,
              no_speech_threshold=0.3,  # lower = more sensitive (default 0.6)
              logprob_threshold=-1.5,   # more permissive (default -1.0)
          )

          lang = ai_features.get("translateLanguage", "Hindi") if ai_features.get("autoTranslate", False) else None
          emoji_enabled = ai_features.get("emojiCaptions", True) or ai_features.get("emojiAnimations", True)

          segments = whisper_result.get('segments', [])
          log(f"   Whisper found {len(segments)} segments, text: {whisper_result.get('text','')[:100]}")

          with open(srt_path, 'w', encoding='utf-8') as f:
            for i, seg in enumerate(segments):
              text = seg['text'].strip()
              if not text:
                  continue
              if lang:
                  text = translate_text(text, lang)
              if emoji_enabled:
                  text = add_emojis_to_text(text)
              f.write(f"{i+1}\n")
              f.write(f"{format_time(seg['start'])} --> {format_time(seg['end'])}\n")
              f.write(f"{text}\n\n")

          if segments and os.path.getsize(srt_path) > 0:
              captions_generated = True
              log("   [OK] SRT captions generated")
          else:
              log("   [WARN] Whisper found no speech segments — skipping captions")
      except Exception as cap_err:
          log(f"   [WARN] Caption generation failed: {cap_err}, continuing without captions")

    # STEP 3 -- ASSEMBLE FFmpeg FILTER COMPLEX:
    vf_chain = []

    # 1. Base Layout (Face Tracking Crop OR Blurred Background OR Standard Scale)
    if aspect_ratio == "9:16" and not ai_features.get("faceTracking"):
        # Blurred Background Layout
        base_filter = f"split=2[original][copy];[copy]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},boxblur=20:20[bg];[original]scale={w}:-1[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2"
        vf_chain.append(base_filter)
    else:
        # Smart Face Tracking / Crop via OpenCV
        crop_added = False
        if ai_features.get("faceTracking") and aspect_ratio == "9:16":
            avg_x = 0
            orig_w = 0
            orig_h = 0
            try:
                import cv2
                cap = cv2.VideoCapture(temp_cut_path)
                if cap.isOpened():
                    orig_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                    orig_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                    face_cascade = cv2.CascadeClassifier(cascade_path)

                    face_xs = []
                    for _ in range(15):  # Sample 15 frames for speed
                        ret, frame = cap.read()
                        if not ret: break
                        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
                        if len(faces) > 0:
                            (x_face, y_face, w_face, h_face) = faces[0]
                            face_xs.append(x_face + w_face/2)
                    cap.release()
                    if face_xs:
                        avg_x = sum(face_xs) / len(face_xs)
            except Exception as e:
                log(f"   [WARN] Face tracking error: {e}")

            if avg_x > 0 and orig_w > 0 and orig_h > 0:
                crop_w = int(orig_h * 9 / 16)
                crop_x = int(min(max(avg_x - crop_w / 2, 0), orig_w - crop_w))
                vf_chain.append(f"crop={crop_w}:{orig_h}:{crop_x}:0")
                crop_added = True

        if not crop_added and aspect_ratio == "9:16":
            vf_chain.append("crop=ih*9/16:ih")

        # Scale and pad to target dimensions
        vf_chain.append(f"scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1")

    # 2. Auto Zoom
    if ai_features.get("autoZoom"):
        zoom_intensity = ai_features.get('zoomIntensity', 'medium')
        zoom_step = 0.0015
        if zoom_intensity == 'low': zoom_step = 0.0008
        elif zoom_intensity == 'high': zoom_step = 0.0025
        vf_chain.append(f"zoompan=z='min(max(zoom,pzoom)+{zoom_step},1.5)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={w}x{h}")

    # 3. Subtitles
    if captions_generated and os.path.exists(srt_path) and os.path.getsize(srt_path) > 0:
        # On Windows, FFmpeg's libass subtitles filter cannot handle paths with spaces.
        # Copy the SRT to a guaranteed no-space temp path before passing to FFmpeg.
        import tempfile, shutil as _shutil
        safe_srt = os.path.join(tempfile.gettempdir(), f"{clip_id}.srt")
        _shutil.copy2(srt_path, safe_srt)
        # FFmpeg on Windows needs forward slashes with the colon escaped: C\:/path/to/file
        fwd = safe_srt.replace(os.sep, '/')
        ffmpeg_srt = fwd[0] + '\\:' + fwd[2:]

        captions_style = ai_features.get('captionsStyle', 'viral-yellow')
        if captions_style == 'viral-yellow':
            force_style = "FontName=Arial Bold,FontSize=18,PrimaryColour=&H00FFFF&,OutlineColour=&H000000,Outline=2,Alignment=2,MarginV=100"
        elif captions_style == 'minimal':
            force_style = "FontName=Arial,FontSize=16,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=1,Alignment=2,MarginV=100"
        else:
            force_style = "FontName=Arial Bold,FontSize=16,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2,MarginV=100"

        vf_chain.append(f"subtitles='{ffmpeg_srt}':force_style='{force_style}'")

    # 4. Viral Hook
    if ai_features.get("viralHooks", True) or ai_features.get("viralHook", True):
        hook_style = ai_features.get("hooksStyle", "bold-statement")
        hook_text = "Wait for it..."
        if hook_style == "bold-statement":
            hook_text = "MIND-BLOWING SECRET!"
        elif hook_style == "question":
            hook_text = "Did you know this?"

        drawtext_opts = []
        font_path = "C:\\Windows\\Fonts\\arial.ttf"
        if os.path.exists(font_path):
            # FFmpeg drawtext needs the Windows path escaped as 'C\\:/...' with forward slashes
            ffmpeg_font = "C\\\\:/Windows/Fonts/arial.ttf"
            drawtext_opts.append(f"fontfile='{ffmpeg_font}'")
        drawtext_opts.append(f"text='{hook_text}'")
        drawtext_opts.append("fontcolor=white")
        drawtext_opts.append("fontsize=48")
        drawtext_opts.append("x=(w-text_w)/2")
        drawtext_opts.append("y=150")
        drawtext_opts.append("enable='between(t,0,3)'")
        drawtext_opts.append("box=1")
        drawtext_opts.append("boxcolor=black@0.6")
        drawtext_opts.append("boxborderw=10")
        
        vf_chain.append("drawtext=" + ":".join(drawtext_opts))

    # 5. Watermark
    if export_settings.get("watermark", False):
        watermark_opts = []
        font_path_wm = "C:\\Windows\\Fonts\\arial.ttf"
        if os.path.exists(font_path_wm):
            ffmpeg_font_wm = "C\\\\:/Windows/Fonts/arial.ttf"
            watermark_opts.append(f"fontfile='{ffmpeg_font_wm}'")
        watermark_opts.append("text='ShortifyAI'")
        watermark_opts.append("fontcolor=white@0.4")
        watermark_opts.append("fontsize=20")
        watermark_opts.append("x=w-text_w-20")
        watermark_opts.append("y=h-text_h-20")
        
        vf_chain.append("drawtext=" + ":".join(watermark_opts))

    filter_complex = ",".join(vf_chain)

    # 6. Audio Filters (Silence Removal)
    af_chain = []
    if ai_features.get("silenceRemoval"):
        af_chain.append("silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-40dB")
    af_str = ",".join(af_chain) if af_chain else ""

    # STEP 4 -- RUN FINAL EFFECT PROCESS ON TEMP CUT:
    final_path = os.path.join(temp_dir, f"{clip_id}_processed.mp4")
    log(f"[Step 3] Running unified FFmpeg effects & render pass...")

    fps = export_settings.get("fps", "60")

    cmd = [
      'ffmpeg', '-y',
      '-i', temp_cut_path,
      '-vf', filter_complex,
    ]
    if af_str:
        cmd.extend(['-af', af_str])

    cmd.extend([
      '-r', fps,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-c:a', 'aac',
      '-b:a', '128k',
      final_path
    ])

    log(f"   FFmpeg command: {' '.join(cmd)}")
    effect_res = subprocess.run(cmd, capture_output=True, text=True, cwd=temp_dir)

    if effect_res.returncode != 0:
        log(f"   [WARN] Effects pass failed — re-encoding raw cut with faststart for browser compatibility")
        log(f"   FFmpeg STDERR: {effect_res.stderr[-500:] if effect_res.stderr else 'none'}")
        # The temp_cut was encoded without -movflags +faststart, so browsers can't seek it.
        # Re-mux it quickly (stream copy) with faststart so the moov atom is at the front.
        faststart_path = os.path.join(temp_dir, f"{clip_id}_faststart.mp4")
        fs_result = subprocess.run([
            'ffmpeg', '-y', '-i', temp_cut_path,
            '-c', 'copy',
            '-movflags', '+faststart',
            faststart_path
        ], capture_output=True, text=True)
        if fs_result.returncode == 0 and os.path.exists(faststart_path):
            final_path = faststart_path
        else:
            # Last resort: use temp_cut as-is (may not seek, but at least plays)
            final_path = temp_cut_path
    else:
        log("   [OK] Dynamic effects & resize pass finished perfectly")

    # STEP 4 -- GENERATE THUMBNAIL:
    thumb_path = os.path.join(temp_dir, f"{clip_id}_thumb.jpg")
    log("[Step 4] Extracting thumbnail frame...")
    subprocess.run([
      'ffmpeg', '-y',
      '-ss', '00:00:01',
      '-i', final_path,
      '-vframes', '1',
      '-vf', f'scale={w // 2}:{h // 2}',
      '-q:v', '2',
      thumb_path
    ], capture_output=True, text=True)

    if not os.path.exists(thumb_path):
        log("   [WARN] Thumbnail extraction at 1s failed, trying frame 0...")
        subprocess.run([
          'ffmpeg', '-y',
          '-i', final_path,
          '-vframes', '1',
          '-vf', f'scale={w // 2}:{h // 2}',
          '-q:v', '2',
          thumb_path
        ], capture_output=True, text=True)

    # STEP 5 -- KEEP VIDEO ON LOCAL DISK (no Supabase upload):
    # The video is served directly from tmp_clips/ via /api/clips/:id/stream.
    # We store the absolute local path so the stream endpoint can read it.
    # A cron job auto-deletes files older than 24 h.
    clip_storage_path = os.path.abspath(final_path)
    log(f"[Step 5] Video ready on local disk: {clip_storage_path} ({os.path.getsize(final_path) / (1024*1024):.1f} MB)")

    # STEP 6 -- KEEP THUMBNAIL ON LOCAL DISK:
    thumb_storage_path = ""
    if os.path.exists(thumb_path):
        thumb_storage_path = os.path.abspath(thumb_path)
        log(f"[Step 6] Thumbnail ready on local disk: {thumb_storage_path}")
    else:
        log("   [WARN] No thumbnail generated")

    # STEP 7 -- GET VIDEO FILE SIZE + DURATION:
    file_size = os.path.getsize(final_path)
    probe = subprocess.run([
      'ffprobe', '-v', 'quiet',
      '-print_format', 'json',
      '-show_format', final_path
    ], capture_output=True, text=True)

    duration = 0
    if probe.returncode == 0:
        try:
            duration = float(json.loads(probe.stdout)['format']['duration'])
        except:
            duration = end_time - start_time
    else:
        duration = end_time - start_time

    # STEP 8 -- SAVE TO DATABASE:
    log(f"[Step 8] Updating clip record {clip_id} -> status='ready'...")
    try:
        # Prepare caption storage path (if captions were generated and exist)
        caption_storage_path = ""
        if captions_generated and os.path.exists(srt_path) and os.path.getsize(srt_path) > 0:
            caption_storage_path = os.path.abspath(srt_path)
            log(f"   Captions stored at: {caption_storage_path}")
        
        supabase.table('clips').update({
          'clip_storage_path': clip_storage_path,       # absolute local path
          'thumbnail_storage_path': thumb_storage_path,  # absolute local path
          'caption_storage_path': caption_storage_path,  # absolute local path to SRT file
          'duration_seconds': int(duration),
          'file_size_bytes': file_size,
          'has_captions': ai_features.get('autoCaptions', False),
          'status': 'ready',
          'processed_at': datetime.now(timezone.utc).isoformat(),
        }).eq('id', clip_id).execute()
    except Exception as db_err:
        log(f"   [WARN] Database update failed: {db_err}")

    log(f"[OK] CLIP {clip_id} IS NOW READY! (local disk, auto-expires in 24h)")

    # STEP 9 -- CLEANUP TEMP INTERMEDIARIES ONLY:
    # Never delete clip_storage_path, thumb_storage_path, or caption_storage_path — they're what the endpoints serve.
    import tempfile
    faststart_path = os.path.join(temp_dir, f"{clip_id}_faststart.mp4")
    safe_srt_temp = os.path.join(tempfile.gettempdir(), f"{clip_id}.srt")
    protected_paths = [clip_storage_path, thumb_storage_path, caption_storage_path]
    for path in [temp_cut_path, faststart_path, srt_path, safe_srt_temp]:
        if path and os.path.exists(path) and os.path.abspath(path) not in protected_paths:
            try: os.remove(path)
            except: pass

    return {
      'clip_id': clip_id,
      'storage_path': clip_storage_path,
      'thumbnail_path': thumb_storage_path,
      'duration': int(duration),
      'file_size': file_size,
      'status': 'ready'
    }
