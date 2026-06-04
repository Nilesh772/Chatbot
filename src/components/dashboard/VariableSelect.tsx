import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Variable } from "lucide-react";

interface VariableSelectProps {
  value: string;
  onChange: (value: string) => void;
  variables?: string[];
  placeholder?: string;
  showDropdown?: boolean;
}

export default function VariableSelect({
  value,
  onChange,
  variables = [],
  placeholder,
  showDropdown = false,
}: VariableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value || "");
  }, [value]);

  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const filtered = variables.filter((v) =>
    v.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (v: string) => {
    setSearch(v);
    onChange(v);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onChange(search);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="flex items-center w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all font-mono text-sm"
      >
        <Variable className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (showDropdown) {
              setIsOpen(true);
            }
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (showDropdown) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "e.g. selected_plan"}
          className="bg-transparent border-none outline-none flex-1 w-full text-slate-700 dark:text-slate-300 min-w-0"
        />
        {showDropdown && (
          <ChevronDown 
            className={`w-4 h-4 text-slate-400 cursor-pointer transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
            onClick={() => setIsOpen(!isOpen)}
          />
        )}
      </div>

      {showDropdown && isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto py-1">
          {search && !variables.includes(search) && (
            <div 
              className="px-3 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer flex items-center gap-2"
              onClick={() => handleSelect(search)}
            >
              <span className="bg-indigo-100 dark:bg-indigo-900/50 p-1 rounded font-bold">New</span> Create "{search}"
            </div>
          )}
          {filtered.length > 0 ? (
            filtered.map((v) => (
              <div
                key={v}
                onClick={() => handleSelect(v)}
                className="px-3 py-2 text-sm font-mono text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex items-center gap-2"
              >
                <Variable className="w-3.5 h-3.5 text-slate-400" />
                {v}
              </div>
            ))
          ) : (
            !search && <div className="px-3 py-2 text-xs text-slate-500 italic">Type to create a variable</div>
          )}
        </div>
      )}
    </div>
  );
}
