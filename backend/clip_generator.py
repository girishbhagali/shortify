import os
import json
import uuid
import subprocess
import whisper
import cv2
import librosa
import numpy as np
from textblob import TextBlob

# Cache whisper model globally — loaded once, reused every call
_whisper_model = None
def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        print("Loading Whisper 'tiny' model (cached globally)...")
        _whisper_model = whisper.load_model("tiny")
    return _whisper_model

def analyze_transcript(video_path, transcript_segments, window_size=35.0):
    words = []
    for segment in transcript_segments:
        if 'words' in segment:
            words.extend(segment['words'])
    
    if not words: return []
    
    # 1. Dump Audio for Librosa
    audio_path = os.path.join(os.path.dirname(video_path), "temp_audio.wav")
    print("Extracting audio for analysis...")
    subprocess.run([
        "ffmpeg", "-y", "-i", video_path, 
        "-vn", "-acodec", "pcm_s16le", "-ar", "8000", "-ac", "1", 
        audio_path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    print("Loading audio into librosa...")
    try:
        y, sr = librosa.load(audio_path, sr=8000)
        rms = librosa.feature.rms(y=y)[0]
        times = librosa.frames_to_time(np.arange(len(rms)), sr=sr)
        global_mean_rms = np.mean(rms) if len(rms) > 0 else 1.0
        if global_mean_rms == 0: global_mean_rms = 1.0
    except Exception as e:
        print(f"Librosa error: {e}")
        times = np.array([])
        rms = np.array([])
        global_mean_rms = 1.0
    
    windows = []
    video_duration = words[-1]['end'] if words else 0
    print(f"DEBUG: Total words in transcript: {len(words)}")
    print(f"DEBUG: Calculated video duration from transcript: {video_duration}s")
    
    for start_time in range(0, int(video_duration), int(window_size // 2)):
        end_time = start_time + window_size
        if end_time > video_duration + 5: break
            
        window_words = [w for w in words if w['start'] >= start_time and w['end'] <= end_time]
        if not window_words: continue
        
        # NLP Text Analysis
        transcript_text = " ".join([w.get('word', '').strip() for w in window_words])
        transcript_lower = transcript_text.lower()
        
        try:
            blob = TextBlob(transcript_text)
            sentiment_score = abs(blob.sentiment.polarity) # 0 to 1
        except:
            sentiment_score = 0.5
            
        # Hook Detection (look at first 5 seconds of the window)
        first_5_secs = [w.get('word', '').strip().lower() for w in window_words if w['start'] < start_time + 5.0]
        first_5_str = " ".join(first_5_secs)
        
        hook_words = ["wait", "watch", "crazy", "secret", "never", "always", "best", "worst", "how", "why", "what", "top", "reason", "insane"]
        hook_count = sum([1 for hw in hook_words if hw in first_5_str])
        hook_score = min(1.0, hook_count / 3.0) 
        
        # Filler / Intro / Outro Penalty
        filler_words = ["like and subscribe", "welcome back", "thanks for watching", "hit the bell", "leave a comment", "smash that like button", "this video is sponsored"]
        filler_penalty = 0.0
        for fw in filler_words:
            if fw in transcript_lower:
                filler_penalty += 0.3
                
        # Word Density / Silence Penalty
        word_density = len(window_words) / window_size
        if word_density < 1.0: # Less than 1 word per sec means long pauses or silence
            filler_penalty += 0.4
            
        # Repetition Penalty (Lexical Diversity)
        unique_words = len(set([w.lower() for w in transcript_lower.split()]))
        total_words = len(transcript_lower.split())
        lexical_diversity = unique_words / total_words if total_words > 0 else 0
        if lexical_diversity < 0.4: # Highly repetitive sentences
            filler_penalty += 0.3
            
        # Audio Energy Analysis
        if len(times) > 0:
            idx_start = np.searchsorted(times, start_time)
            idx_end = np.searchsorted(times, end_time)
            if idx_start < idx_end:
                mean_energy = np.mean(rms[idx_start:idx_end])
            else:
                mean_energy = 0.0
            energy_ratio = min(1.0, mean_energy / global_mean_rms)
        else:
            energy_ratio = 0.5
            
        # Composite Viral Score (0 to 100)
        base_score = (sentiment_score * 0.2 + energy_ratio * 0.4 + hook_score * 0.4)
        viral_score = max(0, (base_score - filler_penalty)) * 100
        
        hook_strength_str = "High" if hook_score > 0.6 else ("Medium" if hook_score > 0.3 else "Low")
        energy_level_str = "High" if energy_ratio > 1.2 else ("Medium" if energy_ratio > 0.8 else "Low")
        
        windows.append({
            'start_time': start_time,
            'end_time': end_time,
            'score': min(99, int(viral_score)), 
            'hook_strength': hook_strength_str,
            'energy_level': energy_level_str,
            'transcript': transcript_text.strip(),
            'duration': window_size,
            'words': window_words
        })
        
    try: os.remove(audio_path)
    except: pass

    print(f"DEBUG: Total valid windows with words: {len(windows)}")
    windows.sort(key=lambda x: x['score'], reverse=True)
    
    top_clips = []
    for window in windows:
        overlap = False
        for clip in top_clips:
            if max(window['start_time'], clip['start_time']) < min(window['end_time'], clip['end_time']):
                overlap = True
                break
        if not overlap:
            top_clips.append(window)
            if len(top_clips) >= 10: break
            
    return top_clips

def generate_srt(words, clip_start, output_path, emoji=False, lang=None):
    from services.clip_processor import translate_text, add_emojis_to_text
    def format_time(seconds):
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds - int(seconds)) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        for i, w in enumerate(words):
            w_start = max(0, w['start'] - clip_start)
            w_end = max(0, w['end'] - clip_start)
            word = w.get('word', '').strip()
            
            if lang:
                word = translate_text(word, lang)
            if emoji:
                word = add_emojis_to_text(word)
                
            f.write(f"{i+1}\n{format_time(w_start)} --> {format_time(w_end)}\n{word}\n\n")

def cut_and_resize_clip(video_path: str, start_time: float, end_time: float, output_path: str, settings: dict, words: list) -> bool:
    padded_start = max(0, start_time - 1)
    padded_end = end_time + 1
    
    ai_features = settings.get("aiFeatures", {})
    export_settings = settings.get("exportSettings", {})
    aspect_ratio = settings.get("aspectRatio", "9:16")
    
    res_setting = export_settings.get("resolution", "1080p")
    w, h = 1080, 1920
    if res_setting == "720p": w, h = 720, 1280
    elif res_setting == "4k": w, h = 2160, 3840
    
    if aspect_ratio == "16:9": w, h = h, w
    elif aspect_ratio == "1:1": h = w
    elif aspect_ratio == "4:5": h = int(w * 1.25)

    base_filter = ""
    
    # 1. Base Layout (Face Tracking Crop OR Blurred Background OR Standard Scale)
    if aspect_ratio == "9:16" and not ai_features.get("faceTracking"):
        # Blurred Background Layout
        base_filter = f"split=2[original][copy];[copy]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},boxblur=20:20[bg];[original]scale={w}:-1[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2"
    else:
        vf_chain = []
        # Smart Face Tracking / Crop via OpenCV
        if ai_features.get("faceTracking") and aspect_ratio == "9:16":
            avg_x = 0
            orig_w = 0
            orig_h = 0
            try:
                cap = cv2.VideoCapture(video_path)
                if cap.isOpened():
                    orig_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                    orig_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                    cap.set(cv2.CAP_PROP_POS_MSEC, padded_start * 1000)
                    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                    face_cascade = cv2.CascadeClassifier(cascade_path)
                    
                    face_xs = []
                    for _ in range(15):  # Reduced from 60 for speed
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
                print(f"Face tracking error: {e}")
                
            if avg_x > 0 and orig_w > 0 and orig_h > 0:
                crop_w = int(orig_h * 9 / 16)
                crop_x = int(min(max(avg_x - crop_w / 2, 0), orig_w - crop_w))
                vf_chain.append(f"crop={crop_w}:{orig_h}:{crop_x}:0")
            else:
                vf_chain.append(f"crop=ih*9/16:ih")
        
        # Scale and Pad
        vf_chain.append(f"scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1")
        base_filter = ",".join(vf_chain)

    # 2. Additional Effects (Appended via comma to the base layout output)
    effects_chain = []

    
    # Auto Zoom
    if ai_features.get("autoZoom"):
        effects_chain.append(f"zoompan=z='min(max(zoom,pzoom)+0.0015,1.5)':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={w}x{h}")

    # Auto Captions
    if ai_features.get("autoCaptions"):
        srt_path = output_path.replace(".mp4", ".srt")
        lang = ai_features.get("translateLanguage", "Hindi") if ai_features.get("autoTranslate", False) else None
        emoji_enabled = ai_features.get("emojiCaptions", True) or ai_features.get("emojiAnimations", True)
        generate_srt(words, padded_start, srt_path, emoji=emoji_enabled, lang=lang)
        
        safe_srt_path = os.path.basename(srt_path)
        effects_chain.append(f"subtitles=filename='{safe_srt_path}':force_style='FontSize=24,PrimaryColour=&H00FFFF&,Bold=1,Alignment=2,MarginV=100'")

    # Viral Hook Overlay
    if ai_features.get("viralHook"):
        hook_text = "Wait for it..."
        font_path = "C\\:/Windows/Fonts/arial.ttf"
        effects_chain.append(f"drawtext=fontfile='{font_path}':text='{hook_text}':fontcolor=white:fontsize=80:x=(w-text_w)/2:y=100:enable='between(t,0,2)':box=1:boxcolor=black@0.5:boxborderw=10")

    # Watermark
    if not export_settings.get("watermark", False):
        font_path = "C\\:/Windows/Fonts/arial.ttf"
        effects_chain.append(f"drawtext=fontfile='{font_path}':text='ShortifyAI':fontcolor=white@0.5:fontsize=30:x=w-text_w-20:y=h-text_h-20")

    effects_str = ",".join(effects_chain)
    if effects_str:
        filter_complex = f"{base_filter},{effects_str}"
    else:
        filter_complex = base_filter
        
    # Audio Filters (Silence Removal)
    af_chain = []
    if ai_features.get("silenceRemoval"):
        af_chain.append("silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-40dB")
    af_str = ",".join(af_chain) if af_chain else ""
    
    fps = export_settings.get("fps", "60")
    
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(padded_start),
        "-to", str(padded_end),
        "-i", video_path,
        "-vf", filter_complex,
    ]
    if af_str:
        cmd.extend(["-af", af_str])
        
    cmd.extend([
        "-r", fps,
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-shortest",
        output_path
    ])
    
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=os.path.dirname(output_path))
        return True
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg Error! Command: {' '.join(cmd)}")
        print(f"Details: {e.stderr.decode() if e.stderr else ''}")
        return False

def generate_clips(video_path: str, num_clips: int = 5, settings: dict = None):
    if settings is None: settings = {}
    
    duration = int(settings.get("duration", 35))
    
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")
        
    output_dir = os.path.abspath("/tmp/clips")
    os.makedirs(output_dir, exist_ok=True)
    
    print("STEP 1: Transcribing video with Whisper (tiny, fast)...")
    try:
        model = get_whisper_model()
        result = model.transcribe(video_path, word_timestamps=True, fp16=False)
    except Exception as e:
        print(f"Whisper failed: {e}")
        return {"error": str(e)}

    print("STEP 2: Advanced Viral Analysis (Audio + NLP)...")
    top_segments = analyze_transcript(video_path, result['segments'], window_size=duration)
    top_segments = top_segments[:num_clips]
    
    print(f"Found {len(top_segments)} viral-worthy clips. Starting generation...")
    results = {"clips": []}
    
    for i, segment in enumerate(top_segments):
        clip_num = i + 1
        output_path = os.path.join(output_dir, f"clip_{clip_num}_{uuid.uuid4().hex[:6]}_out.mp4")
        
        print(f"STEP 3 & 4: Cutting, resizing (Smart Crop), and applying AI features to clip {clip_num}...")
        success = cut_and_resize_clip(video_path, segment['start_time'], segment['end_time'], output_path, settings, segment['words'])
        
        if success:
            results["clips"].append({
                "clip_number": clip_num,
                "file_path": output_path,
                "start_time": segment['start_time'],
                "end_time": segment['end_time'],
                "score": segment['score'],
                "hook_strength": segment['hook_strength'],
                "energy_level": segment['energy_level'],
                "transcript": segment['transcript'],
                "duration": segment['duration']
            })
            print(f"Successfully generated Clip {clip_num}!")
            
    print("STEP 5: Processing complete!")
    return results

def find_viral_segments(video_path: str, num_clips: int = 5, duration: int = 35):
    print("STEP 1: Transcribing video with Whisper (tiny, fast)...")
    model = get_whisper_model()
    result = model.transcribe(video_path, word_timestamps=True, fp16=False)
    
    print("STEP 2: Advanced Viral Analysis (Audio + NLP)...")
    top_segments = analyze_transcript(video_path, result['segments'], window_size=duration)
    return top_segments[:num_clips]

if __name__ == "__main__":
    pass
