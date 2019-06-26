# DIMBIN

> 针对大量数据网络传输设计的序列化方案，用于储存多维数组

## useage

`npm install --save dimbin`

```javascript
import DIMBIN from 'dimbin' // v3

// import DIMBIN from 'dimbin/v2' // old version
```

```javascript
const data = [
    [0, 1, 2, 3], // 普通数值数组 ✅
    new Int16Array([1, 2, 3, 4]), // TypedArray ✅
    [
        // 更高维度数组 ✅
        [0, 1, 2],
        [0, 1, 2, 3, 4],
    ],
    DIMBIN.stringsSerialize(['a', 'bc', '😊']), // Array<string>
    DIMBIN.booleansSerialize([true, false, true, true]), // Array<boolean>
]

// 序列化为ArrayBuffer
const bin = DIMBIN.serialize(data)

// 反序列化为 Array<TypedArray>
const dim = DIMBIN.parse(bin)
dim[3] = DIMBIN.stringsParse(dim[3])
dim[4] = DIMBIN.booleansParse(dim[4])

/*
[
    Float32Array{0, 1, 2, 3},
    Int16Array{1, 2, 3, 4},
    [
        Float32Array{0, 1, 2},
        Float32Array{0, 1, 2, 3, 4},
    ],
    ['a', 'bc', '😊'],
    [true, false, true, true]
]
*/
```

## 数据结构

DIMBIN 为多维数组而设计, 因此传入的数据结构必须为多维数组, 数组维数没有上限, 每一维度数组的元素个数上线为 2^32 .

维度和数组元素个数受运行环境和设备限制.

```javascript
// 粒子 🌰

// 正确的格式
const input = [
    // Array
    [1, 2, 3],
    // TypedArray
    new Float32Array(1000),
    // higher dimensions
    [
        //
        [4, 5, 6],
        new Float64Array(2000),
    ],
]

const wrong1 = [
    // 必须为多维数组
    1,
    2,
    3,
]

const wrong2 = [
    // - 数组元素必须 *全部为数组* 或者 *全部为数值*
    [1, 2, 3, [4], [5]],
]

const wrong3 = [
    // 非数值数据需要先转换为数值数据
    ['123', 'hello'],
]
```

数组的元素支持以下数据类型

-   number: Int8, UInt8, Int16, UInt16, Int32, UInt32, Float32, Float64
-   string
-   boolean

默认情况下, 所有的数据将使用 Float32 格式进行保存.
如果需要指定数据格式, 请先转换成 TypedArray.
如需要处理字符串和布尔值, 请使用对应的接口预先转换成 TypedArray.

## API

### `serialize`

序列化为二进制数据

-   @param `{Array<TypedArray|Array<number|TypedArray|Array>>} data` 多维数组
-   @param `{float} magicNumber` 用户控制的标识位
-   @return `{ArrayBuffer}`

### `parse`

反序列化回多维数组

-   @param `{ArrayBuffer|Buffer|DataView} buffer` 序列化后的二进制数据
-   @return `{Array<TypedArray|Array<TypedArray|Array>>}`

### `getMeta`

读取二进制数据的元数据

-   @param `{ArrayBuffer|Buffer|DataView} buffer` 序列化后的二进制数据
-   @return `{Meta}`

```typescript
interface Meta {
    version: number
    magic_num: number
    seg_meta_bytes: number
    seg_meta_start: number
    len: number
    big_endian: boolean
}
```

### `stringsSerialize`

将 Array<string> 序列化成 TypedArray

-   @param `{string[]} strs` 元素为字符串的数组
-   @return `{UInt8Array}` 序列化后的二进制数据

### `stringsParse`

将 stringsSerialize 生成的二进制数据解析回 Array<string>

-   @param `{UInt8Array}` 序列化后的二进制数据
-   @return `{string[]}` 元素为字符串的数组

### `booleansSerialize`

将 Array<boolean> 序列化成 TypedArray

-   @param `{boolean[]} strs` 元素为布尔值的数组
-   @return `{UInt8Array}` 序列化后的二进制数据

### `booleansParse`

将 booleansSerialize 生成的二进制数据解析回 Array<boolean>

-   @param `{UInt8Array}` 序列化后的二进制数据
-   @return `{boolean[]}` 元素为布尔值的数组

## performance

当使用纯数值数据时

-   序列化性能为 JSON 的 3-10 倍
-   反序列化性能为 JSON 的 十万到百万 倍
-   体积比 JSON 减小 60%

当数据包含字符串时, 性能与体积受字符串所占比例的影响, (二进制序列化方案处理字符串的性能和体积都差于 JSON)

在 JS 环境中, 性能好于 flatbuffers, 远好于 protocolbuffers.

## specifications

moved to ./specifications/v3.md
