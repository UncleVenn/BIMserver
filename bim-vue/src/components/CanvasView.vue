<script>
export default {
    props: {
        projectName: {
            type: String,
        },
    },
    data() {
        return {
            renderColor: [
                {
                    'id': 131850,
                    'color': [1, 0.3, 0.3, 1],
                },
                {
                    'id': 459321,
                    'color': [0, 1, 1, 1],
                },
                {
                    'id': 590393,
                    'color': [1, 1, 0, 1],
                },
            ]
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
                this.$bimserver.bimServerApiPromise.done(() => {
                    this.$bimserver.getProjectsByName(this.projectName).then(project => {
                        this.$bimserver.renderCanvasByProject(project, this.$refs['3dView'], (percentage) => {
                            // console.log(percentage + "% loaded")
                            if (percentage === 100) {
                                this.$bimserver.renderColor(this.renderColor);
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
    <canvas ref="3dView"></canvas>
</template>

<style scoped>
canvas {
    width: 100%;
    height: 100%;
}
</style>