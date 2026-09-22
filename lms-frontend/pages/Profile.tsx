
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Profile = () => {
  const { user, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        email: user.email,
        username: user.username
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.users.update(user.id, formData);
      await refreshProfile();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Не удалось обновить профиль');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 rounded-full border-4 border-brand-green flex items-center justify-center bg-brand-blue/50 text-4xl font-display font-bold">
          {user.full_name.charAt(0)}
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-white">{user.full_name}</h1>
          <p className="text-brand-green font-sans uppercase tracking-widest text-sm">{user.role}</p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold">Личные данные</h2>
          {!isEditing && (
             <button onClick={() => setIsEditing(true)} className="text-brand-cyan hover:text-brand-green transition-colors font-display text-sm uppercase">
               Редактировать
             </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="Полное имя"
            value={formData.full_name}
            disabled={!isEditing}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            className={!isEditing ? "bg-transparent text-white border border-white/20" : ""}
          />
          <Input
            label="Email"
            value={formData.email}
            disabled={!isEditing}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className={!isEditing ? "bg-transparent text-white border border-white/20" : ""}
          />
          <Input
            label="Имя пользователя"
            value={formData.username}
            disabled={!isEditing}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            className={!isEditing ? "bg-transparent text-white border border-white/20" : ""}
          />

          {isEditing && (
            <div className="flex gap-4 mt-6">
              <Button type="submit">Сохранить</Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Отмена</Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
