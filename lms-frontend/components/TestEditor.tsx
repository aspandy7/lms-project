
import React, { useState, useEffect } from 'react';
import { Test, TestCreate, TestQuestion, TestOption } from '../types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface TestEditorProps {
  lessonId: number;
  existingTest: Test | null;
  onSave: (testData: TestCreate) => Promise<void>;
}

export const TestEditor: React.FC<TestEditorProps> = ({ lessonId, existingTest, onSave }) => {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);

  useEffect(() => {
    if (existingTest) {
      setTitle(existingTest.title);
      setQuestions(existingTest.questions);
    } else {
      setTitle('Lesson Quiz');
      setQuestions([]);
    }
  }, [existingTest]);

  const addQuestion = () => {
    const newQuestion: TestQuestion = {
      title: 'New Question',
      type: 'single',
      order: questions.length,
      options: [
        { text: 'Option 1', is_correct: false },
        { text: 'Option 2', is_correct: false }
      ]
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<TestQuestion>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push({ text: 'New Option', is_correct: false });
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, updates: Partial<TestOption>) => {
    const newQuestions = [...questions];
    const question = newQuestions[qIndex];
    
    // Handle single choice logic
    if (updates.is_correct && question.type === 'single') {
       question.options.forEach((opt, idx) => {
         opt.is_correct = idx === oIndex;
       });
    } else {
       question.options[oIndex] = { ...question.options[oIndex], ...updates };
    }
    
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
    setQuestions(newQuestions);
  };

  const handleSave = () => {
    if (!title) {
        alert("Please enter a test title");
        return;
    }
    onSave({
      title,
      lessonId: lessonId, // Note: This property name must match backend expectation (lesson_id vs lessonId), mapping to `lesson_id` in types.
      lesson_id: lessonId,
      questions
    } as any);
  };

  return (
    <div className="space-y-6">
      <div className="bg-black/20 p-6 rounded-2xl border border-white/10">
        <Input 
          label="Quiz Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-white/5 p-6 rounded-2xl border border-white/10 relative group">
             <div className="flex justify-between items-start mb-4">
               <div className="flex-1 mr-4">
                 <Input 
                   placeholder="Question text" 
                   value={q.title}
                   onChange={(e) => updateQuestion(qIndex, { title: e.target.value })}
                   className="!text-lg !font-bold"
                 />
               </div>
               <Button 
                 variant="outline" 
                 onClick={() => removeQuestion(qIndex)}
                 className="!p-2 text-red-400 border-red-400/30 hover:bg-red-500/10"
               >
                 Trash
               </Button>
             </div>

             <div className="mb-4 flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name={`type-${qIndex}`}
                    checked={q.type === 'single'}
                    onChange={() => updateQuestion(qIndex, { type: 'single' })}
                    className="accent-brand-cyan"
                  />
                  <span className="text-sm">Single Choice</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name={`type-${qIndex}`}
                    checked={q.type === 'multiple'}
                    onChange={() => updateQuestion(qIndex, { type: 'multiple' })}
                    className="accent-brand-cyan"
                  />
                  <span className="text-sm">Multiple Choice</span>
                </label>
             </div>

             <div className="space-y-2 pl-4 border-l-2 border-white/10">
               {q.options.map((opt, oIndex) => (
                 <div key={oIndex} className="flex items-center gap-3">
                    <input 
                      type={q.type === 'single' ? 'radio' : 'checkbox'}
                      name={`correct-${qIndex}`}
                      checked={opt.is_correct}
                      onChange={(e) => updateOption(qIndex, oIndex, { is_correct: e.target.checked })}
                      className="w-5 h-5 accent-brand-green cursor-pointer"
                    />
                    <input 
                      className="flex-1 bg-transparent border-b border-white/20 py-1 focus:border-brand-cyan focus:outline-none transition-colors"
                      value={opt.text}
                      onChange={(e) => updateOption(qIndex, oIndex, { text: e.target.value })}
                      placeholder="Option text"
                    />
                    <button 
                      onClick={() => removeOption(qIndex, oIndex)}
                      className="text-white/20 hover:text-red-400"
                    >
                      &times;
                    </button>
                 </div>
               ))}
               <button 
                 onClick={() => addOption(qIndex)}
                 className="text-sm text-brand-cyan hover:text-brand-green mt-2 font-display uppercase tracking-wider"
               >
                 + Add Option
               </button>
             </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Button onClick={addQuestion} variant="secondary" className="flex-1 border-2 border-dashed border-white/20 !bg-transparent hover:!bg-white/5">
          + Add Question
        </Button>
      </div>

      <div className="flex justify-end pt-6 border-t border-white/10">
        <Button onClick={handleSave}>
          {existingTest ? 'Update Quiz' : 'Create Quiz'}
        </Button>
      </div>
    </div>
  );
};
