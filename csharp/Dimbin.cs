using System;
using System.Collections;
using System.Collections.Generic;

namespace Ali.DIMBIN.V3
{
    static class CONSTANTS
    {
        public static readonly Type[] TYPES = new Type[128];
        public static readonly int[] BYTES_PER_ELEMENT = new int[128];

        static CONSTANTS()
        {
            TYPES.SetValue(typeof(sbyte), 0);
            TYPES.SetValue(typeof(byte), 1);
            TYPES.SetValue(typeof(byte), 2);
            TYPES.SetValue(typeof(Int16), 3);
            TYPES.SetValue(typeof(UInt16), 4);
            TYPES.SetValue(typeof(Int32), 5);
            TYPES.SetValue(typeof(UInt32), 6);
            TYPES.SetValue(typeof(float), 7);
            TYPES.SetValue(typeof(double), 8);
            TYPES.SetValue(typeof(byte), 127);

            BYTES_PER_ELEMENT.SetValue(1, 0);
            BYTES_PER_ELEMENT.SetValue(1, 1);
            BYTES_PER_ELEMENT.SetValue(1, 2);
            BYTES_PER_ELEMENT.SetValue(2, 3);
            BYTES_PER_ELEMENT.SetValue(2, 4);
            BYTES_PER_ELEMENT.SetValue(4, 5);
            BYTES_PER_ELEMENT.SetValue(4, 6);
            BYTES_PER_ELEMENT.SetValue(4, 7);
            BYTES_PER_ELEMENT.SetValue(8, 8);
            BYTES_PER_ELEMENT.SetValue(1, 127);
        }

        public enum TYPES_MAP
        {
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
    }

    public struct Meta
    {
        public byte Version;
        public bool BigEndian;
        public byte SegMetaBytes;
        public uint SegMetaStart;
        public float MagicNum;
        public uint Len;

        public override string ToString()
        {
            return $"Meta:\n"
            + $"--Version={Version}\n"
            + $"--BigEndian={BigEndian}\n"
            + $"--SegMetaBytes={SegMetaBytes}\n"
            + $"--SegMetaStart={SegMetaStart}\n"
            + $"--MagicNum={MagicNum}\n"
            + $"--Len={Len}\n";
        }
    }

    class IncompatibleVersionException : ApplicationException
    {
        public IncompatibleVersionException(string message) : base(message) { }
    }

    static class Dimbin
    {
        // 获取元数据
        static public Meta GetMeta(byte[] buffer)
        {
            Meta meta;

            meta.Version = buffer[0];
            meta.BigEndian = buffer[1] == 1;

            if (meta.BigEndian || !BitConverter.IsLittleEndian)
            {
                throw new IncompatibleVersionException("BigEndian is Not supported by current version");
            }

            meta.SegMetaBytes = buffer[2];
            meta.SegMetaStart = BitConverter.ToUInt32(buffer, 3);
            meta.MagicNum = BitConverter.ToUInt32(buffer, 7);
            meta.Len = BitConverter.ToUInt32(buffer, 11);

            return meta;
        }

        // 解析
        static public List<dynamic> Parse(byte[] buffer)
        {
            Meta meta = GetMeta(buffer);
            if (meta.Version != 3)
            {
                throw new IncompatibleVersionException($"Version of this data ({meta.Version}) is not supported by this program (v3)");
            }

            List<dynamic> result = new List<dynamic>();

            int metaStart = (int)meta.SegMetaStart;

            for (var i = 0; i < meta.Len; i++)
            {
                int type = (int)buffer[metaStart];
                int dataStart = (int)BitConverter.ToUInt32(buffer, metaStart + 1);
                int length = (int)BitConverter.ToUInt32(buffer, metaStart + 5);

                if (type == 127)
                {
                    var subBuffer = new byte[length];
                    Buffer.BlockCopy(buffer, dataStart, subBuffer, 0, length);
                    result.Add(Parse(subBuffer));
                }
                else
                {
                    int BYTES_PER_ELEMENT = CONSTANTS.BYTES_PER_ELEMENT[type];

                    var segment = Array.CreateInstance(CONSTANTS.TYPES[type], length);
                    Buffer.BlockCopy(buffer, dataStart, segment, 0, (length * BYTES_PER_ELEMENT));
                    result.Add(segment);
                }

                metaStart += meta.SegMetaBytes;
            }

            return result;
        }

        // 解析字符串
        static public List<String> StringsParse(byte[] buffer)
        {
            List<String> result = new List<String>();

            int version = (int)BitConverter.ToUInt32(buffer, 0);
            int length = (int)BitConverter.ToUInt32(buffer, 4);

            var i = 0;
            var pointer = 4 + 4 + length * 4;

            while (i < length)
            {
                var len = (int)BitConverter.ToUInt32(buffer, 8 + 4 * i++);

                var str = System.Text.Encoding.UTF8.GetString(buffer, pointer, len);
                pointer += len;

                result.Add(str);
            }

            return result;
        }
    }
}
