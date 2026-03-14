from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.modules.loyalty.models import DiscountType


class DiscountRuleCreate(BaseModel):
    name: str
    discount_type: DiscountType = DiscountType.PERCENTAGE
    discount_value: float
    conditions: Optional[Dict[str, Any]] = {}
    is_active: bool = True


class DiscountRuleResponse(BaseModel):
    id: int
    program_id: int
    name: str
    discount_type: DiscountType
    discount_value: float
    conditions: Optional[Dict[str, Any]]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class LoyaltyProgramCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True


class LoyaltyProgramUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class LoyaltyProgramResponse(BaseModel):
    id: int
    salon_id: int
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    discount_rules: List[DiscountRuleResponse] = []

    model_config = {"from_attributes": True}
