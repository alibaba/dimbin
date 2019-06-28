/**
 * Copyright (c) 2017 Alibaba Group Holding Limited
 * @author Simon <gaomeng1900@gmail.com>
 */

const VERSION = 3
const VERSION_ERROR = `DIMBIN::#0 当前程序支持版本为 ${VERSION}, 你使用的数据版本为 `
const ENDIAN_ERROR = 'DIMBIN::#1 当前版本仅支持小端数据'

// types map

const TYPES = [
    Int8Array, // 0
    Uint8Array, // 1
    Uint8ClampedArray, // 2
    Int16Array, // 3
    Uint16Array, // 4
    Int32Array, // 5
    Uint32Array, // 6
    Float32Array, // 7
    Float64Array, // 8
]
TYPES[127] = Uint8Array // DIMBIN 嵌套

enum TYPES_MAP {
    Int8Array, // 0
    Uint8Array, // 1
    Uint8ClampedArray, // 2
    Int16Array, // 3
    Uint16Array, // 4
    Int32Array, // 5
    Uint32Array, // 6
    Float32Array, // 7
    Float64Array, // 8

    DIMBIN = 127,
}

// interface

export interface Meta {
    version: number
    magicNum: number
    segMetaBytes: number
    segMetaStart: number
    len: number
    bigEndian: boolean
}

interface DimensionalArray extends Array<number | DimensionalArray | TypedArray> {}

interface MultiDimensionalArray extends Array<DimensionalArray | TypedArray> {}

// ✨

/**
 * serialize a MultiDimensionalArray into a ArrayBuffer
 * @param data <MultiDimensionalArray>
 * @param magicNumber [0] <number>
 */
export function serialize(data: MultiDimensionalArray, magicNumber = 0): ArrayBuffer {
    // 保证第一维是数组
    if (!data || !data.forEach)
        throw new Error('DIMBIN::#1 格式不支持, 传入数据应为2维(或更高维)数组')

    const meta: Meta = {
        version: VERSION,
        magicNum: magicNumber,
        segMetaBytes: 9,
        segMetaStart: 15,
        len: data.length,
        bigEndian: false,
    }

    const segments = []

    let metaStart = meta.segMetaStart
    let dataStart = meta.segMetaStart + meta.segMetaBytes * meta.len

    data.forEach(seg => {
        // 保证第二维是数组
        if (!_isArray(seg)) throw new Error('DIMBIN::#2 格式不支持, 传入数据应为2维(或更高维)数组')

        // segment meta
        let type, lendth, byteLength, data
        if (_isArray(seg[0])) {
            // 如果第三维还是数组，则需要嵌套DIMBIN

            data = new Uint8Array(serialize(seg as MultiDimensionalArray))
            // console.log(data, parse(data.buffer))

            type = TYPES_MAP['DIMBIN']
            lendth = data.byteLength
            byteLength = data.byteLength

            // @NOTE 内存字节对齐
            // http://t.cn/Rgac3eJ
            // 由于嵌套DIMBIN中可能会有各种数据结构，因此需要与8对齐（最小公倍数）
            const chink = dataStart % 8
            if (chink > 0) {
                dataStart += 8 - chink
            }
        } else {
            // 一个分段的数据

            // 如果是JS Array，则转换成 Float32Array
            if (!isTypedArray(seg)) {
                seg = new Float32Array(seg as Array<number>)
            }

            // @NOTE 内存字节对齐
            // http://t.cn/Rgac3eJ
            const chink = dataStart % seg.BYTES_PER_ELEMENT
            if (chink > 0) {
                dataStart += seg.BYTES_PER_ELEMENT - chink
            }

            type = TYPES_MAP[seg.constructor.name]
            lendth = seg.length
            // 这里要考虑bufferview自己的范围
            byteLength = seg.byteLength // seg.buffer.byteLength
            data = seg
        }

        segments.push({
            type,
            metaStart,
            dataStart,
            lendth,
            byteLength,
            data,
        })

        metaStart += 9 // 一个segment的信息位
        dataStart += byteLength
    })

    const arrayBuffer = new ArrayBuffer(dataStart + 1)
    const view = new DataView(arrayBuffer)

    // meta

    view.setUint8(0, meta.version)
    view.setUint8(1, meta.bigEndian ? 1 : 0)
    view.setUint8(2, meta.segMetaBytes)
    view.setUint32(3, meta.segMetaStart, true) // 小端
    view.setFloat32(7, meta.magicNum, true) // 小端
    view.setUint32(11, meta.len, true) // 小端

    // segments
    segments.forEach(seg => {
        // meta
        view.setUint8(seg.metaStart, seg.type)
        view.setUint32(seg.metaStart + 1, seg.dataStart, true)
        view.setUint32(seg.metaStart + 5, seg.lendth, true)

        // data
        const target = new TYPES[seg.type](arrayBuffer, seg.dataStart, seg.lendth)
        target.set(seg.data)
    })

    return arrayBuffer
}

/**
 * parse parse a DIMBIN buffer into a multiDimensionalArray
 * @param buffer <ArrayBuffer|Buffer|DataView>
 */
export function parse(buffer: ArrayBuffer | Buffer | DataView): MultiDimensionalArray {
    const view = buffer instanceof DataView ? buffer : new DataView(buffer)
    buffer = view.buffer

    const meta = getMeta(view)

    if (meta.version !== 3) throw new Error(VERSION_ERROR + meta.version)
    if (meta.bigEndian) throw new Error(ENDIAN_ERROR)

    const result = []
    let metaStart = meta.segMetaStart
    for (let i = 0; i < meta.len; i++) {
        const type = view.getUint8(metaStart)
        const dataStart = view.getUint32(metaStart + 1, true)
        const lendth = view.getUint32(metaStart + 5, true)

        if (type === 127) {
            result.push(parse(new DataView(buffer, dataStart + view.byteOffset, lendth)))
        } else {
            result.push(new TYPES[type](buffer, dataStart + view.byteOffset, lendth))
        }
        metaStart += meta.segMetaBytes
    }

    return result
}

/**
 * read meta data from a DIMBIN buffer
 * @param buffer <ArrayBuffer|Buffer|DataView>
 */
export function getMeta(buffer: ArrayBuffer | Buffer | DataView): Meta {
    const view = buffer instanceof DataView ? buffer : new DataView(buffer)

    const version = view.getUint8(0)
    const bigEndian = !!view.getUint8(1)

    if (version !== 3) console.error(VERSION_ERROR + version)

    if (bigEndian) console.error(ENDIAN_ERROR)

    return {
        version,
        bigEndian,
        segMetaBytes: view.getUint8(2),
        segMetaStart: view.getUint32(3, true), // 小端
        magicNum: view.getFloat32(7, true), // 小端
        len: view.getUint32(11, true), // 小端
    }
}

//

// polyfill

export type TypedArray =
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array

// TS 类型保护
function isTypedArray(sth: any): sth is TypedArray {
    return !!sth.BYTES_PER_ELEMENT
}

// test array-like obj
function _isArray(d: any): boolean {
    if (!d) return false
    if (!Array.isArray(d) && !d.BYTES_PER_ELEMENT) return false

    return true
}

//

// non-numberical value support

// - string

/**
 * serialize an array of strings into Uint8Array, which you can use in DIMBIN.parse
 * @param strs <string[]>
 */
export function stringsSerialize(strs: string[]): Uint8Array {
    'use strict'

    let i = 0
    const length = strs.length

    // 2ms
    let sum = 0
    while (i < length) {
        sum += strs[i].length
        i++
    }

    // version 4 | length 4 | segments 4 * len | utf8
    const buffer = new ArrayBuffer(4 + 4 + length * 4 + sum * 4) // 按32位分配，这里不见得用得到32位，输出前裁掉

    const view = new DataView(buffer)
    view.setUint32(0, 0)
    view.setUint32(4, length)

    // 5ms
    const utf8 = new Uint8Array(buffer, 4 + 4 + length * 4, sum * 4) // 用不完

    i = 0
    let pointer = 0
    while (i < length) {
        const str = strs[i]

        // view.setUint32(8 + 4 * i, str.length)

        const start = pointer

        let j = 0
        while (j < str.length) {
            // buffer[pointer] = str.charCodeAt(j)
            // 7ms
            const code = str.charCodeAt(j++)
            // ~0ms
            // utf16 -> unicode
            let codePoint
            if (code < 0xd800 || code >= 0xdc00) {
                codePoint = code
            } else {
                const b = str.charCodeAt(j++)
                codePoint = (code << 10) + b + (0x10000 - (0xd800 << 10) - 0xdc00)
            }

            // unicode -> utf8
            // const utf8 = []
            if (codePoint < 0x80) {
                // 7ms
                utf8[pointer++] = codePoint
                // utf8.push(codePoint)
            } else {
                if (codePoint < 0x800) {
                    utf8[pointer++] = ((codePoint >> 6) & 0x1f) | 0xc0
                } else {
                    if (codePoint < 0x10000) {
                        utf8[pointer++] = ((codePoint >> 12) & 0x0f) | 0xe0
                    } else {
                        utf8[pointer++] = ((codePoint >> 18) & 0x07) | 0xf0
                        utf8[pointer++] = ((codePoint >> 12) & 0x3f) | 0x80
                    }
                    utf8[pointer++] = ((codePoint >> 6) & 0x3f) | 0x80
                }
                utf8[pointer++] = (codePoint & 0x3f) | 0x80
            }

            // 17ms
            // const codePoint = str.codePointAt(j++)
            // 26ms
            // buffer[pointer++] = str.charCodeAt(j)
            // 90ms
            // codes.push(code)
        }

        const end = pointer
        view.setUint32(8 + 4 * i, end - start)

        i++
    }

    return new Uint8Array(buffer, 0, 4 + 4 + length * 4 + pointer)
}

/**
 * parse the Uint8Array generated by stringsSerialize back into array of strings
 * @param uint8array <Uint8Array>
 */
export function stringsParse(uint8array: Uint8Array): string[] {
    'use strict'
    // version (4 bytes) | length (4 bytes) | segments (4 * len bytes) | utf8

    const view = new DataView(uint8array.buffer, uint8array.byteOffset, uint8array.byteLength)
    const version = view.getUint32(0)
    const length = view.getUint32(4)

    const utf8 = new Uint8Array(uint8array.buffer, uint8array.byteOffset + 4 + 4 + length * 4)

    const strs = []

    let i = 0
    let pointer = 0

    let end = 0
    while (i < length) {
        const len = view.getUint32(8 + 4 * i++)
        const isLongString = len > 20

        const codePoints = []
        let result = ''

        end += len
        while (pointer < end) {
            let codePoint = 0

            // UTF-8 -> unicode
            const a = utf8[pointer++]
            if (a < 0xc0) {
                codePoint = a
            } else {
                const b = utf8[pointer++]
                if (a < 0xe0) {
                    codePoint = ((a & 0x1f) << 6) | (b & 0x3f)
                } else {
                    const c = utf8[pointer++]
                    if (a < 0xf0) {
                        codePoint = ((a & 0x0f) << 12) | ((b & 0x3f) << 6) | (c & 0x3f)
                    } else {
                        const d = utf8[pointer++]
                        codePoint =
                            ((a & 0x07) << 18) | ((b & 0x3f) << 12) | ((c & 0x3f) << 6) | (d & 0x3f)
                    }
                }
            }

            // unicode -> UTF-16

            if (isLongString) {
                codePoints.push(codePoint)
            } else {
                // 该方案在处理短字符串时性能更好
                if (codePoint < 0x10000) {
                    result += String.fromCharCode(codePoint)
                } else {
                    codePoint -= 0x10000
                    result += String.fromCharCode(
                        (codePoint >> 10) + 0xd800,
                        (codePoint & ((1 << 10) - 1)) + 0xdc00
                    )
                }
            }
        }

        if (isLongString) {
            // 该方案在处理长字符串时性能更好
            strs.push(String.fromCodePoint.apply(null, codePoints))
        } else {
            strs.push(result)
        }
    }

    return strs
}

// - boolean

function packBooleans(b0, b1, b2, b3, b4, b5, b6, b7): number {
    'use strict'
    return (
        (b0 || 0) +
        (b1 || 0) * 2 +
        (b2 || 0) * 4 +
        (b3 || 0) * 8 +
        (b4 || 0) * 16 +
        (b5 || 0) * 32 +
        (b6 || 0) * 64 +
        (b7 || 0) * 128
    )
}

/**
 * serialize an array of booleans into Uint8Array, which you can use in DIMBIN.parse
 * @param booleans
 */
export function booleansSerialize(booleans: boolean[]): Uint8Array {
    'use strict'

    const length = booleans.length

    // version 4 | length 4 | bits
    const buffer = new ArrayBuffer(4 + 4 + Math.ceil(length / 8))

    const view = new DataView(buffer)
    view.setUint32(0, 0, true)
    view.setUint32(4, length, true)

    const masks = new Uint8Array(buffer, 8)

    for (let i = 0; i < length; i += 8) {
        masks[i / 8] = packBooleans(
            booleans[i + 0],
            booleans[i + 1],
            booleans[i + 2],
            booleans[i + 3],
            booleans[i + 4],
            booleans[i + 5],
            booleans[i + 6],
            booleans[i + 7]
        )
    }

    return new Uint8Array(buffer)
}

/**
 * parse the Uint8Array generated by booleansSerialize back into array of booleans
 * @param uint8array <Uint8Array>
 */
export function booleansParse(uint8array: Uint8Array): boolean[] {
    'use strict'

    // version 4 | length 4 | bits
    const view = new DataView(uint8array.buffer, uint8array.byteOffset, uint8array.byteLength)
    const version = view.getUint32(0, true)
    const length = view.getUint32(4, true)

    const masks = new Uint8Array(uint8array.buffer, uint8array.byteOffset + 4 + 4)

    const booleans = []

    const maskLen = Math.ceil(length / 8)
    for (let i = 0; i < maskLen; i++) {
        let mask = masks[i]
        for (let j = 0; j < 8; booleans.push(!!(mask & 1)), mask >>>= 1, j++);
    }

    const paddingLen = booleans.length - length
    for (let i = 0; i < paddingLen; i++) {
        booleans.pop()
    }

    return booleans
}

// export

const DIMBIN = {
    version: VERSION,
    //
    parse,
    serialize,
    getMeta,
    //
    stringsSerialize,
    stringsParse,
    booleansSerialize,
    booleansParse,
}

export default DIMBIN
