import "../App.css";
import React from 'react';

export default function CourseList({courses}) {
    return (
        <ul id="courseList">
            { courses.map(id => <li key={id}>{id}</li>) }
        </ul>
    )
}