from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_owner
from app.modules.loyalty.models import LoyaltyProgram, DiscountRule
from app.modules.loyalty.schemas import (
    LoyaltyProgramCreate, LoyaltyProgramUpdate, LoyaltyProgramResponse,
    DiscountRuleCreate, DiscountRuleResponse,
)
from app.modules.salons.services import assert_owner_of_provider
from app.modules.users.models import User

router = APIRouter()


@router.get("/provider/{provider_id}", response_model=List[LoyaltyProgramResponse])
def list_programs(
    provider_id: int,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_provider(db, current_user, provider_id)
    return db.query(LoyaltyProgram).filter(LoyaltyProgram.provider_id == provider_id).all()


@router.post("/provider/{provider_id}", response_model=LoyaltyProgramResponse, status_code=201)
def create_program(
    provider_id: int,
    data: LoyaltyProgramCreate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    assert_owner_of_provider(db, current_user, provider_id)
    prog = LoyaltyProgram(provider_id=provider_id, **data.model_dump())
    db.add(prog)
    db.commit()
    db.refresh(prog)
    return prog


@router.patch("/{program_id}", response_model=LoyaltyProgramResponse)
def update_program(
    program_id: int,
    data: LoyaltyProgramUpdate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    prog = db.query(LoyaltyProgram).filter(LoyaltyProgram.id == program_id).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
    assert_owner_of_provider(db, current_user, prog.provider_id)
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(prog, k, v)
    db.commit()
    db.refresh(prog)
    return prog


@router.post("/{program_id}/rules", response_model=DiscountRuleResponse, status_code=201)
def add_rule(
    program_id: int,
    data: DiscountRuleCreate,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    prog = db.query(LoyaltyProgram).filter(LoyaltyProgram.id == program_id).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
    assert_owner_of_provider(db, current_user, prog.provider_id)
    rule = DiscountRule(program_id=program_id, **data.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{program_id}/rules/{rule_id}", status_code=204)
def delete_rule(
    program_id: int,
    rule_id: int,
    current_user: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
):
    prog = db.query(LoyaltyProgram).filter(LoyaltyProgram.id == program_id).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
    assert_owner_of_provider(db, current_user, prog.provider_id)
    rule = db.query(DiscountRule).filter(DiscountRule.id == rule_id, DiscountRule.program_id == program_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
