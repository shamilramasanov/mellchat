import { useState, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

export function CodeInput({ phone, email, onVerify, onBack, isLoading, error, retryAfter, onRetry }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const [retryTimer, setRetryTimer] = useState(retryAfter || 0);

  // Форматирование email или номера для отображения
  const formatDisplay = (value) => {
    // Если это email (содержит @)
    if (value && value.includes('@')) {
      return value;
    }
    // Для номера телефона просто возвращаем как есть (phone auth удален)
    return value || '';
  };

  // Таймер для повторной отправки
  useEffect(() => {
    if (retryTimer > 0) {
      const timer = setTimeout(() => setRetryTimer(retryTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [retryTimer]);

  const handleChange = (index, value) => {
    // Только цифры
    const digit = value.replace(/\D/g, '').slice(0, 1);
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Автоматический переход к следующему полю
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Автоматическая отправка при заполнении всех полей
    if (digit && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6 && onVerify) {
        setTimeout(() => onVerify(fullCode), 100);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);
    
    // Фокус на последнем заполненном поле
    const lastIndex = Math.min(pasted.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();
    
    // Если код полный, отправляем
    if (pasted.length === 6 && onVerify) {
      setTimeout(() => onVerify(pasted), 100);
    }
  };

  useEffect(() => {
    // Фокус на первом поле при монтировании
    inputRefs.current[0]?.focus();
  }, []);

  const handleRetry = () => {
    if (retryTimer === 0 && onRetry) {
      onRetry();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Назад</span>
        </button>
        
        <h2 className="text-xl font-semibold text-black mb-2">
          Подтверждение
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Мы отправили код на {formatDisplay(email || phone)}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Не пришел код?
          </p>
          <button
            onClick={handleRetry}
            disabled={retryTimer > 0 || isLoading}
            className="text-sm text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {retryTimer > 0 ? `Отправить снова (${retryTimer} сек)` : 'Отправить код снова'}
          </button>
        </div>
      </div>
    </div>
  );
}

