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
    methods: {
        init() {
            if (this.projectName !== null) {
                this.loading = true;
                this.$bimserver.bimServerApiPromise.done(() => {
                    this.$bimserver.getProjectsByName(this.projectName).then(project => {
                        this.$bimserver.getArtifactInformation(project, false).then(result => {
                            this.tree = result.getTree();
                            this.loading = false;
                            this.$bimserver.tree = this.$refs['el-tree'];
                        })
                    })
                })
            }
        },
        handleNodeChange(data, node, self) {
            let id = data.id;
            this.$mitt.emit(`${this.projectName}-artifactId-selected`, id)
            if (this.$bimserver.view != null && node.childNodes.length === 0) {
                let viewer = this.$bimserver.view.viewer;
                viewer.viewFit([id], {
                    animate: true,
                }).catch(e => {
                })
                if (this.pickId != null) {
                    this.$bimserver.resetColorSet(this.pickId);
                }
                this.pickId = id;
                viewer.setSelectionState([id], false, true);
                let clr = [0, 1, 0, 1];
                viewer.setColor([id], clr)
            }
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
            v-show="Object.keys(tree).length>0"
            style="height: 100%"
            ref="el-tree" :data="[tree]"
            @current-change="handleNodeChange" default-expand-all
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
