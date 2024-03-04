<template>
    <div>
        <div>
            <ProjectList ref="project-list" style="display: inline-block" :select-project="projectSelect"></ProjectList>
            <el-button type="primary" @click="showUpload = true">上传</el-button>
        </div>
        <div class="container">
            <div class="left">
                <ArtifactInformation :project-name="projectName"></ArtifactInformation>
            </div>
            <div class="middle">
                <CanvasView :project-name="projectName" :render-color="renderColor"></CanvasView>
            </div>
            <div class="right">
                <ArtifactProperties :project-name="projectName"></ArtifactProperties>
            </div>
        </div>

        <el-dialog
            :visible.sync="showUpload"
            width="30%"
            center>
            <el-input v-model="createProjectName" placeholder="请输入项目名称" style="margin-bottom: 20px"></el-input>
            <Upload :project-name="createProjectName" v-show="createProjectName" :success="uploadSuccess"
                    :error="uploadError" :uploadProgress="uploadProgress" :parsingProgress="parsingProgress"></Upload>
        </el-dialog>
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
            projectName: null,
            showUpload: false,
            createProjectName: null,
            renderColor: null,
        }
    },
    created() {
    },
    methods: {
        projectSelect(project) {
            this.projectName = project.name;
            if (this.projectName === 'test') {
                this.renderColor = [
                    {
                        'id': [131850, 328249],
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
                ];
            }
        },
        uploadSuccess() {
            this.showUpload = false;
            this.createProjectName = null;
            this.$refs['project-list'].getProjectList();
            this.$message.success('上传成功');
        },
        uploadError(e) {
            this.$message.error(e);
        },
        uploadProgress() {

        },
        parsingProgress(e, state) {

        },
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
    width: 30%;
    padding: 20px;
}

.middle {
    width: 100%;
}
</style>
