import { TypedArray } from 'three/src/Three.d';
interface AttributeData {
    array: TypedArray;
    name: string;
    version: number;
    itemSize: number;
    count: number;
    updateRange: {
        offset: number;
        count: number;
    };
}
export interface GeomData {
    attributes: Map<string, AttributeData>;
    index?: AttributeData;
    drawRange: {
        start: number;
        count: number;
    };
    userData?: string;
}
/**
 * 把 THREE.BufferGeometry 序列化成 arraybuffer
 * @param geom
 */
export declare function tuplelize(geom: THREE.BufferGeometry): ArrayBuffer;
/**
 * 把 arrayBuffer 反序列化成 GeomData（通用网格数据）
 * @param buffer
 */
export declare function parse(buffer: ArrayBuffer): GeomData;
/**
 * 把 arrayBuffer 或者 GeomData 转换成 THREE.BufferGeometry
 * @param geom
 */
export declare function parseBufferGeometry(geom: GeomData | ArrayBuffer): THREE.BufferGeometry;
export {};
