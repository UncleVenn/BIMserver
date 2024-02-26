<template>
    <div>
        <Upload project-name="ttttt112222"></Upload>
        <div class="item" style="height: 800px;width:300px;overflow-y: scroll">
            <ArtifactInformation ref="artifactInformation" project-name="test1"></ArtifactInformation>
        </div>
        <div class="item">
            <CanvasView width="800" height="500" project-name="test1"></CanvasView>
            <ArtifactProperties project-name="test1"></ArtifactProperties>
        </div>
    </div>
</template>

<script>
import CanvasView from './components/CanvasView.vue'
import ArtifactInformation from './components/ArtifactInformation.vue'
import ArtifactProperties from './components/ArtifactProperties.vue'
import Upload from "@/components/Upload.vue";

export default {
    name: 'App',
    components: {
        Upload,
        CanvasView,
        ArtifactInformation,
        ArtifactProperties
    },
}
</script>

<style>
.item {
    display: inline-block;
}
</style>
