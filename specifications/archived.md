### `version 2.5`

```

// update: user_version 从 uint 升级为 单精度 浮点数

ArrayBuffer长度单位是1字节（1 byte）8位（8 bit），因此这里的单位都是 byte

二进制数据分为三个段： | 源信息 | 分段源信息 | 分段数据 |

| meta                               | segments_meta         | data
------------------------------------------------------------------
| x         | xxxx         | xxxx   | x     xxxx    xxxx    | *
| version   | user_version | len    | type  start   lenth   | data
| uint8     | float32      | uint32 | unit8 unit32  unit32  | *

type:
- 0: Int8Array
- 1: Uint8Array
- 2: Uint8ClampedArray
- 3: Int16Array
- 4: Uint16Array
- 5: Int32Array
- 6: Uint32Array
- 7: Float32Array
- 8: Float64Array
- 127: DIMBIN // nested dimention

* 其中data段需要进行内存字节对齐，因此：其长度>=数据长度之和

```

### `version 2`

```

// update: 扩展数组数量限制，从 uint8(0-256) 扩展到 uint32(0-4294967296)

ArrayBuffer长度单位是1字节（1 byte）8位（8 bit），因此这里的单位都是 byte

二进制数据分为三个段： | 源信息 | 分段源信息 | 分段数据 |

| meta                               | segments_meta         | data
------------------------------------------------------------------
| x         | x            | xxxx   | x     xxxx    xxxx    | *
| version   | user_version | len    | type  start   lenth   | data
| uint8     | uint8        | uint32 | unit8 unit32  unit32  | *

type:
- 0: Int8Array
- 1: Uint8Array
- 2: Uint8ClampedArray
- 3: Int16Array
- 4: Uint16Array
- 5: Int32Array
- 6: Uint32Array
- 7: Float32Array
- 8: Float64Array
- 127: DIMBIN // nested dimention

* 其中data段需要进行内存字节对齐，因此：其长度>=数据长度之和

```


### `version 1`

```

// update: 不限制多维数组的维数，如果超过2维，则自嵌套

ArrayBuffer长度单位是1字节（1 byte）8位（8 bit），因此这里的单位都是 byte

二进制数据分为三个段： | 源信息 | 分段源信息 | 分段数据 |

| meta                              | segments_meta         | data
------------------------------------------------------------------
| x         | x             | x     | x     xxxx    xxxx    | *
| version   | user_version  | len   | type  start   lenth   | data
| uint      | uint          | uint  | unit  unit32  unit32  | *

type:
- 0: Int8Array
- 1: Uint8Array
- 2: Uint8ClampedArray
- 3: Int16Array
- 4: Uint16Array
- 5: Int32Array
- 6: Uint32Array
- 7: Float32Array
- 8: Float64Array
- 127: DIMBIN // nested dimention

* 其中data段需要进行内存字节对齐，因此：其长度>=数据长度之和

```

### `version 0`

```

ArrayBuffer长度单位是1字节（1 byte）8位（8 bit），因此这里的单位都是 byte

二进制数据分为三个段： | 源信息 | 分段源信息 | 分段数据 |

| meta                              | segments_meta         | data
------------------------------------------------------------------
| x         | x             | x     | x     xxxx    xxxx    | *
| version   | user_version  | len   | type  start   lenth   | data
| uint      | uint          | uint  | unit  unit32  unit32  | *

type:
- 0: Int8Array
- 1: Uint8Array
- 2: Uint8ClampedArray
- 3: Int16Array
- 4: Uint16Array
- 5: Int32Array
- 6: Uint32Array
- 7: Float32Array
- 8: Float64Array

* 其中data段需要进行内存字节对齐，因此：其长度>=数据长度之和

```
