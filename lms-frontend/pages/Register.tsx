
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.auth.register(formData);
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="text-center mb-10">
         <h1 className="font-display text-4xl font-bold uppercase mb-2 bg-brand-green text-transparent bg-clip-text inline-block">
          Присоединиться
        </h1>
        <p className="text-white/70 font-sans">Создайте аккаунт, чтобы начать обучение</p>
      </div>

      <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <Input
            label="Полное имя"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            placeholder="Иван Иванов"
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="ivan@example.com"
          />
          <Input
            label="Имя пользователя"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            placeholder="ivanivanov"
          />
          <Input
            label="Пароль"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="Придумайте пароль"
          />

          <div className="mb-6">
            <label className="block text-white mb-2 font-display uppercase tracking-wider text-sm">Я</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="role" 
                  value="student" 
                  checked={formData.role === 'student'} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="accent-brand-cyan"
                />
                Студент
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="role" 
                  value="author" 
                  checked={formData.role === 'author'} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="accent-brand-cyan"
                />
                Автор
              </label>
            </div>
          </div>
          
          {error && <p className="text-red-400 mb-4 text-center">{error}</p>}

          <Button className="w-full">
            Зарегистрироваться
          </Button>
        </form>

        <div className="mt-6 text-center text-sm font-sans">
          <span className="text-white/60">Уже есть аккаунт? </span>
          <Link to="/login" className="text-brand-green font-bold hover:underline">
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
};
