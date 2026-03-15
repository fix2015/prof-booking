import io
import uuid
from typing import List

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from PIL import Image

from app.config import settings
from app.dependencies import get_current_user
from app.modules.users.models import User

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

PILLOW_FORMAT = {
    "jpg": "JPEG", "jpeg": "JPEG",
    "png": "PNG", "webp": "WEBP", "gif": "GIF",
}
CONTENT_TYPE = {
    "JPEG": "image/jpeg", "PNG": "image/png",
    "WEBP": "image/webp", "GIF": "image/gif",
}


def _optimize(content: bytes, ext: str, max_size: int) -> tuple[bytes, str]:
    """Resize to max_size × max_size and re-encode with compression."""
    fmt = PILLOW_FORMAT.get(ext, "JPEG")
    img = Image.open(io.BytesIO(content))

    # Resize if either dimension exceeds max_size
    if img.width > max_size or img.height > max_size:
        img.thumbnail((max_size, max_size), Image.LANCZOS)

    # GIF: return as-is after resize (palette-based, no quality knob)
    if fmt == "GIF":
        buf = io.BytesIO()
        img.save(buf, format="GIF", optimize=True)
        return buf.getvalue(), "GIF"

    # Convert palette/RGBA → RGB for JPEG
    if fmt == "JPEG" and img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    buf = io.BytesIO()
    save_kwargs: dict = {"format": fmt, "optimize": True}
    if fmt in ("JPEG", "WEBP"):
        save_kwargs["quality"] = 85
    img.save(buf, **save_kwargs)
    return buf.getvalue(), fmt


def _s3_client():
    kwargs = {"region_name": settings.AWS_S3_REGION}
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
    return boto3.client("s3", **kwargs)


def _upload_to_s3(content: bytes, filename_orig: str, max_size: int) -> str:
    """Resize, optimize, upload to S3, return public URL."""
    ext = filename_orig.rsplit(".", 1)[-1].lower() if "." in filename_orig else "jpg"
    if ext not in PILLOW_FORMAT:
        ext = "jpg"

    content, fmt = _optimize(content, ext, max_size)
    # After JPEG conversion the extension should match
    out_ext = "jpg" if fmt == "JPEG" else ext
    key = f"uploads/{uuid.uuid4()}.{out_ext}"

    try:
        _s3_client().put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=key,
            Body=content,
            ContentType=CONTENT_TYPE.get(fmt, "image/jpeg"),
        )
    except (BotoCoreError, ClientError) as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")
    return f"{settings.S3_BASE_URL}/{key}"


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    max_size: int = Query(default=1200, ge=64, le=4096,
                          description="Max width/height in px (256 for logos)"),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, GIF images are allowed")
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size must be under 5 MB")
    url = _upload_to_s3(content, file.filename or "image.jpg", max_size)
    return {"url": url}


@router.post("/images")
async def upload_images(
    files: List[UploadFile] = File(...),
    max_size: int = Query(default=1200, ge=64, le=4096,
                          description="Max width/height in px"),
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
        urls.append(_upload_to_s3(content, file.filename or "image.jpg", max_size))
    return {"urls": urls}
