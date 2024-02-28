<script>
export default {
    props: {
        selectProject: {
            type: Function,
            default: () => {
            }
        }
    },
    data() {
        return {
            projectList: [],
            project: null
        }
    },
    methods: {
        getProjectList() {
            this.$bimserver.bimServerApiPromise.done(() => {
                this.$bimserver.getAllProjects().then(projectList => {
                    this.projectList = projectList
                })
            });
        }
    },
    created() {
        this.getProjectList();
    }
}
</script>

<template>
    <div style="margin: 10px">
        <el-select
            v-model="project"
            value-key="id"
            @change="selectProject(project)"
            placeholder="请选择项目"
        >
            <el-option
                v-for="project in projectList"
                :key="project.id"
                :label="project.name"
                :value="project"
            >
            </el-option>
        </el-select>
    </div>
</template>

<style scoped>
</style>