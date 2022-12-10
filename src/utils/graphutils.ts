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

export async function addWithLink(a: Node, b: Node, linkData, graph: Graph) {
    await graph.query(`CREATE (n:${ a.name + " " + JSON5.stringify({...a.data})})-[r:c ${JSON5.stringify(linkData)}]-> (m:${ b.name + " " + JSON5.stringify({...b.data})})`);
}