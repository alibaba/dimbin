using System;
using System.IO;
using Ali.GeomTuple.V0;

namespace geom_tuple
{
    class Demo
    {
        static void Main(string[] args)
        {
            byte[] buffer = File.ReadAllBytes("./test.geomtuple.dimbin");
            GeomData geom = GeomTuple.Parse(buffer);
            Console.WriteLine(geom);
            AttributeData attr;
            geom.attributes.TryGetValue("position", out attr);
            Console.WriteLine(attr);
            Console.WriteLine(geom.index);
        }
    }
}
