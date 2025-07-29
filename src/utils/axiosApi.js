import axios from 'axios';
import router from '../router'


/*axios全局请求拦截*/
axios.interceptors.request.use(config => {
  console.log('发送请求:', config.method?.toUpperCase(), config.url);
  return config;
}, error => {
  console.error('请求配置错误:', error);
  return Promise.reject(error);
});

/*axios全局响应拦截*/
axios.interceptors.response.use(success=>{
  // 请求成功，检查业务状态码
  if (success.status && success.status == 200) {
    if (success.data.status == 500) {
      // 请求成功，但业务处理出现错误
      console.error('业务处理错误:', success.data.msg || '服务器内部错误');
      // return Promise.reject(new Error(success.data.msg || '服务器内部错误'));
    }
    
    // 请求成功，无论业务状态码如何都返回数据，让上层业务逻辑处理
    if (success.data.code && success.data.code !== 200) {
      console.warn('业务状态码提示:', success.data.code, success.data.msg);
      // 不要reject，直接返回数据让上层处理
    }
    
    console.log('请求成功:', success.config.url, success.data);
    return success.data;
  }
  
  console.error('HTTP状态码异常:', success.status);
  // return Promise.reject(new Error('HTTP状态码异常'));
}, error => {
  // 网络错误或HTTP状态码错误
  if (!error.response) {
    // 网络错误，没有响应
    console.error('网络错误，无法连接到服务器:', error.message);
    // return Promise.reject(error);
  }
  
  const status = error.response.status;
  let errorMessage = '';
  
  switch (status) {
    case 400:
      errorMessage = '请求参数错误';
      break;
    case 401:
      errorMessage = '未授权，请重新登录';
      router.replace("/"); // 跳转到登录页
      break;
    case 403:
      errorMessage = '权限不足，拒绝访问';
      break;
    case 404:
      errorMessage = '请求的资源不存在';
      break;
    case 500:
      errorMessage = '服务器内部错误';
      break;
    case 502:
      errorMessage = '网关错误';
      break;
    case 503:
      errorMessage = '服务不可用';
      break;
    case 504:
      errorMessage = '网关超时';
      break;
    default:
      errorMessage = error.response.data?.msg || error.message || '未知错误';
  }
  
  console.error(`HTTP ${status} 错误:`, errorMessage, error.response.data);
  return Promise.reject(error);
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

