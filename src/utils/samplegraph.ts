import createGraph, { Graph } from "ngraph.graph";


export function buildBetterGraph(): Graph {
    const graph = createGraph();

    graph.addNode("H", {label: "MEET AT HERMANNSTR"});

    //S41
    graph.addNode("1", {label: "Arrival Tempelhof. - 00:01"});
    graph.addNode("2", {label: "Departure Tempelhof. - 00:02"});
    graph.addNode("3", {label: "Arrival Hermannstr. - 00:04"});
    graph.addNode("4", {label: "Departure Hermannstr. - 00:05"});
    graph.addLink("1", "2");
    graph.addLink("2", "3");
    graph.addLink("3", "4");
    graph.addLink("3", "H");


    //U8
    graph.addNode("U1", {label: "Arrival Leinestr. - 00:01"});
    graph.addNode("U2", {label: "Departure Leinestr. - 00:02"});
    graph.addNode("U3", {label: "Arrival Hermannstr. - 00:04"});
    graph.addNode("U4", {label: "Departure Hermannstr. - 00:05"});
    graph.addLink("U1", "U2");
    graph.addLink("U2", "U3");
    graph.addLink("U3", "U4");
    graph.addLink("U3", "H");

    return graph;
}

export function formatGraph(graph: Graph): Graph {
    graph.forEachNode(n => {
        //n.data.pos = `${n.data.lng*10000},${n.data.lat*10000}!`
        n.data.tooltip = `${n.data.label}\n${n.data.name}`;
        //n.data.label = "";
        n.data.shape = "rectangle";
        n.data.width = "0.25";
        n.data.height = "0.25";
        n.data.ordering = "in";
    });
    return graph;
}