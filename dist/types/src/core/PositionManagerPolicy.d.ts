import GeoPosition, { type AccuracyQuality, type GeoCoords, type GeoPositionInput } from './GeoPosition.js';
export interface PositionManagerError {
    name: string;
    message: string;
}
export interface ValidPositionInput extends GeoPositionInput {
    timestamp: number;
    coords: GeoCoords & {
        latitude: number;
        longitude: number;
    };
}
export interface PositionInputValidationResult {
    position: ValidPositionInput | null;
    error: PositionManagerError | null;
}
export interface DistanceTimeGateResult {
    accepted: boolean;
    bypassed: boolean;
    distance: number | null;
    timeElapsed: number;
    distanceExceeded: boolean | null;
    timeExceeded: boolean | null;
    error: PositionManagerError | null;
}
export interface PositionEventClassification {
    immediate: boolean;
    timeElapsed: number;
    error: PositionManagerError | null;
}
export declare function validatePositionInput(position: GeoPositionInput | null | undefined): PositionInputValidationResult;
export declare function getRejectedAccuracyError(position: ValidPositionInput, notAcceptedAccuracy: AccuracyQuality[] | null): PositionManagerError | null;
export declare function evaluateDistanceTimeGate({ lastPosition, position, lastModified, minimumDistanceChange, minimumTimeChange, bypassDistanceRule, calculateDistance, }: {
    lastPosition: GeoPosition | null;
    position: ValidPositionInput;
    lastModified: number | null;
    minimumDistanceChange: number;
    minimumTimeChange: number;
    bypassDistanceRule: boolean;
    calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
}): DistanceTimeGateResult;
export declare function classifyPositionEvent(timestamp: number, lastModified: number | null, trackingInterval: number): PositionEventClassification;
