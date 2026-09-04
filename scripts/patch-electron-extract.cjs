const fs = require('node:fs')
const path = require('node:path')

function patchElectronExtract() {
  const target = path.join(__dirname, '..', 'node_modules', 'app-builder-lib', 'out', 'util', 'electronGet.js')
  if (!fs.existsSync(target)) {
    console.warn('skip electron extract patch: app-builder-lib not found')
    return
  }

  let source = fs.readFileSync(target, 'utf8')
  if (source.includes('Windows cannot rename a directory while a lockfile')) {
    return
  }

  const marker = '    });\n    try {\n        // rm + mkdir happen AFTER acquiring the lock'
  const withFlag = '    });\n    let released = false;\n    try {\n        // rm + mkdir happen AFTER acquiring the lock'
  if (!source.includes(marker)) {
    console.warn('skip electron extract patch: unexpected app-builder-lib source')
    return
  }
  source = source.replace(marker, withFlag)

  const oldRename = `        await fs.rm(dir, { recursive: true, force: true });
        await fs.rename(tmpDir, dir);
    }
    finally {
        await release().catch(err => builder_util_1.log.warn({ err }, "failed to release lockfile"));
    }
}`
  const newRename = `        await fs.rm(dir, { recursive: true, force: true });
        // Windows cannot rename a directory while a lockfile handle is still open inside it.
        await release().catch(err => builder_util_1.log.warn({ err }, "failed to release lockfile"));
        released = true;
        try {
            await fs.rename(tmpDir, dir);
        }
        catch (e) {
            if ((e === null || e === void 0 ? void 0 : e.code) === "EPERM" || (e === null || e === void 0 ? void 0 : e.code) === "EACCES") {
                await fs.cp(tmpDir, dir, { recursive: true, force: true });
                await fs.rm(tmpDir, { recursive: true, force: true });
            }
            else {
                throw e;
            }
        }
    }
    finally {
        if (!released) {
            await release().catch(err => builder_util_1.log.warn({ err }, "failed to release lockfile"));
        }
    }
}`
  if (!source.includes(oldRename)) {
    console.warn('skip electron extract patch: rename block not found')
    return
  }
  source = source.replace(oldRename, newRename)
  fs.writeFileSync(target, source)
  console.log('patched app-builder-lib extractArchive for Windows EPERM')
}

if (require.main === module) {
  patchElectronExtract()
} else {
  module.exports = patchElectronExtract
}
