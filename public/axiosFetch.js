const AUTH_HEADER = 'User';

const setAuth = async (auth) => {
    localStorage.setItem(AUTH_HEADER, auth);
    axios.defaults.headers.common[AUTH_HEADER] = JSON.parse(auth).token;
};

const getAuth = async () => {
    return localStorage.getItem(AUTH_HEADER);
};

const setAuthHeader = () => {
    axios.defaults.headers.common[AUTH_HEADER] = JSON.parse(localStorage.getItem(AUTH_HEADER)).token;
};

const axiosPost = async (url, data) => {
    setAuthHeader();
    return await axios.post(url, data);
};

const axiosGet = async (url, params) => {
    setAuthHeader();
    return await axios.get(url, { params });
};

const axiosPut = async (url, data) => {
    setAuthHeader();
    return await axios.put(url, data);
};

const axiosDelete = async (url, data) => {
    setAuthHeader();
    return await axios.delete(url, { data });
};



