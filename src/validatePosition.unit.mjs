import test from 'ava';
import validatePosition from './validatePosition.mjs';
import createTestData from '../testData/createTestData.mjs';
import resolveData from '../testData/resolveData.mjs';
import createPosition from './createPosition.mjs';

test('fails with invalid position', (t) => {
    t.throws(() => validatePosition({ type: 'notAType' }), {
        message: /\'open\' or \'close\', got notAType/,
    });
    t.throws(() => validatePosition({ type: 'open', size: 'notASize' }), {
        message: /number, got notASize/,
    });
    t.throws(() => validatePosition({ type: 'open', size: 2, barsHeld: 'notBarsHeld' }), {
        message: /number, got notBarsHeld/,
    });

});

test('passes with valid position', (t) => {
    t.notThrows(() => validatePosition({ type: 'open', size: 3, barsHeld: 0 }));
})