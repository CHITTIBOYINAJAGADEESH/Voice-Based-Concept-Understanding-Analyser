import os
import pymongo
import gridfs
from typing import Union
from dotenv import load_dotenv

# Try loading from project root or backend folder
for path in [
    os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
    os.path.join(os.path.dirname(__file__), "..", ".env"),
    os.path.join(os.path.dirname(__file__), ".env")
]:
    if os.path.exists(path):
        load_dotenv(path)
        break
else:
    load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client["VBCUA"]
fs = gridfs.GridFS(db)

def save_file_to_db(filename: str, file_data: Union[str, bytes], content_type: str) -> None:
    """
    Saves file data (either a file path or raw bytes) to GridFS.
    If a file with the same filename already exists, it is deleted first.
    """
    # Delete old file with same name if exists to avoid duplicates
    delete_file_from_db(filename)
    
    if isinstance(file_data, str):
        with open(file_data, "rb") as f:
            fs.put(f, filename=filename, content_type=content_type)
    else:
        fs.put(file_data, filename=filename, content_type=content_type)

def download_file_from_db(filename: str, dest_path: str) -> None:
    """
    Downloads a file from GridFS to a local destination path.
    """
    grid_out = fs.find_one({"filename": filename})
    if not grid_out:
        raise FileNotFoundError(f"File '{filename}' not found in MongoDB GridFS")
    with open(dest_path, "wb") as f:
        f.write(grid_out.read())

def get_file_from_db(filename: str):
    """
    Retrieves a file from GridFS and returns a GridOut object.
    """
    return fs.find_one({"filename": filename})

def delete_file_from_db(filename: str) -> None:
    """
    Deletes a file from GridFS if it exists.
    """
    grid_out = fs.find_one({"filename": filename})
    if grid_out:
        fs.delete(grid_out._id)
