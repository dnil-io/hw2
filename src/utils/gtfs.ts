import {getTrips} from "gtfs";

export async function findMostCommonTrip(routeId: string): Promise<string | undefined> {
    const trips = (await getTrips({route_id: routeId}));
    let shapeIds: {[key: string]: number} = {};
    for (let i = trips.length; i >=0;i--){
        let currentTrip = trips[i];

        if(shapeIds[currentTrip.block_id]) {
            shapeIds[currentTrip.block_id] += 1;
        } else {
            shapeIds[currentTrip.block_id] = 1
        }
    }

    let mostUsesOfShapeId = 0;
    let mostUsedBlockId: string | undefined;

    for(let key in Object.keys(shapeIds)) {
        let usesOfCurrentBlockId = shapeIds[key];
        if(usesOfCurrentBlockId > mostUsesOfShapeId){
            mostUsesOfShapeId = usesOfCurrentBlockId;
            mostUsedBlockId = key;
        }
    }

    return mostUsedBlockId;
}
