import { Graph } from 'redis';

export interface Node {
    name: string;
    data?: any;
}

export interface Link {
    from: string;
    to: string;
    data?: any;
}

export function addAllNodes(nodes: Node[], graph: Graph) {
    for(let node of nodes) {
        graph.query(`CREATE (${{name: node.name, ...node.data}.json()})`);
    }
}

export function addAllLinks(links: Link[], graph: Graph) {
    for(let link of links) {
        graph.query(`MATCH (a), (b) WHERE a.name = '${link.from}' AND b.name = '${link.to}' CREATE (a)-[r ${link.data.json()}]->(b)`, );
    }
}

export function addAll(all: {nodes: Node[], links: Link[]}, graph: Graph) {
    addAllNodes(all.nodes, graph);
    addAllLinks(all.links, graph);
}