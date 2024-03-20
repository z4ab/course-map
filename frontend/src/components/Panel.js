import "../App.css";
import React from 'react';

export default function Panel({panelInfo}) {
    var {
        description,
        id,
        subject,
        title,
    } = panelInfo;
    return (
        <div id="infoPanel">
            <h1>{title}</h1>
            <h1 style={{fontSize:24}}>{id}</h1>
            <p>{description}</p>
        </div>
    )
}