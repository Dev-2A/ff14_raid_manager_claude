import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  Calendar, ArrowLeft, Clock, Users, Target, FileText,
  AlertCircle, Loader, Info, Repeat, CalendarDays,
  ChevronDown, Check
} from 'lucide-react';
import { raidService, scheduleService } from '../../services';
import { RaidGroup, RaidScheduleCreate, RecurrenceType, WEEKDAYS } from '../../types';

export const CreateSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupIdParam = searchParams.get('groupId');
  
  const [myGroups, setMyGroups] = useState<RaidGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  
  const [formData, setFormData] = useState<RaidScheduleCreate & { raid_group_id: number }>({
    raid_group_id: groupIdParam ? parseInt(groupIdParam) : 0,
    title: '',
    description: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    start_time: '20:00',
    end_time: '23:00',
    target_floors: '',
    minimum_members: 8,
    notes: '',
    recurrence_type: RecurrenceType.NONE,
    recurrence_end_date: '',
    recurrence_count: undefined,
    recurrence_days: ''
  });

  useEffect(() => {
    loadMyGroups();
  }, []);

  useEffect(() => {
    // 반복 설정 표시 여부
    setShowRecurrenceOptions(formData.recurrence_type !== RecurrenceType.NONE);
  }, [formData.recurrence_type]);

  const loadMyGroups = async () => {
    try {
      const groups = await raidService.getMyRaidGroups();
      setMyGroups(groups);
      
      if (!groupIdParam && groups.length > 0) {
        setFormData(prev => ({ ...prev, raid_group_id: groups[0].id }));
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
      setError('공대 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const handleWeekdayToggle = (weekday: number) => {
    setSelectedWeekdays(prev => {
      const newDays = prev.includes(weekday)
        ? prev.filter(d => d !== weekday)
        : [...prev, weekday].sort((a, b) => a - b);
      
      // recurrence_days 업데이트
      setFormData(prevForm => ({
        ...prevForm,
        recurrence_days: newDays.join(',')
      }));
      
      return newDays;
    });
  };

  const validateForm = (): boolean => {
    if (!formData.raid_group_id) {
      setError('공대를 선택해주세요.');
      return false;
    }
    
    if (!formData.title || formData.title.length < 2) {
      setError('일정 제목은 2자 이상 입력해주세요.');
      return false;
    }
    
    if (!formData.scheduled_date || !formData.start_time) {
      setError('날짜와 시간을 입력해주세요.');
      return false;
    }
    
    // 반복 설정 검증
    if (formData.recurrence_type !== RecurrenceType.NONE) {
      if (!formData.recurrence_end_date && !formData.recurrence_count) {
        setError('반복 종료일 또는 반복 횟수를 설정해주세요.');
        return false;
      }
      
      if (formData.recurrence_type === RecurrenceType.WEEKLY && selectedWeekdays.length === 0) {
        setError('반복할 요일을 선택해주세요.');
        return false;
      }
    }
    
    // 시작 시간과 종료 시간 검증
    if (formData.end_time && formData.start_time >= formData.end_time) {
      setError('종료 시간은 시작 시간보다 늦어야 합니다.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { raid_group_id, ...scheduleData } = formData;
      
      // 반복 설정이 없으면 관련 필드 제거
      if (scheduleData.recurrence_type === RecurrenceType.NONE) {
        delete scheduleData.recurrence_end_date;
        delete scheduleData.recurrence_count;
        delete scheduleData.recurrence_days;
      }
      
      await scheduleService.createRaidSchedule(raid_group_id, scheduleData);
      navigate(`/schedule?groupId=${raid_group_id}`);
    } catch (err: any) {
      setError(err.message || '일정 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRecurrenceEndDate = () => {
    if (!formData.recurrence_count || !formData.scheduled_date) return '';
    
    const startDate = new Date(formData.scheduled_date);
    let endDate = new Date(startDate);
    
    switch (formData.recurrence_type) {
      case RecurrenceType.DAILY:
        endDate.setDate(endDate.getDate() + formData.recurrence_count - 1);
        break;
      case RecurrenceType.WEEKLY:
        endDate.setDate(endDate.getDate() + (formData.recurrence_count - 1) * 7);
        break;
      case RecurrenceType.BIWEEKLY:
        endDate.setDate(endDate.getDate() + (formData.recurrence_count - 1) * 14);
        break;
      case RecurrenceType.MONTHLY:
        endDate.setMonth(endDate.getMonth() + formData.recurrence_count - 1);
        break;
    }
    
    return endDate.toLocaleDateString('ko-KR');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link
          to="/schedule"
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">일정 생성</h1>
          <p className="text-gray-400 mt-1">새로운 레이드 일정을 만들어보세요</p>
        </div>
      </div>

      {/* 생성 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 flex items-start">
            <AlertCircle className="text-red-400 mr-2 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* 기본 정보 */}
        <div className="card-game">
          <h2 className="text-lg font-semibold text-primary-300 mb-4">기본 정보</h2>
          
          <div className="space-y-4">
            {/* 공대 선택 */}
            <div>
              <label htmlFor="raid_group_id" className="label-game">
                공대 선택
              </label>
              <select
                id="raid_group_id"
                name="raid_group_id"
                value={formData.raid_group_id}
                onChange={handleChange}
                className="input-game w-full appearance-none"
                required
              >
                <option value="">공대를 선택하세요</option>
                {myGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} - {group.raid?.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 일정 제목 */}
            <div>
              <label htmlFor="title" className="label-game">
                일정 제목
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                className="input-game w-full"
                placeholder="예: 1-4층 클리어"
                required
              />
            </div>

            {/* 날짜와 시간 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="scheduled_date" className="label-game">
                  날짜
                </label>
                <input
                  id="scheduled_date"
                  name="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  className="input-game w-full"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="start_time" className="label-game">
                  시작 시간
                </label>
                <input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className="input-game w-full"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="end_time" className="label-game">
                  종료 시간 (선택)
                </label>
                <input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={formData.end_time || ''}
                  onChange={handleChange}
                  className="input-game w-full"
                />
              </div>
            </div>

            {/* 목표 층 */}
            <div>
              <label htmlFor="target_floors" className="label-game">
                목표 층 (선택)
              </label>
              <input
                id="target_floors"
                name="target_floors"
                type="text"
                value={formData.target_floors || ''}
                onChange={handleChange}
                className="input-game w-full"
                placeholder="예: 1-4층, 3-4층"
              />
            </div>

            {/* 최소 인원 */}
            <div>
              <label htmlFor="minimum_members" className="label-game">
                최소 인원
              </label>
              <input
                id="minimum_members"
                name="minimum_members"
                type="number"
                value={formData.minimum_members}
                onChange={handleChange}
                className="input-game w-full"
                min="1"
                max="8"
              />
              <p className="text-xs text-gray-500 mt-1">
                이 인원 이상 참석해야 일정이 진행됩니다
              </p>
            </div>

            {/* 설명 */}
            <div>
              <label htmlFor="description" className="label-game">
                설명 (선택)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="input-game w-full resize-none"
                rows={3}
                placeholder="일정에 대한 추가 설명을 입력하세요"
              />
            </div>

            {/* 메모 */}
            <div>
              <label htmlFor="notes" className="label-game">
                메모 (선택)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                className="input-game w-full resize-none"
                rows={2}
                placeholder="준비사항, 주의사항 등"
              />
            </div>
          </div>
        </div>

        {/* 반복 설정 */}
        <div className="card-game">
          <h2 className="text-lg font-semibold text-primary-300 mb-4 flex items-center">
            <Repeat className="mr-2" size={20} />
            반복 설정
          </h2>
          
          <div className="space-y-4">
            {/* 반복 유형 */}
            <div>
              <label className="label-game">반복 유형</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries({
                  [RecurrenceType.NONE]: '반복 없음',
                  [RecurrenceType.DAILY]: '매일',
                  [RecurrenceType.WEEKLY]: '매주',
                  [RecurrenceType.BIWEEKLY]: '격주',
                  [RecurrenceType.MONTHLY]: '매월'
                }).map(([value, label]) => (
                  <label key={value} className="relative">
                    <input
                      type="radio"
                      name="recurrence_type"
                      value={value}
                      checked={formData.recurrence_type === value}
                      onChange={handleChange}
                      className="peer sr-only"
                    />
                    <div className="card-game cursor-pointer text-center py-3 border-2 border-transparent peer-checked:border-primary-500 peer-checked:bg-primary-900/20 transition-all">
                      <p className="text-sm font-semibold">{label}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 반복 상세 설정 */}
            {showRecurrenceOptions && (
              <>
                {/* 매주 반복일 경우 요일 선택 */}
                {formData.recurrence_type === RecurrenceType.WEEKLY && (
                  <div>
                    <label className="label-game">반복 요일</label>
                    <div className="flex gap-2">
                      {WEEKDAYS.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => handleWeekdayToggle(day.value)}
                          className={`w-12 h-12 rounded-lg font-semibold transition-all ${
                            selectedWeekdays.includes(day.value)
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          {day.short}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 반복 종료 조건 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="recurrence_count" className="label-game">
                      반복 횟수
                    </label>
                    <input
                      id="recurrence_count"
                      name="recurrence_count"
                      type="number"
                      value={formData.recurrence_count || ''}
                      onChange={handleChange}
                      className="input-game w-full"
                      placeholder="예: 12"
                      min="1"
                      max="52"
                    />
                    {formData.recurrence_count && (
                      <p className="text-xs text-gray-500 mt-1">
                        약 {getRecurrenceEndDate()}까지
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="recurrence_end_date" className="label-game">
                      또는 종료일
                    </label>
                    <input
                      id="recurrence_end_date"
                      name="recurrence_end_date"
                      type="date"
                      value={formData.recurrence_end_date || ''}
                      onChange={handleChange}
                      className="input-game w-full"
                      min={formData.scheduled_date}
                    />
                  </div>
                </div>

                {/* 반복 정보 요약 */}
                <div className="p-4 bg-primary-900/20 rounded-lg border border-primary-700/50">
                  <div className="flex items-start gap-3">
                    <Info className="text-primary-400 flex-shrink-0 mt-1" size={20} />
                    <div className="text-sm text-gray-300">
                      <p className="font-semibold text-primary-300 mb-1">반복 일정 요약</p>
                      <p>
                        {formData.scheduled_date && new Date(formData.scheduled_date).toLocaleDateString('ko-KR')}부터{' '}
                        {formData.recurrence_type === RecurrenceType.DAILY && '매일'}
                        {formData.recurrence_type === RecurrenceType.WEEKLY && 
                          `매주 ${selectedWeekdays.map(d => WEEKDAYS.find(w => w.value === d)?.short).join(', ')}`}
                        {formData.recurrence_type === RecurrenceType.BIWEEKLY && '2주마다'}
                        {formData.recurrence_type === RecurrenceType.MONTHLY && '매월 같은 날'}
                        {' '}반복됩니다.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex gap-4 justify-end">
          <Link
            to="/schedule"
            className="btn-game-secondary"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-game flex items-center"
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin mr-2" size={20} />
                생성 중...
              </>
            ) : (
              <>
                <Calendar className="mr-2" size={20} />
                일정 생성
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};