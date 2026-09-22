
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Course } from '../types';
import { useAuth } from '../context/AuthContext';

export const CourseList = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        let data;
        if (user?.role === 'author') {
           data = await api.courses.myCourses();
        } else {
           data = await api.courses.list('published_only=true');
        }
        setCourses(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
  }, [user]);

  return (
    <div>
      <div className="flex justify-between items-center mb-12">
         {/* Title with purple background tag style */}
         <h1 className="text-5xl font-display font-bold text-white">
            <span className="bg-brand-purple px-6 py-2">Курсы</span>
         </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {courses.map((course) => (
          <Link 
            to={`/course/${course.id}`} 
            key={course.id} 
            className="group relative block aspect-[16/10] rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-brand-purple/20 hover:-translate-y-2"
          >
             {/* Card Background / Preview */}
             {/* Gradient matches the screenshot: Purple (#746db2) to Green (#b8cf69) */}
             <div className={`w-full h-full absolute inset-0 transition-transform duration-700 group-hover:scale-110 ${
               !course.thumbnail_url 
                 ? 'bg-gradient-to-b from-[#746db2] to-[#b8cf69]' 
                 : 'bg-black'
             }`}>
                {course.thumbnail_url && (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title} 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                  />
                )}
             </div>

             {/* Course Name Label */}
             {/* Styled to match screenshot: Light gray box, black text, on bottom line */}
             <div className="absolute bottom-2 left-0 right-0 flex justify-center px-4 z-10">
                <div className="bg-[#e5e5e5] text-black px-6 py-1 font-bold font-sans text-sm truncate max-w-full text-center">
                  {course.title}
                </div>
             </div>
          </Link>
        ))}
        
        {courses.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border-2 border-dashed border-white/10">
            <p className="text-xl font-display text-white/50">Курсы не найдены.</p>
          </div>
        )}
      </div>
    </div>
  );
};
