export default {
    "extends": [
        "@commitlint/config-conventional"
    ],

    rules: {
        // type 类型定义
        "type-enum": [
            2,
            "always",
            [
                "feat", // 新功能、新特性feature
                "fix", // 修复 bug
                "docs", // 文档修改
                "style", // 代码格式(不影响代码运行的变动)
                "refactor", // 代码重构
                "perf", // 优化相关，比如提升性能、体验
                "test", // 测试用例修改
                "chore", // 其他修改, 比如改变构建流程、或者增加依赖库、工具等
                "revert", // 回滚上一个版本
                "build", // 编译相关的修改，例如发布版本、对项目构建或者依赖的改动
            ],
        ],
        // subject 大小写不做校验
        // 自动部署的BUILD ROBOT的commit信息大写，以作区别
        "subject-case": [0],
        "must-add-document-url": [2, "always"], // 加入自定义规则
        'body-max-line-length': [2, 'always', 200], // 加入自定义规则
        'header-max-length': [2, 'always', 200], // 加入自定义规则
    },
    plugins: [
        {
            rules: {
                "must-add-document-url": ({ type, body }) => {
                    const ALIYUN_DOCUMENT_PREFIX = "https://devops.aliyun.com";

                    // 排除的类型
                    const excludeTypes = ["chore", "refactor", "style", "test"];
                    if (excludeTypes.includes(type)) {
                        return [true];
                    }

                    return [
                        body && body.includes(ALIYUN_DOCUMENT_PREFIX),
                        `提交的内容中必须包含云效相关文档地址`,
                    ];
                },
            },
        },
    ]
}