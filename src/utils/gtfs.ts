import { Console } from "console";
import {getStops, getStoptimes, getTrips} from "gtfs";

export async function findMostCommonTrip(routeId: string): Promise<string | undefined> {
    const trips = (await getTrips({route_id: routeId}));
    let shapeIds: {[key: string]: number} = {};
    for (let currentTrip of trips){
        if(shapeIds[currentTrip.shape_id]) {
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
    let inputAsDate = new Date(1,1,1, Number.parseInt(times[0]), Number.parseInt(times[1]));
    return inputAsDate;
}