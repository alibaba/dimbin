"use strict";
exports.__esModule = true;
var dimbin_1 = require("dimbin");
var three_1 = require("three");
var THREE = {
    BufferAttribute: three_1.BufferAttribute,
    BufferGeometry: three_1.BufferGeometry
};
/**
 * 把 THREE.BufferGeometry 序列化成 arraybuffer
 * @param geom
 */
function tuplelize(geom) {
    // v0
    var attrNameSeg = [];
    var attrDataSeg = [];
    var attrPropsSeg = [];
    var propsSeg = [];
    var result = [attrNameSeg, attrDataSeg, attrPropsSeg, propsSeg];
    var names = [];
    // 找出所有修改了的BufferAttribute，包括index
    var attrEntries = Object.entries(geom.attributes);
    geom.index && attrEntries.push(['index', geom.index]);
    for (var i = 0; i < attrEntries.length; i++) {
        var _a = attrEntries[i], name_1 = _a[0], attr = _a[1];
        if (!attr.isBufferAttribute) {
            console.error('currently only BufferAttribute is unsupported');
            continue;
        }
        // NOTE 对 InterleavedBufferAttribute 的兼容性处理
        // const dataAttr = attr.isInterleavedBufferAttribute ? attr.data : attr
        var dataAttr = attr;
        // 记录一个__committed_version，来判断是否需要更新
        // needsUpdate不可读
        if (dataAttr.version !== dataAttr.__committed_version) {
            dataAttr.__committed_version = dataAttr.version;
            attrDataSeg.push(attr.array);
            // attrNameSeg.push(str2array(name))
            names.push(name_1);
            attrPropsSeg.push([
                attr.version,
                attr.itemSize,
                attr.count,
                attr.updateRange.offset,
                attr.updateRange.count,
            ]);
        }
    }
    propsSeg.push(geom.drawRange.start);
    propsSeg.push(geom.drawRange.count);
    // console.log(result)
    result[0] = dimbin_1["default"].stringsSerialize(names);
    return dimbin_1["default"].serialize(result, 0);
}
exports.tuplelize = tuplelize;
/**
 * 把 arrayBuffer 反序列化成 GeomData（通用网格数据）
 * @param buffer
 */
function parse(buffer) {
    var dim = dimbin_1["default"].parse(buffer);
    // console.log(dim)
    var attributes = new Map();
    dim[0] = dimbin_1["default"].stringsParse(dim[0]);
    dim[0].forEach(function (name, index) {
        // console.log(name)
        var array = dim[1][index];
        var props = dim[2][index];
        attributes.set(name, {
            name: name,
            array: array,
            version: props[0],
            itemSize: props[1],
            count: props[2],
            updateRange: {
                offset: props[3],
                count: props[4]
            }
        });
    });
    var index = attributes.get('index');
    attributes["delete"]('index');
    return {
        attributes: attributes,
        index: index,
        drawRange: {
            start: dim[3][0],
            count: dim[3][1]
        }
    };
}
exports.parse = parse;
/**
 * 把 arrayBuffer 或者 GeomData 转换成 THREE.BufferGeometry
 * @param geom
 */
function parseBufferGeometry(geom) {
    if (geom instanceof ArrayBuffer)
        geom = parse(geom);
    var geometry = new THREE.BufferGeometry();
    geometry.drawRange = geom.drawRange;
    geom.attributes.forEach(function (attribute, name) {
        var a = new THREE.BufferAttribute(attribute.array, attribute.itemSize);
        a.version = attribute.version;
        a.updateRange = attribute.updateRange;
        geometry.addAttribute(name, a);
    });
    if (geom.index && geom.index.array.length) {
        geometry.setIndex(new THREE.BufferAttribute(geom.index.array, 1));
        geometry.index.version = geom.index.version;
        geometry.index.updateRange = geom.index.updateRange;
    }
    return geometry;
}
exports.parseBufferGeometry = parseBufferGeometry;
//# sourceMappingURL=GeomTuple.js.map