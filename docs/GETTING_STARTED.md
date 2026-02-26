# Getting Started

**Package:** `paraty_geocore.js`

---

## Prerequisites

- Node.js 18 or later
- npm 9 or later

---

## Installation

```bash
npm install paraty_geocore.js
```

> **Note:** The package is not yet published to the npm registry. To use it from source, clone the repository and install locally:
>
> ```bash
> git clone https://github.com/your-org/paraty_geocore.js.git
> cd paraty_geocore.js
> npm install
> npm run build
> ```
>
> Then in your project:
> ```bash
> npm install ../paraty_geocore.js
> ```

---

## Usage

### Wrapping a Browser Geolocation Position

```javascript
import GeoPosition from 'paraty_geocore.js/core/GeoPosition';

navigator.geolocation.getCurrentPosition((browserPosition) => {
    const pos = new GeoPosition(browserPosition);

    console.log(pos.latitude);        // e.g. -23.5505
    console.log(pos.longitude);       // e.g. -46.6333
    console.log(pos.accuracy);        // e.g. 18 (meters)
    console.log(pos.accuracyQuality); // 'good'
    console.log(pos.timestamp);       // Unix ms
});
```

### Checking Accuracy Quality

```javascript
import GeoPosition from 'paraty_geocore.js/core/GeoPosition';

// Static method — no instance required
const quality = GeoPosition.getAccuracyQuality(8);
console.log(quality); // 'excellent'
```

### Calculating Distance Between Two Points

```javascript
import GeoPosition from 'paraty_geocore.js/core/GeoPosition';

navigator.geolocation.getCurrentPosition((browserPosition) => {
    const pos = new GeoPosition(browserPosition);

    const restaurant = { latitude: -23.5489, longitude: -46.6388 };
    const meters = pos.distanceTo(restaurant);

    console.log(`${Math.round(meters)} meters away`);
});
```

### Using Distance Utilities Directly

```javascript
import { calculateDistance, EARTH_RADIUS_METERS } from 'paraty_geocore.js/utils/distance';

// São Paulo → Rio de Janeiro
const d = calculateDistance(-23.5505, -46.6333, -22.9068, -43.1729);
console.log(`${(d / 1000).toFixed(1)} km`); // 357.7 km

console.log(EARTH_RADIUS_METERS); // 6371000
```

### Async Delay Utility

```javascript
import { delay } from 'paraty_geocore.js/utils/distance';

async function pollPosition() {
    while (true) {
        await fetchAndProcessPosition();
        await delay(5000); // wait 5 seconds between polls
    }
}
```

### Watching Position Changes

```javascript
import GeoPosition from 'paraty_geocore.js/core/GeoPosition';

navigator.geolocation.watchPosition(
    (browserPosition) => {
        const pos = new GeoPosition(browserPosition);
        console.log(pos.toString());
        // "GeoPosition: -23.5505, -46.6333, good, 760, 0, 0, 1634567890123"
    },
    (error) => {
        console.error('Geolocation error', error);
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
);
```

---

## Working with Plain Objects (Tests / Node.js)

`GeoPosition` accepts any plain object with a `coords` shape, making it easy to use outside the browser:

```javascript
import GeoPosition from 'paraty_geocore.js/core/GeoPosition';

const mockPosition = {
    timestamp: Date.now(),
    coords: {
        latitude: -23.5505,
        longitude: -46.6333,
        accuracy: 15,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
    }
};

const pos = new GeoPosition(mockPosition);
console.log(pos.accuracyQuality); // 'good'
```

---

## Running Tests

```bash
npm test
```

Tests are located in `__tests__/` and use Jest.

---

## Further Reading

- [API Reference](./API.md)
- [Architecture](./ARCHITECTURE.md)
- [GeoPosition Functional Requirements](./GeoPosition-FRS.md)
- [distance Functional Requirements](./distance-FRS.md)
