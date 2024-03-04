bim-vue中有三个组件
- ArtifactInformation.vue 用于展示构建树
- CanvasView.vue 用于展示3D模型
- ArtifactProperties.vue 用于展示构建的信息
- Upload.vue 用于上传ifc文件
- ProjectList.vue 用于展示项目列表


BimServerJar启动会自动安装指定home目录下的install_plugins目录中的插件

运行需要修改bim-vue/src/assets/js/bimserver/bimserver.js中的URL,USERNAME,PASSWORD配置信息