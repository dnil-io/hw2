import {FastifyReply, FastifyRequest} from "fastify";
import {getRoutes, getStops, getStoptimes, getTransfers, getTrips} from "gtfs";

import createGraph from "ngraph.graph";
import * as toGexf from "ngraph.gexf";
import {Graph} from "ngraph.graph";
import * as ngraphPath from "ngraph.path";
import { findMostCommonTrip, isDuringDaytime, parseTime } from "../utils/gtfs.js";

let graph: Graph;

const setup = async () => {
    if (graph === undefined) {
        graph = createGraph({multigraph: false});
        const routes = (await getRoutes());
        const stops = (await getStops(undefined, ["stop_id", "stop_name", "stop_lon", "stop_lat"], undefined, undefined));

        for (let route of routes) {
            if (!route.route_short_name?.startsWith("U") && !route.route_short_name?.startsWith("S")) continue;
            if (await (isDuringDaytime(route.route_id)) === false) continue;
            const tripId = await findMostCommonTrip(route.route_id);
            if (tripId === undefined) continue;
            let stopTimes = (await getStoptimes({trip_id: tripId}));

            stopTimes = stopTimes.sort((a: any, b: any) => {
                return (a.stop_sequence as number) - (b.stop_sequence as number)
            });

            let last: any;

            stopTimes.forEach(c => {
                let stop = stops.find(x => x.stop_id == c.stop_id);

                graph.addNode(tripId + "|" + c.stop_id, {
                    name: route.route_short_name,
                    stop_id: c.stop_id,
                    label: stop?.stop_name,
                    lat: parseFloat(stop?.stop_lat),
                    lng: parseFloat(stop?.stop_lon)
                });


                if (last !== undefined) {
                    //weight:                
                    let timeA = parseTime(last.arrival_time);
                    let timeB = parseTime(c.arrival_time);
                    let duration = timeB.getTime() - timeA.getTime(); // 11:14 11:16
                    duration = duration / 60000; //convert to minutes
                    duration = Math.max(1, duration);
                    graph.addLink(tripId + "|" + last.stop_id, tripId + "|" + c.stop_id, {label: duration, weight: duration});
                }
                last = c;
            });
        }


        //add transfers
        const transfers = (await getTransfers());

        graph.forEachNode(node => {
            let nodeStop = node.data.stop_id;
            for (let transfer of transfers) {
                if (transfer.from_stop_id === nodeStop) {
                    graph.forEachNode(node_b => {
                        if (node_b.data.stop_id === transfer.to_stop_id && node.id !== node_b.id) {
                            let weight = (transfer.min_transfer_time / 60) + 15;
                            graph.addLink(node.id, node_b.id, {art: "transfer", label: weight, weight: weight });
                        }
                    });
                }
            }
        });
    }
    return graph;

}

const calculateDebug = async (req: FastifyRequest, res: FastifyReply) => {
    return toGexf.save(await setup());
};

const calculate = async (req: FastifyRequest, res: FastifyReply) => {
    const {from, to} = (req.params as any);

    const graph = await setup();


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

    return path;
};

export {calculate, calculateDebug};
