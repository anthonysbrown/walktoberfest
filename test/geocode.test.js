import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchHouse } from '../src/geocode.js';
const house = { properties: { city: 'Worcester', housenumber: '15', street: 'Heroult Road' }, geometry: { type: 'Point', coordinates: [-71.8115286, 42.3127033] } };
test('house lookup accepts street abbreviations and converts longitude/latitude', () => {
 assert.deepEqual(matchHouse([house], '15 Heroult Rd'), [42.3127033, -71.8115286]);
});
test('house lookup rejects the wrong street, number, city, and street-only results', () => {
 assert.equal(matchHouse([house], '15 Other Rd'), null);
 assert.equal(matchHouse([house], '16 Heroult Rd'), null);
 assert.equal(matchHouse([{ ...house, properties: { ...house.properties, city: 'Boston' } }], '15 Heroult Rd'), null);
 assert.equal(matchHouse([{ ...house, properties: { ...house.properties, housenumber: undefined } }], '15 Heroult Rd'), null);
 assert.equal(matchHouse([], '15 Heroult Rd'), null);
});
