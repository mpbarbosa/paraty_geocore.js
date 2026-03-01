"use strict";
/**
 * paraty_geocore.js — Core JavaScript classes for geolocation applications.
 *
 * @module paraty_geocore
 * @since 0.9.2-alpha
 * @author Marcelo Pereira Barbosa
 * @license MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = exports.EARTH_RADIUS_METERS = exports.calculateDistance = exports.GeoPositionError = exports.GeocodingState = exports.ObserverSubject = exports.GeoPosition = void 0;
var GeoPosition_js_1 = require("./core/GeoPosition.js");
Object.defineProperty(exports, "GeoPosition", { enumerable: true, get: function () { return __importDefault(GeoPosition_js_1).default; } });
var ObserverSubject_js_1 = require("./core/ObserverSubject.js");
Object.defineProperty(exports, "ObserverSubject", { enumerable: true, get: function () { return __importDefault(ObserverSubject_js_1).default; } });
var GeocodingState_js_1 = require("./core/GeocodingState.js");
Object.defineProperty(exports, "GeocodingState", { enumerable: true, get: function () { return __importDefault(GeocodingState_js_1).default; } });
var errors_js_1 = require("./core/errors.js");
Object.defineProperty(exports, "GeoPositionError", { enumerable: true, get: function () { return errors_js_1.GeoPositionError; } });
var distance_js_1 = require("./utils/distance.js");
Object.defineProperty(exports, "calculateDistance", { enumerable: true, get: function () { return distance_js_1.calculateDistance; } });
Object.defineProperty(exports, "EARTH_RADIUS_METERS", { enumerable: true, get: function () { return distance_js_1.EARTH_RADIUS_METERS; } });
var async_js_1 = require("./utils/async.js");
Object.defineProperty(exports, "delay", { enumerable: true, get: function () { return async_js_1.delay; } });
