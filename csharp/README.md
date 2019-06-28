# dimbin C sharp

DIMBIN 的 C#版本

接口与 dimbin.js 一致

## useage

```csharp
using System;
using System.Collections.Generic;
using Ali.DIMBIN.V3;

namespace Test
{
    class Test
    {
        static void Main(string[] args)
        {
            byte[] buffer = System.IO.File.ReadAllBytes("./api.dimbin");

            // byte[] buffer = new byte[10];
            List<dynamic> result = Dimbin.Parse(buffer);

            Meta meta = Dimbin.GetMeta(buffer);

            Console.Write(meta);
            // Meta:
            // --Version=3
            // --BigEndian=False
            // --SegMetaBytes=9
            // --SegMetaStart=15
            // --MagicNum=0
            // --Len=8

            // float
            Console.WriteLine(result[0][1]);
            // 1

            // int16
            Console.WriteLine(result[5][0]);
            // 16

            // nested
            Console.WriteLine(result[7][0][0][2]);
            // -2
        }
    }
}
```

## API

### `Dimbin.GetMeta`

获取原数据

```csharp
public struct Meta
{
    public byte Version;
    public bool BigEndian;
    public byte SegMetaBytes;
    public uint SegMetaStart;
    public float MagicNum;
    public uint Len;
}
```

-   @param `{byte[]} buffer`
-   @return `{Meta} meta`

### `Dimbin.Parse`

解析二进制数据，这里使用 List<dynamic>来表示多维数组: `List< List | Array<int|float|double|...> >`

-   @param `{byte[]} buffer`
-   @return `{List<dynamic>} multiDemensionArray`
