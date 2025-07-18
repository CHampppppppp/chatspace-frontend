import axios from 'axios';
import { ElMessage } from "element-plus";
import router from '../router'
import { getCurrentInstance } from 'vue'


/*axios全局响应拦截*/
axios.interceptors.response.use(success=>{
  if (success.status&&success.status==200&&success.data.status==500){//请求成功，但处理出现其他错误
    ElMessage.error({message:success.data.msg})
    return;
  }
  //请求成功且服务器处理无错误
  if (success.data.msg){
    ElMessage.success({message:success.data.msg});
  }
  return success.data;
},error => {
  if (error.response.status==504) {//	充当网关或代理的服务器，未及时从远端服务器获取请求
    ElMessage.error({message:'找不到服务器'})
  }else if(error.response.status==403){	//服务器理解请求客户端的请求，但是拒绝执行此请求
    ElMessage.error({message:'权限不足，请联系管理员'})
  }else if (error.response.status==401){//请求要求用户的身份认证
    ElMessage.error({message:'尚未登录，请登录'});
    router.replace("/");//跳转到登陆页
  }else if (error.response.status==404){
    ElMessage.error({message:'服务器无法根据客户端的请求找到资源'})
  } else if (error.response.status==500){
    ElMessage.error({message:'服务器内部错误，无法完成请求'})
  } else {
    if (error.response.data){
      ElMessage.error({message:error.response.data.msg})
    }
    else {
      ElMessage.error({message:'未知错误!'})
    }
  }
  return;
})

// 根据环境变量设置API基础路径
// 开发环境使用代理，生产环境可以使用完整URL
let base = import.meta.env.VITE_API_BASE || '/api';

/*
登录请求方法，与服务端Spring Security的登录接口对接
 */
export const postKeyValueRequest=(url,params)=>{
  return axios({
    method:'post',
    url:`${base}${url}`,
    data:params,
    transformRequest:[function (data) {//处理请求的数据格式
      //console.log(data);
      let ret='';
      for (let i in data){
        ret+=encodeURIComponent(i)+'='+encodeURIComponent(data[i])+'&'
      }
     // console.log(ret);
      return ret;
    }],
    headers:{
      'Content-Type':'application/x-www-form-urlencoded'
    }
  });
}
/*
封装“增加”请求方法——post
 */
export const postRequest=(url,params)=>{
  return axios({
    method:'post',
    url:`${base}${url}`,
    data:params
  });
}
/*
封装“修改”请求方法——put
 */
export const putRequest=(url,params)=>{
  return axios({
    method:'put',
    url:`${base}${url}`,
    data:params
  });
}
/*
封装“查询”请求方法——get
 */
export const getRequest=(url,params)=>{
  return axios({
    method:'get',
    url:`${base}${url}`,
    data:params
  });
}
/*
封装"删除"请求方法——delete
 */
export const deleteRequest=(url,params)=>{
  return axios({
    method:'delete',
    url:`${base}${url}`,
    data:params
  });
}

/**
 * API调用的组合式函数
 * 提供统一的API调用接口，避免在每个组件中重复导入
 */
export function useApi() {
  // 获取当前实例，用于访问全局属性（备用方案）
  const instance = getCurrentInstance()
  
  // 直接返回API函数，确保在组合式API中可以正常使用
  return {
    // 登录专用的键值对请求
    postKeyValueRequest: (url, params) => {
      return postKeyValueRequest(url, params)
    },
    
    // POST请求
    postRequest: (url, params) => {
      return postRequest(url, params)
    },
    
    // GET请求
    getRequest: (url, params) => {
      return getRequest(url, params)
    },
    
    // PUT请求
    putRequest: (url, params) => {
      return putRequest(url, params)
    },
    
    // DELETE请求
    deleteRequest: (url, params) => {
      return deleteRequest(url, params)
    },
    
    // 备用方案：通过全局属性访问（如果直接导入失败）
    $api: instance?.appContext?.config?.globalProperties || {}
  }
}

/**
 * 简化版本的API调用函数
 * 直接导出常用的API方法，可以在任何地方使用
 */
export const api = {
  post: postRequest,
  get: getRequest,
  put: putRequest,
  delete: deleteRequest,
  login: postKeyValueRequest
}

/**
 * 默认导出useApi函数
 */
export default useApi
