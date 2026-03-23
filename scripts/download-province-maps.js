import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 读取 china.json 文件
const chinaJsonPath = path.join(__dirname, '../public/maps/china.json')
const outputDir = path.join(__dirname, '../public/maps')

// 确保 output 目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
  console.log(`创建目录: ${outputDir}`)
}

// 读取 china.json
let chinaJson
try {
  chinaJson = JSON.parse(fs.readFileSync(chinaJsonPath, 'utf8'))
  console.log('成功读取 china.json')
} catch (error) {
  console.error('读取 china.json 失败:', error.message)
  process.exit(1)
}

// 下载函数
function downloadJson(adcode, name) {
  return new Promise((resolve, reject) => {
    const url = `https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`
    const filename = `${adcode}.json`
    const filepath = path.join(outputDir, filename)

    // 如果文件已存在，跳过
    if (fs.existsSync(filepath)) {
      resolve({ success: true, exists: true, name, adcode })
      return
    }

    console.log(`正在下载: ${name} (${adcode})...`)

    const protocol = url.startsWith('https') ? https : http

    const req = protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`下载失败: ${name} (${adcode}) - HTTP ${res.statusCode}`))
        return
      }

      const chunks = []
      res.on('data', (chunk) => {
        chunks.push(chunk)
      })

      res.on('end', () => {
        try {
          const data = Buffer.concat(chunks)
          const jsonData = JSON.parse(data.toString())
          fs.writeFileSync(filepath, JSON.stringify(jsonData, null, 2), 'utf8')
          console.log(`✓ 下载完成: ${name} (${adcode})`)
          resolve({ success: true, exists: false, name, adcode })
        } catch (error) {
          reject(new Error(`解析 JSON 失败: ${name} (${adcode})`))
        }
      })
    })

    req.on('error', (error) => {
      reject(new Error(`下载失败: ${name} (${adcode}) - ${error.message}`))
    })

    // 设置超时
    req.setTimeout(30000, () => {
      req.destroy()
      reject(new Error(`下载超时: ${name} (${adcode})`))
    })
  })
}

// 批量下载函数（限制并发数）
async function downloadAll(features, concurrency = 3) {
  const results = []
  const total = features.length

  for (let i = 0; i < features.length; i += concurrency) {
    const batch = features.slice(i, i + concurrency)
    const batchPromises = batch.map((feature, idx) => {
      return downloadJson(feature.properties.adcode, feature.properties.name)
        .catch(error => ({ success: false, error: error.message, name: feature.properties.name, adcode: feature.properties.adcode }))
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    const progress = Math.min(i + concurrency, total)
    console.log(`进度: ${progress}/${total}`)

    // 添加延迟，避免请求过快
    if (i + concurrency < features.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return results
}

// 主函数
async function main() {
  console.log(`\n开始下载省份地图数据...\n`)
  console.log(`总计: ${chinaJson.features.length} 个省份/地区\n`)

  const results = await downloadAll(chinaJson.features, 5)

  const success = results.filter(r => r.success).length
  const exists = results.filter(r => r.exists).length
  const failed = results.filter(r => !r.success).length
  const newDownloads = success - exists

  console.log(`\n下载完成!`)
  console.log(`总计: ${chinaJson.features.length}`)
  console.log(`已存在: ${exists}`)
  console.log(`新下载: ${newDownloads}`)
  console.log(`失败: ${failed}`)
  console.log(`输出目录: ${outputDir}\n`)

  if (failed > 0) {
    console.log('失败列表:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name} (${r.adcode}): ${r.error}`)
    })
  }
}

main().catch(error => {
  console.error('执行出错:', error)
  process.exit(1)
})
