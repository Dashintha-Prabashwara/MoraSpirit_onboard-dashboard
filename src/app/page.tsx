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

// Returns today's date as a string in YYYY-MM-DD format
const getTodayString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export default function Home() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberAvailability, setMemberAvailability] = useState<Record<string, AvailabilityResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'busy'>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Current month
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://task.moraspirit.com';

  // Filters members by search query and status; recalculates when dependencies change
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;

      const memberData = memberAvailability[`${m.id}-${selectedDate}`];
      if (!memberData) return true; // Show if data not loaded yet

      return statusFilter === 'available'
        ? memberData.status === 'available'
        : memberData.status === 'busy';
    });
  }, [members, searchQuery, statusFilter, memberAvailability, selectedDate]);

  // Get selected member info
  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedMemberData = selectedMemberId ? memberAvailability[`${selectedMemberId}-${selectedDate}`] : null;

  // Fetches initial member list on component mount
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

  // Fetches selected member's availability for the chosen date (uses cache to avoid duplicate requests)
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

  // Converts YYYY-MM-DD to human-readable format (e.g., "Monday, April 10, 2026")
  // Uses Sakamoto's algorithm to avoid timezone conversion issues
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);

    // Tomohiko Sakamoto's algorithm - calculates day of week without timezone issues
    const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
    const y = month < 3 ? year - 1 : year;
    const dayOfWeek = (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[month - 1] + day) % 7;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return `${dayNames[dayOfWeek]}, ${monthNames[month - 1]} ${day}, ${year}`;
  };

  // Generates calendar grid array for a month, with null padding for empty cells
  // Calendar starts Monday (index 0) and ends Sunday (index 6)
  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Adjust for calendar headers starting with Monday (not Sunday)
    // getDay(): 0=Sun, 1=Mon, ..., 6=Sat
    // Calendar headers: M T W T F S S (col 0=Mon, col 6=Sun)
    const dayOfWeek = firstDay.getDay();
    const startingDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // Fetches availability for all members when date changes; tracks errors gracefully
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

  // Attempts to reload members from API, used when initial load fails
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
                  const dateStr = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : null;
                  const isSelected = dateStr === selectedDate;
                  const isCurrentMonth = date && date.getMonth() === currentMonth.getMonth();
                  const today = new Date();
                  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  const isToday = dateStr === todayStr;

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
                          : isToday
                          ? 'hover:bg-gray-100 cursor-pointer border border-gray-400'
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

            {/* Mobile Date Selection */}
            <div className="lg:hidden mt-4">
              <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
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

              <div className="flex gap-2 mb-5">
                {(['all', 'available', 'busy'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                      statusFilter === filter
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={
                      statusFilter === filter ? { backgroundColor: 'rgba(128, 0, 0, 0.8)' } : {}
                    }
                  >
                    {filter === 'all' ? 'All' : filter === 'available' ? '✓ Available' : '◆ Busy'}
                  </button>
                ))}
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
                        className={`${containerClass} p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all bg-white border border-gray-200 ${isSelected ? 'ring-1 ring-red-300' : ''} relative`}
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

            <section className="hidden xl:block xl:col-span-4">
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

                      {selectedMemberData.status !== 'busy' && (
                        <button className="w-full mt-6 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 font-bold hover:bg-red-50 transition-colors text-sm" style={{ borderColor: 'rgba(128, 0, 0, 0.8)', color: 'rgba(128, 0, 0, 0.8)' }}>
                          <span>Schedule Meeting</span>
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </button>
                      )}
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

      {/* Mobile Modal for Status Insight */}
      {selectedMember && selectedMemberData && (
        <div className="xl:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end">
          <div className="w-full bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300 max-h-[90vh] overflow-y-auto pb-20">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-2xl font-bold font-headline">Status Insight</h3>
              <button
                onClick={() => setSelectedMemberId(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-gray-600">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
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

                  {selectedMemberData.status !== 'busy' && (
                    <button className="w-full mt-6 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 font-bold hover:bg-red-50 transition-colors text-sm" style={{ borderColor: 'rgba(128, 0, 0, 0.8)', color: 'rgba(128, 0, 0, 0.8)' }}>
                      <span>Schedule Meeting</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  )}
                </div>
              </article>
            </div>
          </div>
        </div>
      )}

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
