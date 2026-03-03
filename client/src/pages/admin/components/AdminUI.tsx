// Shared UI primitives for the Admin Panel

export function PageHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon?: any }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-red-400" />
        </div>
      )}
      <div>
        <h1 className="font-orbitron text-2xl font-bold text-white tracking-wider">{title}</h1>
        {subtitle && <p className="text-zinc-400 text-sm font-rajdhani mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon?: any }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-red-400" />
        </div>
      )}
      <div>
        <h2 className="font-orbitron text-base font-bold text-white tracking-wider">{title}</h2>
        {subtitle && <p className="text-zinc-500 text-xs font-rajdhani">{subtitle}</p>}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-red-400",
  onClick,
}: {
  label: string;
  value: number | string;
  icon: any;
  color?: string;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={`bg-zinc-900/80 border border-white/8 rounded-xl p-4 flex items-center gap-4 ${onClick ? "hover:border-white/20 transition-colors cursor-pointer w-full text-left" : ""}`}
    >
      <div className={`w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className={`text-2xl font-orbitron font-bold ${color}`}>{value}</p>
        <p className="text-zinc-400 text-xs font-rajdhani">{label}</p>
      </div>
    </Wrapper>
  );
}

export function AdminCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-zinc-900/60 border border-white/8 rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}

export function AdminInput({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-zinc-800/60 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-red-500/60 transition-colors ${className}`}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-green-500/20 text-green-400 border-green-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    active: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    inactive: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    completed: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    in_progress: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    registration_open: "bg-green-500/20 text-green-400 border-green-500/30",
    registration_closed: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const cls = map[status] ?? "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-mono border ${cls}`}>
      {status.replace(/_/g, " ").toUpperCase()}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-12 h-12 text-zinc-700 mb-4" />
      <p className="font-orbitron text-sm text-zinc-400">{title}</p>
      {subtitle && <p className="text-zinc-600 text-xs mt-1 font-rajdhani">{subtitle}</p>}
    </div>
  );
}
