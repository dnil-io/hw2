import { getStops, getTransfers } from "gtfs";
import { Graph } from "ngraph.graph";
import { st } from "../../routes/stops";

export function parseStops(stops: any) {
    var nodes: any = [];
    console.error(stops.length)
    for (let stop of stops) {
        for(let i = 0; i < 32*60; i++) {
            var name = `${stop.stop_id}#${i}`;
            var data = {
                time: i
            }
            nodes.push({name: name, data: data});
        }
    }

    return nodes;
}

export async function connectStops(graph: Graph) {
    
    //tp arr/dep
    graph.forEachNode(pt => {
        if(pt.data.type.startsWith("tp#")) {            
            const stop_id = pt.data.stop_id;
            const time = pt.data.time;
            const name = `${stop_id}#${time}`;
            let node: any;
            if (!graph.hasNode(name)) {
                node = graph.addNode(name, {time: time, stop_id: stop_id, type: "stop"});
            } else {
                node = graph.getNode(name);
            }
            if(pt.data.type === "tp#arr") {
                graph.addLink(pt.id, node.id, {weight: 0});
            } else if(pt.data.type === "tp#dep") {            
                graph.addLink(node.id, pt.id, {weight: 0});
            }
        }
    });

    console.error("sorting stops");
    const stops = {};
    graph.forEachNode(n => {
        if(n.data.type === "stop") {
            if(!stops[n.data.stop_id]) {
                stops[n.data.stop_id] = [];
            } 
            stops[n.data.stop_id].push(n);
        }
    });



    console.error("transfers");
    //transfers
    let i = 0;
    let len = Object.keys(stops).length;
    for (let stop_id in stops) {
        console.error(i++ + "/" + len)
        const transfers = await getTransfers({from_stop_id: stop_id});
        for (let transfer of transfers) {
            if(transfer.from_stop_id === transfer.to_stop_id) continue;
            if(stops[transfer.to_stop_id]) {
                let parsed = Number.parseInt(transfer.min_transfer_time);
                let duration = Math.ceil((parsed ? parsed : 0)/60) * 60;
                for(let tstop of stops[stop_id]) {
                    if(tstop.data.generated) continue;
                    let arrTime = Number.parseInt(tstop.data.time) + duration;

                    let tstopto_node;
                    for(let tstop_to of stops[transfer.to_stop_id]) {
                        if(tstop_to.time === arrTime) {
                            tstopto_node = tstop_to;
                        }
                    }

                    if(!tstopto_node) {
                        tstopto_node = graph.addNode(`${transfer.to_stop_id}#${arrTime}`, {time: arrTime, stop_id: transfer.to_stop_id, type: "stop", generated: true});
                        stops[transfer.to_stop_id].push(tstopto_node);
                    }

                    graph.addLink(tstop.id, tstopto_node.id, {type: "transfer", weight: duration});
                }
            }
        }
    }


    console.error("wait times");
    //wait times
    for(let stop_id in stops) {
        let stop_parts = stops[stop_id];
        stop_parts.sort((a: any, b: any) => {
            return (a.data.time as number) - (b.data.time as number)
        });
        let len = stop_parts.length;
        for(let i = 0; i<len; i++) {
            let hasNext = (i < len-1);
            if(hasNext) {
                graph.addLink(stop_parts[i].id, stop_parts[i+1].id, {type: "wait", weight: stop_parts[i+1].data.time - stop_parts[i].data.time}); 
            }
        }
    }

    console.error("meeting spots");

    for(let stop_id in stops) {
        const id = await findMeet(stop_id);
        const name = `meet#${id}`;
        var meet;
        if(graph.hasNode(name)) {
            meet = graph.getNode(name);
        } else {
            meet = graph.addNode(name, {type:"meet", stop_id: id});
        }
        stops[stop_id].forEach(n => {
            graph.addLink(n.id, meet.id, {type: "end", weight: 0});
        });
    }
}

var stops;

async function findMeet(stop_id: string) {
    if(!stops) stops = await getStops();
    const start = stops.find(s => s.stop_id === stop_id);
    if(start.location_type === 1) return start.stop_id;
    if(start.parent_station) return start.parent_station;
    const guess = stops.find(s => s.stop_name === start.stop_name && s.location_type === 1);
    if(guess) return guess.stop_id;
    return stop_id;
}