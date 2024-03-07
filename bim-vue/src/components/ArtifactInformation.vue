<script>
export default {
    props: {
        projectName: {
            type: String,
        }
    },
    data() {
        return {
            tree: {},
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
        projectName(val) {
            this.init();
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
        initListener() {
            this.$mitt.on(`${this.projectName}-view-selected`, (id) => {
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
            })
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
        handleNodeChange(data, node, self) {
            if (node.childNodes.length === 0) {
                this.$mitt.emit(`${this.projectName}-tree-selected`, data.id)
            }
            this.$mitt.emit(`${this.projectName}-artifactId-selected`, data.id)
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
            v-show="Object.keys(tree).length>0"
            style="height: 100%"
            ref="el-tree" :data="[tree]"
            @current-change="handleNodeChange"
            :default-expand-all="false"
            highlight-current node-key="id"
            :current-node-key="currentNodeKey"
            :props="defaultProps"
        >
        </el-tree>
    </el-scrollbar>
</template>

<style>
.scrollbar {
    height: 100%;
}

.scrollbar .el-scrollbar__wrap {
    overflow-x: hidden;
}
</style>
