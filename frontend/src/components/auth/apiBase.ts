import axios from "axios";
// function getTokenFromSession() {
//     return typeof sessionStorage != "undefined"
//         ? sessionStorage.getItem("accessToken")
//         : null;
// }
// const accessToken: string | null | undefined = getTokenFromSession();

const ApiBase = axios.create({
    baseURL: "http://127.0.0.1:8000/",
    timeout: 5000, // Timeout request after 5 seconds
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});


ApiBase.interceptors.request.use(async (request) => {
    //   let accessToken: string | undefined | null = getTokenFromSession();

    //   if (!accessToken) {
    //     console.log("No token found,");
    //     accessToken = await getAuthToken();
    //   } else {
    //     const decoded: any = jwtDecode(accessToken);
    //     const currentTime= Date.now()/1000
    //     const isExpired = decoded.exp< currentTime

    //     if (isExpired) {
    //       console.log("token expired!");accessToken = await getAuthToken()
    //     }
    //   }

    //   request.headers.Authorization = `Bearer ${accessToken}`;
    return request;
});

export default ApiBase;
