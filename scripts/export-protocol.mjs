import fs from "fs";
import path from "path";
import readline from "readline/promises";

const API_BASE_URL = "http://47.118.24.91:28082";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function request(url, options = {}) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json();

    return data;
}

async function login(username, password) {
    const response = await request("/api/user/login", {
        method: "POST",
        body: JSON.stringify({
            username,
            password
        })
    });

    if (response.code !== 0 && response.code !== 200) {
        throw new Error(response.msg || "登录失败");
    }

    return response.data;
}

async function exportProtocolsJson(token, tokenPrefix) {
    const normalizedPrefix = typeof tokenPrefix === "string"
        ? tokenPrefix.trim()
        : "";

    const authorization = normalizedPrefix
        ? `${normalizedPrefix} ${token}`
        : token;

    const headers = {
        Authorization: authorization
    };

    const protocolResponse = await request(
        "/api/protocol-definition/list",
        { headers }
    );

    if (protocolResponse.code !== 0 && protocolResponse.code !== 200) {
        throw new Error(
            protocolResponse.msg || "获取协议列表失败"
        );
    }

    const protocols = protocolResponse.data || [];

    const result = [];

    for (const protocol of protocols) {
        console.log(
            `处理协议: ${protocol.protocol_name}`
        );

        const fieldResponse = await request(
            `/api/protocol-field-definition/by-protocol/${protocol.id}`,
            { headers }
        );

        if (fieldResponse.code !== 0 && fieldResponse.code !== 200) {
            throw new Error(
                fieldResponse.msg || "获取协议字段失败"
            );
        }

        result.push({
            protocol_id: protocol.id,
            protocol_code: protocol.protocol_code,
            protocol_name: protocol.protocol_name,
            fields: fieldResponse.data || []
        });
    }

    const filePath = path.resolve(
        process.cwd(),
        "src/static/protocol_fields.json"
    );

    fs.writeFileSync(
        filePath,
        JSON.stringify(result, null, 2),
        "utf8"
    );

    console.log("生成成功:", filePath);
}

async function main() {
    try {
        const username = await rl.question("用户名: ");
        const password = await rl.question("密码: ");

        const loginData = await login(
            username,
            password
        );

        console.log("登录成功");

        await exportProtocolsJson(
            loginData.token,
            loginData.tokenPrefix
        );
    } catch (error) {
        console.error(
            "导出失败:",
            error.message || error
        );

        process.exitCode = 1;
    } finally {
        rl.close();
    }
}

main();