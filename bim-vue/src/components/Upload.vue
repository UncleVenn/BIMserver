<script>
export default {
    props: {
        projectName: {
            type: String,
            default: null
        }
    },
    data() {
        return {
            uploadLoading: false
        }
    },
    mounted() {

    },
    methods: {
        upload(e) {
            this.uploadLoading = true;
            this.$bimserver.checkIn(this.projectName, e.file, (e) => {
                console.log("上传中", e)
            }, (e) => {
                this.uploadLoading = false;
                console.log("上传完成", e)
            }, (e) => {
                this.uploadLoading = false;
                console.log("上传失败", e)
            })
        }
    }
}
</script>

<template>
    <el-upload
        v-loading="uploadLoading"
        drag
        action="#"
        :disabled="uploadLoading"
        :show-file-list="false"
        accept=".ifc"
        :http-request="upload"
    >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
    </el-upload>
</template>

<style>
</style>