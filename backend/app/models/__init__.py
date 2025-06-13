# 모든 모델을 여기서 import하여 Alembic이 인식할 수 있도록 함
from app.models.user import User
from app.models.raid import Raid, RaidGroup, RaidMember
from app.models.equipment import Equipment, EquipmentSet, EquipmentSetItem
from app.models.item_distribution import ItemDistribution, DistributionHistory
from app.models.raid_schedule import RaidSchedule

__all__ = [
    "User",
    "Raid",
    "RaidGroup",
    "RaidMember",
    "Equipment",
    "EquipmentSet",
    "EquipmentSetItem",
    "ItemDistribution",
    "DistributionHistory",
    "RaidSchedule"
]