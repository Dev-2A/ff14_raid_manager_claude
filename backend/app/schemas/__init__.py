# 모든 스키마를 여기서 import하여 쉽게 사용할 수 있도록 함
from app.schemas.user import (
    UserBase, UserCreate, UserUpdate, User, UserInDB,
    UserLogin, Token, TokenData
)
from app.schemas.raid import (
    RaidBase, RaidCreate, RaidUpdate, Raid,
    RaidGroupBase, RaidGroupCreate, RaidGroupUpdate, RaidGroup,
    RaidMemberBase, RaidMemberCreate, RaidMemberUpdate, RaidMember,
    DistributionMethod
)
from app.schemas.equipment import (
    EquipmentBase, EquipmentCreate, EquipmentUpdate, Equipment,
    EquipmentSetBase, EquipmentSetCreate, EquipmentSetUpdate, EquipmentSet,
    EquipmentSetItemBase, EquipmentSetItemCreate, EquipmentSetItemUpdate, EquipmentSetItem,
    EquipmentSlot, EquipmentType
)
from app.schemas.item_distribution import (
    ItemDistributionBase, ItemDistributionCreate, ItemDistributionUpdate, ItemDistribution,
    DistributionHistoryBase, DistributionHistoryCreate, DistributionHistory,
    ResourceRequirementBase, ResourceRequirementUpdate, ResourceRequirement,
    ResourceCalculationResult, ItemType
)
from app.schemas.raid_schedule import (
    RaidScheduleBase, RaidScheduleCreate, RaidScheduleUpdate, RaidSchedule,
    RaidAttendanceBase, RaidAttendanceCreate, RaidAttendanceUpdate, RaidAttendance,
    ScheduleDashboard, AttendanceStatus
)

__all__ = [
    # User
    "UserBase", "UserCreate", "UserUpdate", "User", "UserInDB",
    "UserLogin", "Token", "TokenData",
    # Raid
    "RaidBase", "RaidCreate", "RaidUpdate", "Raid",
    "RaidGroupBase", "RaidGroupCreate", "RaidGroupUpdate", "RaidGroup",
    "RaidMemberBase", "RaidMemberCreate", "RaidMemberUpdate", "RaidMember",
    "DistributionMethod",
    # Equipment
    "EquipmentBase", "EquipmentCreate", "EquipmentUpdate", "Equipment",
    "EquipmentSetBase", "EquipmentSetCreate", "EquipmentSetUpdate", "EquipmentSet",
    "EquipmentSetItemBase", "EquipmentSetItemCreate", "EquipmentSetItemUpdate", "EquipmentSetItem",
    "EquipmentSlot", "EquipmentType",
    # Distribution
    "ItemDistributionBase", "ItemDistributionCreate", "ItemDistributionUpdate", "ItemDistribution",
    "DistributionHistoryBase", "DistributionHistoryCreate", "DistributionHistory",
    "ResourceRequirementBase", "ResourceRequirementUpdate", "ResourceRequirement",
    "ResourceCalculationResult", "ItemType",
    # Schedule
    "RaidScheduleBase", "RaidScheduleCreate", "RaidScheduleUpdate", "RaidSchedule",
    "RaidAttendanceBase", "RaidAttendanceCreate", "RaidAttendanceUpdate", "RaidAttendance",
    "ScheduleDashboard", "AttendanceStatus",
]