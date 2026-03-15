import uuid
from typing import List

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException

from app.config import settings
from app.dependencies import get_current_user
from app.modules.users.models import User

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def _s3_client():
    kwargs = {"region_name": settings.AWS_S3_REGION}
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
    return boto3.client("s3", **kwargs)


def _upload_to_s3(content: bytes, filename_orig: str) -> str:
    """Upload bytes to S3 and return the public URL."""
    ext = filename_orig.rsplit(".", 1)[-1].lower() if "." in filename_orig else "jpg"
    if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
        ext = "jpg"
    key = f"uploads/{uuid.uuid4()}.{ext}"
    content_type_map = {
        "jpg": "image/jpeg", "jpeg": "image/jpeg",
        "png": "image/png", "webp": "image/webp", "gif": "image/gif",
    }
    try:
        _s3_client().put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=key,
            Body=content,
            ContentType=content_type_map.get(ext, "image/jpeg"),
        )
    except (BotoCoreError, ClientError) as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")
    return f"{settings.S3_BASE_URL}/{key}"


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
    url = _upload_to_s3(content, file.filename or "image.jpg")
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
        urls.append(_upload_to_s3(content, file.filename or "image.jpg"))
    return {"urls": urls}
