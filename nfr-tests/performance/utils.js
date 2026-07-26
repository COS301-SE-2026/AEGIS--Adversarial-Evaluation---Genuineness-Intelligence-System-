import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL } from "./config.js";

export function get(endpoint) {
    const response = http.get(`${BASE_URL}${endpoint}`);
    check(response, {
        "Status is 200": (res) => res.status === 200,
    });

    return response
}

export const baseOptions = {
    vus: 10,
    duration: "1m",
    thresholds: {
        http_req_duration: ["p(95)<2000"],
        http_req_failed: ["rate<0.01"],
    }
}