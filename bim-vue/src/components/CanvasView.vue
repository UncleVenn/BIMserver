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
            loading: false,
            loadingText: "",
        }
    },
    created() {
        this.init();

    },
    watch: {
        projectName(val, oval) {
            this.init();
            if (oval != null) {
                this.$bus.$off(`${oval}-tree-selected`, this.render);
            }
        }
    },
    methods: {
        initListener() {
            this.$bus.$on(`${this.projectName}-tree-selected`, this.render)
        },
        render(id) {
            this.$bimserver.viewFocus(id, [0, 1, 0, 1], false);
        },
        init() {
            if (this.projectName !== null) {
                this.loading = true;
                this.initListener();
                this.$bimserver.bimServerApiPromise.done(() => {
                    this.$bimserver.getProjectsByName(this.projectName).then(project => {
                        this.$bimserver.renderCanvasByProject(project, this.$refs['3dView'], (percentage) => {
                            // console.log(percentage + "% loaded")
                            this.loadingText = `加载中:${percentage.toFixed(2)}%`
                            if (percentage === 100) {
                                if (this.renderColor) this.$bimserver.renderColor(this.renderColor);
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
                                if (render) {
                                    this.$nextTick(() => {
                                        this.$bus.$emit(`${this.projectName}-view-selected`, ids[0])
                                        this.$bus.$emit(`${this.projectName}-artifactId-selected`, ids[0])
                                        this.render(ids[0]);
                                    });
                                }
                            }
                        })
                    })
                })
            }
        },

    }
}
</script>

<template>
    <div
        v-loading="loading"
        :element-loading-text="loadingText"
    >
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