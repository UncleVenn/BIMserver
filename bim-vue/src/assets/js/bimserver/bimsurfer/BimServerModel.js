import {BimServerApiPromise} from "@/assets/js/bimserver/bimserver/bimserverapipromise";

export class BimServerModel {
    constructor(project) {
        this.project = project;
        this.tree = [];
        this.types = [];
        this.length = 0;
    }

    getTree() {
        let node = Object.create(Node.prototype)
        node.init();
        node.sort = true;
        this.buildDecomposedTree(this.project, node);
        return node.children;
    }

    buildDecomposedTree(object, node) {
        let othis = this;
        let name = null;
        if (object.getLongName != null) {
            if (object.getLongName() != null && object.getLongName() !== "") {
                name = object.getLongName();
            }
        }
        if (name == null) {
            if (object.getName() != null && object.getName() !== "") {
                name = object.getName();
            }
        }
        if (name == null) {
            name = "Unknown";
        }
        let data = Object.create(Node.prototype);
        data.init(object.oid, name, object);
        data.type = object.getType();
        if (["IfcProject", "IfcSite", "IfcBuilding", "IfcBuildingStorey", "IfcSpace"].includes(data.type)) {
            data.icon = "el-icon-hierarchy";
        } else {
            data.icon = "el-icon-yuan";
        }
        data.title = data.type + " - " + object.getName();
        this.types.push(data.type);
        node.add(data);
        if (data.type === "IfcBuildingStorey") {
            this.loadBuildingStorey(data, object);
        } else {
            object.getIsDecomposedBy(function (isDecomposedBy) {
                isDecomposedBy.getRelatedObjects(function (relatedObject) {
                    othis.buildDecomposedTree(relatedObject, data);
                });
            }).done(function () {
                if (object.getContainsElements != null) {
                    object.getContainsElements(function (containedElement) {
                        containedElement.getRelatedElements(function (relatedElement) {
                            othis.buildDecomposedTree(relatedElement, data);
                        });
                    });
                }
            });
            if ((object.object._rIsDecomposedBy == null || object.object._rIsDecomposedBy.length === 0) && (object.object._rContainsElements == null || object.object._rContainsElements.length === 0)) {
                data.children = [];
            }
        }
    }

    loadBuildingStorey(node, object) {
        let othis = this;
        let promise = new BimServerApiPromise();
        let createdTypes = {};
        object.getIsDecomposedBy(function (isDecomposedBy) {
            if (isDecomposedBy != null) {
                isDecomposedBy.getRelatedObjects(function (relatedObject) {
                    othis.processRelatedElement(node, relatedObject, createdTypes);
                });
            }
        });
        object.getContainsElements(function (relReferencedInSpatialStructure) {
            relReferencedInSpatialStructure.getRelatedElements(function (relatedElement) {
                othis.processRelatedElement(node, relatedElement, createdTypes);
            }).done(function () {
                object.getIsDecomposedBy(function (isDecomposedBy) {
                    if (isDecomposedBy != null) {
                        isDecomposedBy.getRelatedObjects(function (relatedObject) {
                            othis.processRelatedElement(node, relatedObject, createdTypes);
                        });
                    }
                });
            });
        }).done(function () {
            promise.fire();
        });
        return promise;
    }

    processRelatedElement(parentNode, relatedElement, createdTypes) {
        let typeNode = createdTypes[relatedElement.getType()];
        if (typeNode == null) {
            typeNode = Object.create(Node.prototype);
            typeNode.init(relatedElement.getType() + '-' + relatedElement.oid, this.stripIfc(relatedElement.getType()), relatedElement);
            typeNode.type = "types";
            typeNode.icon = 'el-icon-types';
            createdTypes[relatedElement.getType()] = typeNode;
            parentNode.add(typeNode);
        }
        this.buildDecomposedTree(relatedElement, typeNode);
    }

    stripIfc(input) {
        if (input.startsWith("Ifc")) {
            return input.substring(3);
        } else {
            return input;
        }
    }
}

function Node() {
}

Node.prototype = {
    init: function (id, title, object) {
        this.id = id;
        this.name = title;
        this.object = object;
        this.visible = true;
    },
    add: function (node) {
        node.parent = this;
        if (this.children == null) {
            this.children = [];
        }
        if (this.sort) {
            let found = false;
            for (let i = 0; i < this.children.length; i++) {
                let diff = node.title.localeCompare(this.children[i].title);
                if (diff < 0) {
                    this.children.splice(i, 0, node);
                    found = true;
                    break;
                }
            }
            if (!found) {
                this.children.push(node);
            }
        } else {
            this.children.push(node);
        }
    },

}