import './App.css';
import React from 'react';
import Graph from './components/Graph';
import Panel from './components/Panel';
import CourseList from './components/CourseList';

const SERVER_URL = "http://127.0.0.1:3030";

export default function App() {
  const [panelInfo, setPanelInfo] = React.useState("");
  const [courses, setCourses] = React.useState([]);
  async function addCourse(id) {
    if (!courses.includes(id)) setCourses([...courses, id]);
    console.log(courses);
    await fetch(SERVER_URL + "/selection", {
      method: "POST",
      body: JSON.stringify(courses),
      mode: "cors",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(r => {
        console.log(r);
      })
  }
  return (
    <div>
      <Graph width={1920 * 2} height={1080 * 2} setPanelInfo={setPanelInfo}></Graph>
      <Panel panelInfo={panelInfo} addCourse={addCourse}></Panel>
      <CourseList courses={courses}></CourseList>
    </div>
  );
}