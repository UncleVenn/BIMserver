<script>
export default {
    props: {
        projectName: {
            type: String,
        }
    },
    data() {
        return {
            tree: [],
            pickId: null,
            loading: false,
            loadingText: "加载中...",
            currentNodeKey: null,
            artifactId: null,
            defaultProps: {
                children: 'children',
                label: 'name',
            },
        }
    },
    created() {
        this.init();
    },
    watch: {
        projectName(val, oval) {
            this.init();
            if (oval != null) {
                this.$bus.$off(`${oval}-view-selected`, this.viewSelectedHandler);
            }
        }
    },
    mounted() {
        this.$bimserver.tree = this.$refs['el-tree'];
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
            this.$nextTick(() => {
                this.explandNode(node);
                this.$nextTick(() => {
                    //TODO 展示时 选中的dom会被往下挤 会导致scrollIntoView失效 暂时使用延时来解决
                    setTimeout(() => {
                        this.$bimserver.tree.$el.querySelector('.is-current').scrollIntoView({
                            block: "center"
                        })
                    }, 500)
                })
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
            this.$bus.$emit(`${this.projectName}-tree-selected`, data.id)
            this.$bus.$emit(`${this.projectName}-artifactId-selected`, data.id)
        },

    }
}
</script>

<template>
    <el-scrollbar
        class="scrollbar"
        v-loading="loading"
        :element-loading-text="loadingText"
    >
        <el-tree
            render-after-expand
            v-show="tree.length>0"
            style="height: 100%;padding-right: 8px"
            ref="el-tree" :data="tree"
            @current-change="handleNodeChange"
            :default-expand-all="false"
            highlight-current node-key="id"
            :current-node-key="currentNodeKey"
            :props="defaultProps"
        >
            <template v-slot="{node,data}">
                <span class="custom-tree-node">
                       <a class="ellipsis" :title="data.title"><i slot="suffix" :class="data.icon"></i> {{
                               node.label
                           }}</a>
                      <el-button size="mini"
                                 :icon="data.visible?'el-icon-yanjing_xianshi':'el-icon-yanjing_yincang'"
                                 @click.stop="setVisibility(node,!data.visible)"
                                 type="text">
                      </el-button>
                </span>
            </template>
        </el-tree>
    </el-scrollbar>
</template>

<style>
.scrollbar {
    height: 100%;
    width: 300px;
}

.scrollbar .el-scrollbar__wrap {
    overflow-x: hidden;
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
.el-icon-yuan{
    color: #67C23A;
}
</style>
