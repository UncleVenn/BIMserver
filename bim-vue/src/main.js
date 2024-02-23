import Vue from 'vue'
import App from './App.vue'
import bimserver from "./assets/js/bimserver/bimserver.js";
import mitt from "mitt";
import 'element-ui/lib/theme-chalk/index.css';
import ElementUI from 'element-ui';
Vue.config.productionTip = false
Vue.prototype.$bimserver = bimserver;
Vue.prototype.$mitt = mitt();
Vue.use(ElementUI);
new Vue({
    render: h => h(App),
}).$mount('#app')
