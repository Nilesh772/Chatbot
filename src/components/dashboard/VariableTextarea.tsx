import React, { useRef, useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";

interface VariableTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  variables: string[];
  placeholder?: string;
}

export default function VariableTextarea({
  label,
  value,
  onChange,
  variables,
  placeholder,
}: VariableTextareaProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleVariableSelect = (variableName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textToInsert = `{{${variableName}}}`;

    const newValue =
      value.substring(0, start) + textToInsert + value.substring(end);

    onChange(newValue);
    setIsDropdownOpen(false);

    // Set cursor position right after the inserted variable
    const newCursorPos = start + textToInsert.length;
    
    // We need to wait for React to re-render with the new value before setting selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add Variable
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
              {variables.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-500 italic">
                  No variables available
                </div>
              ) : (
                variables.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => handleVariableSelect(variable)}
                    className="w-full text-left px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                  >
                    {`{{${variable}}}`}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <textarea
        ref={textareaRef}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all leading-relaxed"
      />
    </div>
  );
}
