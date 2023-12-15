import DIMBIN from 'dimbin'
import { BufferGeometry, BufferAttribute as _BufferAttribute } from 'three'
// import { BufferAttribute as _BufferAttribute } from 'three/src/core/BufferAttribute'
// import { BufferGeometry } from 'three/src/core/BufferGeometry'
import { TypedArray } from 'three/src/Three.d'

const THREE = {
    BufferAttribute: _BufferAttribute,
    BufferGeometry,
}

// 合并
interface BufferAttribute extends _BufferAttribute {
    isBufferAttribute: boolean
    isInterleavedBufferAttribute: boolean
    __committed_version: number
}

interface AttributeData {
    array: TypedArray
    name: string
    version: number
    itemSize: number
    count: number
    updateRange: {
        offset: number
        count: number
    }
}
export interface GeomData {
    attributes: Map<string, AttributeData>
    index?: AttributeData
    drawRange: {
        start: number
        count: number
    }
    userData?: string
}

/**
 * 把 THREE.BufferGeometry 序列化成 arraybuffer
 * @param geom
 */
export function tuplelize(geom: THREE.BufferGeometry): ArrayBuffer {
    // v0
    const attrNameSeg = []
    const attrDataSeg = []
    const attrPropsSeg = []
    const propsSeg = []
    const result: any[] = [attrNameSeg, attrDataSeg, attrPropsSeg, propsSeg]

    const names = []

    // 找出所有修改了的BufferAttribute，包括index
    const attrEntries: any = Object.entries(geom.attributes)
    geom.index && attrEntries.push(['index', geom.index])

    for (let i = 0; i < attrEntries.length; i++) {
        const [name, attr]: [string, BufferAttribute] = attrEntries[i]

        if (!attr.isBufferAttribute) {
            console.error('currently only BufferAttribute is unsupported')
            continue
        }

        // NOTE 对 InterleavedBufferAttribute 的兼容性处理
        // const dataAttr = attr.isInterleavedBufferAttribute ? attr.data : attr
        const dataAttr = attr
        // 记录一个__committed_version，来判断是否需要更新
        // needsUpdate不可读
        if (dataAttr.version !== dataAttr.__committed_version) {
            dataAttr.__committed_version = dataAttr.version

            attrDataSeg.push(attr.array)
            // attrNameSeg.push(str2array(name))
            names.push(name)
            attrPropsSeg.push([
                attr.version,
                attr.itemSize,
                attr.count,
                attr.updateRange.offset,
                attr.updateRange.count,
            ])
        }
    }

    propsSeg.push(geom.drawRange.start)
    propsSeg.push(geom.drawRange.count)

    // console.log(result)

    result[0] = DIMBIN.stringsSerialize(names)

    return DIMBIN.serialize(result, 0)
}

/**
 * 把 arrayBuffer 反序列化成 GeomData（通用网格数据）
 * @param buffer
 */
export function parse(buffer: ArrayBuffer): GeomData {
    const dim: any[] = DIMBIN.parse(buffer)
    // console.log(dim)
    const attributes: Map<string, AttributeData> = new Map()

    dim[0] = DIMBIN.stringsParse(dim[0])

    dim[0].forEach((name, index: number) => {
        // console.log(name)
        const array = dim[1][index] as TypedArray
        const props = dim[2][index]
        attributes.set(name, {
            name,
            array,
            version: props[0],
            itemSize: props[1],
            count: props[2],
            updateRange: {
                offset: props[3],
                count: props[4],
            },
        })
    })

    let index = attributes.get('index')
    attributes.delete('index')

    return {
        attributes,
        index,
        drawRange: {
            start: dim[3][0] as number,
            count: dim[3][1] as number,
        },
        // userData: string
    }
}

/**
 * 把 arrayBuffer 或者 GeomData 转换成 THREE.BufferGeometry
 * @param geom
 */
export function parseBufferGeometry(geom: GeomData | ArrayBuffer): THREE.BufferGeometry {
    if (geom instanceof ArrayBuffer) geom = parse(geom)

    const geometry = new THREE.BufferGeometry()
    geometry.drawRange = geom.drawRange

    geom.attributes.forEach((attribute, name) => {
        const a = new THREE.BufferAttribute(attribute.array, attribute.itemSize)
        a.version = attribute.version
        a.updateRange = attribute.updateRange
        geometry.addAttribute(name, a)
    })

    if (geom.index && geom.index.array.length) {
        geometry.setIndex(new THREE.BufferAttribute(geom.index.array, 1))
        geometry.index.version = geom.index.version
        geometry.index.updateRange = geom.index.updateRange
    }

    return geometry
}
