import os
import json
from clip_generator import generate_clips

def run_test():
    # Provide a path to a sample MP4 video here
    test_video = "sample_video.mp4"
    
    # Create a dummy video if it doesn't exist for the sake of script structure
    if not os.path.exists(test_video):
        print(f"Test video '{test_video}' not found.")
        print("Please place an MP4 file named 'sample_video.mp4' in this directory.")
        return

    print(f"Starting test run on {test_video}...")
    
    try:
        settings = {
            "aiFeatures": {
                "faceTracking": False,
                "autoCaptions": True
            }
        }
        results = generate_clips(test_video, num_clips=1, settings=settings)
        
        print("\n=== FINAL RESULTS ===")
        print(json.dumps(results, indent=2))
        
    except Exception as e:
        print(f"Test failed with error: {e}")

if __name__ == "__main__":
    run_test()
