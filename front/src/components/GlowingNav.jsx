import { NavLink } from 'react-router-dom';

const ACTIVE_THEMES = {
  '/dashboard': 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/30 font-semibold',
  '/mon-hoc': 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30 font-semibold',
  '/lich-hoc': 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-md shadow-sky-500/30 font-semibold',
  '/deadline': 'bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-md shadow-violet-500/30 font-semibold',
  '/tai-chinh': 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/30 font-semibold',
  '/ho-so': 'bg-gradient-to-r from-rose-600 to-pink-500 text-white shadow-md shadow-rose-500/30 font-semibold',
};

export default function GlowingNav({ menu }) {
  return <div className="flex items-center gap-1.5">
    {menu.map(item => {
      const activeClass = ACTIVE_THEMES[item.path] || 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold';
      return (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all ${
              isActive
                ? activeClass
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
            }`
          }
        >
          {item.label}
        </NavLink>
      );
    })}
  </div>;
}
