import test from 'ava';
import validatePosition from './validatePosition.mjs';

test('fails with invalid position', (t) => {
    t.throws(() => validatePosition({ type: 'notAType' }), {
        message: /'open' or 'close', got notAType/,
    });
    t.throws(() => validatePosition({ type: 'open', size: 'notASize' }), {
        message: /number, got notASize/,
    });
    t.throws(() => validatePosition({ type: 'open', size: 2, barsHeld: 'notBarsHeld' }), {
        message: /number, got notBarsHeld/,
    });
    t.throws(() => validatePosition({ type: 'open', size: 2, barsHeld: 5 }), {
        message: /property id.*got undefined/,
    });

});

test('passes with valid position', (t) => {
    t.notThrows(() => validatePosition({
        type: 'open',
        size: 3,
        barsHeld: 0,
        // 0 is a valid value for an ID
        id: 0,
    }));
});
