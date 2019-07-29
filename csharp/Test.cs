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

            Console.WriteLine(result[0]);
            Console.WriteLine(result[7][0]);

            Console.WriteLine(Dimbin.StringsParse(result[8])[0]);

            // // float
            // Console.WriteLine(result[0][0]);

            // // int16
            // Console.WriteLine(result[5][0]);

            // // nested
            // Console.WriteLine(result[7][0][0][2]);
        }
    }
}