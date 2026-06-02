import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/fabrics', icon: '🧵', label: '我的面料' },
  { to: '/studio', icon: '✂️', label: '设计工坊' },
  { to: '/gallery', icon: '🗂️', label: '我的作品' },
  { to: '/settings', icon: '⚙️', label: '设置' },
]

export default function Sidebar() {
  return (
    <aside className="w-16 lg:w-52 h-screen bg-card border-r border-border flex flex-col py-6 fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-3 lg:px-5 mb-8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center text-white text-lg flex-shrink-0">
          ✿
        </div>
        <span className="hidden lg:block font-display font-semibold text-text-primary tracking-tight text-[15px]">
          布样工坊
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
               ${isActive
                 ? 'bg-primary/10 text-primary'
                 : 'text-text-secondary hover:bg-background hover:text-text-primary'
               }`
            }
          >
            <span className="text-lg w-6 text-center flex-shrink-0">{item.icon}</span>
            <span className="hidden lg:block">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom brand tagline */}
      <div className="hidden lg:block px-5 pb-2">
        <p className="text-[11px] text-text-secondary/60 leading-snug">
          先设计，再裁布。
        </p>
      </div>
    </aside>
  )
}
