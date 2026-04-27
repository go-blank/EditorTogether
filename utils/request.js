// src/utils/request.js
import axios from 'axios';
import { ElMessage } from 'element-plus';

// 创建 axios 实例
const request = axios.create({
    baseURL: 'api',
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器
request.interceptors.request.use(
    (config) => {
        // 可以从 localStorage 获取 token
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
request.interceptors.response.use(
    (response) => {
        // 直接返回数据
        return response.data;
    },
    (error) => {
        // 统一错误处理
        if (error.response) {
            const { status, data } = error.response;

            switch (status) {
                case 400:
                    console.log("aaaaaa",data)
                    ElMessage.error(data.error)
                    break;
                case 401:
                    console.error('未授权，请重新登录');
                    // 清除本地存储并跳转到登录页
                    ElMessage.error(data.error)
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    break;
                case 403:
                    ElMessage.error(data.error)
                    break;
                case 404:
                    ElMessage.error('请求地址不存在')

                    break;
                case 500:
                    ElMessage.error('服务器错误')
                    break;
                default:
                    ElMessage.error('未知错误',data.error || data.message)
            }

            return Promise.reject(data);
        } else if (error.request) {
            console.error('网络错误，请检查网络连接');
            return Promise.reject({ error: '网络错误，请检查网络连接' });
        } else {
            console.error('请求配置错误:', error.message);
            return Promise.reject({ error: error.message });
        }
    }
);

export default request;