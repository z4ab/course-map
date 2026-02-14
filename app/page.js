'use client';

import './globals.css';
import React from 'react';
import Graph from './components/Graph';
import Panel from './components/Panel';
import CourseList from './components/CourseList';

export default function Home() {
  const [panelInfo, setPanelInfo] = React.useState("");
  const [courses, setCourses] = React.useState([]);
  
  async function addCourse(id) {
    if (!courses.includes(id)) {
      const newCourses = [...courses, id];
      setCourses(newCourses);
      console.log(newCourses);
      
      await fetch("/api/selection", {
        method: "POST",
        body: JSON.stringify({ courses: newCourses }),
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(r => {
          console.log(r);
        })
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
