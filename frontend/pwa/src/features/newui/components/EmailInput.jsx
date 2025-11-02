import { useState, useRef } from 'react';
import { Mail } from 'lucide-react';

export function EmailInput({ value, onChange, onSubmit, isLoading, error }) {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = value && emailRegex.test(value);
    
    if (isValid && !isLoading && onSubmit) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email адрес
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            id="email"
            type="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="example@email.com"
            className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
            autoFocus
          />
        </div>
        {error && (
          <div className="mt-1">
            <p className="text-sm text-red-600">{error}</p>
            {error.includes('Подождите') && (
              <p className="text-xs text-gray-500 mt-1">
                Это ограничение защищает от спама. Код будет отправлен после истечения времени ожидания.
              </p>
            )}
          </div>
        )}
      </div>
      
      <button
        type="submit"
        disabled={!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || isLoading}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-500 rounded-lg bg-blue-500 text-white text-base font-medium cursor-pointer transition-all hover:bg-blue-600 hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none min-h-[44px]"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Отправка...</span>
          </div>
        ) : (
          <span>Отправить код</span>
        )}
      </button>
    </form>
  );
}

