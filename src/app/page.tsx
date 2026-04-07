export default function Home() {
  const members = [
    {
      id: "MSP001",
      name: "Arjun Perera",
      role: "Chief Marketing Officer",
      status: "Busy",
      initials: "AP",
      selected: true,
    },
    {
      id: "MSP024",
      name: "Sarah De Silva",
      role: "Lead Developer",
      status: "Available",
      initials: "SD",
      selected: false,
    },
    {
      id: "MSP015",
      name: "Kasun Jayawardena",
      role: "Editorial Lead",
      status: "Available",
      initials: "KJ",
      selected: false,
    },
  ];

  return (
    <div className="bg-background text-(--on-background) min-h-screen flex flex-col pb-20 lg:pb-0">
      <header className="fixed top-0 left-0 w-full z-50 bg-[var(--surface)]/95 backdrop-blur-md">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[var(--primary-container)] rounded-lg flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <h1 className="text-xl font-extrabold text-[var(--primary)] font-headline">MoraSpirit Web Pillar</h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a className="text-[var(--primary)] border-b-2 border-[var(--primary)] pb-1 uppercase tracking-[0.08em] text-xs font-semibold" href="#">
              Dashboard
            </a>
            <a className="text-slate-600 hover:text-[var(--primary)] transition-colors uppercase tracking-[0.08em] text-xs font-semibold" href="#">
              Members
            </a>
            <a className="text-slate-600 hover:text-[var(--primary)] transition-colors uppercase tracking-[0.08em] text-xs font-semibold" href="#">
              Reports
            </a>
            <a className="text-slate-600 hover:text-[var(--primary)] transition-colors uppercase tracking-[0.08em] text-xs font-semibold" href="#">
              Settings
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-slate-600 hover:scale-95 transition-transform">notifications</button>
            <div className="w-9 h-9 rounded-full bg-[var(--primary-container)] text-white flex items-center justify-center text-sm font-bold border-2 border-[var(--surface-container-highest)]">
              JP
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-20">
        <aside className="fixed left-0 top-0 h-screen z-40 bg-[var(--surface-container-low)] w-64 hidden lg:flex flex-col pt-24 px-4">
          <div className="mb-8 px-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Navigation</p>
            <div className="space-y-1">
              <div className="flex items-center gap-3 py-3 px-4 bg-teal-700/10 text-[var(--primary)] rounded-r-full font-bold cursor-pointer">
                <span className="material-symbols-outlined">event_available</span>
                <span>Availability</span>
              </div>
              <div className="flex items-center gap-3 py-3 px-4 text-slate-500 hover:bg-white rounded-r-full transition-colors cursor-pointer">
                <span className="material-symbols-outlined">calendar_month</span>
                <span>Calendar</span>
              </div>
              <div className="flex items-center gap-3 py-3 px-4 text-slate-500 hover:bg-white rounded-r-full transition-colors cursor-pointer">
                <span className="material-symbols-outlined">groups</span>
                <span>Teams</span>
              </div>
              <div className="flex items-center gap-3 py-3 px-4 text-slate-500 hover:bg-white rounded-r-full transition-colors cursor-pointer">
                <span className="material-symbols-outlined">inventory_2</span>
                <span>Archive</span>
              </div>
            </div>
          </div>

          <div className="mb-8 px-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-4">Date Selection</p>
            <div className="bg-[var(--surface-container-lowest)] rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">October 2023</span>
                <span className="text-sm text-slate-500">&#8249; &#8250;</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-slate-400 mb-2">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-[11px] text-center font-medium">
                <span className="p-1">25</span><span className="p-1">26</span><span className="p-1">27</span><span className="p-1">28</span><span className="p-1">29</span><span className="p-1">30</span><span className="p-1 text-slate-300">1</span>
                <span className="p-1">2</span><span className="p-1">3</span><span className="p-1">4</span><span className="p-1">5</span><span className="p-1">6</span><span className="p-1">7</span><span className="p-1">8</span>
                <span className="p-1 bg-[var(--primary)] text-white rounded-md">9</span><span className="p-1">10</span><span className="p-1">11</span><span className="p-1">12</span><span className="p-1">13</span><span className="p-1">14</span><span className="p-1">15</span>
              </div>
            </div>
          </div>

          <div className="mt-auto pb-8 space-y-4">
            <button className="academic-gradient text-white w-full py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all">
              Update Status
            </button>
            <div className="flex flex-col gap-1 border-t border-slate-300 pt-4">
              <div className="flex items-center gap-3 py-2 px-4 text-slate-500 text-sm cursor-pointer hover:text-[var(--primary)]">
                <span className="material-symbols-outlined text-sm">help</span>
                <span>Help</span>
              </div>
              <div className="flex items-center gap-3 py-2 px-4 text-slate-500 text-sm cursor-pointer hover:text-[var(--error)]">
                <span className="material-symbols-outlined text-sm">logout</span>
                <span>Logout</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 lg:ml-64 p-6 md:p-10 max-w-[1600px] mx-auto w-full">
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 bg-[var(--primary)] rounded-full"></div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-headline">Member Availability Dashboard</h2>
            </div>
            <p className="text-slate-500 max-w-2xl text-lg">
              Real-time status tracking for the MoraSpirit core team. Select a member to view detailed academic commitments and workshop schedules.
            </p>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <section className="xl:col-span-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                <h3 className="text-3xl font-bold font-headline">Core Team Members</h3>
                <div className="flex items-center gap-2 bg-[var(--surface-container-low)] px-3 py-2 rounded-full">
                  <span className="material-symbols-outlined text-sm text-slate-400">search</span>
                  <input
                    className="bg-transparent border-none outline-none text-sm placeholder:text-slate-400 w-full sm:w-56"
                    placeholder="Search members..."
                    type="text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {members.map((member) => {
                  const isBusy = member.status === "Busy";
                  const statusColor = isBusy ? "bg-red-600" : "bg-emerald-500";
                  const statusText = isBusy ? "text-red-600" : "text-emerald-600";
                  const containerClass = member.selected
                    ? "bg-[var(--surface-container-lowest)] ring-2 ring-teal-700/30 border-l-4 border-teal-500"
                    : "bg-[var(--surface-container-lowest)]";

                  return (
                    <article key={member.id} className={`${containerClass} p-5 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-full academic-gradient text-white font-bold flex items-center justify-center">
                          {member.initials}
                        </div>
                        <span className="bg-[var(--secondary-container)] text-[var(--on-surface-variant)] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                          {member.id}
                        </span>
                      </div>
                      <h4 className="font-bold text-xl leading-tight">{member.name}</h4>
                      <p className="text-sm text-slate-500 font-medium mb-3">{member.role}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
                        <span className={`text-xs font-bold uppercase tracking-wider ${statusText}`}>{member.status}</span>
                      </div>
                    </article>
                  );
                })}

                {[1, 2, 3].map((item) => (
                  <div key={item} className="bg-[var(--surface-container-low)] p-5 rounded-xl animate-pulse">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-full bg-[var(--surface-container-highest)]"></div>
                      <div className="w-16 h-4 rounded bg-[var(--surface-container-highest)]"></div>
                    </div>
                    <div className="w-32 h-4 rounded bg-[var(--surface-container-highest)] mb-2"></div>
                    <div className="w-20 h-3 rounded bg-[var(--surface-container-highest)] mb-4"></div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--surface-container-highest)]"></div>
                      <div className="w-16 h-2 rounded bg-[var(--surface-container-highest)]"></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-[var(--error-container)]/30 p-4 rounded-xl flex items-center gap-4">
                <span className="material-symbols-outlined text-[var(--error)]">error</span>
                <div>
                  <p className="text-sm font-bold text-red-900">Filter synchronization failed</p>
                  <p className="text-xs text-red-900/70">Unable to load the "Editorial" department members. Please refresh or try again later.</p>
                </div>
              </div>
            </section>

            <section className="xl:col-span-4">
              <div className="sticky top-28">
                <h3 className="text-3xl font-bold font-headline mb-6">Status Insight</h3>

                <article className="bg-[var(--surface-container-lowest)] rounded-2xl shadow-xl shadow-slate-300/40 overflow-hidden">
                  <div className="academic-gradient p-8 text-white relative">
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                          Selected Member
                        </span>
                      </div>
                      <h4 className="text-4xl font-extrabold font-headline">Arjun Perera</h4>
                      <p className="text-white/80 text-sm font-medium">Chief Marketing Officer • MSP001</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                      <span className="material-symbols-outlined text-[120px]">account_circle</span>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Current Status</p>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-600"></span>
                          <span className="text-3xl font-extrabold">Busy</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Timeline</p>
                        <p className="text-sm font-bold text-slate-700">09 Oct - 14 Oct</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-[var(--surface-container-low)] p-5 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-[var(--primary)] text-sm">event_busy</span>
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Reason for Absence</p>
                        </div>
                        <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed italic">
                          "Unavailable because the CMO is leading a strategy workshop for the upcoming University Colors Awards ceremony. Contact the deputy lead for urgent media approvals."
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Department</p>
                          <p className="text-xs font-bold">Marketing</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Response Time</p>
                          <p className="text-xs font-bold">~24 Hours</p>
                        </div>
                      </div>
                    </div>

                    <button className="w-full mt-8 flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-[var(--primary)] text-[var(--primary)] font-bold hover:bg-teal-50 transition-colors">
                      <span>Schedule Meeting</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </article>

                <div className="mt-6 bg-[color:color-mix(in_oklab,var(--tertiary)_12%,white)] p-4 rounded-xl flex gap-3">
                  <span className="material-symbols-outlined text-[var(--tertiary)]">lightbulb</span>
                  <p className="text-xs text-amber-900 leading-tight">
                    <span className="font-bold block mb-1 text-[var(--tertiary)]">Academic Tip</span>
                    Most CMO availability shifts happen after 4 PM local time during weekday workshop sessions.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-white/90 backdrop-blur-md rounded-t-xl border-t border-slate-200">
        <div className="flex flex-col items-center text-slate-500 px-3 py-1">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-medium">Home</span>
        </div>
        <div className="flex flex-col items-center bg-teal-100 text-teal-900 rounded-xl px-3 py-1">
          <span className="material-symbols-outlined">today</span>
          <span className="text-[10px] font-medium">Schedule</span>
        </div>
        <div className="flex flex-col items-center text-slate-500 px-3 py-1">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="text-[10px] font-medium">Status</span>
        </div>
        <div className="flex flex-col items-center text-slate-500 px-3 py-1">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-medium">Profile</span>
        </div>
      </nav>
    </div>
  );
}
