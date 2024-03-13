<script>
import ElVirtualTree from '@/components/el-virtual-tree';

export default {
    props: {
        projectName: {
            type: String,
        },
        renderColor: {
            type: Array,
            default: () => {
                return []
            }
        }
    },
    components: {
        ElVirtualTree
    },
    data() {
        return {
            tree: [],
            pickId: null,
            loading: false,
            height: 0,
            loadingText: "加载中...",
            currentNodeKey: null,
            artifactId: null,
            defaultProps: {
                children: 'children',
                label: 'name',
            },
            showEye: true,
        }
    },
    created() {
        this.init()
    },
    watch: {
        projectName(val, oval) {
            this.init();
            if (oval != null) {
                this.$bus.$off(`${oval}-view-selected`, this.viewSelectedHandler);
            }
        }
    },
    destroyed() {
        this.$bus.$off(`${this.projectName}-view-selected`, this.viewSelectedHandler);
    },
    methods: {
        explandNode(node) {
            if (!node.isLeaf || !node.expanded)
                node.expand();
            if (node.parent != null) {
                this.explandNode(node.parent)
            }
        },
        viewSelectedHandler(id) {
            let node = this.$bimserver.tree.getNode(id);
            this.$bimserver.tree.setCurrentNode(node.data);
            this.explandNode(node);
            this.$nextTick(() => {
                let res = this.findNodeIndex(node.data, this.tree);
                let visualList = this.$refs['el-virtual-tree'].$refs['virtual-list'];
                visualList.scrollToIndex(res.index - Math.floor((this.height / 22) / 3));
            })
        },
        initListener() {
            this.$bus.$on(`${this.projectName}-view-selected`, this.viewSelectedHandler)
        },
        init() {
            if (this.projectName !== null) {
                this.loading = true;
                this.initListener();
                this.$bimserver.bimServerApiPromise.done(() => {
                    this.$bimserver.getProjectsByName(this.projectName).then(project => {
                        this.$bimserver.getArtifactInformation(project, false).then(result => {
                            this.tree = result.getTree();
                            //启用虚拟树
                            this.height = this.$refs['scroll-bar'].clientHeight;
                            this.$bimserver.tree = this.$refs['el-virtual-tree'];
                            this.showEye = this.$bimserver.view !== null;
                            this.loading = false;
                        })
                    })
                })
            }
        },
        setVisibility(node, visible) {
            node.data.visible = visible;
            if (node.childNodes.length > 0) {
                //父级变化 改变所有子级的状态
                node.childNodes.forEach(child => {
                    this.setVisibility(child, visible);
                })
            }
            this.$bimserver.setVisibility([node.data.id], visible);
        },
        handleNodeChange(data, node, self) {
            if (node.childNodes.length === 0) {
                this.$bus.$emit(`${this.projectName}-tree-selected`, data.id)
            }
            this.$bus.$emit(`${this.projectName}-artifactId-selected`, data.id)
        },
        getNodeColor(data) {
            let id = data.id;
            let find = this.renderColor.find((item) => {
                return Array.isArray(item.id) ? item.id.includes(id) : item.id === id;
            });
            if (find && data.children.length === 0) {
                let color = find.color;
                return (`color(srgb ${color[0]} ${color[1]} ${color[2]})`)
            }
        },
        findNodeIndex(data, list) {
            let index = 0;
            let findFlag = false;
            //未找到
            for (let i = 0; i < list.length; i++) {
                let item = list[i];
                index++;
                if (data.id === item.id) {
                    findFlag = true;
                    break;
                }
                let node = this.$bimserver.tree.getNode(item.id);
                if (node.expanded) {
                    let res = this.findNodeIndex(data, item.children);
                    index += res.index;
                    if (res.find) {
                        findFlag = true;
                        break;
                    }
                }
            }
            return {index: index, find: findFlag};
        },
    }
}
</script>

<template>
    <div
        ref="scroll-bar"
        class="scrollbar"
        v-loading="loading"
        :element-loading-text="loadingText"
    >
        <el-virtual-tree
            :height="height"
            render-after-expand
            v-show="tree.length>0"
            ref="el-virtual-tree" :data="tree"
            @current-change="handleNodeChange"
            :default-expand-all="false"
            highlight-current node-key="id"
            :current-node-key="currentNodeKey"
            :props="defaultProps"
        >
            <template v-slot="{node,data}">
                <span class="custom-tree-node">
                       <a class="ellipsis" :title="data.title">
                           <i slot="suffix" :class="data.icon"
                              :style="{
                                     'color' : getNodeColor(data)
                                 }"></i>
                           {{ node.label }}
                       </a>
                      <el-button size="mini"
                                 v-if="showEye"
                                 :icon="data.visible?'el-icon-eye-open':'el-icon-eye-close'"
                                 @click.stop="setVisibility(node,!data.visible)"
                                 type="text">
                    </el-button>
                </span>
            </template>
        </el-virtual-tree>
    </div>
</template>

<style>
.scrollbar {
    height: 100%;
    width: 300px;
}

::-webkit-scrollbar {
    position: absolute;
    right: 2px;
    width: 6px;
    bottom: 2px;
    z-index: 1;
    border-radius: 4px;
    opacity: 0;
    transition: opacity .12s ease-out;
}

::-webkit-scrollbar-thumb {
    position: relative;
    display: block;
    width: 0;
    height: 0;
    cursor: pointer;
    border-radius: inherit;
    background-color: rgba(167, 168, 173, .3);
    transition: background-color .3s;
}

.ellipsis {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.custom-tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    width: 0;
}

.el-icon-yuan {
    color: #67C23A;
}
</style>
