# HIT compilers Lab

编译原理实验，包含的模块有：

1. 词法分析
2. 语法分析
3. 语义分析

![20190510030733-2019-5-10.png](https://i.loli.net/2019/05/10/5cd47a7bcf380.png)

您可以直接下载 `.exe` 可执行文件来运行查看效果，下载地址在 https://github.com/upupming/compiler/releases/tag/v1.0.0。

## 项目说明

本项目使用 TypeScript 开发，Electron 作为 GUI 框架，请在运行之前安装 Node.js。

1. 安装依赖

    ```bash
    npm i
    ```

2. 运行 GUI

    需要开两个终端：

    ```bash
    npm run compile
    ```

    ```bash
    npm run start
    ```

当然，您还可以运行 test 文件夹中的测试用例来加深对算法过程的理解。