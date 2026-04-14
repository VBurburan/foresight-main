'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator as CalcIcon, X } from 'lucide-react';

interface CalculatorWidgetProps {
  onClose: () => void;
}

/**
 * Floating, draggable calculator for exam use.
 * Useful for drug calculations, dosage math, etc.
 */
export default function CalculatorWidget({ onClose }: CalculatorWidgetProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Add to fixed container on mount
  useEffect(() => {
    if (!constraintsRef.current) {
      const div = document.createElement('div');
      div.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:70;';
      document.body.appendChild(div);
      (constraintsRef as any).current = div;
      return () => {
        if (constraintsRef.current) document.body.removeChild(constraintsRef.current);
      };
    }
  }, []);

  const inputDigit = (digit: string) => {
    if (waitingForNewValue) {
      setDisplay(digit);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
  };

  const handleOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operator) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operator);
      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperator(nextOperator);
  };

  const calculate = (first: number, second: number, op: string): number => {
    switch (op) {
      case '+': return first + second;
      case '-': return first - second;
      case '×': return first * second;
      case '÷': return second !== 0 ? first / second : 0;
      default: return second;
    }
  };

  const equals = () => {
    const inputValue = parseFloat(display);
    if (previousValue !== null && operator) {
      const newValue = calculate(previousValue, inputValue, operator);
      setDisplay(String(Number(newValue.toFixed(10))));
      setPreviousValue(null);
      setOperator(null);
      setWaitingForNewValue(true);
    }
  };

  const buttonClass = "h-10 rounded-md text-sm font-medium transition-colors active:scale-95";
  const numClass = `${buttonClass} bg-zinc-700 hover:bg-zinc-600 text-white`;
  const opClass = `${buttonClass} bg-blue-600 hover:bg-blue-500 text-white`;
  const clearClass = `${buttonClass} bg-red-600 hover:bg-red-500 text-white`;
  const equalsClass = `${buttonClass} bg-emerald-600 hover:bg-emerald-500 text-white`;

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed z-[70] pointer-events-auto"
      style={{ top: 120, right: 32 }}
    >
      <div className="w-64 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden">
        {/* Header — drag handle */}
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-800 cursor-move">
          <div className="flex items-center gap-2">
            <CalcIcon className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-300">Calculator</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Close calculator"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display */}
        <div className="px-3 py-4 bg-zinc-950">
          <div className="text-right text-2xl font-mono text-emerald-400 tabular-nums truncate">
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-1.5 p-2">
          <button onClick={clear} className={`${clearClass} col-span-2`}>AC</button>
          <button onClick={() => handleOperator('÷')} className={opClass}>÷</button>
          <button onClick={() => handleOperator('×')} className={opClass}>×</button>

          <button onClick={() => inputDigit('7')} className={numClass}>7</button>
          <button onClick={() => inputDigit('8')} className={numClass}>8</button>
          <button onClick={() => inputDigit('9')} className={numClass}>9</button>
          <button onClick={() => handleOperator('-')} className={opClass}>−</button>

          <button onClick={() => inputDigit('4')} className={numClass}>4</button>
          <button onClick={() => inputDigit('5')} className={numClass}>5</button>
          <button onClick={() => inputDigit('6')} className={numClass}>6</button>
          <button onClick={() => handleOperator('+')} className={opClass}>+</button>

          <button onClick={() => inputDigit('1')} className={numClass}>1</button>
          <button onClick={() => inputDigit('2')} className={numClass}>2</button>
          <button onClick={() => inputDigit('3')} className={numClass}>3</button>
          <button onClick={equals} className={`${equalsClass} row-span-2`}>=</button>

          <button onClick={() => inputDigit('0')} className={`${numClass} col-span-2`}>0</button>
          <button onClick={inputDecimal} className={numClass}>.</button>
        </div>
      </div>
    </motion.div>
  );
}
