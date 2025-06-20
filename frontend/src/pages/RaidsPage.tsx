import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RaidListPage } from './Raids/RaidListPage';
import { RaidGroupDetailPage } from './Raids/RaidGroupDetailPage';
import { CreateRaidGroupPage } from './Raids/CreateRaidGroupPage';
import { RaidGroupSettingsPage } from './Raids/RaidGroupSettingsPage';
import { RaidGroupMembersPage } from './Raids/RaidGroupMembersPage';

export const RaidsPage: React.FC = () => {
  return (
    <Routes>
      <Route index element={<RaidListPage />} />
      <Route path="create" element={<CreateRaidGroupPage />} />
      <Route path=":groupId" element={<RaidGroupDetailPage />} />
      <Route path=":groupId/settings" element={<RaidGroupSettingsPage />} />
      <Route path=":groupId/members" element={<RaidGroupMembersPage />} />
      <Route path="*" element={<Navigate to="/raids" replace />} />
    </Routes>
  );
};