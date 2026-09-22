
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import { api } from '../services/api';
import { Course, Lesson, Test, TestCreate } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { TestEditor } from '../components/TestEditor';
import { TestPlayer } from '../components/TestPlayer';

export const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'content' | 'test'>('content');
  const [currentTest, setCurrentTest] = useState<Test | null>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  
  // Course Edit Form
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    short_description: '',
    thumbnail_url: '',
    price: 0,
    is_free: true,
    is_published: false
  });

  // Lesson Edit Form
  const [lessonEditForm, setLessonEditForm] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  // When active lesson changes, update the lesson edit form and fetch test
  useEffect(() => {
    const active = lessons.find(l => l.id === activeLessonId);
    if (active) {
      setLessonEditForm({
        title: active.title,
        content: active.content || ''
      });
      fetchTest(active.id);
      setActiveTab('content'); // Reset to content tab on change
    } else {
      setCurrentTest(null);
    }
  }, [activeLessonId, lessons]);

  const loadData = async () => {
    if (!id) return;
    try {
      const cData = await api.courses.get(parseInt(id));
      setCourse(cData);
      setEditForm({
        title: cData.title,
        description: cData.description || '',
        short_description: cData.short_description || '',
        thumbnail_url: cData.thumbnail_url || '',
        price: cData.price,
        is_free: cData.is_free,
        is_published: cData.is_published
      });

      const lData = await api.lessons.getByCourse(parseInt(id));
      setLessons(lData.sort((a, b) => a.order - b.order));
      if (lData.length > 0 && !activeLessonId) setActiveLessonId(lData[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTest = async (lessonId: number) => {
    try {
      // Assuming GET returns single test or throws 404
      const test = await api.tests.getByLesson(lessonId).catch(() => null);
      setCurrentTest(test);
    } catch (err) {
      setCurrentTest(null);
    }
  };

  const isAuthor = user && course && user.id === course.author_id;

  const handleUpdateCourse = async () => {
    if (!course) return;
    try {
      await api.courses.update(course.id, {
        title: editForm.title,
        description: editForm.description,
        short_description: editForm.short_description,
        thumbnail_url: editForm.thumbnail_url,
        price: 0,
        is_free: true,
        is_published: editForm.is_published
      });
      setIsEditing(false);
      loadData(); // Reload to show changes
    } catch (err) {
      console.error(err);
      alert('Не удалось обновить курс');
    }
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    if (!window.confirm('Вы абсолютно уверены, что хотите удалить этот курс? Это действие нельзя отменить, и все уроки и прогресс студентов будут удалены.')) return;
    
    try {
      await api.courses.delete(course.id);
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Не удалось удалить курс');
    }
  };

  const handleUpdateLesson = async () => {
    if (!activeLessonId) return;
    try {
      await api.lessons.update(activeLessonId, {
        title: lessonEditForm.title,
        content: lessonEditForm.content,
        course_id: course!.id
      });
      
      // Update local state
      const updatedLessons = lessons.map(l => 
        l.id === activeLessonId 
          ? { ...l, title: lessonEditForm.title, content: lessonEditForm.content }
          : l
      );
      setLessons(updatedLessons);
      alert('Урок успешно обновлен');
    } catch (err) {
      console.error(err);
      alert('Не удалось обновить урок');
    }
  };

  const handleSaveTest = async (testData: TestCreate) => {
    if (!activeLessonId) return;
    try {
      if (currentTest) {
        await api.tests.update(currentTest.id, testData);
      } else {
        await api.tests.create(testData);
      }
      alert('Тест успешно сохранен');
      fetchTest(activeLessonId);
    } catch (err) {
      console.error(err);
      alert('Не удалось сохранить тест');
    }
  };

  const handleReorder = async (index: number, direction: -1 | 1, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!course) return;
    
    // Boundary checks
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === lessons.length - 1) return;

    const newLessons = [...lessons];
    const targetIndex = index + direction;
    
    const currentLesson = newLessons[index];
    const targetLesson = newLessons[targetIndex];

    // Swap order values
    const tempOrder = currentLesson.order;
    currentLesson.order = targetLesson.order;
    targetLesson.order = tempOrder;

    // Swap positions in array and sort
    newLessons[index] = targetLesson;
    newLessons[targetIndex] = currentLesson;
    
    // Sort to ensure state consistency
    newLessons.sort((a, b) => a.order - b.order);
    setLessons(newLessons);

    try {
      // Update both lessons on server
      await Promise.all([
        api.lessons.update(currentLesson.id, { course_id: course.id, order: currentLesson.order }),
        api.lessons.update(targetLesson.id, { course_id: course.id, order: targetLesson.order })
      ]);
    } catch (err) {
      console.error("Failed to reorder", err);
      alert("Не удалось сохранить порядок");
      loadData(); // Revert on error
    }
  };

  const handleAddLesson = async () => {
    if (!course) return;
    try {
      const newOrder = lessons.length > 0 ? lessons[lessons.length - 1].order + 1 : 1;
      const newLesson = await api.lessons.create({
        title: `Новый урок ${lessons.length + 1}`,
        content: '# Содержание нового урока\n\nНачните писать здесь...\n\n### Пример видео\nhttps://rutube.ru/video/c8b3e36125345634563456/',
        course_id: course.id,
        order: newOrder
      });
      setLessons([...lessons, newLesson]);
      setActiveLessonId(newLesson.id);
      setIsEditing(true); // Ensure we are in edit mode to modify it immediately
    } catch (err) {
      console.error(err);
      alert('Не удалось создать урок');
    }
  };

  const handleDeleteLesson = async (lessonId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Вы уверены, что хотите удалить этот урок? Это действие нельзя отменить.')) return;
    
    try {
      await api.lessons.delete(lessonId);
      // Remove locally to avoid full reload
      const newLessons = lessons.filter(l => l.id !== lessonId);
      setLessons(newLessons);
      if (activeLessonId === lessonId) {
        setActiveLessonId(newLessons.length > 0 ? newLessons[0].id : null);
      }
    } catch (err) {
      console.error(err);
      alert('Не удалось удалить урок');
    }
  };

  if (!course) return <div className="text-center mt-20">Загрузка...</div>;

  const activeLesson = lessons.find(l => l.id === activeLessonId);
  
  // Check if lesson is SCORM
  const isScormLesson = activeLesson?.scorm_data && (activeLesson.scorm_data.url || activeLesson.scorm_data.launch_url);
  const scormUrl = activeLesson?.scorm_data?.url || activeLesson?.scorm_data?.launch_url;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-140px)]">
      {/* Sidebar / Accordion */}
      <div className="lg:col-span-1 bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display font-bold text-xl text-brand-green uppercase">Модули</h2>
          {isAuthor && isEditing && (
            <button 
              onClick={handleAddLesson}
              className="text-xs font-display uppercase bg-brand-green text-brand-blue hover:bg-white hover:text-brand-blue px-2 py-1 rounded transition-colors"
            >
              + Урок
            </button>
          )}
        </div>

        <div className="space-y-3 flex-1">
          {/* Course Overview Selection */}
          <button
            onClick={() => setActiveLessonId(null)}
            className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
              activeLessonId === null
                ? 'bg-brand-purple text-white shadow-lg'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
             <div className="font-display font-bold text-sm">Обзор курса</div>
          </button>

          {lessons.map((lesson, idx) => (
            <div key={lesson.id} className="relative group">
              <button
                onClick={() => setActiveLessonId(lesson.id)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                  activeLessonId === lesson.id 
                    ? 'bg-brand-cyan text-white shadow-lg' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                } ${isEditing ? 'pr-24' : 'pr-12'}`}
              >
                <div className="text-xs opacity-70 font-sans mb-1">Шаг {idx + 1}</div>
                <div className="font-display font-bold text-sm truncate">{lesson.title}</div>
              </button>
              
              {isEditing && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                   <div className="flex flex-col mr-1">
                      <button 
                        onClick={(e) => handleReorder(idx, -1, e)}
                        disabled={idx === 0}
                        className="p-0.5 hover:text-brand-cyan text-white/40 hover:bg-white/10 rounded disabled:opacity-10 transition-colors"
                        title="Вверх"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button 
                        onClick={(e) => handleReorder(idx, 1, e)}
                        disabled={idx === lessons.length - 1}
                        className="p-0.5 hover:text-brand-cyan text-white/40 hover:bg-white/10 rounded disabled:opacity-10 transition-colors"
                        title="Вниз"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                   </div>
                   <button 
                      onClick={(e) => handleDeleteLesson(lesson.id, e)}
                      className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-all"
                      title="Удалить урок"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                </div>
              )}
            </div>
          ))}
          
          {lessons.length === 0 && (
            <div className="text-center text-sm text-white/40 py-4">Уроков пока нет</div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3 bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 flex flex-col relative overflow-hidden">
        
        {/* Header / Edit Mode Toggle */}
        <div className="flex justify-between items-start mb-6 z-10">
           {isEditing ? (
             <div className="flex-1 mr-8">
               {activeLesson ? (
                 <div className="flex items-center gap-2">
                   <span className="text-white/50 font-display text-sm">Редактирование:</span>
                   <h2 className="text-2xl font-bold font-display">{activeLesson.title}</h2>
                 </div>
               ) : (
                 <Input 
                   value={editForm.title} 
                   onChange={e => setEditForm({...editForm, title: e.target.value})}
                   placeholder="Название курса"
                   className="text-2xl font-bold mb-2"
                 />
               )}
             </div>
           ) : (
             <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-brand-green text-brand-blue px-3 py-1 rounded font-bold font-display uppercase text-xs">
                    {activeLesson ? `Урок ${activeLesson.order}` : 'Обзор курса'}
                  </span>
                  {course.is_published ? (
                     <span className="border border-brand-green text-brand-green px-2 py-0.5 rounded text-[10px] font-display uppercase tracking-widest">
                       Опубликовано
                     </span>
                  ) : (
                     <span className="border border-yellow-400 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-display uppercase tracking-widest">
                       Черновик
                     </span>
                  )}
                </div>
                <h1 className="text-4xl font-display font-bold mt-1">
                  {activeLesson ? activeLesson.title : course.title}
                </h1>
             </div>
           )}

           <div className="flex items-start gap-4 shrink-0">
              {isAuthor && (
                <Button 
                  variant={isEditing ? 'secondary' : 'outline'}
                  onClick={() => setIsEditing(!isEditing)}
                  className="!py-2 !px-4 text-xs"
                >
                  {isEditing ? 'Готово' : 'Режим правки'}
                </Button>
              )}
           </div>
        </div>

        {/* TABS (Only visible if a lesson is selected and NOT scorm) */}
        {activeLesson && !isScormLesson && (
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl mb-6 w-fit relative z-10">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-6 py-2 rounded-lg font-display font-bold uppercase text-sm transition-all ${
                activeTab === 'content' ? 'bg-brand-cyan text-white shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              Обучение
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`px-6 py-2 rounded-lg font-display font-bold uppercase text-sm transition-all flex items-center gap-2 ${
                activeTab === 'test' ? 'bg-brand-purple text-white shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              Тест
              {currentTest && !isEditing && <span className="w-2 h-2 rounded-full bg-brand-green"></span>}
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="z-10 h-full overflow-y-auto pr-4 scrollbar-thin">
          
          {isEditing ? (
            <div className="animate-fadeIn h-full">
              {activeLesson ? (
                /* LESSON EDITING */
                activeTab === 'content' ? (
                  <div className="h-full flex flex-col">
                    <Input 
                      label="Название урока"
                      value={lessonEditForm.title}
                      onChange={e => setLessonEditForm({...lessonEditForm, title: e.target.value})}
                    />
                    
                    {isScormLesson ? (
                      <div className="bg-brand-purple/10 p-6 rounded-xl border border-brand-purple/30 mb-4">
                         <h3 className="text-brand-purple font-bold mb-2">SCORM Урок</h3>
                         <p className="text-sm opacity-60">Этот контент управляется через SCORM пакет. Редактирование контента отключено.</p>
                      </div>
                    ) : (
                      <div className="flex-1 mb-4 flex flex-col">
                        <label className="block text-white mb-2 font-display uppercase tracking-wider text-sm">Контент (Markdown)</label>
                        <textarea 
                          className="flex-1 w-full px-4 py-3 rounded-xl bg-white text-brand-blue placeholder-brand-blue/50 focus:outline-none focus:ring-4 focus:ring-brand-cyan/50 transition-all font-sans font-medium font-mono"
                          value={lessonEditForm.content}
                          onChange={e => setLessonEditForm({...lessonEditForm, content: e.target.value})}
                        />
                        <div className="mt-2 text-xs text-white/50 font-sans space-y-1">
                          <p>✨ Поддерживается Markdown форматирование</p>
                          <p>🎥 Для вставки видео просто добавьте ссылку Rutube на новой строке: <span className="font-mono bg-white/10 px-1 rounded text-brand-green">https://rutube.ru/video/ID/</span></p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-4">
                       <Button onClick={handleUpdateLesson}>Сохранить урок</Button>
                    </div>
                  </div>
                ) : (
                  /* TEST EDITING */
                  <TestEditor 
                    lessonId={activeLesson.id}
                    existingTest={currentTest}
                    onSave={handleSaveTest}
                  />
                )
              ) : (
                /* COURSE EDITING FORM */
                <div className="space-y-6 max-w-2xl">
                  <div className="bg-black/20 p-6 rounded-xl border border-white/10">
                    <h3 className="font-display font-bold text-lg mb-4 text-brand-cyan">Настройки курса</h3>
                    
                    <TextArea 
                      label="Описание"
                      value={editForm.description}
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                      rows={4}
                    />
                    
                    <Input 
                      label="URL обложки"
                      value={editForm.thumbnail_url}
                      onChange={e => setEditForm({...editForm, thumbnail_url: e.target.value})}
                      placeholder="https://example.com/image.jpg"
                    />

                    <div className="flex flex-wrap gap-6 mb-4 bg-white/5 p-4 rounded-lg">
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={editForm.is_published} 
                            onChange={(e) => setEditForm({...editForm, is_published: e.target.checked})}
                            className="w-5 h-5 rounded accent-brand-green"
                          />
                          <span className="font-display uppercase text-sm">Опубликован</span>
                      </label>
                    </div>

                    <div className="flex gap-4 mt-6">
                      <Button onClick={handleUpdateCourse}>Сохранить настройки курса</Button>
                    </div>
                  </div>
                  
                  <div className="bg-red-900/10 p-6 rounded-xl border border-red-500/20">
                    <h3 className="font-display font-bold text-lg mb-2 text-red-400">Опасная зона</h3>
                    <p className="text-sm text-white/60 mb-4">Удаление курса приведет к потере всех уроков, тестов и прогресса студентов. Это действие нельзя отменить.</p>
                    <Button 
                      onClick={handleDeleteCourse} 
                      className="bg-red-500 hover:bg-red-600 text-white !border-0"
                    >
                      Удалить курс
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* VIEW MODE */
            <>
              {activeLesson ? (
                isScormLesson ? (
                  <div className="h-full w-full bg-white rounded-xl overflow-hidden">
                    <iframe 
                      src={scormUrl} 
                      className="w-full h-full border-0" 
                      title="SCORM Content"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                  </div>
                ) : (
                  activeTab === 'content' ? (
                    <div className="prose prose-invert max-w-none font-sans prose-headings:font-sans prose-a:text-brand-green prose-strong:text-brand-green prose-p:text-white prose-headings:text-white prose-li:text-white [&_li::marker]:text-white [&_li::marker]:font-bold">
                      <Markdown
                        components={{
                          a: ({ href, children, ...props }: any) => {
                            if (href && href.includes('rutube.ru/video/')) {
                              const match = href.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/);
                              if (match && match[1]) {
                                return (
                                  <div className="aspect-video w-full my-6 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black relative z-20">
                                    <iframe 
                                      src={`https://rutube.ru/play/embed/${match[1]}/`} 
                                      className="w-full h-full"
                                      frameBorder="0" 
                                      allow="clipboard-write; autoplay" 
                                      allowFullScreen
                                    />
                                  </div>
                                );
                              }
                            }
                            return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                          }
                        }}
                      >
                        {activeLesson.content || ''}
                      </Markdown>
                    </div>
                  ) : (
                    <div className="h-full">
                      {currentTest ? (
                        <TestPlayer 
                          test={currentTest} 
                          onSubmit={(answers) => api.tests.submit(currentTest.id, answers)}
                        />
                      ) : (
                        <div className="text-center py-20 text-white/40">
                           <div className="text-4xl mb-4">📝</div>
                           <h3 className="font-display text-xl mb-2">Тест отсутствует</h3>
                           <p>Для этого урока еще нет теста.</p>
                        </div>
                      )}
                    </div>
                  )
                )
              ) : (
                <div className="space-y-6">
                   <div className="aspect-video relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 max-w-2xl">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                           <span className="font-display text-lg">Нет обложки</span>
                        </div>
                      )}
                   </div>
                   
                   <div className="prose prose-invert">
                      <p className="text-lg leading-relaxed">{course.description}</p>
                   </div>
                   
                   <Button onClick={() => lessons.length > 0 && setActiveLessonId(lessons[0].id)}>
                     Начать обучение
                   </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
