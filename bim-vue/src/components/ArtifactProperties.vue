<script>
export default {
    props: {
        projectName: {
            required: true,
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
        this.$mitt.on(`${this.projectName}-artifactId-selected`, this.artifactIdSelectedHandler)
        this.$bimserver.bimServerApiPromise.done(() => {
            this.$bimserver.getProjectsByName(this.projectName).then(project => {
                this.project = project;
            })
        })
    },
    methods: {
        artifactIdSelectedHandler(id) {
            this.$bimserver.getArtifactProperties(this.project, id).then(properties => {
                this.properties = properties;
            })
        },
    }
}
</script>

<template>
    <div v-if="properties">
        <div v-for="property in Object.keys(properties)" :key="property" class="mb-2">
            <div>
                <div style="font-weight: bold">{{ property }}</div>
                <div style="padding-left: 25px" v-for="key in Object.keys(properties[property])" :key="key">
                    <span style="font-weight: 600">{{ key }}</span>:{{ properties[property][key] }}
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>

</style>