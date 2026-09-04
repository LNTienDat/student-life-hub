import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export default function Autocomplete({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Nhập để tìm kiếm...",
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const wrapperRef = useRef(null);

  // Sync internal state if external value changes
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        // Khi đóng, nếu người dùng gõ text mà chưa chọn thì ta vẫn lưu lại text đó
        if (searchTerm !== value) {
          onChange(searchTerm);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef, searchTerm, value, onChange]);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    setSearchTerm(option);
    onChange(option);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    setSearchTerm(newVal);
    onChange(newVal); // Cho phép nhập tự do
    setIsOpen(true);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div 
        className="relative flex items-center w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-shadow focus-within:ring-2 focus-within:ring-ink-500/30 dark:focus-within:ring-ink-400/40"
      >
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onClick={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full bg-transparent text-slate-900 dark:text-white px-4 py-2.5 text-sm focus:outline-none"
        />
        <button 
          type="button" 
          onClick={() => setIsOpen(!isOpen)}
          className="pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto overflow-x-hidden">
          {filteredOptions.length > 0 ? (
            <ul className="py-1">
              {filteredOptions.map((option, index) => (
                <li
                  key={index}
                  onClick={() => handleSelect(option)}
                  className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                >
                  {option}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <p className="text-center">
                Không tìm thấy kết quả phù hợp.<br/>
                <span className="text-xs">Bạn có thể dùng tên vừa nhập.</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
