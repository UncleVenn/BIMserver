<script>
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
        },
    },
    data() {
        return {
            loading: false
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
                        this.$bimserver.renderCanvasByProject(project, this.$refs['3dView'], (percentage) => {
                            // console.log(percentage + "% loaded")
                            if (percentage === 100) {
                                this.$bimserver.renderColor(this.renderColor);
                                this.loading = false;
                            }
                        }, {
                            loaderSettings: {
                                generateLineRenders: true,
                            },
                            realtimeSettings: {
                                // drawLineRenders: true,
                            }
                        });
                        this.$bimserver.view.addSelectionListener({
                            handler: (renderLayer, ids, render) => {
                                if (render && this.$bimserver.tree) {
                                    this.$nextTick(() => {
                                        let node = this.$bimserver.tree.getNode(ids[0]);
                                        this.$bimserver.tree.setCurrentNode(node.data);
                                        this.$bimserver.tree.$emit('current-change', node.data, node);
                                        this.$nextTick(() => {
                                            let element = this.$bimserver.tree.$el.querySelector('.is-current')
                                            element.scrollIntoView()
                                        })
                                    });
                                }
                            }
                        })
                    })
                })
            }
        }
    }
}
</script>

<template>
    <div v-loading="loading">
        <canvas ref="3dView"></canvas>
    </div>
</template>

<style scoped>
div {
    width: 100%;
    height: 100%;
}

canvas {
    width: 100%;
    height: 100%;
}
</style>