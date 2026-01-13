#!/usr/bin/env node

/**
 * 🔍 环境变量检查工具
 * 用法: node check-env.js [backend|frontend|all]
 */

const fs = require('fs');
const path = require('path');

// 需要检查的环境变量
const REQUIRED_BACKEND_VARS = {
  // 必需
  PORT: { required: true, type: 'number' },
  NODE_ENV: { required: true, type: 'string' },
  JWT_SECRET: { required: true, type: 'string', minLength: 16 },
  DB_HOST: { required: true, type: 'string' },
  DB_PORT: { required: true, type: 'number' },
  DB_USERNAME: { required: true, type: 'string' },
  DB_PASSWORD: { required: true, type: 'string' },
  DB_NAME: { required: true, type: 'string' },
  GITHUB_CLIENT_ID: { required: true, type: 'string' },
  GITHUB_CLIENT_SECRET: { required: true, type: 'string' },
  GITHUB_REDIRECT_URI: { required: true, type: 'string' },
  
  // RAG 功能需要
  MILVUS_HOST: { required: false, type: 'string', feature: 'RAG' },
  MILVUS_PORT: { required: false, type: 'number', feature: 'RAG' },
  OPENAI_API_KEY: { required: false, type: 'string', feature: 'RAG', startsWith: 'sk-' },
  
  // 可选
  LOG_LEVEL: { required: false, type: 'string' },
  JWT_EXPIRATION: { required: false, type: 'string' },
  MAX_REQUESTS_PER_15MIN: { required: false, type: 'number' },
};

const REQUIRED_FRONTEND_VARS = {
  // 必需
  VITE_API_BASE_URL: { required: true, type: 'string', pattern: /^https?:\/\// },
  VITE_GITHUB_CLIENT_ID: { required: true, type: 'string' },
  VITE_GITHUB_REDIRECT_URI: { required: true, type: 'string', pattern: /^https?:\/\// },
  
  // 可选
  VITE_DEFAULT_THEME: { required: false, type: 'string' },
};

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(`${colors[color]}${args.join(' ')}${colors.reset}`);
}

function readEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      // 跳过注释和空行
      if (!line || line.startsWith('#')) return;
      
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return env;
  } catch (error) {
    return null;
  }
}

function validateVar(key, value, spec) {
  const errors = [];
  
  // 检查值是否存在
  if (!value) {
    if (spec.required) {
      errors.push(`⚠️ 缺失必需变量`);
    }
    return errors;
  }
  
  // 类型检查
  if (spec.type === 'number') {
    if (isNaN(Number(value))) {
      errors.push(`❌ 不是数字，当前值: "${value}"`);
    }
  }
  
  // 长度检查
  if (spec.minLength && value.length < spec.minLength) {
    errors.push(`❌ 长度过短（最少 ${spec.minLength} 字符），当前: ${value.length}`);
  }
  
  // 前缀检查
  if (spec.startsWith && !value.startsWith(spec.startsWith)) {
    errors.push(`❌ 应该以 "${spec.startsWith}" 开头`);
  }
  
  // 正则检查
  if (spec.pattern && !spec.pattern.test(value)) {
    errors.push(`❌ 格式不正确: "${value}"`);
  }
  
  return errors;
}

function checkEnv(target = 'all') {
  let hasIssues = false;
  
  // 检查后端
  if (target === 'backend' || target === 'all') {
    log('cyan', '\n📋 检查后端环境变量 (backend/.env)');
    log('cyan', '═'.repeat(50));
    
    const backendEnv = readEnvFile(path.join(process.cwd(), 'backend', '.env'));
    
    if (!backendEnv) {
      log('red', '❌ 后端 .env 文件不存在！');
      log('yellow', '   请运行: cd backend && cp .env.example .env');
      hasIssues = true;
    } else {
      let backendOk = true;
      
      // 必需变量
      log('blue', '\n✓ 必需变量检查:');
      Object.entries(REQUIRED_BACKEND_VARS).forEach(([key, spec]) => {
        if (!spec.required || spec.feature) return;
        
        const value = backendEnv[key];
        const errors = validateVar(key, value, spec);
        
        if (errors.length > 0) {
          log('red', `  ❌ ${key}`);
          errors.forEach(err => log('red', `     ${err}`));
          backendOk = false;
          hasIssues = true;
        } else {
          const display = value.length > 30 ? value.substring(0, 27) + '...' : value;
          log('green', `  ✅ ${key} = ${display}`);
        }
      });
      
      // 可选变量 (RAG)
      log('blue', '\n⚠️ RAG 功能变量检查（可选）:');
      let ragVarsPresent = 0;
      ['MILVUS_HOST', 'MILVUS_PORT', 'OPENAI_API_KEY'].forEach(key => {
        const spec = REQUIRED_BACKEND_VARS[key];
        const value = backendEnv[key];
        
        if (value) {
          const errors = validateVar(key, value, spec);
          if (errors.length > 0) {
            log('yellow', `  ⚠️ ${key} (配置错误)`);
            errors.forEach(err => log('yellow', `     ${err}`));
          } else {
            const display = value.length > 30 ? value.substring(0, 27) + '...' : value;
            log('green', `  ✅ ${key} = ${display}`);
            ragVarsPresent++;
          }
        } else {
          log('yellow', `  ⚠️ ${key} 未设置（若不需要 RAG 功能可忽略）`);
        }
      });
      
      if (ragVarsPresent > 0) {
        log('green', `\n  💡 RAG 功能已配置 (${ragVarsPresent}/3)`);
      } else {
        log('yellow', `\n  💡 RAG 功能未配置（可选功能）`);
      }
      
      if (!backendOk) {
        log('red', '\n❌ 后端配置有问题！');
      } else {
        log('green', '\n✅ 后端配置正常！');
      }
    }
  }
  
  // 检查前端
  if (target === 'frontend' || target === 'all') {
    log('cyan', '\n📋 检查前端环境变量 (frontend/.env)');
    log('cyan', '═'.repeat(50));
    
    const frontendEnv = readEnvFile(path.join(process.cwd(), 'frontend', '.env'));
    
    if (!frontendEnv) {
      log('red', '❌ 前端 .env 文件不存在！');
      log('yellow', '   请运行: cd frontend && cp .env.example .env');
      hasIssues = true;
    } else {
      let frontendOk = true;
      
      log('blue', '\n✓ 必需变量检查:');
      Object.entries(REQUIRED_FRONTEND_VARS).forEach(([key, spec]) => {
        if (!spec.required) return;
        
        const value = frontendEnv[key];
        const errors = validateVar(key, value, spec);
        
        if (errors.length > 0) {
          log('red', `  ❌ ${key}`);
          errors.forEach(err => log('red', `     ${err}`));
          frontendOk = false;
          hasIssues = true;
        } else {
          const display = value.length > 50 ? value.substring(0, 47) + '...' : value;
          log('green', `  ✅ ${key}`);
          log('green', `     = ${display}`);
        }
      });
      
      if (!frontendOk) {
        log('red', '\n❌ 前端配置有问题！');
      } else {
        log('green', '\n✅ 前端配置正常！');
      }
    }
  }
  
  // 总结
  log('cyan', '\n' + '═'.repeat(50));
  if (hasIssues) {
    log('red', '\n⚠️ 有配置问题需要修复！\n');
    process.exit(1);
  } else {
    log('green', '\n✅ 所有环境变量配置正常！\n');
    process.exit(0);
  }
}

// 主程序
const target = process.argv[2] || 'all';

if (!['backend', 'frontend', 'all'].includes(target)) {
  log('red', '❌ 无效的参数');
  log('cyan', '用法: node check-env.js [backend|frontend|all]');
  process.exit(1);
}

checkEnv(target);
