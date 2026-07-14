import os
import sys

# Add workspace to path so we can import utils
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from utils.db import save_file_to_db

TEMP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "temp_outputs"))

def get_content_type(filename: str) -> str:
    if filename.endswith(".png"):
        return "image/png"
    elif filename.endswith(".wav"):
        return "audio/wav"
    elif filename.endswith(".pdf"):
        return "application/pdf"
    elif filename.endswith(".json"):
        return "application/json"
    else:
        return "application/octet-stream"

def migrate():
    print(f"Scanning directory: {TEMP_DIR}")
    if not os.path.exists(TEMP_DIR):
        print("Directory 'temp_outputs' does not exist. Nothing to migrate.")
        return

    files = [f for f in os.listdir(TEMP_DIR) if os.path.isfile(os.path.join(TEMP_DIR, f))]
    print(f"Found {len(files)} files to migrate.")

    success_count = 0
    for filename in files:
        file_path = os.path.join(TEMP_DIR, filename)
        content_type = get_content_type(filename)
        
        try:
            print(f"Migrating: {filename} ({content_type})...")
            save_file_to_db(filename, file_path, content_type)
            success_count += 1
        except Exception as e:
            print(f"ERROR migrating {filename}: {e}")

    print(f"\nMigration completed successfully for {success_count}/{len(files)} files.")

if __name__ == "__main__":
    migrate()
