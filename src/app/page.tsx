'use client';

import { useEffect, useState, useMemo } from 'react';

interface Member {
  id: string;
  name: string;
  role: string;
  initials: string;
}

interface AvailabilityResponse {
  requested_date: string;
  id: string;
  name: string;
  role: string;
  status: string;
  reason: string;
}

export default function Home() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberAvailability, setMemberAvailability] = useState<Record<string, AvailabilityResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-04-08');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1)); // April 2026
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://task.moraspirit.com';

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  // Get selected member info
  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedMemberData = selectedMemberId ? memberAvailability[`${selectedMemberId}-${selectedDate}`] : null;

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE}/api/members`);
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();

        if (!data.members || !Array.isArray(data.members)) {
          throw new Error('Invalid API response: members array not found');
        }

        if (data.members.length === 0) {
          throw new Error('No members found in the database');
        }

        const membersWithInitials = data.members.map((m: any) => ({
          ...m,
          initials: m.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase(),
        }));

        setMembers(membersWithInitials);
        if (membersWithInitials.length > 0) {
          setSelectedMemberId(membersWithInitials[0].id);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load members';
        setError(errorMsg);
        console.error('Members fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedMemberId) return;
      const cacheKey = `${selectedMemberId}-${selectedDate}`;
      if (memberAvailability[cacheKey]) return;

      try {
        const response = await fetch(`${API_BASE}/api/availability/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ msp_id: selectedMemberId, date: selectedDate }),
        });
        if (!response.ok) throw new Error('Failed to fetch availability');
        const data = await response.json();
        setMemberAvailability((prev) => ({
          ...prev,
          [cacheKey]: data,
        }));
      } catch (err) {
        console.error('Availability fetch error:', err);
      }
    };

    fetchAvailability();
  }, [selectedMemberId, selectedDate, memberAvailability, API_BASE]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00Z');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get calendar days for month
  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // Fetch availability for all members on selected date
  useEffect(() => {
    const fetchAllAvailabilities = async () => {
      setAvailabilityError(null);
      let hasErrors = false;

      for (const member of members) {
        const cacheKey = `${member.id}-${selectedDate}`;
        if (!memberAvailability[cacheKey]) {
          try {
            const response = await fetch(`${API_BASE}/api/availability/check`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ msp_id: member.id, date: selectedDate }),
            });
            if (!response.ok) {
              console.warn(`Failed to fetch availability for ${member.id}: ${response.status}`);
              hasErrors = true;
              continue;
            }
            const data = await response.json();

            if (!data.id || !data.status) {
              console.warn(`Invalid availability response for ${member.id}`);
              hasErrors = true;
              continue;
            }

            setMemberAvailability((prev) => ({
              ...prev,
              [cacheKey]: data,
            }));
          } catch (err) {
            console.error(`Failed to fetch availability for ${member.id}:`, err);
            hasErrors = true;
          }
        }
      }

      if (hasErrors && members.length > 0) {
        setAvailabilityError('Some member statuses could not be loaded. Please refresh to retry.');
      }
    };

    if (members.length > 0) {
      fetchAllAvailabilities();
    }
  }, [selectedDate, members, memberAvailability, API_BASE]);

  // Retry loading members
  const retryLoadMembers = async () => {
    setRetrying(true);
    try {
      const response = await fetch(`${API_BASE}/api/members`);
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();

      if (!data.members || !Array.isArray(data.members)) {
        throw new Error('Invalid API response');
      }

      const membersWithInitials = data.members.map((m: any) => ({
        ...m,
        initials: m.name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase(),
      }));

      setMembers(membersWithInitials);
      setError(null);
      if (membersWithInitials.length > 0) {
        setSelectedMemberId(membersWithInitials[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="bg-white text-black min-h-screen flex flex-col pb-16 lg:pb-0" style={{ '--mora-red': 'rgba(128, 0, 0, 0.8)' } as React.CSSProperties}>
      <header className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="flex justify-between items-center w-full px-5 py-3.5 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: 'rgba(128, 0, 0, 0.8)' }}>
              M
            </div>
            <h1 className="text-lg font-extrabold font-headline" style={{ color: 'rgba(128, 0, 0, 0.8)' }}>MoraSpirit Web Pillar</h1>
          </div>

          <nav className="hidden md:flex items-center gap-7">
            <a className="text-sm font-semibold uppercase tracking-wider pb-0.5 border-b-2" style={{ color: 'rgba(128, 0, 0, 0.8)', borderColor: 'rgba(128, 0, 0, 0.8)' }} href="#">
              Dashboard
            </a>
            <a className="text-sm font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 transition-colors" href="#">
              Members
            </a>
            <a className="text-sm font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 transition-colors" href="#">
              Reports
            </a>
            <a className="text-sm font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 transition-colors" href="#">
              Settings
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button className="material-symbols-outlined text-gray-600 hover:scale-95 transition-transform">notifications</button>
            <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold border border-gray-300" style={{ backgroundColor: 'rgba(128, 0, 0, 0.8)' }}>
              JP
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        <aside className="fixed left-0 top-0 h-screen z-40 bg-gray-50 w-60 hidden lg:flex flex-col pt-20 px-3.5">
          <div className="mb-7 px-2">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-1.5">Navigation</p>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5 py-2.5 px-3.5 rounded-r-full font-bold cursor-pointer" style={{ backgroundColor: 'rgba(128, 0, 0, 0.1)', color: 'rgba(128, 0, 0, 0.8)' }}>
                <span className="material-symbols-outlined text-base">event_available</span>
                <span className="text-sm">Availability</span>
              </div>
              <div className="flex items-center gap-2.5 py-2.5 px-3.5 text-gray-500 hover:bg-white rounded-r-full transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-base">calendar_month</span>
                <span className="text-sm">Calendar</span>
              </div>
              <div className="flex items-center gap-2.5 py-2.5 px-3.5 text-gray-500 hover:bg-white rounded-r-full transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-base">groups</span>
                <span className="text-sm">Teams</span>
              </div>
              <div className="flex items-center gap-2.5 py-2.5 px-3.5 text-gray-500 hover:bg-white rounded-r-full transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-base">inventory_2</span>
                <span className="text-sm">Archive</span>
              </div>
            </div>
          </div>

          <div className="mb-7 px-2">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-3">Date Selection</p>
            <div className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-3.5">
                <span className="font-semibold text-sm">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="text-gray-500 hover:text-gray-900 text-xs"
                  >
                    &#8249;
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="text-gray-500 hover:text-gray-900 text-xs"
                  >
                    &#8250;
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-[9px] text-center text-gray-400 mb-1.5 font-medium">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-[10px] text-center font-medium">
                {getCalendarDays(currentMonth).map((date, idx) => {
                  const dateStr = date ? date.toISOString().split('T')[0] : null;
                  const isSelected = dateStr === selectedDate;
                  const isCurrentMonth = date && date.getMonth() === currentMonth.getMonth();

                  return (
                    <button
                      key={idx}
                      onClick={() => dateStr && setSelectedDate(dateStr)}
                      disabled={!date}
                      className={`p-1 rounded text-xs transition-all ${
                        !date
                          ? 'text-gray-200'
                          : isSelected
                          ? 'text-white rounded-md font-bold'
                          : !isCurrentMonth
                          ? 'text-gray-300'
                          : 'hover:bg-gray-100 cursor-pointer'
                      }`}
                      style={
                        date && isSelected && isCurrentMonth
                          ? { backgroundColor: 'rgba(128, 0, 0, 0.8)' }
                          : {}
                      }
                    >
                      {date?.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-auto pb-7 space-y-3">
            <button className="text-white w-full py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: 'rgba(128, 0, 0, 0.8)' }}>
              Update Status
            </button>
            <div className="flex flex-col gap-0.5 border-t border-gray-300 pt-3">
              <div className="flex items-center gap-2.5 py-1.5 px-3.5 text-gray-500 text-xs cursor-pointer hover:text-gray-900">
                <span className="material-symbols-outlined text-xs">help</span>
                <span>Help</span>
              </div>
              <div className="flex items-center gap-2.5 py-1.5 px-3.5 text-gray-500 text-xs cursor-pointer hover:text-red-600">
                <span className="material-symbols-outlined text-xs">logout</span>
                <span>Logout</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 lg:ml-56 p-5 md:p-8 max-w-[1600px] mx-auto w-full">
          <header className="mb-8">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-0.5 h-7 rounded-full" style={{ backgroundColor: 'rgba(128, 0, 0, 0.8)' }}></div>
              <h2 className="text-4xl md:text-4xl font-extrabold tracking-tight font-headline">Member Availability Dashboard</h2>
            </div>
            <p className="text-gray-500 max-w-2xl text-base">
              Real-time status tracking for the MoraSpirit core team. Select a member to view detailed commitments and schedules.
            </p>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <section className="xl:col-span-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-2.5">
                <h3 className="text-2.5xl font-bold font-headline">Core Team Members</h3>
                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-full border border-gray-200">
                  <span className="material-symbols-outlined text-xs text-gray-400">search</span>
                  <input
                    className="bg-transparent border-none outline-none text-xs placeholder:text-gray-400 w-full sm:w-48"
                    placeholder="Search members..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {loading ? (
                  <>
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="bg-gray-50 p-4 rounded-xl animate-pulse border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                          <div className="w-14 h-3 rounded bg-gray-200"></div>
                        </div>
                        <div className="w-28 h-3 rounded bg-gray-200 mb-1.5"></div>
                        <div className="w-18 h-2.5 rounded bg-gray-200 mb-3"></div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                          <div className="w-14 h-2 rounded bg-gray-200"></div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                    const isSelected = member.id === selectedMemberId;
                    const memberData = memberAvailability[`${member.id}-${selectedDate}`];
                    const isBusy = memberData?.status === 'busy';
                    const containerClass = isSelected
                      ? "border-l-4 border-red-600"
                      : "";

                    return (
                      <article
                        key={member.id}
                        onClick={() => setSelectedMemberId(member.id)}
                        className={`${containerClass} p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all bg-white border border-gray-200 ${isSelected ? 'ring-1 ring-red-300' : ''} relative group`}
                        title={isBusy && memberData?.reason ? memberData.reason : undefined}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="w-10 h-10 rounded-full text-white font-bold flex items-center justify-center text-sm" style={{ backgroundColor: 'rgba(128, 0, 0, 0.8)' }}>
                            {member.initials}
                          </div>
                          <span className="bg-gray-100 text-gray-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            {member.id}
                          </span>
                        </div>
                        <h4 className="font-bold text-base leading-tight mb-0.5">{member.name}</h4>
                        <p className="text-xs text-gray-500 font-medium mb-2.5">{member.role}</p>
                        <div className="flex items-center gap-1.5">
                          {memberData ? (
                            <>
                              <span className={`w-2 h-2 rounded-full ${isBusy ? 'bg-red-600' : 'bg-green-500'}`}></span>
                              <span className={`text-xs font-bold uppercase tracking-wider ${isBusy ? 'text-red-600' : 'text-green-600'}`}>
                                {isBusy ? 'Busy' : 'Available'}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Loading...</span>
                          )}
                        </div>

                        {isBusy && memberData?.reason && (
                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded p-2 z-50 w-48 max-h-20 overflow-y-auto whitespace-pre-wrap">
                            <p className="font-bold mb-1 text-red-300">Reason:</p>
                            <p>{memberData.reason}</p>
                          </div>
                        )}
                      </article>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-10">
                    <p className="text-gray-500 text-sm">No members found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-6 bg-red-50 p-3.5 rounded-xl border border-red-200">
                  <div className="flex items-start gap-3 mb-2.5">
                    <span className="material-symbols-outlined text-red-600 text-lg flex-shrink-0">error</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-red-900">Failed to load members</p>
                      <p className="text-xs text-red-700 mt-0.5">{error}</p>
                    </div>
                  </div>
                  <button
                    onClick={retryLoadMembers}
                    disabled={retrying}
                    className="text-xs font-bold text-red-700 hover:text-red-900 underline disabled:opacity-50"
                  >
                    {retrying ? 'Retrying...' : 'Retry'}
                  </button>
                </div>
              )}

              {availabilityError && !error && (
                <div className="mt-6 bg-yellow-50 p-3.5 rounded-xl border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-yellow-600 text-lg flex-shrink-0">warning</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-yellow-900">Warning</p>
                      <p className="text-xs text-yellow-700 mt-0.5">{availabilityError}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="xl:col-span-4">
              <div className="sticky top-20">
                <h3 className="text-2.5xl font-bold font-headline mb-5">Status Insight</h3>

                {selectedMember && selectedMemberData ? (
                  <article className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="p-6 text-white relative" style={{ backgroundColor: 'rgba(128, 0, 0, 0.8)' }}>
                      <div className="relative z-10">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="bg-white/20 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">
                            Selected Member
                          </span>
                        </div>
                        <h4 className="text-3xl font-extrabold font-headline">{selectedMember.name}</h4>
                        <p className="text-white/80 text-xs font-medium">
                          {selectedMember.role} • {selectedMember.id}
                        </p>
                      </div>
                      <div className="absolute -right-3 -bottom-3 opacity-10">
                        <span className="material-symbols-outlined text-[100px]">account_circle</span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <p className="text-[8px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">
                            Status on {formatDate(selectedDate).split(',')[0]}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                selectedMemberData.status === 'busy' ? 'bg-red-600' : 'bg-green-500'
                              }`}
                            ></span>
                            <span className="text-2.5xl font-extrabold capitalize">
                              {selectedMemberData.status === 'busy' ? 'Busy' : 'Available'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">Date</p>
                          <p className="text-xs font-bold text-gray-700">{formatDate(selectedDate).split(',')[1].trim()}</p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        {selectedMemberData.status === 'busy' && (
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-1.5 mb-2.5">
                              <span className="material-symbols-outlined text-red-600 text-xs">event_busy</span>
                              <p className="text-xs font-bold uppercase tracking-wider text-red-600">Reason for Absence</p>
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed italic">
                              "{selectedMemberData.reason}"
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                            <p className="text-[8px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">
                              Department
                            </p>
                            <p className="text-xs font-bold text-gray-900">
                              {selectedMember.role.split(' ').slice(-1)[0]}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                            <p className="text-[8px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">
                              Member ID
                            </p>
                            <p className="text-xs font-bold text-gray-900">{selectedMember.id}</p>
                          </div>
                        </div>
                      </div>

                      <button className="w-full mt-6 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 font-bold hover:bg-red-50 transition-colors text-sm" style={{ borderColor: 'rgba(128, 0, 0, 0.8)', color: 'rgba(128, 0, 0, 0.8)' }}>
                        <span>Schedule Meeting</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    </div>
                  </article>
                ) : loading ? (
                  <article className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse border border-gray-200">
                    <div className="p-6 h-28" style={{ backgroundColor: 'rgba(128, 0, 0, 0.2)' }}></div>
                    <div className="p-6 space-y-5">
                      <div className="h-16 bg-gray-200 rounded-xl"></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-14 bg-gray-200 rounded-lg"></div>
                        <div className="h-14 bg-gray-200 rounded-lg"></div>
                      </div>
                    </div>
                  </article>
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-gray-200">
                    <p className="text-gray-500 text-sm">Select a member to view status details</p>
                  </div>
                )}

                <div className="mt-5 bg-amber-50 p-3.5 rounded-xl flex gap-2.5 border border-amber-200">
                  <span className="material-symbols-outlined text-amber-600 text-lg flex-shrink-0">lightbulb</span>
                  <p className="text-xs text-amber-900 leading-tight">
                    <span className="font-bold block mb-0.5 text-amber-700">Tip</span>
                    Check availability for different dates to plan your meeting effectively with team members.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-3 pb-3 pt-1.5 bg-white/90 backdrop-blur-md rounded-t-xl border-t border-gray-200">
        <div className="flex flex-col items-center text-gray-500 px-2.5 py-0.5 text-xs">
          <span className="material-symbols-outlined text-base">dashboard</span>
          <span className="text-[8px] font-medium">Home</span>
        </div>
        <div className="flex flex-col items-center rounded-xl px-2.5 py-0.5 text-xs" style={{ backgroundColor: 'rgba(128, 0, 0, 0.1)', color: 'rgba(128, 0, 0, 0.8)' }}>
          <span className="material-symbols-outlined text-base">today</span>
          <span className="text-[8px] font-medium">Schedule</span>
        </div>
        <div className="flex flex-col items-center text-gray-500 px-2.5 py-0.5 text-xs">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span className="text-[8px] font-medium">Status</span>
        </div>
        <div className="flex flex-col items-center text-gray-500 px-2.5 py-0.5 text-xs">
          <span className="material-symbols-outlined text-base">person</span>
          <span className="text-[8px] font-medium">Profile</span>
        </div>
      </nav>
    </div>
  );
}
