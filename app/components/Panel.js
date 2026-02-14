'use client';

import React from 'react';

export default function Panel({panelInfo, addCourse}) {
    var {
        description,
        id,
        subject,
        title,
    } = panelInfo;
    function onAdd() {
        addCourse(id);
    }
    return (
        <div id="infoPanel">
            <h1>{title}</h1>
            <h1 style={{fontSize:24}}>{id}</h1>
            <p>{description}</p>
            <button onClick={onAdd}>Add</button>
        </div>
    )
}
