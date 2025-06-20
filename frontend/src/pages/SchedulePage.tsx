import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ScheduleListPage } from './Schedule/ScheduleListPage';
import { ScheduleDetailPage } from './Schedule/ScheduleDetailPage';
import { CreateSchedulePage } from './Schedule/CreateSchedulePage';
import { ScheduleCalendarPage } from './Schedule/ScheduleCalendarPage';

export const SchedulePage: React.FC = () => {
  return (
    <Routes>
      <Route index element={<ScheduleListPage />} />
      <Route path="calendar" element={<ScheduleCalendarPage />} />
      <Route path="create" element={<CreateSchedulePage />} />
      <Route path=":scheduleId" element={<ScheduleDetailPage />} />
      <Route path="*" element={<Navigate to="/schedule" replace />} />
    </Routes>
  );
};