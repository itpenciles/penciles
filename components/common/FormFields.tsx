import React from 'react';

export const InputField = ({ label, name, value, onChange, type = "number" }: { label: string, name: string, value: number | string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input type={type} name={name} value={value} onChange={onChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" />
    </div>
);

export const SelectField = ({ label, name, value, onChange, options }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[] }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <select name={name} value={value} onChange={onChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue bg-white">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

export const ToggleField = ({ label, name, checked, onChange }: { label: string, name: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="flex items-center">
        <label htmlFor={name} className="flex items-center cursor-pointer">
            <div className="relative">
                <input type="checkbox" id={name} name={name} className="sr-only" checked={checked} onChange={onChange} />
                <div className={`block w-14 h-8 rounded-full ${checked ? 'bg-brand-blue' : 'bg-gray-200'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <div className="ml-3 text-sm font-medium text-gray-700">{label}</div>
        </label>
    </div>
);

export const SliderField = ({ label, name, value, onChange, unit, min, max, step, displayValue }: { label: string, name: string, value: number, onChange: (v: number) => void, unit: string, min: number, max: number, step: number, displayValue?: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}: <span className="font-bold">{displayValue || `${value}${unit}`}</span></label>
        <input type="range" name={name} value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} max={max} step={step} className="mt-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-blue" />
    </div>
);
