
import React, { useState } from 'react';
import { Test, TestResult } from '../types';
import { Button } from './ui/Button';

interface TestPlayerProps {
  test: Test;
  onSubmit: (answers: Record<number, number | number[]>) => Promise<TestResult>;
}

export const TestPlayer: React.FC<TestPlayerProps> = ({ test, onSubmit }) => {
  const [answers, setAnswers] = useState<Record<number, number | number[]>>({});
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = (questionId: number, optionId: number, type: 'single' | 'multiple') => {
    if (result) return; // Prevent changes after submission

    setAnswers(prev => {
      const current = prev[questionId];
      if (type === 'single') {
        return { ...prev, [questionId]: optionId };
      } else {
        const list = Array.isArray(current) ? current : [];
        if (list.includes(optionId)) {
          return { ...prev, [questionId]: list.filter(id => id !== optionId) };
        } else {
          return { ...prev, [questionId]: [...list, optionId] };
        }
      }
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await onSubmit(answers);
      setResult(res);
    } catch (err) {
      console.error(err);
      alert('Не удалось отправить тест');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers({});
  };

  if (result) {
    return (
      <div className="text-center py-10 animate-fadeIn font-sans">
        <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-4xl font-bold border-4 mb-6 ${
          result.passed ? 'border-brand-green bg-brand-green/20 text-brand-green' : 'border-red-500 bg-red-500/20 text-red-500'
        }`}>
          {Math.round(result.percentage)}%
        </div>
        <h2 className="text-3xl font-bold mb-2 text-white">{result.passed ? 'Поздравляем!' : 'Попробуйте снова'}</h2>
        <p className="text-white mb-8">Вы набрали {result.score} из {result.max_score} баллов.</p>
        
        <Button onClick={handleRetry} variant={result.passed ? 'outline' : 'primary'}>
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto font-sans">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-brand-cyan">{test.title}</h2>
        <p className="text-white text-sm">Ответьте на все вопросы для завершения модуля.</p>
      </div>

      {test.questions.map((q, idx) => (
        <div key={q.id || idx} className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold mb-4 flex gap-3 text-white">
            <span className="text-brand-green">0{idx + 1}.</span>
            {q.title}
          </h3>
          <div className="space-y-2 ml-8">
            {q.options.map((opt, oIdx) => {
              const isSelected = q.type === 'single' 
                ? answers[q.id!] === opt.id
                : (answers[q.id!] as number[])?.includes(opt.id!);

              return (
                <div 
                  key={opt.id || oIdx}
                  onClick={() => handleSelect(q.id!, opt.id!, q.type)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
                    isSelected 
                      ? 'bg-brand-cyan/20 border-brand-cyan text-white' 
                      : 'border-white/10 hover:bg-white/5 text-white'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-brand-cyan' : 'border-white/30'
                  }`}>
                    {isSelected && <div className="w-3 h-3 bg-brand-cyan rounded-full" />}
                  </div>
                  {opt.text}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex justify-end pt-6">
        <Button onClick={handleSubmit} disabled={loading || Object.keys(answers).length < test.questions.length}>
          {loading ? 'Отправка...' : 'Отправить ответы'}
        </Button>
      </div>
    </div>
  );
};
