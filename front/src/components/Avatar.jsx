import { AVATAR_PRESETS } from '../utils/avatarPresets';
export default function Avatar({ value, name = '', size = 'h-10 w-10', className = '' }) {
  const preset = AVATAR_PRESETS.find(item => value === `preset:${item.id}`);
  const Icon = preset?.Icon;
  const uploaded = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value || '') && value.length <= 120000;
  return <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${size} ${preset?.color || 'bg-ink-100 text-ink-700'} ${className}`}>
    {uploaded ? <img src={value} alt="" className="h-full w-full object-cover" /> : Icon ? <Icon className="h-[55%] w-[55%]" strokeWidth={1.8} /> : <span className="text-[1.3em] font-semibold">{name.trim().charAt(0).toUpperCase() || 'L'}</span>}
  </span>;
}
