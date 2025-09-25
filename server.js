const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');
const querystring = require('querystring');

const PORT = 3000;

// 简单的MIME类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

// 获取文件的MIME类型
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'text/plain';
}

// 解析POST请求体
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}

// 发送JSON响应
function sendJSON(res, data, statusCode = 200) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

// 发送文件
async function sendFile(res, filePath) {
    try {
        const content = await fs.readFile(filePath);
        const mimeType = getMimeType(filePath);
        res.writeHead(200, {
            'Content-Type': mimeType,
            'Access-Control-Allow-Origin': '*'
        });
        res.end(content);
    } catch (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
    }
}

// 创建HTTP服务器
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;
    
    console.log(`${req.method} ${pathname}`);
    
    // 处理CORS预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }
    
    try {
        // API路由
        if (pathname.startsWith('/api/')) {
            
            // 读取目录
            if (pathname === '/api/read-directory' && req.method === 'GET') {
                const dirPath = query.path;
                if (!dirPath) {
                    sendJSON(res, { error: '缺少路径参数' }, 400);
                    return;
                }
                
                try {
                    const items = await fs.readdir(dirPath, { withFileTypes: true });
                    const result = [];
                    
                    for (const item of items) {
                        const itemPath = path.join(dirPath, item.name);
                        const stats = await fs.stat(itemPath);
                        
                        result.push({
                            name: item.name,
                            path: itemPath,
                            isDirectory: item.isDirectory(),
                            modified: stats.mtime
                        });
                    }
                    
                    sendJSON(res, result);
                } catch (error) {
                    console.error('读取目录失败:', error);
                    sendJSON(res, { error: '读取目录失败: ' + error.message }, 500);
                }
                return;
            }
            
            // 读取文件
            if (pathname === '/api/read-file' && req.method === 'GET') {
                const filePath = query.path;
                if (!filePath) {
                    sendJSON(res, { error: '缺少文件路径参数' }, 400);
                    return;
                }
                
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    sendJSON(res, { content });
                } catch (error) {
                    console.error('读取文件失败:', error);
                    sendJSON(res, { error: '读取文件失败: ' + error.message }, 500);
                }
                return;
            }
            
            // 写入文件
            if (pathname === '/api/write-file' && req.method === 'POST') {
                try {
                    const body = await parseBody(req);
                    const { path: filePath, content } = body;
                    
                    if (!filePath || content === undefined) {
                        sendJSON(res, { error: '缺少文件路径或内容参数' }, 400);
                        return;
                    }
                    
                    await fs.writeFile(filePath, content, 'utf8');
                    sendJSON(res, { success: true, message: '文件保存成功' });
                } catch (error) {
                    console.error('写入文件失败:', error);
                    sendJSON(res, { error: '写入文件失败: ' + error.message }, 500);
                }
                return;
            }
            
            // 追加文件内容
            if (pathname === '/api/append-file' && req.method === 'POST') {
                try {
                    const body = await parseBody(req);
                    const { path: filePath, content } = body;
                    
                    if (!filePath || content === undefined) {
                        sendJSON(res, { error: '缺少文件路径或内容参数' }, 400);
                        return;
                    }
                    
                    await fs.appendFile(filePath, content, 'utf8');
                    sendJSON(res, { success: true, message: '内容追加成功' });
                } catch (error) {
                    console.error('追加文件失败:', error);
                    sendJSON(res, { error: '追加文件失败: ' + error.message }, 500);
                }
                return;
            }
            
            // API路由未找到
            sendJSON(res, { error: 'API路由未找到' }, 404);
            return;
        }
        
        // 静态文件服务
        if (pathname === '/' || pathname === '/index.html') {
            await sendFile(res, path.join(__dirname, 'enhanced.html'));
            return;
        }
        
        if (pathname === '/basic') {
            await sendFile(res, path.join(__dirname, 'web.html'));
            return;
        }
        
        if (pathname === '/projects' || pathname === '/project-manager') {
            await sendFile(res, path.join(__dirname, 'project-manager.html'));
            return;
        }
        
        // 其他静态文件
        const filePath = path.join(__dirname, pathname);
        await sendFile(res, filePath);
        
    } catch (error) {
        console.error('服务器错误:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
});

// 启动服务器
server.listen(PORT, () => {
    console.log(`\n🚀 AI知识库助手服务器已启动!`);
    console.log(`📱 请在浏览器中打开: http://localhost:${PORT}`);
    console.log(`💡 使用说明:`);
    console.log(`   1. 在页面上方输入您的文件夹路径`);
    console.log(`   2. 点击"加载"按钮浏览文件`);
    console.log(`   3. 点击Markdown文件开始编辑`);
    console.log(`   4. 使用Ctrl+S保存，Ctrl+P切换预览`);
    console.log(`\n按 Ctrl+C 停止服务器\n`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});

// 错误处理
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
});