import {getStoptimes, getTrips} from "gtfs";
import {Graph} from "ngraph.graph";

export async function findMostCommonTrip(routeId: string): Promise<string | undefined> {
    const trips = (await getTrips({route_id: routeId}));
    let shapeIds: { [key: string]: number } = {};
    for (let currentTrip of trips) {
        if (shapeIds[currentTrip.shape_id]) {
            shapeIds[currentTrip.shape_id] += 1;
        } else {
            shapeIds[currentTrip.shape_id] = 1
        }
    }

    let mostUsesOfShapeId = 0;
    let mostUsedShapeId: string | undefined;

    for(let key of Object.keys(shapeIds)) {
        let usesOfCurrentShapeId = shapeIds[key];
        if(usesOfCurrentShapeId > mostUsesOfShapeId){
            mostUsesOfShapeId = usesOfCurrentShapeId;
            mostUsedShapeId = key;
        }
    }

    let mostUsedTrip = trips.filter(obj => obj.shape_id === mostUsedShapeId).at(0); 

    return (mostUsedTrip?.trip_id as string | undefined);
}


export async function isDuringDaytime(routeId: string): Promise<boolean> { 
    const trips = (await getTrips({route_id: routeId}));
    
    let numberOfTripsDuringDay=0;
    for(let trip of trips) {
        const currentStops = (await getStoptimes({trip_id: trip.trip_id}));
        const singleStop = currentStops.at(0);
        if(!singleStop) continue;
        let departureTime = parseTime(singleStop?.departure_time);
        let departureHours = departureTime.getHours();

        if (departureHours>=8 && departureHours <=18){
            numberOfTripsDuringDay++;
            if(numberOfTripsDuringDay >= 2) {
                return true;
            }
        }
    }

    return false;
}

export function parseTime(inputTime: string): Date {

    let times = inputTime.split(":");
    return new Date(1, 1, 1, Number.parseInt(times[0]), Number.parseInt(times[1]));
}

export function findMiddleStop(path, graph: Graph) {
    let middleStop;
    let middleStopIndex;
    let dif;

    for (let i = 0; i < path.length; i++) {
        let difA = weight(0, i, graph, path);
        let difB = weight(i, path.length-1, graph, path);
        let currentDif: number = Math.abs(difA - difB);
        if (dif === undefined || currentDif < dif) {
            dif = currentDif;
            middleStop = path[i];
            middleStopIndex = i;
            console.log(currentDif + " "+ dif);
        }
    }

    let linkArray = links(graph,path);

    return {
        middleStop: middleStop,
        indexOfMiddleStop: middleStopIndex,
        path: path,
        duration:  weight(0, path.length -1 , graph, path),
        dif: dif,
        links: linkArray,
    };
}

export function weight(indexA: number, indexB: number, graph: Graph, guide) {
    if(indexA === indexB) return 0;
    let weight = 0;

    for (let i = indexA; i < indexB - 1; i++) {
        let linkA = graph.getLink(guide[i].id, guide[i + 1].id);
        let linkB = graph.getLink(guide[i + 1].id, guide[i].id);

        let link = linkA ? linkA : linkB;
        if(!link) {
            break;
        }
        if((i === 0 || i === guide.length - 2) && link.data.art === "transfer") {
            weight += 0;
        } else {
            weight += link.data.weight;
        }
    }
    return weight;
}

export function links(graph: Graph, guide) {
    let result: any = [];
    for (let i = 0; i < guide.length-1; i++) {
        let linkA = graph.getLink(guide[i].id, guide[i + 1].id);
        let linkB = graph.getLink(guide[i + 1].id, guide[i].id);
        let link;
        if(linkA) link = linkA;
        if(linkB) link = linkB;

        if((i === 0 || i === guide.length - 2) && link.data.art === "transfer") {
        } else {
            result.push(link);
        }
    }
    return result;
}