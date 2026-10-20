import { NavLink } from 'react-router-dom';

export default function GlowingNav({ menu }) {
  return <div className="flex items-center gap-1">
    {menu.map(item => <NavLink key={item.path} to={item.path}
      className={({ isActive }) => `inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors ${isActive ? 'bg-ink-50 text-ink-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
      {item.label}
    </NavLink>)}
  </div>;
}
