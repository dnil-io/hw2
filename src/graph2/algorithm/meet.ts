import { getStops } from "gtfs";
import { Graph, Node, NodeId } from "ngraph.graph";

export function findMeetingSpots(graph: Graph, startStop: string, startTime: number, weight: number): Set<string> {
    console.error("find starting point");
    let startNode: Node<any> | undefined;
    graph.forEachNode(n => {
        console.log(n);
        return;
        if(n.data.type === "stop" && n.data.stop_id === startStop && n.data.time >= startTime) {
            if(!(startNode?.data.time <= n.data.time)) {
                startNode = n;
            }
        }
    });
    console.log(startNode?.data.time)
    if(!startNode || !startNode.links) return new Set<any>();
    console.error("looking for meet");
    return new Set(examine(graph, startNode, weight, []));
}

function examine(graph: Graph, node: Node<any>, weight: number, alreadyVisited: NodeId[]): any[] {
    if(weight <= 0) return [];
    if(alreadyVisited.includes(node.id)) return [];
    alreadyVisited.push(node.id);
    if(node.data.type === "meet") {
        return [node.id];
    }
    if(!node.links) return [];
    let nodeData: any[] = [];
    for(let link of node.links) {
        const toNode = graph.getNode(link.toId);
        if(link.fromId !== node.id || !toNode) continue;
        nodeData.push(...examine(graph, toNode, weight-Math.max(1, link.data.weight), alreadyVisited));
    }
    return nodeData;
}

export async function printMeetingSpots(graph: Graph, spots: Set<any>) {
    for(let spot of spots) {
        console.error((await getStops({stop_id: graph.getNode(spot)?.data.stop_id}))[0].stop_name)
    }

}