import { NavLink } from 'react-router-dom';

const ACTIVE_THEMES = {
  '/dashboard': 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-sm font-semibold',
  '/mon-hoc': 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 shadow-sm font-semibold',
  '/lich-hoc': 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300 shadow-sm font-semibold',
  '/deadline': 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300 shadow-sm font-semibold',
  '/tai-chinh': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-sm font-semibold',
  '/ho-so': 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 shadow-sm font-semibold',
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
