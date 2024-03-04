<script>
export default {
    props: {
        projectName: {
            type: String
        }
    },
    data() {
        return {
            project: null,
            properties: null,
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
            this.properties = null;
            if (this.projectName !== null) {
                this.$mitt.on(`${this.projectName}-artifactId-selected`, this.artifactIdSelectedHandler)
                this.$bimserver.bimServerApiPromise.done(() => {
                    this.$bimserver.getProjectsByName(this.projectName).then(project => {
                        this.project = project;
                    })
                })
            }
        },
        artifactIdSelectedHandler(id) {
            this.$bimserver.getArtifactProperties(this.project, id).then(properties => {
                this.properties = properties;
            })
        },
        getProperty(value) {
            let type = typeof (value);
            if (type === 'number') {
                return value.toFixed(2);
            } else if (type === 'object') {
                return value._t;
            }
            return value;
        }
    }
}
</script>

<template>
    <div v-if="properties">
        <div v-for="property in Object.keys(properties)" :key="property" class="mb-2">
            <div>
                <div style="font-weight: bold">{{ property }}</div>
                <div style="padding-left: 25px" v-for="key in Object.keys(properties[property])" :key="key">
                    <span style="font-weight: 600">{{ key }}:</span><span> {{
                        getProperty(properties[property][key])
                    }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>

</style>