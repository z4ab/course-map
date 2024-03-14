import './App.css';
import Graph from './components/Graph';

/*
const data = {
    nodes: [
        { id: "CS145", group: 1},
        { id: "CS146", group: 1},
        { id: "CS246", group: 1},
    ],
    links: [
        { source: "CS145", target: "CS146" },
        { source: "CS146", target: "CS246" },
    ]
}
*/

export default function App() {
    return (
      <div>
        <Graph width={800} height={600}></Graph>
      </div>
    );
}