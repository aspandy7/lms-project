
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      const data = await api.auth.login(formData);
      await login(data.access_token);
      navigate('/');
    } catch (err: any) {
      setError('Неверные учетные данные');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold uppercase mb-2 bg-brand-green text-transparent bg-clip-text inline-block">
          С возвращением
        </h1>
        <p className="text-white/70 font-sans">Войдите, чтобы продолжить обучение</p>
      </div>

      <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <Input
            label="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Введите имя пользователя"
          />
          <Input
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
          />
          
          {error && <p className="text-red-400 mb-4 text-center">{error}</p>}

          <Button className="w-full mt-4">
            Войти
          </Button>
        </form>

        <div className="mt-6 text-center text-sm font-sans">
          <span className="text-white/60">Нет аккаунта? </span>
          <Link to="/register" className="text-brand-green font-bold hover:underline">
            Зарегистрируйтесь
          </Link>
        </div>
      </div>
    </div>
  );
};
