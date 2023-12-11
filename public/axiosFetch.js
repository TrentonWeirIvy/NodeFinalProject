
const setAuth = async (auth) => {
    localStorage.setItem('user',auth)
}
const getAuth = async () => {
    return localStorage.getItem('user');
}
const axiosPost = async (url, obj) => {
    const token = await getAuth();
    axios.defaults.headers.common['Authorization'] = token;
    return await axios.post(url, obj)
}
const axiosGet = async (url, obj) => {
    const token = await getAuth();
    axios.defaults.headers.common['Authorization'] = token; 
    return await axios.get(url, obj);
}
