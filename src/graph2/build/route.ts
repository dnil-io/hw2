export function isRelevant(route: any) {
    if (route.agency_id != 1 && route.agency_id != 796) return false;
    if (!route.route_short_name?.startsWith("U") && !route.route_short_name?.startsWith("S")) return false;
    return true;
}

export function isRelevantR() {
    return Math.random() > 0.5;
}