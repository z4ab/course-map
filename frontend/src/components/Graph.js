import React from 'react';
import * as d3 from 'd3';

const RADIUS = 10;
const data = {
    nodes: [
        { id: "CS145", group: 1 },
        { id: "CS146", group: 1 },
        { id: "CS246", group: 1 },
    ],
    links: [
        { source: "CS145", target: "CS146" },
        { source: "CS146", target: "CS246" },
    ]
}

const drawNetwork = (context, width, height, nodes, links,) => {
    context.clearRect(0, 0, width, height);

    // Draw the links first
    links.forEach((link) => {
        context.beginPath();
        context.moveTo(link.source.x, link.source.y);
        context.lineTo(link.target.x, link.target.y);
        context.stroke();
    });

    // Draw the nodes
    nodes.forEach((node) => {
        context.beginPath();
        context.moveTo(node.x + RADIUS, node.y);
        context.arc(node.x, node.y, RADIUS, 0, 2 * Math.PI);
        context.fillStyle = '#cb1dd1';
        context.fill();
    });
};

export default function Graph(props) {
    const {
        width,
        height,
    } = props;
    const canvasRef = React.useRef(null);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        d3.forceSimulation(data.nodes) // apply the simulation to our array of nodes
            // Force #1: links between nodes
            .force('link', d3.forceLink(data.links).id((d) => d.id))
            // Force #2: avoid node overlaps
            .force('collide', d3.forceCollide().radius(RADIUS))
            // Force #3: attraction or repulsion between nodes
            .force('charge', d3.forceManyBody())
            // Force #4: nodes are attracted by the center of the chart area
            .force('center', d3.forceCenter(width / 2, height / 2))

            .on('tick', () => {
                drawNetwork(context, width, height, data.nodes, data.links);
            });
    }, [width, height, data])

    return (
        <div>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
            />
        </div>
    )
}