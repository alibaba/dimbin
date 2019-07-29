using System;
using System.Collections.Generic;
using Ali.DIMBIN.V3;

namespace Ali.GeomTuple.V0
{
    public struct AttributeData
    {
        public dynamic array;
        public string name;
        public uint version;
        public uint itemSize;
        public uint count;
        public uint[] updateRange;

        public override string ToString() {
            return $"AttributeData:\n"
            + $"--name={name}\n"
            + $"--itemSize={itemSize}\n"
            + $"--count={count}\n";
        }
    }

    public struct GeomData
    {
        public Dictionary<string, AttributeData> attributes;
        public AttributeData index;
        public uint[] drawRange;
        public string userData;

        public override string ToString() {
            var result = "GeomData:\n";

            foreach(KeyValuePair<string, AttributeData> entry in attributes) 
            {
                result += $"--AttributeData:{entry.Value.name}\n";
            }
            return result;
        }
    }

    static class GeomTuple
    {
        static public GeomData Parse(byte[] buffer)
        {
            List<dynamic> dim = Dimbin.Parse(buffer);

            Dictionary<string, AttributeData> attributes = new Dictionary<string, AttributeData>();

            List<String> names = Dimbin.StringsParse(dim[0]);

            for (int i = 0; i < names.Count; i++)
            {
                var array = dim[1][i];
                var props = dim[2][i];

                AttributeData attr;
                attr.array = array;
                attr.name = names[i];
                attr.version = (uint)props[0];
                attr.itemSize = (uint)props[1];
                attr.count = (uint)props[2];
                attr.updateRange = new uint[] { (uint)props[3], (uint)props[4] };
                attributes.Add(names[i], attr);
            }

            AttributeData index;
            attributes.TryGetValue("index", out index);
            attributes.Remove("index");

            GeomData result;
            result.attributes = attributes;
            result.index = index;
            result.drawRange = new uint[] { (uint)dim[3][0], (uint)dim[3][1] };
            result.userData = "";

            return result;
        }
    }
}