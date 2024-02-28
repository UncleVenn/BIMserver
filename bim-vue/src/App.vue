<template>
    <div>
        <div>
            <ProjectList :select-project="projectSelect"></ProjectList>
        </div>
        <div class="container">
            <div class="left">
                <ArtifactInformation :project-name="projectName"></ArtifactInformation>
            </div>
            <div class="middle">
                <CanvasView :project-name="projectName"></CanvasView>
            </div>
            <div class="right">
                <ArtifactProperties :project-name="projectName"></ArtifactProperties>
            </div>
        </div>
    </div>
</template>

<script>
import CanvasView from '@/components/CanvasView.vue'
import ArtifactInformation from '@/components/ArtifactInformation.vue'
import ArtifactProperties from '@/components/ArtifactProperties.vue'
import Upload from "@/components/Upload.vue";
import ProjectList from "@/components/ProjectList.vue";

export default {
    name: 'App',
    components: {
        ProjectList,
        Upload,
        CanvasView,
        ArtifactInformation,
        ArtifactProperties
    },
    data() {
        return {
            projectName: null
        }
    },
    methods: {
        projectSelect(project) {
            this.projectName = project.name;
        }
    }
}
</script>

<style>
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
}

.container {
    height: 800px;
    display: flex;
}

.left {
    width: 30%;
    max-height: 800px;
    overflow-y: scroll;
}

.right {
    width: 20%;
    padding: 20px;
}

.middle {
    width: 100%;
}

</style>
