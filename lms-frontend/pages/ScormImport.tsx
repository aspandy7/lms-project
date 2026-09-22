
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';

export const ScormImport = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !id) return;
    setUploading(true);
    try {
      await api.scorm.import(parseInt(id), file);
      alert('SCORM пакет успешно импортирован!');
      navigate(`/course/${id}`);
    } catch (err) {
      console.error(err);
      alert('Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-3xl font-display font-bold mb-8">Импорт контента курса</h1>
      
      <div className="bg-white/10 backdrop-blur-md p-10 rounded-3xl border-2 border-dashed border-white/20 hover:border-brand-green transition-colors">
        <div className="mb-8">
           <svg className="w-16 h-16 mx-auto text-brand-cyan mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
           </svg>
           <h3 className="font-display text-xl mb-2">Перетащите или выберите файл</h3>
           <p className="text-white/60">Поддерживаются пакеты SCORM 1.2 или 2004 (.zip)</p>
        </div>

        <input 
          type="file" 
          accept=".zip" 
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-brand-purple file:text-white
            hover:file:bg-brand-cyan
          "
        />

        {file && (
          <div className="mt-8">
             <Button onClick={handleUpload} disabled={uploading}>
               {uploading ? 'Загрузка...' : 'Импортировать пакет'}
             </Button>
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <Button variant="outline" onClick={() => navigate(`/course/${id}`)}>
          Пропустить импорт
        </Button>
      </div>
    </div>
  );
};
