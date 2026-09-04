# 记账本

个人/家庭日常记账应用。账本是 Markdown 文件，可打包成 Windows 安装包和 Android APK。

## 数据文件

开发时目录：`D:\cjl\cjl-accounts\data`

| 文件 | 内容 |
| --- | --- |
| `categories.md` | 分类 |
| `transactions.md` | 流水 |

两张表都是 Markdown 表格，可用本应用读写，也可以直接改 md 文件。

应用每次启动时会自动检查流水日期，删除发生时间早于近三年的记录。记一笔时也不能选择或保存超过三年的日期。

安装后的数据位置：

- Windows：用户数据目录下的 `data`（分类、流水为 md 文件）
- Android：应用内部存储中的 `categories.md`、`transactions.md`

Windows 和 Android 的账本互相独立，不会自动同步。

## 开发运行

```powershell
cd D:\cjl\cjl-accounts
npm install
npm run dev
```

## 打包

Windows 安装包：

```powershell
npm run dist:win
```

生成文件在 `D:\cjl\cjl-accounts`：

- `记账本 Setup 1.0.0.exe`：Windows 安装程序
- `记账本-1.0.0-android-debug.apk`：Android 安装包
- `release\win-unpacked\记账本.exe`：Windows 免安装可执行文件

Android APK（需本机已安装 Android SDK 与 JDK）：

```powershell
npm run dist:android
```

传到手机后允许安装未知来源应用即可。
