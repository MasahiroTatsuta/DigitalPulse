import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Next.jsの環境変数や設定を読み込むためのディレクトリ指定
  dir: './',
})

/** @type {import('jest').Config} */
const config = {
  // ブラウザ環境をシミュレートする設定
  testEnvironment: 'jest-environment-jsdom',
}

// Next.jsのコンパイラ（SWC）を使ってTypeScriptやReactをJestが読めるように変換する
export default createJestConfig(config)