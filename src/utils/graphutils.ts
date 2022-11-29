import { Graph } from 'redis';
import JSON5 from 'json5'

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
        graph.query(`CREATE (n ${JSON5.stringify({name: node.name, ...node.data})})`);
    }
}

export function addAllLinks(links: Link[], graph: Graph) {
    for(let link of links) {
        graph.query(`MATCH (a), (b) WHERE a.name = '${link.from}' AND b.name = '${link.to}' CREATE (a)-[r:l ${JSON5.stringify(link.data)}]->(b)`);
    }
}

export async function addWithLink(a: Node, b: Node, linkData, graph: Graph) {
    await graph.query(`CREATE (n ${JSON5.stringify({name: a.name, ...a.data})})-[r:l ${JSON5.stringify(linkData)}]-> (m ${JSON5.stringify({name: b.name, ...b.data})})`);
}

export function addAll(all: {nodes: Node[], links: Link[]}, graph: Graph) {
    addAllNodes(all.nodes, graph);
    addAllLinks(all.links, graph);
}