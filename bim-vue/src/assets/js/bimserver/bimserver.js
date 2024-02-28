import {BimServerClient} from "./bimserver/bimserverclient.js";
import {BimServerApiPromise} from "./bimserver/bimserverapipromise.js";
import {BimServerViewer} from "./bimsurfer/bimserverviewer.js";
import {BimServerModel} from "./bimsurfer/BimServerModel.js";

//cpb6XhFDWsXfhaz
class Bimserver {
    constructor(address, username, password) {
        this.bimServerApiPromise = new BimServerApiPromise();
        this.models = [];
        this.properties = [];
        this.apiClient = new BimServerClient(address);
        this.view = null;
        this.tree = null;
        this.colorSet = null;
        this.apiClient.init().then(() => {
            this.apiClient.login(username, password, (token) => {
                this.bimServerApiPromise.fire();
            })
        });
    }

    getAllProjects() {
        return new Promise((resolve, reject) => {
            this.apiClient.call("ServiceInterface", "getAllProjects", {
                onlyTopLevel: true,
                onlyActive: true
            }, (projects) => {
                resolve(projects)
            })
        })
    }

    getProjectsByName(name) {
        return new Promise((resolve, reject) => {
            this.apiClient.call("ServiceInterface", "getProjectsByName", {
                name: name,
            }, (projects) => {
                resolve(projects[0])
            })
        });
    }

    getAllRelatedProjects(poid) {
        return new Promise((resolve, reject) => {
            this.apiClient.call("ServiceInterface", "getAllRelatedProjects", {poid: poid}, (projects) => {
                this.projects = projects;
                resolve(projects)
            })
        })
    }

    renderCanvasByProject(project, domNode, progressListener, settings = {}) {
        let bimServerViewer = new BimServerViewer(settings, domNode, null, null, null);
        bimServerViewer.setProgressListener(progressListener);
        bimServerViewer.loadModel(this.apiClient, project, null);
        this.view = bimServerViewer;
    }

    /**
     * 颜色用的是sRGBA
     * @param params 渲染的构建以及颜色 [{'id'=>'',color=>[r,g,b,a]}]
     */
    renderColor(params) {
        this.colorSet = params;
        for (let param of params) {
            this.view.viewer.setColor([param.id], param.color);
        }
    }

    resetColorSet(id) {
        let find = this.colorSet.find((item) => {
            return item.id === id
        });
        if (find) {
            this.view.viewer.setColor([id], find.color);
        } else {
            this.view.viewer.resetColor([id]);
        }
    }

    /**
     * 通过ID控制控件显隐
     * @param id
     * @param visible
     * @param sort
     * @param fireEvent
     */
    hidden(id, visible, sort = true, fireEvent = true) {
        this.view.setVisibility(id, visible, sort, fireEvent)
    }

    /**
     * @param projectName 项目名称
     * @param source file | remoteUrl
     * @param progress function
     * @param success function
     * @param error function
     */
    checkIn(projectName, source, progress, success, error) {
        let isRemoteUrl = () => {
            return typeof source === 'string' && source.startsWith("http")
        }
        let upload = (project) => {
            let path = isRemoteUrl() ? source : source.name;
            let lastIndex = path.lastIndexOf(".");
            if (lastIndex !== -1) {
                let extension = path.substring(lastIndex + 1);
                this.apiClient.call("ServiceInterface", "getSuggestedDeserializerForExtension", {
                    extension: extension,
                    poid: project.oid
                }, (data) => {
                    let deserializerOid = data.oid;
                    if (isRemoteUrl()) {
                        this.apiClient.callWithFullIndication("ServiceInterface", "checkinFromUrlAsync", {
                            deserializerOid: deserializerOid,
                            comment: path,
                            merge: false,
                            poid: project.oid,
                            url: source,
                            fileName: null
                        }, (data) => {
                            let progressDoneHandled = false;
                            let progressHandler = (topicId, state) => {
                                if (state.state === "AS_ERROR") {
                                    this.apiClient.unregisterProgressHandler(topicId, progressHandler);
                                    error(state.errors)
                                } else {
                                    if (state.progress !== -1) {
                                        progress(parseInt(state.progress));
                                    }
                                    if (state.state === "FINISHED") {
                                        if (!progressDoneHandled) {
                                            progressDoneHandled = true;
                                            this.apiClient.callWithNoIndication("ServiceInterface", "cleanupLongAction", {topicId: topicId}, function () {
                                            }).done(() => {
                                                this.apiClient.unregister(progressHandler);
                                                success();
                                            });
                                        }
                                    }
                                }

                            }
                            this.apiClient.registerProgressHandler(data, progressHandler);
                        });
                    } else {
                        this.apiClient.initiateCheckin(project, deserializerOid, (topicId) => {
                            this.apiClient.checkin(topicId, project, path, source, deserializerOid, progress, success, error);
                        }, error)
                    }
                })
            }
        }
        this.getProjectsByName(projectName).then(project => {
            if (project === undefined) {
                this.addProject(projectName, "ifc2x3tc1").then(project => {
                    upload(project)
                })
            } else {
                upload(project)
            }
        });


    }

    /**
     *
     * @param projectName
     * @param schema ifc2x3tc1 | ifc4
     */
    addProject(projectName, schema) {
        return new Promise((resolve, reject) => {
            this.apiClient.call("ServiceInterface", "addProject", {
                projectName: projectName,
                schema: schema
            }, (project) => {
                resolve(project)
            }, err => {
                reject(err);
            })
        });
    }

    getArtifactInformation(project, deep) {
        return new Promise((resolve, reject) => {
            this.apiClient.getModel(project.oid, project.lastRevisionId, project.schema, deep, (model) => {
                this.models[project.lastRevisionId] = model;
                this._preloadModel(project).done(() => {
                    let bimServerModel = new BimServerModel(model);
                    resolve(bimServerModel)
                })
            })
        })
    }

    getArtifactProperties(project, id) {
        return new Promise((resolve, reject) => {
            if (this.properties[id]) {
                resolve(this.properties[id]);
            }
            let promise = new BimServerApiPromise(2);
            promise.done(() => {
                this.properties[id] = result;
                resolve(result)
            })
            let result = {};
            let model = this.models[project.lastRevisionId];
            model.get(id, (object) => {
                result[object.getType()] = {
                    Name: object.getName(),
                    Description: object.getDescription(),
                    "Owner History": object.object._rOwnerHistory,
                    GUID: object.getGlobalId(),
                    "UUID (Server)": object.object._u,
                };
                if(object.getGeometry){
                    object.getGeometry(function (geometryInfo) {
                        if (geometryInfo != null) {
                            var knownTranslations = {
                                TOTAL_SURFACE_AREA: "Total surface area",
                                TOTAL_SHAPE_VOLUME: "Total shape volume",
                                SURFACE_AREA_ALONG_X: "Surface area along X axis",
                                SURFACE_AREA_ALONG_Y: "Surface area along Y axis",
                                SURFACE_AREA_ALONG_Z: "Surface area along Z axis",
                                WALKABLE_SURFACE_AREA: "Walkable surface area",
                                LARGEST_FACE_AREA: "Largest face area",
                                BOUNDING_BOX_SIZE_ALONG_X: "Bounding box size along X axis",
                                BOUNDING_BOX_SIZE_ALONG_Y: "Bounding box size along Y axis",
                                BOUNDING_BOX_SIZE_ALONG_Z: "Bounding box size along Z axis",
                                LARGEST_FACE_DIRECTION: "Largest face direction"
                            };
                            if (geometryInfo.object.additionalData != null) {
                                let calc = {};
                                var additionalData = JSON.parse(geometryInfo.object.additionalData);
                                for (const key in additionalData) {
                                    let value = additionalData[key];
                                    calc[knownTranslations[key]] = value;
                                }
                                result['Calculated'] = calc;
                            }
                        }
                        promise.dec();
                    });
                }
                object.getIsDefinedBy(function (isDefinedBy, length) {
                    if (isDefinedBy.getType() === "IfcRelDefinesByProperties") {
                        isDefinedBy.getRelatingPropertyDefinition(function (propertySet) {
                            if (propertySet.getType() === "IfcPropertySet") {
                                let prop = {}
                                propertySet.getHasProperties(function (property) {
                                    property.getNominalValue(value => {
                                        prop[property.getName()] = value == null ? "" : value._v;
                                    }).done(() => {
                                        result[propertySet.getName()] = prop;
                                    })
                                }).done(() => {
                                    promise.dec()
                                });
                            }
                        })
                    }
                })
            })
        })
    }


    // private method
    _preloadModel(project) {
        console.time("preloadModel " + project.lastRevisionId);
        var promise = new BimServerApiPromise();
        let model = this.models[project.lastRevisionId];
        if (model == null) {
            console.log("no model", model);
        } else {
            if (model.isPreloaded) {
                promise.fire();
                return promise;
            } else {
                if (project.schema == "ifc2x3tc1") {
                    var preLoadQuery = {
                        defines: {
                            Representation: {
                                type: "IfcProduct",
                                fields: ["Representation", "geometry"]
                            },
                            ContainsElementsDefine: {
                                type: "IfcSpatialStructureElement",
                                field: "ContainsElements",
                                include: {
                                    type: "IfcRelContainedInSpatialStructure",
                                    field: "RelatedElements",
                                    includes: [
                                        "IsDecomposedByDefine",
                                        "ContainsElementsDefine",
                                        "Representation"
                                    ]
                                }
                            },
                            IsDecomposedByDefine: {
                                type: "IfcObjectDefinition",
                                field: "IsDecomposedBy",
                                include: {
                                    type: "IfcRelDecomposes",
                                    field: "RelatedObjects",
                                    includes: [
                                        "IsDecomposedByDefine",
                                        "ContainsElementsDefine",
                                        "Representation"
                                    ]
                                }
                            }
                        },
                        queries: [
                            {
                                type: "IfcProject",
                                includes: [
                                    "IsDecomposedByDefine",
                                    "ContainsElementsDefine"
                                ]
                            },
                            {
                                type: {
                                    name: "IfcRepresentation",
                                    includeAllSubTypes: true
                                }
                            },
                            {
                                type: {
                                    name: "IfcProductRepresentation",
                                    includeAllSubTypes: true
                                }
                            },
                            {
                                type: "IfcPresentationLayerWithStyle"
                            },
                            {
                                type: {
                                    name: "IfcProduct",
                                    includeAllSubTypes: true
                                }
                            },
                            {
                                type: "IfcProductDefinitionShape"
                            },
                            {
                                type: "IfcPresentationLayerAssignment"
                            },
                            {
                                type: "IfcRelAssociatesClassification",
                                includes: [
                                    {
                                        type: "IfcRelAssociatesClassification",
                                        field: "RelatedObjects"
                                    },
                                    {
                                        type: "IfcRelAssociatesClassification",
                                        field: "RelatingClassification"
                                    }
                                ]
                            },
                            {
                                type: "IfcSIUnit"
                            },
                            {
                                type: "IfcPresentationLayerAssignment"
                            }
                        ]
                    };
                } else if (project.schema == "ifc4") {
                    var preLoadQuery = {
                        defines: {
                            Representation: {
                                type: "IfcProduct",
                                fields: ["Representation", "geometry"]
                            },
                            ContainsElementsDefine: {
                                type: "IfcSpatialStructureElement",
                                field: "ContainsElements",
                                include: {
                                    type: "IfcRelContainedInSpatialStructure",
                                    field: "RelatedElements",
                                    includes: [
                                        "IsDecomposedByDefine",
                                        "ContainsElementsDefine",
                                        "Representation"
                                    ]
                                }
                            },
                            IsDecomposedByDefine: {
                                type: "IfcObjectDefinition",
                                field: "IsDecomposedBy",
                                include: {
                                    type: "IfcRelAggregates",
                                    field: "RelatedObjects",
                                    includes: [
                                        "IsDecomposedByDefine",
                                        "ContainsElementsDefine",
                                        "Representation"
                                    ]
                                }
                            }
                        },
                        queries: [
                            {
                                type: "IfcProject",
                                includes: [
                                    "IsDecomposedByDefine",
                                    "ContainsElementsDefine"
                                ]
                            },
                            {
                                type: {
                                    name: "IfcRepresentation",
                                    includeAllSubTypes: true
                                }
                            },
                            {
                                type: {
                                    name: "IfcProductRepresentation",
                                    includeAllSubTypes: true
                                }
                            },
                            {
                                type: "IfcPresentationLayerWithStyle"
                            },
                            {
                                type: {
                                    name: "IfcProduct",
                                    includeAllSubTypes: true
                                },
                            },
                            {
                                type: "IfcProductDefinitionShape"
                            },
                            {
                                type: "IfcPresentationLayerAssignment"
                            },
                            {
                                type: "IfcRelAssociatesClassification",
                                includes: [
                                    {
                                        type: "IfcRelAssociatesClassification",
                                        field: "RelatedObjects"
                                    },
                                    {
                                        type: "IfcRelAssociatesClassification",
                                        field: "RelatingClassification"
                                    }
                                ]
                            },
                            {
                                type: "IfcSIUnit"
                            },
                            {
                                type: "IfcPresentationLayerAssignment"
                            }
                        ]
                    };
                }
                model.query(preLoadQuery, function (loaded) {
                }).done(function () {
                    console.timeEnd("preloadModel " + project.lastRevisionId);
                    setTimeout(function () {
                        model.isPreloaded = true;
                        promise.fire();
                    }, 0);
                });
            }
        }
        return promise;
    }

}

const bimserver = new Bimserver("http://172.16.16.222:8082/", "admin@bimserver.com", "123456");
export default bimserver;

