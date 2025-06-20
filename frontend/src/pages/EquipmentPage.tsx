import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EquipmentListPage } from './Equipment/EquipmentListPage';
import { EquipmentCreatePage } from './Equipment/EquipmentCreatePage';
import { EquipmentSetListPage } from './Equipment/EquipmentSetListPage';
import { EquipmentSetCreatePage } from './Equipment/EquipmentSetCreatePage';
import { EquipmentSetDetailPage } from './Equipment/EquipmentSetDetailPage';
import { EquipmentSetEditPage } from './Equipment/EquipmentSetEditPage';

export const EquipmentPage: React.FC = () => {
  return (
    <Routes>
      {/* 기본 경로는 장비 세트 목록으로 리다이렉트 */}
      <Route index element={<Navigate to="/equipment/sets" replace />} />
      
      {/* 장비 관리 */}
      <Route path="list" element={<EquipmentListPage />} />
      <Route path="create" element={<EquipmentCreatePage />} />
      
      {/* 장비 세트 관리 */}
      <Route path="sets" element={<EquipmentSetListPage />} />
      <Route path="sets/create" element={<EquipmentSetCreatePage />} />
      <Route path="sets/:setId" element={<EquipmentSetDetailPage />} />
      <Route path="sets/:setId/edit" element={<EquipmentSetEditPage />} />
      
      {/* 잘못된 경로는 장비 세트 목록으로 리다이렉트 */}
      <Route path="*" element={<Navigate to="/equipment/sets" replace />} />
    </Routes>
  );
};