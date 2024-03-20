import './App.css';
import React from 'react';
import Graph from './components/Graph';
import Panel from './components/Panel';

export default function App() {
  const [panelInfo, setPanelInfo] = React.useState("");
  console.log(panelInfo)
  return (
    <div>
      <Graph width={1920 * 2} height={1080 * 2} setPanelInfo={setPanelInfo}></Graph>
      <Panel panelInfo={panelInfo}></Panel>
    </div>
  );
}