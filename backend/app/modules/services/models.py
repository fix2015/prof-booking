from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Table, Index
from sqlalchemy.orm import relationship
from app.database import Base


# Many-to-many junction: a service can be offered at multiple providers
service_providers = Table(
    "service_providers",
    Base.metadata,
    Column("service_id", Integer, ForeignKey("services.id", ondelete="CASCADE"), primary_key=True),
    Column("provider_id", Integer, ForeignKey("providers.id", ondelete="CASCADE"), primary_key=True),
)


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    professional_id = Column(Integer, ForeignKey("professionals.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=False, default=60)
    price = Column(Float, nullable=False, default=0.0)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    providers = relationship("Provider", secondary=service_providers)
    professional = relationship("Professional", foreign_keys=[professional_id])
    sessions = relationship("Session", back_populates="service")

    __table_args__ = (
        Index("ix_services_active", "is_active"),
        Index("ix_services_professional", "professional_id"),
    )

    @property
    def provider_ids(self) -> list:
        return [p.id for p in (self.providers or [])]

    def __repr__(self) -> str:
        return f"<Service id={self.id} name={self.name}>"
