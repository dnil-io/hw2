import {FastifyReply, FastifyRequest} from "fastify";
import {getStops} from "gtfs";
import { getGraph } from "../utils/graph.js";


const stops = async (req: FastifyRequest, res: FastifyReply) => {
    const stops = (await getStops(undefined, ["stop_id", "stop_name", "stop_lon", "stop_lat"], undefined, undefined));

    let nodes: {
        stop_name: string | undefined;
        stop_id: string;
    }[] = [];

    getGraph().forEachNode(node => {
        if(!nodes.some(el => el.stop_id === node.data.stop_id)) {
            nodes.push({stop_id: node.data.stop_id as string, stop_name: undefined});
        }
    });

    for(let node of nodes) {
        let stop = stops.find(el => el.stop_id === node.stop_id);
        node.stop_name = stop?.stop_name;
    }

    return nodes;
};

export { stops as st };
