import React from "react";
import * as d3 from "d3";

const RADIUS = 30;

var data = {
    nodes: [],
    links: [],
};

const SERVER_URL = "http://127.0.0.1:3030";

async function getCourseData() {
    await fetch(SERVER_URL + "/coursedata", {
        method: "GET",
        mode: "cors",
    })
        .then((response) => response.json())
        .then((obj) => {
            data.nodes = obj.courses;
            obj.relationships.forEach((element) => {
                data.links.push({
                    source: element.from,
                    target: element.to,
                });
            });
        });
    console.log(data);
}

var transform;
async function renderNodes(width, height, setPanelInfo) {
    // Create the SVG container.
    var svg = d3
        .select("#svgdiv")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;")
        .call(
            d3
                .zoom()
                .on("zoom", (e) => {
                    node.attr("transform", (transform = e.transform));
                    //node.style("stroke-width", RADIUS / Math.sqrt(transform.k));
                    link.attr("transform", (transform = e.transform));
                    nodetext.attr("transform", (transform = e.transform));
                    node.attr("r", RADIUS / Math.sqrt(transform.k));
                    nodetext
                        .attr("x", function (d) {
                            return d.x - 40 + 9 * Math.sqrt(transform.k);
                        })
                        .attr("y", function (d) {
                            return d.y + 8 - Math.sqrt(transform.k) / 2;
                        });
                    nodetext.attr("font-size", RADIUS / Math.sqrt(transform.k));
                })
                .scaleExtent([1, 5])
        );

    // Initialize the links
    var link = svg
        .selectAll("line")
        .data(data.links)
        .enter()
        .append("line")
        .style("stroke", "#aaa");

    // Initialize the nodes
    var node = svg
        .selectAll("circle")
        .data(data.nodes)
        .enter()
        .append("circle")
        .attr("r", RADIUS)
        .style("fill", "#bbceed")
        .on("click", (e) => {
            let courseData = e.srcElement.__data__;
            setPanelInfo(courseData);
        });

    var nodetext = svg
        .selectAll("text")
        .data(data.nodes)
        .enter()
        .append("text")
        .text((d) => d.id)
        .attr("font-size", RADIUS)
        .style("fill", "black");

    // Let's list the force we wanna apply on the network
    console.log(data.links);
    var simulation = d3
        .forceSimulation(data.nodes) // Force algorithm is applied to data.nodes
        .force(
            "link",
            d3
                .forceLink() // This force provides links between nodes
                .id(function (d) {
                    return d.id;
                }) // This provide  the id of a node
                .links(data.links) // and this the list of links
        )
        .force("charge", d3.forceManyBody().strength(-1000)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength
        .force("center", d3.forceCenter(width / 2, height / 2)) // This force attracts nodes to the center of the svg area
        .on("end", ticked);

    // This function is run at each iteration of the force algorithm, updating the nodes position.
    function ticked() {
        link.attr("x1", function (d) {
            return d.source.x;
        })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            });

        node.attr("cx", function (d) {
            return d.x;
        }).attr("cy", function (d) {
            return d.y;
        });
        nodetext
            .attr("x", function (d) {
                return d.x - 40;
            })
            .attr("y", function (d) {
                return d.y + 8;
            });
    }
}

export default function Graph({ width, height, setPanelInfo }) {
    React.useEffect(() => {
        getCourseData().then(() => renderNodes(width, height, setPanelInfo));
    }, []);

    return <div id="svgdiv"></div>;
}
