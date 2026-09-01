# 记账本

个人/家庭日常记账 Windows 桌面应用。账本是项目里的 Markdown 文件。

## 数据文件

目录：`D:\cjl\cjl-accounts\data`

| 文件 | 内容 |
| --- | --- |
| `categories.md` | 分类 |
| `transactions.md` | 流水 |

两张表都是 Markdown 表格，可用本应用读写，也可以直接改 md 文件。

应用每次启动时会自动检查流水日期，删除发生时间早于近三年的记录。记一笔时也不能选择或保存超过三年的日期。

## 开发运行

```powershell
cd D:\cjl\cjl-accounts
npm install
npm run dev
```

## 打包

```powershell
npm run dist
```

打包后的安装包在 `release` 目录。安装版会把 md 账本复制到用户数据目录，避免写进安装包。
