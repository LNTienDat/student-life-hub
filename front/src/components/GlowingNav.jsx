import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

export default function GlowingNav({ menu }) {
  const location = useLocation();

  return (
    <div className="flex gap-1 items-center bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-inner backdrop-blur-md transition-colors duration-300">
      {menu.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-150 flex items-center justify-center z-10 select-none whitespace-nowrap ${
              isActive
                ? 'text-ink-700 dark:text-ink-100 font-semibold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {isActive && (
              <>
                {/* Vòng sáng (Glow border) bao quanh tab active */}
                <motion.div
                  layoutId="glowBorder"
                  className="absolute inset-0 rounded-xl border border-ink-300/70 dark:border-ink-400/50 bg-ink-50/80 dark:bg-ink-500/20 shadow-[0_0_15px_rgba(46,49,89,0.15)] dark:shadow-[0_0_15px_rgba(142,152,203,0.25)]"
                  transition={{
                    type: 'spring',
                    stiffness: 350,
                    damping: 30,
                  }}
                />
              </>
            )}
            <span className="relative z-20">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
