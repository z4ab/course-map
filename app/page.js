'use client';

import './globals.css';
import React from 'react';
import Graph from './components/Graph';
import Panel from './components/Panel';
import CourseList from './components/CourseList';

export default function Home() {
  const [panelInfo, setPanelInfo] = React.useState("");
  const [courses, setCourses] = React.useState([]);

  // Load courses from localStorage on mount
  React.useEffect(() => {
    const savedCourses = localStorage.getItem('selectedCourses');
    if (savedCourses) {
      try {
        setCourses(JSON.parse(savedCourses));
      } catch (error) {
        console.error('Error loading courses from localStorage:', error);
      }
    }
  }, []);

  function addCourse(id) {
    if (!courses.includes(id)) {
      const newCourses = [...courses, id];
      setCourses(newCourses);
      console.log(newCourses);

      // Save to localStorage
      localStorage.setItem('selectedCourses', JSON.stringify(newCourses));
    }
  }
  
  return (
    <div>
      <Graph width={1920 * 2} height={1080 * 2} setPanelInfo={setPanelInfo}></Graph>
      <Panel panelInfo={panelInfo} addCourse={addCourse}></Panel>
      <CourseList courses={courses}></CourseList>
    </div>
  );
}
