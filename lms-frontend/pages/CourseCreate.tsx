
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Input, TextArea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const CourseCreate = () => {
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    short_description: '',
    thumbnail_url: '',
    is_free: true,
    price: 0,
    is_published: false
  });
  const [scormFile, setScormFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Create Course
      const newCourse = await api.courses.create({
        ...courseData,
        is_free: true,
        price: 0
      });

      // 2. Import SCORM if file selected
      if (scormFile) {
        try {
           await api.scorm.import(newCourse.id, scormFile);
        } catch (scormErr) {
           console.error("SCORM import failed", scormErr);
           alert("Курс создан, но импорт SCORM не удался. Вы можете попробовать импортировать его снова в настройках курса.");
        }
      }

      // Navigate to course detail
      navigate(`/course/${newCourse.id}`); 
    } catch (err) {
      console.error(err);
      alert('Не удалось создать курс');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-display font-bold text-white mb-8">Создать новый курс</h1>
      
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10">
        <form onSubmit={handleSubmit}>
          <Input 
            label="Название курса"
            value={courseData.title}
            onChange={(e) => setCourseData({...courseData, title: e.target.value})}
            placeholder="Например: Введение в кибербезопасность"
            required
          />
          
          <Input 
            label="Краткое описание"
            value={courseData.short_description}
            onChange={(e) => setCourseData({...courseData, short_description: e.target.value})}
            placeholder="Краткий обзор для карточки курса"
          />

          <Input 
            label="URL обложки"
            value={courseData.thumbnail_url}
            onChange={(e) => setCourseData({...courseData, thumbnail_url: e.target.value})}
            placeholder="https://example.com/course-image.jpg"
          />

          <TextArea 
            label="Полное описание"
            value={courseData.description}
            onChange={(e) => setCourseData({...courseData, description: e.target.value})}
            rows={5}
            placeholder="Подробная информация о курсе..."
          />

          <div className="my-8 p-6 bg-brand-purple/10 rounded-xl border border-brand-purple/30">
             <div className="flex justify-between items-start mb-2">
                <h3 className="font-display font-bold text-lg text-brand-purple">Импорт SCORM (Опционально)</h3>
                <span className="text-xs bg-brand-purple text-white px-2 py-1 rounded uppercase font-bold">New</span>
             </div>
             <p className="text-sm text-white/60 mb-4">Загрузите пакет SCORM 1.2 или 2004 (.zip). Уроки будут созданы автоматически.</p>
             <input 
                type="file" 
                accept=".zip"
                onChange={(e) => setScormFile(e.target.files ? e.target.files[0] : null)}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-brand-purple file:text-white
                  hover:file:bg-brand-cyan
                  cursor-pointer
                  bg-black/20 rounded-full
                "
              />
          </div>

          <div className="flex flex-wrap gap-8 mb-6 bg-black/20 p-4 rounded-xl border border-white/5">
             <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={courseData.is_published} 
                  onChange={(e) => setCourseData({...courseData, is_published: e.target.checked})}
                  className="w-5 h-5 rounded accent-brand-green"
                />
                <span className="font-display uppercase text-sm">Опубликовать сразу</span>
             </label>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Создание...' : 'Создать курс'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
