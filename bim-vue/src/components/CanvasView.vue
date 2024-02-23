<script>
export default {
    props: {
        width: null,
        height: null,
        projectName: {
            type: String,
            required: true
        },
    },
    data() {
        return {
            renderColor: [
                {
                    'id': 131987,
                    'color': [1, 0.3, 0.3, 1],
                },
                {
                    'id': 590049,
                    'color': [0, 1, 1, 1],
                },
                {
                    'id': 458977,
                    'color': [1, 1, 0, 1],
                },
            ]
        }
    },
    mounted() {

        this.$bimserver.bimServerApiPromise.done(() => {
            this.$bimserver.getProjectsByName(this.projectName).then(project => {
                this.$bimserver.view = this.$bimserver.renderCanvasByProject(project, this.$refs['3dView'], (percentage) => {
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
                            });
                        }
                    }
                })
            })
        })
    },
    methods: {}
}
</script>

<template>
    <canvas ref="3dView" :width="width" :height="height"></canvas>
</template>

<style scoped>

</style>