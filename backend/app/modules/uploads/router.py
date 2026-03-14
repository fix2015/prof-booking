import uuid
import os
from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException

from app.dependencies import get_current_user
from app.modules.users.models import User

router = APIRouter()

UPLOAD_DIR = "uploads"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def _save_upload(content: bytes, filename_orig: str) -> str:
    """Save bytes to uploads dir and return the relative URL."""
    ext = filename_orig.rsplit(".", 1)[-1].lower() if "." in filename_orig else "jpg"
    if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
        ext = "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
        f.write(content)
    return f"/uploads/{filename}"


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, GIF images are allowed")
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size must be under 5 MB")
    url = _save_upload(content, file.filename or "image.jpg")
    return {"url": url}


@router.post("/images")
async def upload_images(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
):
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 images per upload")
    urls = []
    for file in files:
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail=f"File '{file.filename}' is not a supported image type")
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"File '{file.filename}' exceeds 5 MB limit")
        urls.append(_save_upload(content, file.filename or "image.jpg"))
    return {"urls": urls}
