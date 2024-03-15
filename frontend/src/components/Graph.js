import React from 'react';
import * as d3 from 'd3';

const RADIUS = 30;
const data = {
    nodes: [
        { id: "CS145", group: 1 },
        { id: "CS146", group: 1 },
        { id: "CS240", group: 1 },
        { id: "CS241", group: 1 },
        { id: "CS245", group: 1 },
        { id: "CS246", group: 1 },
        { id: "CS350", group: 1 },
        { id: "CS346", group: 1 },
    ],
    links: [
        { source: "CS145", target: "CS146" },
        { source: "CS146", target: "CS245" },
        { source: "CS146", target: "CS246" },
        { source: 'CS245', target: 'CS240' },
        { source: 'CS246', target: 'CS241' },
        { source: 'CS246', target: 'CS350' },
        { source: 'CS246', target: 'CS346' },
    ]
}

export default function Graph(props) {
    const {
        width,
        height,
    } = props;

    React.useEffect(() => {
        // Create the SVG container.
        var svg = d3.select("#svgdiv")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        // Initialize the links
        var link = svg
            .selectAll("line")
            .data(data.links)
            .enter()
            .append("line")
            .style("stroke", "#aaa")

        // Initialize the nodes
        var node = svg
            .selectAll("circle")
            .data(data.nodes)
            .enter()
            .append("circle")
            .attr("r", RADIUS)
            .style("fill", "cyan");

        var nodetext = svg
            .selectAll("text")
            .data(data.nodes)
            .enter()
            .append("text")
            .text((d) => d.id)
            .style("fill", "white");

        // Let's list the force we wanna apply on the network
        var simulation = d3.forceSimulation(data.nodes)                 // Force algorithm is applied to data.nodes
            .force("link", d3.forceLink()                               // This force provides links between nodes
                .id(function (d) { return d.id; })                     // This provide  the id of a node
                .links(data.links)                                    // and this the list of links
            )
            .force("charge", d3.forceManyBody().strength(-4000))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
            .force("center", d3.forceCenter(width / 2, height / 2))     // This force attracts nodes to the center of the svg area
            .on("end", ticked);

        // This function is run at each iteration of the force algorithm, updating the nodes position.
        function ticked() {
            link
                .attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            node
                .attr("cx", function (d) { return d.x + 6; })
                .attr("cy", function (d) { return d.y - 6; });
            nodetext
                .attr("x", function (d) { return d.x - 12; })
                .attr("y", function (d) { return d.y; });
        }
    }, []);

    return (
        <div id="svgdiv">
        </div>
    )
}