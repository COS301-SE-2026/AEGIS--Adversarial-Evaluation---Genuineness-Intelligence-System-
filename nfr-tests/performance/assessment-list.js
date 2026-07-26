import { sleep } from "k6";
import { baseOptions } from "./utils.js";
import { get } from "./utils.js"

export const options = baseOptions;

export default function () {
    get("/api/v1/assessments/");
    sleep(1);
}