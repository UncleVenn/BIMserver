<script>
export default {
    props: {
        projectName: {
            type: String,
            default: null
        },
        uploadProgress: {
            type: Function,
            default: () => {
            }
        },
        parsingProgress: {
            type: Function,
            default: () => {
            }
        },
        success: {
            type: Function,
            default: () => {
            }
        },
        error: {
            type: Function,
            default: () => {
            }
        },
    },
    data() {
        return {
            uploadLoading: false,
            loadingText: "",
        }
    },
    methods: {
        upload(e) {
            this.uploadLoading = true;
            this.$bimserver.checkIn(this.projectName, e.file, (e) => {
                this.uploadProgress(e);
                this.loadingText = `上传中:${e}%`
            }, (progress, e) => {
                this.parsingProgress(progress)
                this.loadingText = `${e.title}:${progress}%`
            }, (e) => {
                this.success();
                this.uploadLoading = false;
                this.loadingText = `完成`
            }, (e) => {
                this.error(e);
                this.uploadLoading = false;
                console.info("上传失败", e)
            })
        }
    }
}
</script>

<template>
    <el-upload
        v-loading="uploadLoading"
        :element-loading-text="loadingText"
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
.el-upload {
    width: 100%;
}

.el-upload .el-upload-dragger {
    width: 100%;
}
</style>