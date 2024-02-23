export class BimServerModel {
    constructor(apiModel) {
        this.api = apiModel.bimServerApi;
        this.apiModel = apiModel;
        this.tree = null;
        this.data = [];
        this.init();
    }

    init() {
        var self = this;
        var entities = {
            'IfcRelDecomposes': 1,
            'IfcRelAggregates': 1,
            'IfcRelContainedInSpatialStructure': 1,
            'IfcRelFillsElement': 1,
            'IfcRelVoidsElement': 1
        }

        // Create a mapping from id->instance
        var instance_by_id = {};
        var objects = [];

        for (var e in this.apiModel.objects) {
            // The root node in a dojo store should have its parent
            // set to null, not just something that evaluates to false
            var o = this.apiModel.objects[e].object;
            o.parent = null;
            instance_by_id[o._i] = o;
            objects.push(o);
        }
        

        // Filter all instances based on relationship entities
        var relationships = objects.filter(function (o) {
            return entities[o._t];
        });

        // Construct a tuple of {parent, child} ids
        var parents = relationships.map(function (o) {
            var ks = Object.keys(o);
            var related = ks.filter(function (k) {
                return k.indexOf('Related') !== -1;
            });
            var relating = ks.filter(function (k) {
                return k.indexOf('Relating') !== -1;
            });
            return [o[relating[0]], o[related[0]]];
        });

        var is_array = function (o) {
            return Object.prototype.toString.call(o) === '[object Array]';
        }
        var visited = {};
        parents.forEach(function (a) {
            // Relationships in IFC can be one to one/many
            var ps = is_array(a[0]) ? a[0] : [a[0]];
            var cs = is_array(a[1]) ? a[1] : [a[1]];
            for (var i = 0; i < ps.length; ++i) {
                for (var j = 0; j < cs.length; ++j) {
                    // Lookup the instance ids in the mapping
                    var p = instance_by_id[ps[i]._i];
                    var c = instance_by_id[cs[j]._i];

                    // parent, id, hasChildren are significant attributes in a dojo store
                    c.parent = p.id = p._i;
                    c.id = c._i;
                    p.hasChildren = true;

                    // Make sure to only add instances once
                    if (!visited[c.id]) {
                        self.data.push(c);
                    }
                    if (!visited[p.id]) {
                        self.data.push(p);
                    }
                    visited[p.id] = visited[c.id] = true;
                }
            }
        });
    }

    make_element(o, fn) {
        fn = fn || function (o) {
            return o;
        };
        return fn({
            name: o.Name,
            id: o.id,
            guid: o.GlobalId,
            parent: o.parent,
            gid: (o._rgeometry == null ? null : o._rgeometry._i)
        });
    }

    getList(fn = null) {
        return this.data.map(e => {
            return this.make_element(e, fn)
        });
    }

    getTree(fn = null) {
        var self = this;
        var fold = (function () {
            var root = null;
            return function (li) {
                var by_oid = {};
                li.forEach(function (elem) {
                    by_oid[elem.id] = elem;
                });
                li.forEach(function (elem) {
                    if (elem.parent === null) {
                        root = elem;
                    } else {
                        var p = by_oid[elem.parent];
                        (p.children || (p.children = [])).push(elem);
                    }
                });
                return root;
            }
        })();
        return fold(self.data.map(e => {
            return self.make_element(e, fn)
        }));
    }

}
