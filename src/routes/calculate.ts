import {FastifyReply, FastifyRequest} from "fastify";

import * as toGexf from "ngraph.gexf";
import * as ngraphPath from "ngraph.path";
import { getGraph } from "../utils/graph.js";
import {findMiddleStop } from "../utils/gtfs.js";

const calculateDebug = async (req: FastifyRequest, res: FastifyReply) => {
    return toGexf.save(getGraph());
};

const calculate = async (req: FastifyRequest, res: FastifyReply) => {
    const {from, to } = (req.params as any);

    const graph =  getGraph();


    let fromNode, toNode;

    graph.forEachNode(node => {
            if (node.data.stop_id === from)
                fromNode = node;
            else if (node.data.stop_id === to)
                toNode = node;
        });

        
    const pathFinder = ngraphPath.aStar(graph, {
        distance(a, b, link) {
            if((fromNode === a || toNode === a || fromNode === b || toNode === b) && link.data.art === "transfer") {
                console.log("replaced start or end destination");
                return 0;
            }
            return link.data.weight;
        },
        oriented: false
    });

    const path = pathFinder.find(fromNode.id, toNode.id);

    return findMiddleStop(path, graph);
};

export {calculate, calculateDebug};
