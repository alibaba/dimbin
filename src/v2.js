/**
 * Copyright (c) 2017 Alibaba Group Holding Limited
 * @author Simon <gaomeng1900@gmail.com>
 */

// constants

const VERSION = 2

// 类型与数字相互转换
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

const TYPES_MAP = {
    Int8Array: 0,
    Uint8Array: 1,
    Uint8ClampedArray: 2,
    Int16Array: 3,
    Uint16Array: 4,
    Int32Array: 5,
    Uint32Array: 6,
    Float32Array: 7,
    Float64Array: 8,
    //
    DIMBIN: 127, // DIMBIN 嵌套结构
}

//

/**
 * 序列化为二进制Buffer
 * @param  {Array<TypedArray|Array<Number>>} data 二维数组, 而且第二维数组的元素必须为数字
 * @param  {Int} [userVersion=0] 用户控制的标识位
 * @return {ArrayBuffer}
 */
export function serialize(data = [[0]], userVersion = 0) {
    if (parseInt(userVersion) !== userVersion)
        throw new Error('DIMBIN::#0 userVersion格式错误，必须为整数')

    // 保证第一维是数组
    if (!data || !data.forEach)
        throw new Error('DIMBIN::#1 格式不支持, 传入数据应为2维(或更高维)数组')

    const meta = {
        version: VERSION,
        user_version: userVersion,
        len: data.length,
    }

    const segments = []

    let metaStart = 6 // 元数据 占用
    let dataStart = metaStart + meta.len * 9 // 元数据 + 分段原数据 占用

    data.forEach(seg => {
        // 保证第二维是数组
        if (!_isArray(seg)) throw new Error('DIMBIN::#2 格式不支持, 传入数据应为2维(或更高维)数组')

        let type, lendth, byteLength, data
        if (_isArray(seg[0])) {
            // 如果第三维还是数组，则需要嵌套DIMBIN

            data = new Uint8Array(serialize(seg))
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
            if (!seg.BYTES_PER_ELEMENT) seg = new Float32Array(seg)

            // @NOTE 内存字节对齐
            // http://t.cn/Rgac3eJ
            const chink = dataStart % seg.BYTES_PER_ELEMENT
            if (chink > 0) {
                dataStart += seg.BYTES_PER_ELEMENT - chink
            }

            type = TYPES_MAP[seg.constructor.name]
            lendth = seg.length
            byteLength = seg.byteLength
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

    // version
    view.setUint8(0, meta.version)

    // user_version
    view.setUint8(1, meta.user_version)

    // len
    view.setUint32(2, meta.len)

    // segments
    segments.forEach(seg => {
        // meta
        view.setUint8(seg.metaStart, seg.type)
        view.setUint32(seg.metaStart + 1, seg.dataStart)
        view.setUint32(seg.metaStart + 5, seg.lendth)

        // data
        const target = new TYPES[seg.type](arrayBuffer, seg.dataStart, seg.lendth)
        target.set(seg.data)
    })

    return arrayBuffer
}

/**
 * 反序列化
 * @param  {ArrayBuffer|Buffer|DataView} buffer 二进制数据
 * @return {Array<TypedArray>}
 */
export function parse(buffer) {
    const view = buffer instanceof DataView ? buffer : new DataView(buffer)
    buffer = view.buffer

    const meta = {
        version: view.getUint8(0),
        user_version: view.getUint8(1),
        len: view.getUint32(2),
    }

    if (meta.version !== 2)
        throw new Error('DIMBIN::#4 当前程序兼容版本为 2, 你使用的数据版本为 ' + meta.version)

    const result = []
    let metaStart = 6
    for (let i = 0; i < meta.len; i++) {
        const type = view.getUint8(metaStart)
        const dataStart = view.getUint32(metaStart + 1)
        const lendth = view.getUint32(metaStart + 5)

        if (type === 127) {
            result.push(parse(new DataView(buffer, dataStart + view.byteOffset, lendth)))
        } else {
            result.push(new TYPES[type](buffer, dataStart + view.byteOffset, lendth))
        }
        metaStart += 9
    }

    return result
}

/**
 * 读取用户标识位
 * @param  {ArrayBuffer|Buffer} buffer 二进制数据
 * @return {Int}
 */
export function getUserVersion(buffer) {
    const view = new DataView(buffer)
    return view.getUint8(1)
}

//

// test array-like obj
function _isArray(d) {
    if (!d) return false
    if (!Array.isArray(d) && !d.BYTES_PER_ELEMENT) return false

    return true
}

// export

const DIMBIN = { version: VERSION }
DIMBIN.parse = parse
DIMBIN.serialize = serialize
DIMBIN.getUserVersion = getUserVersion

export default DIMBIN
