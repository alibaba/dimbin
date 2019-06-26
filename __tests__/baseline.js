/* eslint-disable node/no-deprecated-api */
const assert = require('assert')

describe('DIMBIN baseline', () => {
    const DIMBIN = require('../v3.js')

    const b = new Float32Array(10000)
    b.fill(32)
    const c = new Float64Array(10000)
    c.fill(64)
    const d = new Int16Array(10000)
    d.fill(16)

    const e = [new Float32Array(200), new Float32Array(300)]
    e[0].fill(112233)
    e[1].fill(445566)

    const booleans = []
    for (let i = 0; i < 10000; i++) {
        booleans.push(Math.random() > 0.5)
    }

    const strings = []
    const string = Array.from('1295你好呀🔥🔥😊呀啦Ô˜˝◊《,,n ,弄,你好.😄1234')
    for (let i = 0; i < 1000; i++) {
        // 避免将32位unicode拆分
        strings.push(string.slice(0, Math.floor(Math.random() * string.length)).join())
    }

    const f = [
        [[-0, -1, -2, -3], [-0, -1, -2, -3]],
        [[-1, -2, -3], [-1, -2, -3]], //
    ]

    e.push(f)

    it('1 demension', () => {
        expect(() => {
            DIMBIN.serialize([1, 2, 3])
        }).toThrow()

        expect(() => {
            DIMBIN.serialize()
        }).toThrow()
    })

    it('2 dimension', () => {
        const expected = [[1, 2, 3, 4], [5, 6, 7, 8], new Float64Array([1, 2, 3])]
        assert.deepEqual(DIMBIN.parse(DIMBIN.serialize(expected)), expected)
    })

    it('typedArray', () => {
        const expected = [b, c, d]
        assert.deepEqual(DIMBIN.parse(DIMBIN.serialize(expected)), expected)
    })

    it('multi 0', () => {
        const expected = e
        assert.deepEqual(DIMBIN.parse(DIMBIN.serialize(expected)), expected)
    })

    it('multi 1', () => {
        const expected = [
            [0, 1, 2, 3], //
            [0, 1, 2, 3, 4],
            [0, 1, 2, 3, 4, 5],
            b,
            c,
            d,
            e,
            f,
        ]
        assert.deepEqual(DIMBIN.parse(DIMBIN.serialize(expected)), expected)
    })

    it('boolean', () => {
        const expected = [
            [0, 1, 2, 3], //
            d,
            booleans,
            [0, 1, 2, 3, 4, 5],
            booleans.slice(0, 123),
            [0, 1, 2, 3, 4, 5],
            e,
        ]

        const a = DIMBIN.serialize([
            expected[0],
            expected[1],
            DIMBIN.booleansSerialize(expected[2]),
            expected[3],
            DIMBIN.booleansSerialize(expected[4]),
            expected[5],
            expected[6],
        ])
        const b = DIMBIN.parse(a)
        b[2] = DIMBIN.booleansParse(b[2])
        b[4] = DIMBIN.booleansParse(b[4])

        assert.deepEqual(b, expected)
    })

    it('string', () => {
        const expected = [
            [0, 1, 2, 3], //
            [0, 1, 2, 3], // e,
            strings,
            [0, 1, 2, 3, 4, 5],
            strings.slice(0, 123),
            [0, 1, 2, 3], // d,
            [0, 1, 4, 5],
        ]

        const a = DIMBIN.serialize([
            expected[0],
            expected[1],
            DIMBIN.stringsSerialize(expected[2]),
            expected[3],
            DIMBIN.stringsSerialize(expected[4]),
            expected[5],
            expected[6],
        ])
        const b = DIMBIN.parse(a)
        b[2] = DIMBIN.stringsParse(b[2])
        b[4] = DIMBIN.stringsParse(b[4])

        assert.deepEqual(b, expected)
    })
})
