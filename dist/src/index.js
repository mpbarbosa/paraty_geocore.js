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
exports.VALID_REF_PLACE_CLASSES = exports.NO_REFERENCE_PLACE = exports.ReferencePlace = exports.warn = exports.log = exports.initializeConfig = exports.createPositionManagerConfig = exports.PositionManager = exports.delay = exports.EARTH_RADIUS_METERS = exports.calculateDistance = exports.GeoPositionError = exports.GeocodingState = exports.withObserver = exports.DualObserverSubject = exports.ObserverSubject = exports.GeoPosition = void 0;
var GeoPosition_js_1 = require("./core/GeoPosition.js");
Object.defineProperty(exports, "GeoPosition", { enumerable: true, get: function () { return __importDefault(GeoPosition_js_1).default; } });
var ObserverSubject_js_1 = require("./core/ObserverSubject.js");
Object.defineProperty(exports, "ObserverSubject", { enumerable: true, get: function () { return __importDefault(ObserverSubject_js_1).default; } });
var DualObserverSubject_js_1 = require("./core/DualObserverSubject.js");
Object.defineProperty(exports, "DualObserverSubject", { enumerable: true, get: function () { return __importDefault(DualObserverSubject_js_1).default; } });
var ObserverMixin_js_1 = require("./core/ObserverMixin.js");
Object.defineProperty(exports, "withObserver", { enumerable: true, get: function () { return ObserverMixin_js_1.withObserver; } });
var GeocodingState_js_1 = require("./core/GeocodingState.js");
Object.defineProperty(exports, "GeocodingState", { enumerable: true, get: function () { return __importDefault(GeocodingState_js_1).default; } });
var errors_js_1 = require("./core/errors.js");
Object.defineProperty(exports, "GeoPositionError", { enumerable: true, get: function () { return errors_js_1.GeoPositionError; } });
var distance_js_1 = require("./utils/distance.js");
Object.defineProperty(exports, "calculateDistance", { enumerable: true, get: function () { return distance_js_1.calculateDistance; } });
Object.defineProperty(exports, "EARTH_RADIUS_METERS", { enumerable: true, get: function () { return distance_js_1.EARTH_RADIUS_METERS; } });
var async_js_1 = require("./utils/async.js");
Object.defineProperty(exports, "delay", { enumerable: true, get: function () { return async_js_1.delay; } });
var PositionManager_js_1 = require("./core/PositionManager.js");
Object.defineProperty(exports, "PositionManager", { enumerable: true, get: function () { return __importDefault(PositionManager_js_1).default; } });
Object.defineProperty(exports, "createPositionManagerConfig", { enumerable: true, get: function () { return PositionManager_js_1.createPositionManagerConfig; } });
Object.defineProperty(exports, "initializeConfig", { enumerable: true, get: function () { return PositionManager_js_1.initializeConfig; } });
var logger_js_1 = require("./utils/logger.js");
Object.defineProperty(exports, "log", { enumerable: true, get: function () { return logger_js_1.log; } });
Object.defineProperty(exports, "warn", { enumerable: true, get: function () { return logger_js_1.warn; } });
var ReferencePlace_js_1 = require("./core/ReferencePlace.js");
Object.defineProperty(exports, "ReferencePlace", { enumerable: true, get: function () { return __importDefault(ReferencePlace_js_1).default; } });
Object.defineProperty(exports, "NO_REFERENCE_PLACE", { enumerable: true, get: function () { return ReferencePlace_js_1.NO_REFERENCE_PLACE; } });
Object.defineProperty(exports, "VALID_REF_PLACE_CLASSES", { enumerable: true, get: function () { return ReferencePlace_js_1.VALID_REF_PLACE_CLASSES; } });
