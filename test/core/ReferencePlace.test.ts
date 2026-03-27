// test/core/ReferencePlace.test.ts

import ReferencePlace, {
	OsmElement,
	NO_REFERENCE_PLACE,
	VALID_REF_PLACE_CLASSES,
} from '../../src/core/ReferencePlace';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeElement(overrides: Partial<OsmElement> = {}): OsmElement {
	return { class: 'shop', type: 'mall', name: 'Shopping Morumbi', ...overrides };
}

// ─── ReferencePlace ──────────────────────────────────────────────────────────

describe('ReferencePlace', () => {

	// ── constructor ──────────────────────────────────────────────────────────

	describe('constructor', () => {
		it('should set className, typeName, and name from valid input', () => {
			const rp = new ReferencePlace(makeElement());
			expect(rp.className).toBe('shop');
			expect(rp.typeName).toBe('mall');
			expect(rp.name).toBe('Shopping Morumbi');
		});

		it('should set all fields to null when passed an empty object', () => {
			const rp = new ReferencePlace({});
			expect(rp.className).toBeNull();
			expect(rp.typeName).toBeNull();
			expect(rp.name).toBeNull();
		});

		it('should set all fields to null when passed null', () => {
			const rp = new ReferencePlace(null);
			expect(rp.className).toBeNull();
			expect(rp.typeName).toBeNull();
			expect(rp.name).toBeNull();
		});

		it('should set all fields to null when passed undefined', () => {
			const rp = new ReferencePlace(undefined);
			expect(rp.className).toBeNull();
			expect(rp.typeName).toBeNull();
			expect(rp.name).toBeNull();
		});

		it('should freeze the instance after construction', () => {
			const rp = new ReferencePlace(makeElement());
			expect(Object.isFrozen(rp)).toBe(true);
		});

		it('should not allow property mutation after freeze', () => {
			const rp = new ReferencePlace(makeElement());
			expect(() => {
				(rp as unknown as Record<string, unknown>).className = 'amenity';
			}).toThrow();
		});

		it('should ignore extra properties in the input object', () => {
			const rp = new ReferencePlace({ ...makeElement(), extra: 'ignored' });
			expect(rp.className).toBe('shop');
			expect(rp.typeName).toBe('mall');
			expect(rp.name).toBe('Shopping Morumbi');
		});

		it('should treat empty-string fields as null (falsy coercion)', () => {
			const rp = new ReferencePlace({ class: '', type: '', name: '' });
			expect(rp.className).toBeNull();
			expect(rp.typeName).toBeNull();
			expect(rp.name).toBeNull();
		});
	});

	// ── calculateDescription ──────────────────────────────────────────────────

	describe('calculateDescription', () => {
		it('should return NO_REFERENCE_PLACE when className is missing', () => {
			const rp = new ReferencePlace({ type: 'mall' });
			expect(rp.description).toBe(NO_REFERENCE_PLACE);
		});

		it('should return NO_REFERENCE_PLACE when typeName is missing', () => {
			const rp = new ReferencePlace({ class: 'shop' });
			expect(rp.description).toBe(NO_REFERENCE_PLACE);
		});

		it('should return NO_REFERENCE_PLACE for an invalid class', () => {
			const rp = new ReferencePlace({ class: 'invalid', type: 'unknown' });
			expect(rp.description).toBe(NO_REFERENCE_PLACE);
		});

		it('should return NO_REFERENCE_PLACE when both class and type are missing', () => {
			const rp = new ReferencePlace({});
			expect(rp.description).toBe(NO_REFERENCE_PLACE);
		});

		it('should return "class: type" fallback for a valid class with unmapped type', () => {
			const rp = new ReferencePlace({ class: 'shop', type: 'unmapped_type' });
			expect(rp.description).toBe('shop: unmapped_type');
		});

		it('should include name in description when name is present (shop/mall)', () => {
			const rp = new ReferencePlace(makeElement());
			expect(rp.description).toBe('Shopping Center Shopping Morumbi');
		});

		it('should omit name in description when name is absent (shop/mall)', () => {
			const rp = new ReferencePlace({ class: 'shop', type: 'mall' });
			expect(rp.description).toBe('Shopping Center');
		});

		it('should handle amenity/cafe with name', () => {
			const rp = new ReferencePlace({ class: 'amenity', type: 'cafe', name: 'Café Central' });
			expect(rp.description).toBe('Café Café Central');
		});

		it('should handle railway/subway with name', () => {
			const rp = new ReferencePlace({ class: 'railway', type: 'subway', name: 'Estação Sé' });
			expect(rp.description).toBe('Estação do Metrô Estação Sé');
		});

		it('should handle railway/station with name', () => {
			const rp = new ReferencePlace({ class: 'railway', type: 'station', name: 'Estação da Luz' });
			expect(rp.description).toBe('Estação de Trem Estação da Luz');
		});

		it('should handle place/house with name', () => {
			const rp = new ReferencePlace({ class: 'place', type: 'house', name: 'Casa do João' });
			expect(rp.description).toBe('Residencial Casa do João');
		});

		it('should handle shop/car_repair with name', () => {
			const rp = new ReferencePlace({ class: 'shop', type: 'car_repair', name: 'Auto Center Silva' });
			expect(rp.description).toBe('Oficina Mecânica Auto Center Silva');
		});

		it('should handle building/yes with name', () => {
			const rp = new ReferencePlace({ class: 'building', type: 'yes', name: 'Edifício Copan' });
			expect(rp.description).toBe('Edifício Edifício Copan');
		});

		it('should handle amenity/restaurant with name', () => {
			const rp = new ReferencePlace({ class: 'amenity', type: 'restaurant', name: 'Restaurante Fasano' });
			expect(rp.description).toBe('Restaurante Restaurante Fasano');
		});

		it('should handle amenity/bar without name', () => {
			const rp = new ReferencePlace({ class: 'amenity', type: 'bar' });
			expect(rp.description).toBe('Bar');
		});

		it('should handle amenity/fast_food without name', () => {
			const rp = new ReferencePlace({ class: 'amenity', type: 'fast_food' });
			expect(rp.description).toBe('Lanchonete');
		});

		it('should handle amenity/hospital with name', () => {
			const rp = new ReferencePlace({ class: 'amenity', type: 'hospital', name: 'Hospital das Clínicas' });
			expect(rp.description).toBe('Hospital Hospital das Clínicas');
		});

		it('should handle amenity/school with name', () => {
			const rp = new ReferencePlace({ class: 'amenity', type: 'school', name: 'Escola Estadual Central' });
			expect(rp.description).toBe('Escola Escola Estadual Central');
		});

		it('should handle amenity/bank without name', () => {
			const rp = new ReferencePlace({ class: 'amenity', type: 'bank' });
			expect(rp.description).toBe('Banco');
		});

		it('should handle amenity/pharmacy without name', () => {
			const rp = new ReferencePlace({ class: 'amenity', type: 'pharmacy' });
			expect(rp.description).toBe('Farmácia');
		});

		it('should handle amenity/fuel without name', () => {
			const rp = new ReferencePlace({ class: 'amenity', type: 'fuel' });
			expect(rp.description).toBe('Posto de Combustível');
		});

		it('should handle shop/supermarket with name', () => {
			const rp = new ReferencePlace({ class: 'shop', type: 'supermarket', name: 'Pão de Açúcar' });
			expect(rp.description).toBe('Supermercado Pão de Açúcar');
		});

		it('should handle shop/bakery without name', () => {
			const rp = new ReferencePlace({ class: 'shop', type: 'bakery' });
			expect(rp.description).toBe('Padaria');
		});

		it('should handle shop/convenience without name', () => {
			const rp = new ReferencePlace({ class: 'shop', type: 'convenience' });
			expect(rp.description).toBe('Loja de Conveniência');
		});

		it('should handle shop/pharmacy without name', () => {
			const rp = new ReferencePlace({ class: 'shop', type: 'pharmacy' });
			expect(rp.description).toBe('Farmácia');
		});

		it('should handle building/school with name', () => {
			const rp = new ReferencePlace({ class: 'building', type: 'school', name: 'Escola Municipal' });
			expect(rp.description).toBe('Escola Escola Municipal');
		});

		it('should handle building/hospital with name', () => {
			const rp = new ReferencePlace({ class: 'building', type: 'hospital', name: 'Hospital São Paulo' });
			expect(rp.description).toBe('Hospital Hospital São Paulo');
		});

		it('should handle building/church with name', () => {
			const rp = new ReferencePlace({ class: 'building', type: 'church', name: 'Catedral da Sé' });
			expect(rp.description).toBe('Igreja Catedral da Sé');
		});

		it('should handle leisure/park with name', () => {
			const rp = new ReferencePlace({ class: 'leisure', type: 'park', name: 'Parque Ibirapuera' });
			expect(rp.description).toBe('Parque Parque Ibirapuera');
		});

		it('should handle leisure/playground without name', () => {
			const rp = new ReferencePlace({ class: 'leisure', type: 'playground' });
			expect(rp.description).toBe('Playground');
		});

		it('should return "class: type" fallback for leisure with unmapped type', () => {
			const rp = new ReferencePlace({ class: 'leisure', type: 'sports_centre' });
			expect(rp.description).toBe('leisure: sports_centre');
		});

		it('should cover all entries in referencePlaceMap', () => {
			const map = ReferencePlace.referencePlaceMap;
			for (const [className, types] of Object.entries(map)) {
				for (const [typeName, label] of Object.entries(types)) {
					const rp = new ReferencePlace({ class: className, type: typeName, name: 'Test' });
					expect(rp.description).toBe(`${label} Test`);
				}
			}
		});
	});

	// ── calculateCategory ────────────────────────────────────────────────────

	describe('calculateCategory', () => {
		it('should return category label for a known class/type pair', () => {
			const rp = new ReferencePlace({ class: 'shop', type: 'mall' });
			expect(rp.calculateCategory()).toBe('Shopping Center');
		});

		it('should return "unknown" for an unrecognised class', () => {
			const rp = new ReferencePlace({ class: 'unknown', type: 'anything' });
			expect(rp.calculateCategory()).toBe('unknown');
		});

		it('should return "unknown" when className is null', () => {
			const rp = new ReferencePlace({});
			expect(rp.calculateCategory()).toBe('unknown');
		});

		it('should return "unknown" for a valid class with unmapped type', () => {
			const rp = new ReferencePlace({ class: 'shop', type: 'unmapped' });
			expect(rp.calculateCategory()).toBe('unknown');
		});

		it('should return "unknown" when typeName is null', () => {
			const rp = new ReferencePlace({ class: 'shop' });
			expect(rp.calculateCategory()).toBe('unknown');
		});
	});

	// ── toString ─────────────────────────────────────────────────────────────

	describe('toString', () => {
		it('should include class name prefix', () => {
			const rp = new ReferencePlace(makeElement());
			expect(rp.toString()).toMatch(/^ReferencePlace:/);
		});

		it('should append " - <name>" when name is present', () => {
			const rp = new ReferencePlace(makeElement());
			expect(rp.toString()).toBe('ReferencePlace: Shopping Center Shopping Morumbi - Shopping Morumbi');
		});

		it('should omit the " - <name>" suffix when name is absent', () => {
			const rp = new ReferencePlace({ class: 'amenity', type: 'cafe' });
			expect(rp.toString()).toBe('ReferencePlace: Café');
			expect(rp.toString()).not.toContain(' - ');
		});

		it('should include NO_REFERENCE_PLACE in output for unclassified place', () => {
			const rp = new ReferencePlace({ class: 'unknown', type: 'unknown' });
			expect(rp.toString()).toContain(NO_REFERENCE_PLACE);
		});
	});

	// ── static referencePlaceMap ─────────────────────────────────────────────

	describe('static referencePlaceMap', () => {
		it('should contain all VALID_REF_PLACE_CLASSES as top-level keys', () => {
			const mapKeys = Object.keys(ReferencePlace.referencePlaceMap);
			for (const cls of VALID_REF_PLACE_CLASSES) {
				expect(mapKeys).toContain(cls);
			}
		});

		it('should be frozen (immutable)', () => {
			expect(Object.isFrozen(ReferencePlace.referencePlaceMap)).toBe(true);
		});
	});

	// ── exported constants ────────────────────────────────────────────────────

	describe('exported constants', () => {
		it('NO_REFERENCE_PLACE should be the Portuguese fallback string', () => {
			expect(NO_REFERENCE_PLACE).toBe('Não classificado');
		});

		it('VALID_REF_PLACE_CLASSES should contain expected classes', () => {
			expect(VALID_REF_PLACE_CLASSES).toContain('place');
			expect(VALID_REF_PLACE_CLASSES).toContain('shop');
			expect(VALID_REF_PLACE_CLASSES).toContain('amenity');
			expect(VALID_REF_PLACE_CLASSES).toContain('railway');
			expect(VALID_REF_PLACE_CLASSES).toContain('building');
			expect(VALID_REF_PLACE_CLASSES).toContain('leisure');
		});
	});

	// ── public API smoke test (via index) ─────────────────────────────────────

	describe('public API (re-export from index)', () => {
		it('should be re-exported from the package entry point', async () => {
			const { ReferencePlace: RP } = await import('../../src/index.js');
			expect(RP).toBeDefined();
			const rp = new RP({ class: 'shop', type: 'mall', name: 'Test Mall' });
			expect(rp.description).toBe('Shopping Center Test Mall');
		});
	});
});
