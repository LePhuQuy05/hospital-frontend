import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, ChevronDown, Loader2 } from 'lucide-react';

/**
 * SearchSelectInput — A reusable search-and-select component.
 *
 * Props:
 *   label        - Field label string
 *   placeholder  - Search input placeholder
 *   value        - Currently selected ID (controlled)
 *   selectedLabel - Display name for the selected item (controlled)
 *   onSelect     - callback(id, item) when an item is picked
 *   onClear      - callback() when selection is cleared
 *   fetchOptions - async (keyword) => [{ id, label, sub }]
 *   error        - Validation error string
 *   required     - bool
 *   disabled     - bool
 */
const SearchSelectInput = ({
  label,
  placeholder = 'Type to search...',
  value,
  selectedLabel,
  onSelect,
  onClear,
  fetchOptions,
  error,
  required = false,
  disabled = false,
}) => {
  const [keyword, setKeyword] = useState('');
  const [options, setOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setKeyword('');
        setOptions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const search = useCallback(
    async (kw) => {
      if (!kw.trim()) {
        setOptions([]);
        setIsOpen(false);
        return;
      }
      setIsLoading(true);
      try {
        const results = await fetchOptions(kw);
        setOptions(results || []);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch {
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchOptions]
  );

  const handleInputChange = (event) => {
    const kw = event.target.value;
    setKeyword(kw);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(kw), 300);
  };

  const handleSelect = (item) => {
    onSelect(item.id, item);
    setKeyword('');
    setOptions([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onClear();
    setKeyword('');
    setOptions([]);
    setIsOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (event) => {
    if (!isOpen || options.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0 && options[activeIndex]) {
        handleSelect(options[activeIndex]);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setKeyword('');
      setOptions([]);
    }
  };

  const isSelected = Boolean(value);

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}

      {isSelected ? (
        // Selected state — show chip
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
            error ? 'border-rose-300 bg-rose-50' : 'border-emerald-300 bg-emerald-50'
          }`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
              ✓
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-emerald-900">
                {selectedLabel || `ID: ${value}`}
              </p>
              <p className="text-xs text-emerald-600">ID: {value}</p>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="flex-shrink-0 rounded-full p-1 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-900"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        // Search state — show input
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : (
              <Search className="h-4 w-4 text-slate-400" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={keyword}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => keyword.trim() && options.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full rounded-2xl border py-3 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50 ${
              error
                ? 'border-rose-300 bg-rose-50 focus:border-rose-400'
                : 'border-slate-200 bg-slate-50 focus:border-sky-500'
            }`}
          />
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>

          {isOpen && options.length > 0 && (
            <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
              {options.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left transition ${
                      index === activeIndex
                        ? 'bg-sky-50 text-sky-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    } ${index < options.length - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    <span className="text-sm font-semibold">{item.label}</span>
                    {item.sub && <span className="text-xs text-slate-500">{item.sub}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {isOpen && !isLoading && keyword.trim() && options.length === 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
              <p className="text-sm text-slate-500">No results found for "{keyword}"</p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
};

export default SearchSelectInput;
