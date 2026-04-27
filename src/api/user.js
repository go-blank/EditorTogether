import request from "../../utils/request";

export function Login(data) {
    return request({
        url: 'auth/login',
        data,
        method: 'post'
    })
}

export function Register(data) {
    return request({
        url: 'auth/register',
        data,
        method: 'post'
    })
}